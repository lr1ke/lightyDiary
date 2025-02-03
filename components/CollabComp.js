
import React, { useState, useEffect, useMemo } from 'react';
import '../styles/EntryForm.css';
import CollaborativeAnalysis from './CollaborativeAnalysis';
import { useContract } from '@/context/ContractContext';


const CollabComp = () => {
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contributionContent, setContributionContent] = useState('');
    const [entryContributions, setEntryContributions] = useState({});
    const [error, setError] = useState('');
    const [location, setLocation] = useState('');
    const [locationError, setLocationError] = useState('');
    const [expandedAddress, setExpandedAddress] = useState(null);
    const [expandedLocation, setExpandedLocation] = useState(null);
    const [userAddress, setUserAddress] = useState('');

    const  contract  = useContract();


    useEffect(() => {
        const getUserAddress = async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ 
                        method: 'eth_requestAccounts' 
                    });
                    setUserAddress(accounts[0]);
                } catch (error) {
                    console.error('Error getting user address:', error);
                }
            }
        };
        getUserAddress();
    }, []);

    useEffect(() => {
        const loadEntries = async () => {
            if (!contract || !userAddress) {
                return;
            }
            try {
                const allEntries = await contract.getAllEntries();
                let array = []; 
    
                for (const entry of allEntries) {
                    if (entry.isCollaborative) {
                        array.push(entry); 
                    }
                
    
                const formattedEntries = formatEntries(array);
                setAllEntries(formattedEntries);
    
                for (const entry of array) {
                        await loadContributions(entry.id, contract);
                    }
                }
            } catch (error) {
                console.log('Error in loadEntries:', error);
            }
        };
        loadEntries();
    }, [contract, userAddress]);

 
    
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
    


    const loadContributions = async (entryId) => {
        try {
            const contributions = await contract.getEntryContributions(entryId);
            console.log('Raw contributions data:', {
                contributions,
                type: typeof contributions,
                isArray: Array.isArray(contributions),
                length: contributions.length
            });
            
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
            console.log('Error in loadContributions:', error);
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }
    
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        console.log('Got coordinates:', { latitude, longitude });
                        
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                        );
                        const data = await response.json();
                        console.log('Location data:', data);
                        
                        const locationString = data.address.city || 
                                            data.address.town || 
                                            data.address.village || 
                                            data.address.suburb ||
                                            data.address.municipality ||
                                            `${latitude}, ${longitude}`;
                        
                        console.log('Final location string:', locationString);
                        setLocation(locationString);
                        resolve(locationString);
                    } catch (error) {
                        console.log('Error getting location:', error);
                        reject(error);
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setLocationError('Unable to retrieve your location');
                    reject(error);
                }
            );
        });
    };



    const addContribution = async (entryId, contributionContent) => {
        try {
            if (!contract || !contributionContent.trim()) return;
            
            setLoading(true);
            console.log('Starting contribution process:', entryId);

            // Get location before adding contribution
            const locationString = await getLocation();
            console.log('Location for contribution:', locationString);
            
            const tx = await contract.addContribution(entryId, contributionContent, locationString);
            console.log('Transaction created:', tx);
            
            await tx.wait();
            console.log('Transaction confirmed');
            
            setContributionContent('');
            await loadEntries(contract);
        } catch (error) {
            console.error('Error adding contribution:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const finalizeEntry = async (entryId) => {
        try {
            if (!contract || !userAddress) {
                setError('Contract not initialized or user not connected');
                return;
            }

            setLoading(true);
            console.log('Starting finalize process for entry:', entryId);
            
            const entry = allEntries.find(e => e.id === entryId);
            if (!entry) {
                setError('Entry not found');
                return;
            }
            
            if (entry.owner.toLowerCase() !== userAddress) {
                setError('Only the owner can finalize this entry');
                return;
            }

            const tx = await contract.finalizeEntry(entryId);
            await tx.wait();
            // await loadEntries(contract);
            
            setError('');
        } catch (error) {
            console.error('Error finalizing entry:', error);
            setError(error.message || 'Failed to finalize entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="entries-section">
                <h2>Collaborative Threads</h2>
                
                {allEntries.map(entry => {
                    return (
                        <div key={entry.id} className="entry-container">
                            <div className="entry">
                                <div className="entry-header">
                                    <div className="entry-title">
                                        <span className="entry-type-tag">👥 Collaborative</span>
                                        <div className="collaborative-title">
                                            <h3>Theme: {entry.title}</h3>
                                        </div>
                                    </div>
                                    <span className="entry-status">
                                        {entry.isFinalized ? '✅ Finalized' : '🔓 Open for contributions'}
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

                                    {!entry.isFinalized && (
                                        <div className="contribution-form">
                                            <textarea
                                                value={contributionContent}
                                                onChange={(e) => setContributionContent(e.target.value)}
                                                placeholder="Add your contribution..."
                                            />
                                            <button 
                                                onClick={() => {
                                                    addContribution(entry.id, contributionContent);
                                                    setContributionContent(''); // Clear input after submission
                                                }}
                                                disabled={!contributionContent.trim()}
                                            >
                                                Add Contribution
                                            </button>
                                        </div>
                                    )}

                                    <CollaborativeAnalysis 
                                        entry={entry}
                                        contributions={entryContributions[entry.id] || []}
                                        theme={entry.title}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default CollabComp;
