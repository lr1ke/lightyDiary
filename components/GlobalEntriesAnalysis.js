import React, { useState, useMemo } from 'react';
import OpenAI from 'openai';
import '../styles/GlobalEntriesAnalysis.css';

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

const GlobalEntriesAnalysis = ({ entries }) => {
    const [analysisTimespan, setAnalysisTimespan] = useState('month');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [analysisResults, setAnalysisResults] = useState(null);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    // Group entries by region
    const groupEntriesByRegion = (entriesArray) => {
        return entriesArray.reduce((acc, entry) => {
            const region = entry.location || 'Unknown Region';
            if (!acc[region]) {
                acc[region] = [];
            }
            acc[region].push(entry);
            return acc;
        }, {});
    };

    // Get unique regions from entries
    const uniqueRegions = useMemo(() => {
        const regions = new Set(entries.map(entry => entry.location).filter(Boolean));
        return ['all', ...Array.from(regions)];
    }, [entries]);

    const getEntriesForTimespan = (timespan, endDate = Date.now()) => {
        const timespans = {
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
            year: 365 * 24 * 60 * 60 * 1000
        };
        
        const endTime = Math.floor(endDate / 1000);
        const startTime = endTime - (timespans[timespan] / 1000);
        
        let filteredEntries = entries.filter(entry => 
            Number(entry.timestamp) > startTime && 
            Number(entry.timestamp) <= endTime
        );

        // Apply region filter if a specific region is selected
        if (selectedRegion !== 'all') {
            filteredEntries = filteredEntries.filter(entry => 
                entry.location === selectedRegion
            );
        }

        return filteredEntries;
    };

    const analyzeGlobalEntries = async (timespan, isComparison = false, endDate = Date.now()) => {
        try {
            setIsAnalyzing(true);
            setError('');

            const entriesInTimespan = getEntriesForTimespan(timespan, endDate);
            if (entriesInTimespan.length === 0) {
                setError(`No entries found in the ${isComparison ? 'previous' : 'selected'} ${timespan}${selectedRegion !== 'all' ? ` for ${selectedRegion}` : ''}`);
                return;
            }

            const analysisPrompt = `
                Analyze these diary entries ${selectedRegion !== 'all' ? `from ${selectedRegion}` : 'from different regions'} 
                over the past ${timespan}.

                ${selectedRegion === 'all' ? `
                Entries by region:
                ${Object.entries(groupEntriesByRegion(entriesInTimespan)).map(([region, regionEntries]) => `
                    Region: ${region}
                    Number of entries: ${regionEntries.length}
                    Entries:
                    ${regionEntries.map(entry => `
                        Date: ${new Date(Number(entry.timestamp) * 1000).toISOString().split('T')[0]}
                        Content: ${entry.content}
                    `).join('\n')}
                `).join('\n\n')}` : `
                Entries from ${selectedRegion}:
                ${entriesInTimespan.map(entry => `
                    Date: ${new Date(Number(entry.timestamp) * 1000).toISOString().split('T')[0]}
                    Content: ${entry.content}
                `).join('\n\n')}
                `}

                Please provide a comprehensive analysis including:
                ${selectedRegion === 'all' ? `
                1. Regional Patterns:
                   - Key themes and topics specific to each region
                   - Emotional patterns and sentiment by region
                   - Cultural influences visible in the entries
                
                2. Global Comparisons:
                   - Common themes across regions
                   - Notable differences between regions
                   - Global sentiment patterns
                ` : `
                1. Regional Insights:
                   - Key themes and topics in ${selectedRegion}
                   - Emotional patterns and sentiment trends
                   - Cultural or local influences in the entries
                `}
                
                3. Temporal Analysis:
                   - How themes evolved over the ${timespan}
                   - ${selectedRegion === 'all' ? 'Regional responses to global events (if apparent)' : 'Local patterns and events'}
                   - Seasonal or temporal patterns ${selectedRegion === 'all' ? 'by region' : ''}
                
                Format the response in clear sections with bullet points where appropriate.
            `;

            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: analysisPrompt }],
                temperature: 0.7,
                max_tokens: 1500
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

    const handleComparison = async () => {
        const timespans = {
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
            year: 365 * 24 * 60 * 60 * 1000
        };
        
        const previousPeriodEndDate = Date.now() - timespans[analysisTimespan];
        await analyzeGlobalEntries(analysisTimespan, true, previousPeriodEndDate);
    };

    return (
        <div className="global-analysis-section">
            <h3>
                {selectedRegion === 'all' ? 'Global' : selectedRegion} Entries Analysis
            </h3>
            
            <div className="analysis-controls">
                <select 
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="region-select"
                >
                    {uniqueRegions.map(region => (
                        <option key={region} value={region}>
                            {region === 'all' ? 'All Regions' : region}
                        </option>
                    ))}
                </select>

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
                    onClick={() => analyzeGlobalEntries(analysisTimespan)}
                    disabled={isAnalyzing}
                    className="analyze-button"
                >
                    {isAnalyzing ? 'Analyzing...' : `Analyze ${selectedRegion === 'all' ? 'Global' : 'Regional'} Patterns`}
                </button>

                {analysisResults && (
                    <button 
                        onClick={handleComparison}
                        disabled={isAnalyzing}
                        className="compare-button"
                    >
                        Compare with Previous Period
                    </button>
                )}
            </div>

            {error && <div className="analysis-error">{error}</div>}

            {analysisResults && (
                <div className="analysis-results">
                    <div className="period-header">
                        <h4>Current Period Analysis</h4>
                        <span className="region-count">
                            {Object.keys(groupEntriesByRegion(getEntriesForTimespan(analysisTimespan))).length} Regions
                        </span>
                    </div>
                    <pre className="analysis-content">
                        {analysisResults}
                    </pre>
                </div>
            )}

            {comparisonResults && (
                <div className="analysis-results comparison">
                    <div className="period-header">
                        <h4>Previous Period Analysis</h4>
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
                    }}
                    className="close-analysis"
                >
                    Close Analysis
                </button>
            )}
        </div>
    );
};

export default GlobalEntriesAnalysis;