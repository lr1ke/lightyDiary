import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import DiaryContract from '../artifacts/contracts/DiaryContract.sol/DiaryContract.json';
import '../styles/EntryForm.css';
import GlobalEntriesAnalysis from './GlobalEntriesAnalysis';




const GlobalComp = () => {
    const [contract, setContract] = useState(null);
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entryCount, setEntryCount] = useState(0);
    const [entryContributions, setEntryContributions] = useState({});
    const [error, setError] = useState('');
    const [expandedAddress, setExpandedAddress] = useState(null);
    const [expandedLocation, setExpandedLocation] = useState(null);

    useEffect(() => {
        const initContract = async () => {
            try {
                console.log('Contract ABI:', DiaryContract.abi);
                
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                
                const contractAddress = '0x02C4bCE808937Ef2Ace44F89557Bb8cD217D3473';
                console.log('Contract address:', contractAddress);
                
                const contractInstance = new ethers.Contract(
                    contractAddress,
                    DiaryContract.abi,
                    signer
                );
                
                console.log('Contract instance created');
                
                try {
                    const count = await contractInstance.entryCount();
                    setEntryCount(Number(count));
                    console.log('Entry count:', Number(count));
                } catch (err) {
                    console.error('Error calling entryCount:', err);
                }
                
                setContract(contractInstance);
                
                try {
                    await loadEntries(contractInstance);
                    await loadMyContributions(contractInstance);
                } catch (err) {
                    console.error('Error in loadEntries:', err);
                }
            } catch (error) {
                console.error('Error initializing contract:', error);
            } finally {
                setLoading(false);
            }
        };

        initContract();
    }, []);


    const loadEntries = async (contractInstance) => {
        try {
            console.log('Loading entries...');
            
            const myEntriesResult = await contractInstance.getMyEntries();
            console.log('My entries loaded:', myEntriesResult);
            
            const allEntriesResult = await contractInstance.getAllEntries();
            console.log('All entries loaded:', allEntriesResult);

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

            const formattedEntries = formatEntries(allEntriesResult);
            console.log('Formatted entries with location:', formattedEntries);
            setAllEntries(formattedEntries);
            
            for (const entry of formattedEntries) {
                if (entry.isCollaborative) {
                    await loadContributions(entry.id, contractInstance);
                }
            }
        } catch (error) {
            console.error('Error in loadEntries:', error);
            throw error;
        }
    };

    const loadContributions = async (entryId, contractInstance) => {
        try {
            const contributions = await contractInstance.getEntryContributions(entryId);
            console.log('Raw contributions data:', {
                contributions,
                type: typeof contributions,
                isArray: Array.isArray(contributions),
                length: contributions.length
            });
            
            // Convert the Proxy Result to a regular array and format each contribution
            const formattedContributions = Array.from(contributions).map(contribution => {
                console.log('Single contribution:', contribution);
                return {
                    contributor: contribution.contributor,
                    content: contribution.content,
                    timestamp: Number(contribution.timestamp),
                    location: contribution.location
                };
            });
            
            console.log('Formatted contributions:', formattedContributions);
            
            setEntryContributions(prev => ({
                ...prev,
                [entryId]: formattedContributions
            }));
        } catch (error) {
            console.error('Error in loadContributions:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                data: error.data
            });
        }
    };



    // const loadMyContributions = async (contractInstance) => {
    //     try {
    //         if (!userAddress) return;
            
    //         const allEntries = await contractInstance.getAllEntries();
    //         const contributionsMap = {};

    //         for (const entry of allEntries) {
    //             if (entry.isCollaborative) {
    //                 const contributions = await contractInstance.getEntryContributions(entry.id);
    //                 const myContributionsToEntry = Array.from(contributions).filter(
    //                     contribution => contribution.contributor.toLowerCase() === userAddress
    //                 );

    //                 if (myContributionsToEntry.length > 0) {
    //                     contributionsMap[entry.id] = {
    //                         entryTitle: entry.title,
    //                         contributions: myContributionsToEntry.map(contribution => ({
    //                             content: contribution.content,
    //                             timestamp: Number(contribution.timestamp),
    //                             location: contribution.location
    //                         }))
    //                     };
    //                 }
    //             }
    //         }
            
    //         setMyContributions(contributionsMap);
    //     } catch (error) {
    //         console.error('Error loading my contributions:', error);
    //     }
    // };

    // const myEntries = useMemo(() => {
    //     if (!userAddress) return [];
        
    //     // Get regular entries owned by the user
    //     const ownedEntries = allEntries.filter(entry => 
    //         entry.owner.toLowerCase() === userAddress
    //     );
        
    //     // Get entries where the user has contributed
    //     const contributedEntries = allEntries.filter(entry => {
    //         const entryContribs = entryContributions[entry.id] || [];
    //         return entryContribs.some(contrib => 
    //             contrib.contributor.toLowerCase() === userAddress
    //         );
    //     });
        
    //     // Combine and remove duplicates
    //     return [...new Set([...ownedEntries, ...contributedEntries])];
    // }, [allEntries, entryContributions, userAddress]);

    // useEffect(() => {
    //     const getUserAddress = async () => {
    //         if (window?.ethereum) {
    //             const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    //             setUserAddress(accounts[0].toLowerCase());
    //         }
    //     };
    //     getUserAddress();
    // }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            {/* <div className="stats">
                <p>All Entries: {allEntries.length}</p>
            </div> */}



            <div className="entries-section">
                <h2>All Entries</h2>
                
                {allEntries.length > 0 && (
                    <GlobalEntriesAnalysis entries={allEntries} />
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
                                                <span 
                                                    className="address-value clickable"
                                                    onClick={() => setExpandedAddress(expandedAddress === contribution.contributor ? null : contribution.contributor)}
                                                    title="Click to expand/collapse"
                                                >
                                                    {expandedAddress === contribution.contributor 
                                                        ? contribution.contributor
                                                        : `${contribution.contributor.slice(0, 5)}...`}
                                                </span>
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
    );
};

export default GlobalComp;
