import React, { useState } from 'react';
import OpenAI from 'openai';
import '../styles/CollaborativeAnalysis.css';

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

const CollaborativeAnalysis = ({ entry, contributions, theme }) => {
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const analyzeCollaborativeEntry = async () => {
        try {
            setIsAnalyzing(true);
            setError('');

            const analysisPrompt = `
                Analyze this collaborative discussion about the theme: "${theme}"

                Original Entry:
                Author: ${entry.owner}
                Content: ${entry.content}

                Contributions:
                ${contributions.map(contrib => 
                    `From ${contrib.contributor}:\n${contrib.content}`
                ).join('\n\n')}

                Please analyze how participants engaged with this specific theme "${theme}", including:
                1. How each participant interpreted and responded to the theme
                2. Key similarities and differences in perspectives
                3. How the discussion evolved through the contributions
                4. Common emotional threads across responses
                5. Unique insights each participant brought to the discussion
                
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
            console.error('Error analyzing collaborative entry:', error);
            setError('Failed to analyze entry: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="collaborative-analysis-section">
            <div className="analysis-controls">
                <button 
                    onClick={analyzeCollaborativeEntry}
                    disabled={isAnalyzing}
                    className="analyze-button"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Discussion'}
                </button>
            </div>

            {error && <div className="analysis-error">{error}</div>}

            {analysisResults && (
                <div className="analysis-results">
                    <div className="theme-header">
                        <h4>Analysis of "{theme}"</h4>
                        <span className="participant-count">
                            {contributions.length + 1} Participants
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