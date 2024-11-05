import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DiaryContract from '../artifacts/contracts/DiaryContract.sol/DiaryContract.json';
import '../styles/EntryForm.css';

const EntryForm = () => {
    const [content, setContent] = useState('');
    const [contract, setContract] = useState(null);
    const [myEntries, setMyEntries] = useState([]);
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entryCount, setEntryCount] = useState(0);
    const [isCollaborative, setIsCollaborative] = useState(false);
    const [contributorAddress, setContributorAddress] = useState('');
    const [contributionContent, setContributionContent] = useState('');
    const [entryContributions, setEntryContributions] = useState({});

    useEffect(() => {
        const initContract = async () => {
            try {
                console.log('Contract ABI:', DiaryContract.abi);
                
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                
                const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
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
                    content: entry.content,
                    owner: entry.owner,
                    timestamp: Number(entry.timestamp),
                    isCollaborative: entry.isCollaborative,
                    isFinalized: entry.isFinalized
                }))
                .sort((a, b) => b.id - a.id);

            const formattedEntries = formatEntries(allEntriesResult);
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
                    timestamp: Number(contribution.timestamp)
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!contract || !content.trim()) return;

            setLoading(true);
            let tx;
            
            if (isCollaborative) {
                tx = await contract.createCollaborativeEntry(content);
            } else {
                tx = await contract.createEntry(content);
            }

            await tx.wait();
            setContent('');
            await loadEntries(contract);
        } catch (error) {
            console.error('Error creating entry:', error);
        } finally {
            setLoading(false);
        }
    };

    const addContributor = async (entryId) => {
        try {
            if (!contract || !contributorAddress) return;
            const tx = await contract.addContributor(entryId, contributorAddress);
            await tx.wait();
            await loadEntries(contract);
            setContributorAddress('');
        } catch (error) {
            console.error('Error adding contributor:', error);
        }
    };

    const addContribution = async (entryId, contribution) => {
        try {
            console.log('Starting contribution process:', {
                entryId,
                contribution,
                contractExists: !!contract
            });
            
            if (!contract || !contribution.trim()) {
                console.log('Contract or contribution missing');
                return;
            }
            
            setLoading(true);
            console.log('Calling contract.addContribution...');
            const tx = await contract.addContribution(entryId, contribution);
            console.log('Transaction created:', tx);
            
            console.log('Waiting for transaction confirmation...');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);
            
            // Clear the contribution input
            setContributionContent('');
            
            console.log('Reloading entries and contributions...');
            await loadEntries(contract);
            
            setLoading(false);
            console.log('Contribution process completed');
        } catch (error) {
            console.error('Error in addContribution:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                data: error.data
            });
            setLoading(false);
        }
    };

    const finalizeEntry = async (entryId) => {
        try {
            if (!contract) return;
            const tx = await contract.finalizeEntry(entryId);
            await tx.wait();
            await loadEntries(contract);
        } catch (error) {
            console.error('Error finalizing entry:', error);
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

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={isCollaborative ? "Start a collaborative entry..." : "Write your diary entry..."}
                    required
                />
                
                <button type="submit" disabled={loading || !content.trim()}>
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
                                <span className="entry-type-tag">
                                    {entry.isCollaborative ? '👥 Collaborative' : '📝 Regular'}
                                </span>
                                <span className="entry-status">
                                    {entry.isCollaborative && (entry.isFinalized ? '✅ Finalized' : '🔓 Open for contributions')}
                                </span>
                            </div>
                            <p className="entry-content">{entry.content}</p>
                            <small>Created: {date.toLocaleString()}</small>
                            
                            {entry.isCollaborative && !entry.isFinalized && entry.owner === window.ethereum.selectedAddress && (
                                <div className="contributor-section">
                                    <input
                                        type="text"
                                        placeholder="Contributor address"
                                        value={contributorAddress}
                                        onChange={(e) => setContributorAddress(e.target.value)}
                                    />
                                    <button onClick={() => addContributor(entry.id)}>
                                        Add Contributor
                                    </button>
                                    <button onClick={() => finalizeEntry(entry.id)}>
                                        Finalize Entry
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="entries-section">
                <h2>All Entries</h2>
                {allEntries.map(entry => {
                    console.log('Entry contributions:', {
                        entryId: entry.id,
                        contributions: entryContributions[entry.id]
                    });
                    
                    return (
                        <div key={entry.id} className={`entry ${entry.isCollaborative ? 'collaborative' : ''}`}>
                            <div className="entry-header">
                                <span className="entry-type-tag">
                                    {entry.isCollaborative ? '👥 Collaborative' : '📝 Regular'}
                                </span>
                                <span className="entry-status">
                                    {entry.isCollaborative && (entry.isFinalized ? '✅ Finalized' : '🔓 Open for contributions')}
                                </span>
                            </div>
                            <p className="entry-content">{entry.content}</p>
                            <small>Created by: {entry.owner}</small>
                            <small>Date: {new Date(Number(entry.timestamp) * 1000).toLocaleString()}</small>
                            
                            {entry.isCollaborative && (
                                <div className="contributions-list">
                                    <h4>Contributions ({entryContributions[entry.id]?.length || 0})</h4>
                                    {entryContributions[entry.id]?.map((contribution, index) => (
                                        <div key={index} className="contribution">
                                            <p>{contribution.content}</p>
                                            <small>
                                                By: {contribution.contributor.slice(0, 6)}...{contribution.contributor.slice(-4)}
                                                <br />
                                                On: {new Date(Number(contribution.timestamp) * 1000).toLocaleString()}
                                            </small>
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
            </div>
        </div>
    );
};

export default EntryForm;
