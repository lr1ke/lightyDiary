import React, { useState } from 'react';
import OpenAI from 'openai';
import '../styles/DiaryAnalysis.css';

// Initialize OpenAI outside the component
const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

const DiaryAnalysis = ({ entries }) => {
    const [analysisTimespan, setAnalysisTimespan] = useState('month');
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const analyzeEntriesOverTime = async () => {
        try {
            setIsAnalyzing(true);
            setError('');
            
            // Get entries within the selected timespan
            const now = Math.floor(Date.now() / 1000);
            const timespans = {
                week: 7 * 24 * 60 * 60,
                month: 30 * 24 * 60 * 60,
                year: 365 * 24 * 60 * 60
            };
            
            const timeThreshold = now - timespans[analysisTimespan];
            const entriesInTimespan = entries.filter(entry => 
                Number(entry.timestamp) > timeThreshold
            );

            if (entriesInTimespan.length === 0) {
                setError(`No entries found in the selected ${analysisTimespan}`);
                return;
            }

            // Prepare entries for analysis
            const entriesText = entriesInTimespan
                .map(entry => ({
                    content: entry.content,
                    date: new Date(Number(entry.timestamp) * 1000).toISOString().split('T')[0]
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            const analysisPrompt = `
                Analyze these diary entries over time and provide insights about emotional patterns, 
                recurring themes, and personal growth. Entries are listed chronologically:

                ${entriesText.map(entry => `
                    Date: ${entry.date}
                    Entry: ${entry.content}
                `).join('\n\n')}

                Please provide a detailed analysis including:
                1. Overall emotional journey and mood patterns
                2. Main themes and how they evolved
                3. Notable changes or transitions
                4. Potential areas of growth or challenge
                5. Word patterns or writing style changes
                
                Format the response in clear sections with bullet points where appropriate.
            `;

            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: analysisPrompt }],
                temperature: 0.7,
                max_tokens: 1000
            });

            setAnalysisResults(response.choices[0].message.content);

        } catch (error) {
            console.error('Error analyzing entries:', error);
            setError('Failed to analyze entries: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="analysis-section">
            <h3>Diary Analysis</h3>
            <div className="analysis-controls">
                <select 
                    value={analysisTimespan} 
                    onChange={(e) => setAnalysisTimespan(e.target.value)}
                    className="timespan-select"
                >
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="year">Past Year</option>
                </select>
                <button 
                    onClick={analyzeEntriesOverTime}
                    disabled={isAnalyzing}
                    className="analyze-button"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Entries'}
                </button>
            </div>

            {error && <div className="analysis-error">{error}</div>}

            {analysisResults && (
                <div className="analysis-results">
                    <pre className="analysis-content">
                        {analysisResults}
                    </pre>
                    <button 
                        onClick={() => setAnalysisResults(null)}
                        className="close-analysis"
                    >
                        Close Analysis
                    </button>
                </div>
            )}
        </div>
    );
};

export default DiaryAnalysis;