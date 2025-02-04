import React, { useState, useEffect, Suspense } from 'react';
import '../styles/EntryForm.css';
import GlobalEntriesAnalysis from './GlobalEntriesAnalysis';
import { useContract } from '@/context/ContractContext';
import { useSearchParams } from 'next/navigation';
import '@/styles/EntryForm.css';   



const GlobalComp = () => {
    const [allEntries, setAllEntries] = useState([]);
    const [entryContributions, setEntryContributions] = useState({});
    const [error, setError] = useState('');
    const [expandedAddress, setExpandedAddress] = useState(null);
    const [expandedLocation, setExpandedLocation] = useState(null);
    const [collaborativeEntries, setCollaborativeEntries] = useState([]);
    const [nonCollabEntries, setNonCollabEntries] = useState([]);
    const searchParams = useSearchParams();
    const highlightId = searchParams.get('highlight');

    const  contract  = useContract();



    const formatEntries = (entries) => 
                entries.map(entry => ({
                    id: Number(entry.id),
                    title: entry.title,
                    content: entry.content,
                    owner: entry.owner,
                    timestamp: Number(entry.timestamp),
                    isCollaborative: entry.isCollaborative,
                    isFinalized: entry.isFinalized,
                    location: entry.location
                }))
                .sort((a, b) => b.id - a.id);


    useEffect(() => {
        const loadEntries = async () => {
            if (!contract) {
                console.log("Contract is not initialized yet.");
                return;
            }

            try {
                const allEntries = await contract.getAllEntries();
                const allEntriesResult = await formatEntries(allEntries);
                setAllEntries(allEntriesResult);

                // Filter all non-collaborative entries
                const allNonCollab = await allEntriesResult.filter(entry => !entry.isCollaborative);
                const allNonCollabEntries = await formatEntries(allNonCollab);
                setNonCollabEntries(allNonCollabEntries);


                // Filter collaborative entries
                const collaborativeEntries = allEntriesResult.filter(entry => entry.isCollaborative);
                const collaborativeEntriesResult = formatEntries(collaborativeEntries);
                setCollaborativeEntries(collaborativeEntriesResult);

                // Get contributions for each collaborative entry
                for (const entry of collaborativeEntriesResult) {
                    const contributionsAll = await contract.getEntryContributions(entry.id);
                    const contributions = await formatEntries(contributionsAll);
                    setEntryContributions(prev => ({
                        ...prev,
                        [entry.id]: contributions
                    }));
                }
            } catch (error) {
                console.error('Error loading entries and contributions:', error);
            }
        };

        loadEntries();
    }, [contract]);

    useEffect(() => {
        if (highlightId) {
            // Add a small delay to ensure the entries are loaded and rendered
            setTimeout(() => {
                const element = document.getElementById(`entry-${highlightId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    element.classList.add('highlight-entry');
                    // Add a flash effect
                    element.style.backgroundColor = '#fef9c3';
                    setTimeout(() => {
                        element.style.backgroundColor = '';
                    }, 2000);
                }
            }, 500);
        }
    }, [highlightId, allEntries]); 


    return (
        <>
        <div className="container">
            <div className="entries-section">
                <h2>All Entries</h2>
                
                {allEntries.length > 0 && (
                    <GlobalEntriesAnalysis entries={allEntries} />
                )}

                {allEntries.map(entry => (
                    <div 
                        key={entry.id} 
                        id={`entry-${entry.id}`}                    
                        className={`entry-container ${entry.id === Number(highlightId) ? 'bg-yellow-50 transition-colors duration-1000' : ''}`}
                        >
                        <div className="entry">
                            <div className="entry-header">
                                <div className="entry-title">
                                    <span className="entry-type-tag">
                                        {entry.isCollaborative ? '👥 Collaborative' : '📝 Regular'}
                                    </span>
                                    {entry.isCollaborative && (
                                        <div className="collaborative-title">
                                            <h3>Theme: {entry.title}</h3>
                                        </div>
                                    )}
                                </div>
                                <span className="entry-status">
                                    {entry.isCollaborative && (entry.isFinalized ? '✅ Finalized' : '🔓 Open for contributions')}
                                </span>
                            </div>
                            <p className="entry-content">{entry.content}</p>
                            <div className="entry-metadata">
                                <small className="clickable" onClick={() => setExpandedAddress(expandedAddress === entry.owner ? null : entry.owner)}>
                                    Created by: {expandedAddress === entry.owner ? entry.owner : `${entry.owner.slice(0, 5)}...`}
                                </small>
                                <small>Date: {new Date(Number(entry.timestamp) * 1000).toLocaleString()}</small>
                                {entry.location && (
                                    <small 
                                        className="contribution-location clickable"
                                        onClick={() => setExpandedLocation(expandedLocation === entry.id ? null : entry.id)}
                                        title="Click to expand/collapse"
                                    >
                                        📍 {expandedLocation === entry.id ? entry.location : `${entry.location.slice(0, 15)}...`}
                                    </small>
                                )}
                            </div>
                        </div>

                        {entry.isCollaborative && (
                            <div className="collaborative-section">
                                {(entryContributions[entry.id] || []).map((contribution, index) => (
                                    <div key={`${entry.id}-${index}`} className="contribution">
                                        <p>{contribution.content}</p>
                                        <div className="contribution-metadata">
                                            <div className="contributor-address">
                                                <span className="address-label">Contributor:</span>
                                                {/* <span 
                                                    className="address-value clickable"
                                                    onClick={() => setExpandedAddress(expandedAddress === contribution.contributer ? null : contribution.contributer)}
                                                    title="Click to expand/collapse"
                                                >
                                                    {expandedAddress === contribution.contributer
                                                        ? contribution.contributer
                                                        : `${contribution.contributor.slice(0, 5)}...`}
                                                </span> */}
                                            </div>
                                            <small>
                                                On: {new Date(Number(contribution.timestamp) * 1000).toLocaleString()}
                                            </small>
                                            {contribution.location && (
                                                <small 
                                                    className="contribution-location clickable"
                                                    onClick={() => setExpandedLocation(expandedLocation === `${entry.id}-${index}` ? null : `${entry.id}-${index}`)}
                                                    title="Click to expand/collapse"
                                                >
                                                    📍 {expandedLocation === `${entry.id}-${index}` ? contribution.location : `${contribution.location.slice(0, 15)}...`}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {error && <div className="error-message">{error}</div>}
        </div>

{/* Variante in Darstellung als Fließtext ohne metadata */}
        <div>
        <h1>All single Entries</h1>
        <h3>singel</h3>
        {nonCollabEntries.map(entry => (
            <div key={entry.id}>
                <p>{entry.content}</p>
            </div>
        ))}
        <h1>Collaborative</h1>
        {collaborativeEntries.map(entry => (
            <div key={entry.id}>
                <h2>{entry.title}</h2>
                <p>{entry.content}</p>
                {/* <h3>Contributions:</h3> */}
                {(entryContributions[entry.id] || []).map((contribution, index) => (
                    <div key={index}>
                        <p>{contribution.content}</p>
                    </div>
                ))}
            </div>
        ))}
        </div>

        </>
    );
};

const GlobalCompWrapper = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <GlobalComp />
    </Suspense>
);

export default GlobalCompWrapper;
