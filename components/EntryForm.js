import React, { useState, useEffect } from 'react';
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
    const [myEntries, setMyEntries] = useState([]);
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

    useEffect(() => {
        const initContract = async () => {
            try {
                console.log('Contract ABI:', DiaryContract.abi);
                
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                
                const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
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
            setMyEntries(formatEntries(myEntriesResult));
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
            if (!contract) {
                setError('Contract not initialized');
                return;
            }
    
            setLoading(true);
            console.log('Starting finalize process for entry:', entryId);
            
            // Check if user is the owner
            const entry = allEntries.find(e => e.id === entryId);
            if (!entry) {
                setError('Entry not found');
                return;
            }
            
            console.log('Current user:', window.ethereum.selectedAddress);
            console.log('Entry owner:', entry.owner);
            
            if (entry.owner.toLowerCase() !== window.ethereum.selectedAddress.toLowerCase()) {
                setError('Only the owner can finalize this entry');
                return;
            }
    
            console.log('Calling contract.finalizeEntry...');
            const tx = await contract.finalizeEntry(entryId);
            console.log('Transaction sent:', tx);
            
            console.log('Waiting for confirmation...');
            await tx.wait();
            console.log('Entry finalized successfully');
            
            // Reload entries to show updated state
            await loadEntries(contract);
            
            setError(''); // Clear any previous errors
        } catch (error) {
            console.error('Error finalizing entry:', error);
            setError(error.message || 'Failed to finalize entry');
        } finally {
            setLoading(false);
        }
    };

    const loadMyContributions = async (contractInstance) => {
        try {
            const allEntries = await contractInstance.getAllEntries();
            const userAddress = window.ethereum.selectedAddress.toLowerCase();
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
                {myEntries.map(entry => {
                    console.log('Entry timestamp:', entry.timestamp, typeof entry.timestamp);
                    const date = new Date(Number(entry.timestamp) * 1000);
                    console.log('Converted date:', date);
                    
                    return (
                        <div key={entry.id} className={`entry ${entry.isCollaborative ? 'collaborative' : ''}`}>
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
                            
                            {entry.isCollaborative && 
                             !entry.isFinalized && 
                             entry.owner.toLowerCase() === window.ethereum.selectedAddress.toLowerCase() && (
                                <div className="entry-actions">
                                    <button 
                                        onClick={() => finalizeEntry(entry.id)}
                                        className="finalize-button"
                                        disabled={loading}
                                    >
                                        {loading ? 'Finalizing...' : 'Finalize Entry'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {myEntries.length > 0 && (
                    <DiaryAnalysis entries={myEntries} />
                )}
            </div>

            <div className="entries-section">
                <h2>All Entries</h2>
                
                {allEntries.length > 0 && (
                    <GlobalEntriesAnalysis entries={allEntries} />
                )}

                {allEntries.map(entry => {
                    console.log('Entry contributions:', {
                        entryId: entry.id,
                        contributions: entryContributions[entry.id]
                    });
                    
                    return (
                        <div 
                            key={entry.id} 
                            id={`entry-${entry.id}`} 
                            className={`entry ${entry.isCollaborative ? 'collaborative' : ''}`}
                        >
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
                                <small className="contribution-location">
                                    📍 {entry.location.slice(0, 15)}
                                </small>
                            )}
                            </div>
                            
                            {entry.isCollaborative && 
                             !entry.isFinalized && 
                             entry.owner.toLowerCase() === window.ethereum.selectedAddress.toLowerCase() && (
                                <div className="entry-actions">
                                    <button 
                                        onClick={() => finalizeEntry(entry.id)}
                                        className="finalize-button"
                                        disabled={loading}
                                    >
                                        {loading ? 'Finalizing...' : 'Finalize Entry'}
                                    </button>
                                </div>
                            )}

                            {entry.isCollaborative && (
                                <div className="contributions-list">
                                    <h4>Contributions ({entryContributions[entry.id]?.length || 0})</h4>
                                    {entryContributions[entry.id]?.map((contribution, index) => (
                                        <div key={index} className="contribution">
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
                            
                            {entry.isCollaborative && !entry.isFinalized && (
                                <div className="contribution-section">
                                    <textarea
                                        value={contributionContent}
                                        placeholder="Add your contribution..."
                                        onChange={(e) => setContributionContent(e.target.value)}
                                    />
                                    <button 
                                        onClick={() => addContribution(entry.id, contributionContent)}
                                        disabled={!contributionContent.trim() || loading}
                                    >
                                        {loading ? 'Adding...' : 'Add Contribution'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {allEntries.filter(entry => entry.isCollaborative).length > 0 && (
                    <CollaborativeAnalysis 
                        entries={allEntries.filter(entry => entry.isCollaborative)}
                        contributions={entryContributions}
                        theme={allEntries.find(entry => entry.isCollaborative)?.title || 'Collaborative Discussion'}
                    />
                )}
            </div>
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default EntryForm;
