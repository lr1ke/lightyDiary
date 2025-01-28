import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import DiaryContract from '../artifacts/contracts/DiaryContract.sol/DiaryContract.json';
import '../styles/EntryForm.css';
import DiaryAnalysis from './DiaryAnalysis';
import CollaborativeAnalysis from './CollaborativeAnalysis';
import GlobalEntriesAnalysis from './GlobalEntriesAnalysis';




const EntryForm = () => {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [contract, setContract] = useState(null);
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entryCount, setEntryCount] = useState(0);
    const [isCollaborative, setIsCollaborative] = useState(false);
    const [contributionContent, setContributionContent] = useState('');
    const [entryContributions, setEntryContributions] = useState({});
    const [error, setError] = useState('');
    const [location, setLocation] = useState('');
    const [locationError, setLocationError] = useState('');
    const [myContributions, setMyContributions] = useState({});
    const [expandedAddress, setExpandedAddress] = useState(null);
    const [expandedLocation, setExpandedLocation] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [userAddress, setUserAddress] = useState('');

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

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const lastResultIndex = event.results.length - 1;
                const transcript = event.results[lastResultIndex][0].transcript;
                console.log('Speech recognition result:', transcript);

                if (isCollaborative && !content) {
                    setTitle(transcript);
                } else {
                    setContent(prevContent => {
                        const newContent = prevContent.trim() + ' ' + transcript.trim();
                        console.log('Updated content:', newContent);
                        return newContent;
                    });
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognition);
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) {
            setError('Speech recognition is not supported in your browser');
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
        setIsListening(!isListening);
    };

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
                        
                        // Extract just the city/town name from the address object
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
                        console.error('Error getting location:', error);
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!contract || !content.trim()) return;
            if (isCollaborative && !title.trim()) return;

            setLoading(true);
            
            // Get location before creating entry
            const locationString = await getLocation();
            console.log('Location received:', locationString);

            
            let tx;
            if (isCollaborative) {
                tx = await contract.createCollaborativeEntry(title, content, locationString);
            } else {
                tx = await contract.createEntry(content, locationString);
            }

            await tx.wait();
            setContent('');
            setTitle('');
            setLocation('');
            await loadEntries(contract);
        } catch (error) {
            console.error('Error creating entry:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
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
            await loadEntries(contract);
            
            setError('');
        } catch (error) {
            console.error('Error finalizing entry:', error);
            setError(error.message || 'Failed to finalize entry');
        } finally {
            setLoading(false);
        }
    };

    const loadMyContributions = async (contractInstance) => {
        try {
            if (!userAddress) return;
            
            const allEntries = await contractInstance.getAllEntries();
            const contributionsMap = {};

            for (const entry of allEntries) {
                if (entry.isCollaborative) {
                    const contributions = await contractInstance.getEntryContributions(entry.id);
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
                }
            }
            
            setMyContributions(contributionsMap);
        } catch (error) {
            console.error('Error loading my contributions:', error);
        }
    };

    const myEntries = useMemo(() => {
        if (!userAddress) return [];
        
        // Get regular entries owned by the user
        const ownedEntries = allEntries.filter(entry => 
            entry.owner.toLowerCase() === userAddress
        );
        
        // Get entries where the user has contributed
        const contributedEntries = allEntries.filter(entry => {
            const entryContribs = entryContributions[entry.id] || [];
            return entryContribs.some(contrib => 
                contrib.contributor.toLowerCase() === userAddress
            );
        });
        
        // Combine and remove duplicates
        return [...new Set([...ownedEntries, ...contributedEntries])];
    }, [allEntries, entryContributions, userAddress]);

    useEffect(() => {
        const getUserAddress = async () => {
            if (window?.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setUserAddress(accounts[0].toLowerCase());
            }
        };
        getUserAddress();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <div className="stats">
                <p>Total Entries: {entryCount}</p>
                <p>My Entries: {myEntries.length}</p>
                <p>All Entries: {allEntries.length}</p>
            </div>

            <form onSubmit={handleSubmit} className="entry-form">
                <div className="entry-type">
                    <label>
                        <input
                            type="radio"
                            checked={!isCollaborative}
                            onChange={() => setIsCollaborative(false)}
                        />
                        Regular Entry
                    </label>
                    <label>
                        <input
                            type="radio"
                            checked={isCollaborative}
                            onChange={() => setIsCollaborative(true)}
                        />
                        Collaborative Entry
                    </label>
                </div>

                {isCollaborative && (
                    <div className="input-group">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter theme/title for collaboration..."
                            className="title-input"
                            required
                        />
                        <button 
                            type="button" 
                            onClick={toggleListening}
                            className={`mic-button ${isListening ? 'active' : ''}`}
                            title="Click to start/stop voice input"
                        >
                            {isListening ? '🛑' : '🎤'}
                        </button>
                    </div>
                )}

                <div className="input-group">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={isCollaborative ? "Start a collaborative entry..." : "Write your diary entry..."}
                        required
                    />
                    <button 
                        type="button" 
                        onClick={toggleListening}
                        className={`mic-button ${isListening ? 'active' : ''}`}
                        title="Click to start/stop voice input"
                    >
                        {isListening ? '🛑' : '🎤'}
                    </button>
                </div>
                
                <button type="submit" disabled={loading || !content.trim() || (isCollaborative && !title.trim())}>
                    {isCollaborative ? "Create Collaborative Entry" : "Create Entry"}
                </button>
            </form>

            <div className="entries-section">
                <h2>My Entries</h2>
                
                {/* Add DiaryAnalysis at the top of My Entries section */}
                {myEntries.length > 0 && (
                    <DiaryAnalysis entries={myEntries} />
                )}

                {myEntries.map(entry => (
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
                            {entry.isCollaborative && entryContributions[entry.id]?.map((contribution, index) => {
                                if (contribution.contributor.toLowerCase() === userAddress.toLowerCase()) {
                                    return (
                                        <div key={`${entry.id}-${index}`} className="contribution">
                                            <div className="entry-header">
                                                <div className="entry-title">
                                                    <span className="entry-type-tag">💭 My Contribution</span>
                                                </div>
                                            </div>
                                            <p className="entry-content">{contribution.content}</p>
                                            <div className="entry-metadata">
                                                <div className="contributor-address">
                                                    <span className="address-label">Contributor:</span>
                                                    <span 
                                                        className="address-value clickable"
                                                        onClick={() => setExpandedAddress(expandedAddress === contribution.contributor ? null : contribution.contributor)}
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
                                                    >
                                                        📍 {expandedLocation === `${entry.id}-${index}` ? contribution.location : `${contribution.location.slice(0, 15)}...`}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}

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

            <div className="entries-section">
                <h2>Collaborative Threads</h2>
                
                {allEntries.filter(entry => entry.isCollaborative).map(entry => {
                    console.log('Rendering collaborative entry:', {
                        id: entry.id,
                        title: entry.title,
                        isCollaborative: entry.isCollaborative
                    });
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

export default EntryForm;
