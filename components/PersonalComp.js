import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import DiaryContract from '../artifacts/contracts/DiaryContract.sol/DiaryContract.json';
import '../styles/EntryForm.css';
import DiaryAnalysis from './DiaryAnalysis';
import CollaborativeAnalysis from './CollaborativeAnalysis';
import GlobalEntriesAnalysis from './GlobalEntriesAnalysis';




const PersonalComp = () => {
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
                <p>My Entries: {myEntries.length}</p>
            </div>

                

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


        </div>
    );
};

export default PersonalComp;
