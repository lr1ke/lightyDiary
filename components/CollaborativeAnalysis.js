import React, { useState } from 'react';
import OpenAI from 'openai';
import '../styles/CollaborativeAnalysis.css';

// Initialize OpenAI outside the component
const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

const CollaborativeAnalysis = ({ entries, contributions, theme }) => {
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const analyzeCollaborativeEntries = async () => {
        try {
            setIsAnalyzing(true);
            setError('');

            // Prepare all entries and their contributions for analysis
            const analysisData = entries.map(entry => ({
                content: entry.content,
                author: entry.owner,
                contributions: contributions[entry.id] || []
            }));

            const analysisPrompt = `
                Analyze this collaborative discussion about the theme: "${theme}"

                Original Entry:
                Author: ${analysisData[0].author}
                Content: ${analysisData[0].content}

                Contributions:
                ${analysisData[0].contributions.map(contrib => 
                    `From ${contrib.contributor}:\n${contrib.content}`
                ).join('\n\n')}

                Please analyze how different participants engaged with the theme "${theme}", including:
                1. How each participant interpreted and responded to the theme
                2. Key similarities and differences in perspectives
                3. How the discussion evolved through the contributions
                4. Common emotional threads across responses
                5. Unique insights each participant brought to the theme
                
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
            console.error('Error analyzing collaborative entries:', error);
            setError('Failed to analyze entries: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="collaborative-analysis-section">
            <h3>Collaborative Analysis</h3>
            
            <div className="analysis-controls">
                <button 
                    onClick={analyzeCollaborativeEntries}
                    disabled={isAnalyzing}
                    className="analyze-button"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Collaborative Discussions'}
                </button>
            </div>

            {error && <div className="analysis-error">{error}</div>}

            {analysisResults && (
                <div className="analysis-results">
                    <div className="theme-header">
                        <h4>Analysis of Collaborative Entries</h4>
                        <span className="participant-count">
                            {entries.length} Themes with {
                                entries.reduce((total, entry) => 
                                    total + (contributions[entry.id]?.length || 0), 
                                    entries.length
                                )
                            } Total Responses
                        </span>
                    </div>
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

export default CollaborativeAnalysis;