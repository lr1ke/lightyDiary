import React, { useState, useEffect, useMemo } from 'react';
import '../styles/EntryForm.css';
import { useContract } from '@/context/ContractContext';
import DiaryAnalysis from './DiaryAnalysis';


const PersonalComp = () => {
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myContributions, setMyContributions] = useState({});
    const [expandedAddress, setExpandedAddress] = useState(null);
    const [expandedLocation, setExpandedLocation] = useState(null);
    const [userAddress, setUserAddress] = useState('');


    const contract = useContract();


    useEffect(() => {
    const loadEntries = async (userAdress) => {
        try {
            const myEntriesResult = await contract.getUserEntries(userAddress);
            const formattedEntries = formatEntries(myEntriesResult);
            setAllEntries(formattedEntries);
            
            for (const entry of formattedEntries) {
                if (entry.isCollaborative) {
                    await loadMyContributions(entry.id);
                }
            }
        } catch (error) {
            throw error;
        }
    };
    loadEntries();
}, [contract]);

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

    
    const loadMyContributions = async () => {

            const contributionsMap = {};
            const contributions = await contract.getEntryContributions(entry.id);

            const myContributionsToEntry = Array.from(contributions).filter(
                        contribution => contribution.contributor.toLowerCase() === userAddress
                    );
                    if (myContributionsToEntry.length > 0) {
                        contributionsMap[entry.id] = {
                            entryTitle: entry.title,
                            contributions: myContributionsToEntry.map(contribution => ({
                                content: contribution.content,
                                timestamp: Number(contribution.timestamp),
                                location: contribution.location
                            }))
                        };
                    }
            setMyContributions(contributionsMap);
    };


    useEffect(() => {
        const getUserAddress = async () => {
            if (window?.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setUserAddress(accounts[0].toLowerCase());
            }
        };
        getUserAddress();
    }, []);


    return (
        <div className="container">
                <div className="entries-section">
                <h2>My Diary</h2>
                {allEntries.length > 0 && (
                    <DiaryAnalysis entries={allEntries} />
                )}

                {allEntries.map(entry => (
                    <div key={entry.id} className="entry-container">
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
                                    >
                                        📍 {expandedLocation === entry.id ? entry.location : `${entry.location.slice(0, 15)}...`}
                                    </small>
                                )}
                            </div>

                            {/* Show contributions if it's a collaborative entry */}
                            {/* {entry.isCollaborative && entryContributions[entry.id]?.map((contribution, index) => {
                                if (contribution.contributor.toLowerCase() === userAddress.toLowerCase()) { */}

                <div className="contributions-container">
                {Object.values(myContributions).map((entryContributions) => (
                    entryContributions.contributions.map((contribution, index) => (
                    <div key={`${entryContributions.entryTitle}-${index}`} className="contribution">
                        <div className="entry-header">
                        <div className="entry-title">
                            <span className="entry-type-tag">💭 My Contribution</span>
                        </div>
                        </div>
                        <p className="entry-content">{contribution.content}</p>
                        <div className="entry-metadata">
                        <div className="contributor-address">
                            <span className="address-label">Contributor:</span>
                            <span className="address-value clickable">
                            {expandedAddress === contribution.contributor ? contribution.contributor : `${contribution.contributor.slice(0, 5)}...`}
                            </span>
                        </div>
                        <small>Date: {new Date(contribution.timestamp * 1000).toLocaleString()}</small>
                        {contribution.location && (
                            <small className="contribution-location clickable">
                            📍 {contribution.location}
                            </small>
                        )}
                        </div>
                    </div>
                    ))
                ))}
                </div>

                {/* Add Finalize button for collaborative entries */}
                {entry.isCollaborative && 
                    !entry.isFinalized && 
                    entry.owner.toLowerCase() === userAddress.toLowerCase() && (
                    <div className="entry-actions">
                        <button 
                            onClick={() => finalizeEntry(entry.id)}
                            className="finalize-button"
                            disabled={loading}
                        >
                            {loading ? 'Finalizing...' : 'Finalize Thread'}
                        </button>
                    </div>
                     )}
                    </div>
                    </div>
                ))}
            </div>
            </div>
            );
            };

export default PersonalComp;
