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
    const [comparisonTimespan, setComparisonTimespan] = useState(null); // for comparison period
    const [analysisResults, setAnalysisResults] = useState(null);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [dateRanges, setDateRanges] = useState({ current: null, previous: null });

    const getEntriesForTimespan = (timespan, endDate = Date.now()) => {
        const timespans = {
            week: 7 * 24 * 60 * 60,
            month: 30 * 24 * 60 * 60,
            year: 365 * 24 * 60 * 60
        };
        
        const endTime = Math.floor(endDate / 1000);
        const startTime = endTime - timespans[timespan];
        
        return entries.filter(entry => 
            Number(entry.timestamp) > startTime && 
            Number(entry.timestamp) <= endTime
        );
    };

    const handleComparison = async () => {
        // Calculate the previous period's end date (current period's start date)
        const currentDate = Date.now();
        const timespans = {
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
            year: 365 * 24 * 60 * 60 * 1000
        };
        
        const previousPeriodEndDate = currentDate - timespans[analysisTimespan];
        
        // Analyze the previous period
        await analyzeEntriesOverTime(analysisTimespan, true, previousPeriodEndDate);
    };

    const formatDateRange = (startDate, endDate) => {
        return {
            start: new Date(startDate).toLocaleDateString(),
            end: new Date(endDate).toLocaleDateString()
        };
    };

    const analyzeEntriesOverTime = async (timespan, isComparison = false, endDate = Date.now()) => {
        try {
            setIsAnalyzing(true);
            setError('');
            
            const timespans = {
                week: 7 * 24 * 60 * 60 * 1000,
                month: 30 * 24 * 60 * 60 * 1000,
                year: 365 * 24 * 60 * 60 * 1000
            };

            const startDate = endDate - timespans[timespan];
            
            // Update date ranges
            if (isComparison) {
                setDateRanges(prev => ({
                    ...prev,
                    previous: formatDateRange(startDate, endDate)
                }));
            } else {
                setDateRanges(prev => ({
                    ...prev,
                    current: formatDateRange(startDate, endDate)
                }));
            }

            // Get entries for the selected timespan
            const entriesInTimespan = getEntriesForTimespan(timespan, endDate);

            if (entriesInTimespan.length === 0) {
                setError(`No entries found in the ${isComparison ? 'previous' : 'selected'} ${timespan}`);
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
                ${isComparison ? 'For comparison: ' : ''}
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

            if (isComparison) {
                setComparisonResults(response.choices[0].message.content);
            } else {
                setAnalysisResults(response.choices[0].message.content);
            }

        } catch (error) {
            console.error('Error analyzing entries:', error);
            setError('Failed to analyze entries: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const exportAnalysis = () => {
        const exportContent = `
Diary Analysis Export
Date: ${new Date().toLocaleDateString()}
Timespan: Past ${analysisTimespan}

Current Period Analysis:
${analysisResults || 'No analysis available'}

${comparisonResults ? `
Comparison Period Analysis:
${comparisonResults}
` : ''}
        `;

        const blob = new Blob([exportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diary-analysis-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                    onClick={() => analyzeEntriesOverTime(analysisTimespan)}
                    disabled={isAnalyzing}
                    className="analyze-button"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Entries'}
                </button>
                
                {analysisResults && (
                    <button 
                        onClick={handleComparison}
                        disabled={isAnalyzing}
                        className="compare-button"
                    >
                        {isAnalyzing ? 'Comparing...' : 'Compare with Previous Period'}
                    </button>
                )}
                
                {analysisResults && (
                    <button 
                        onClick={exportAnalysis}
                        className="export-button"
                    >
                        Export Analysis
                    </button>
                )}
                </div>

            {error && <div className="analysis-error">{error}</div>}

            {analysisResults && dateRanges.current && (
                <div className="analysis-results">
                    <div className="date-range-header">
                        <h4>Current Period Analysis</h4>
                        <span className="date-range">
                            {dateRanges.current.start} - {dateRanges.current.end}
                        </span>
                    </div>
                    <pre className="analysis-content">
                        {analysisResults}
                    </pre>
                </div>
            )}

            {comparisonResults && dateRanges.previous && (
                <div className="analysis-results comparison">
                    <div className="date-range-header">
                        <h4>Previous Period Analysis</h4>
                        <span className="date-range">
                            {dateRanges.previous.start} - {dateRanges.previous.end}
                        </span>
                    </div>
                    <pre className="analysis-content">
                        {comparisonResults}
                    </pre>
                </div>
            )}

            {(analysisResults || comparisonResults) && (
                <button 
                    onClick={() => {
                        setAnalysisResults(null);
                        setComparisonResults(null);
                        setComparisonTimespan(null);
                    }}
                    className="close-analysis"
                >
                    Close Analysis
                </button>
            )}
        </div>
    );
};

export default DiaryAnalysis;