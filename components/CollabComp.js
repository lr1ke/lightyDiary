
import React, { useState, useEffect, useMemo } from 'react';
import '../styles/EntryForm.css';
import { useContract } from '@/context/ContractContext';
import { User, MapPin, MessageCircle, Repeat2, Heart, Share, Users, Clock, MoreHorizontal, Megaphone  } from 'lucide-react';
import { theme } from '@/app/ui/dashboard/weekly-idea';
import CollaborativeAnalysis from './CollaborativeAnalysis';


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
            <div className="px-3 sm:px-6 py-3 sm:py-4">
             <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
             ✨ Collaborative Writings
            </h2>
            </div>

            <div className="entries-section">
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
                                    {/* <small className="clickable" onClick={() => setExpandedAddress(expandedAddress === entry.owner ? null : entry.owner)}>
                                        Created by: {expandedAddress === entry.owner ? entry.owner : `${entry.owner.slice(0, 5)}...`}
                                    </small> */}
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
                                                {/* <div className="contributor-address">
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
                                                </div> */}
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




// Alternative design 
//     return (
//         <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-6 bg-gray-50">
//             <div className=" top-0 z-10 bg-gradient-to-b from-purple-50 to-gray-50 border-b border-purple-100 rounded-t-lg shadow-sm mb-4 sm:mb-6">
//                 <div className="px-3 sm:px-6 py-3 sm:py-4">
//                     <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
//                         ✨ Collaborative Writings
//                     </h2>
//                 </div>
//                 {allEntries.length > 0 && (
//                     <CollaborativeAnalysis entries={allEntries} />
//                 )}
//             </div>

//             <div className="space-y-4 sm:space-y-6">
//                 {allEntries.map((entry) => (
//                     <div
//                         key={entry.id} 
//                         className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
//                     >
//                         <div className="p-3 sm:p-6">
//                             <div className="flex space-x-2 sm:space-x-4">
//                                 <div className="flex-shrink-0">
//                                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-100 to-gray-100 
//                                                   border border-gray-200 flex items-center justify-center shadow-inner">
//                                         {/* <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" /> */}
//                                     </div>
//                                 </div>

//                                 <div className="flex-1 min-w-0">
//                                     <div className="flex items-center justify-between space-x-2 flex-wrap">
                                        
//                                         {/* <button
//                                             onClick={() => setExpandedAddress(expandedAddress === entry.owner ? null : entry.owner)}
//                                             className="text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors truncate max-w-[200px]"
//                                         >
//                                             {expandedAddress === entry.owner
//                                                 ? entry.owner
//                                                 : `${entry.owner.slice(0, 6)}...${entry.owner.slice(-4)}`}
//                                         </button> */}
//                                         <span className="text-gray-400">•</span>
//                                         {/* <span className="text-xs sm:text-sm text-gray-500">
//                                             {new Date(entry.timestamp * 1000).toLocaleDateString()}
//                                         </span> */}
//                                         <button>
//                                         <MoreHorizontal className="w-5 h-5 text-gray-400" />
//                                         </button>
//                                     </div>
                                    

//                                     <div className="mt-3 text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">
//                                         {entry.content}
//                                     </div>

//                                     {/* <div className="mt-4 flex flex-wrap gap-2 text-gray-500 text-xs sm:text-sm">
//                                         <span className="flex items-center space-x-1 px-2 py-1 bg-purple-50 rounded-full">
//                                             <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
//                                             <span className="text-purple-600">
//                                                 {entry.isFinalized ? 'Finalized' : 'Open for Contributions'}
//                                             </span>
//                                         </span>
//                                         {entry.location && (
//                                             <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
//                                                 <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
//                                                 <span className="truncate max-w-[150px]">{entry.location}</span>
//                                             </span>
//                                         )}
//                                         <span className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded-full">
//                                             <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
//                                             <span className="text-blue-600">
//                                                 {new Date(entry.timestamp * 1000).toLocaleTimeString([], { 
//                                                     hour: '2-digit', 
//                                                     minute: '2-digit' 
//                                                 })}
//                                             </span>
//                                         </span>
//                                     </div> */}

//                                     <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-4">
//                                         <button className="flex items-center space-x-1 text-purple-500 hover:text-purple-600">
//                                             {/* <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
//                                             <span className="text-xs sm:text-sm">
//                                                 {entry.contributions?.length || 0}
//                                             </span> */}
//                                             <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
//                                             <span className="text-xs sm:text-sm">
//                                             {new Date(entry.timestamp * 1000).toLocaleTimeString([], { 
//                                                     hour: '2-digit', 
//                                                     minute: '2-digit' 
//                                                 })}
//                                             </span>

//                                         </button>
                                  
//                                         {entry.location && (
//                                             <button>
//                                             <span className="flex items-center space-x-1 px-2 py-1 bg-blue- text-blue-400 rounded-full">
//                                                 <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
//                                                 <span className="truncate max-w-[150px]">{entry.location}</span>
//                                             </span>
//                                             </button>
//                                         )}
//                                         <button className="flex items-center space-x-1 text-red-400 hover:text-red-500">
//                                             {/* <Heart className="w-4 h-4 sm:w-5 sm:h-5" /> */}
//                                             <span className="text-xs sm:text-sm text-gray-500 hover:text-purple-600">
//                                             {new Date(entry.timestamp * 1000).toLocaleDateString()}
//                                         </span>
//                                         </button>
//                                         <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-500">
//                                             <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {allEntries.length > 0 && (
//                 <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
//                     <CollaborativeAnalysis 
//                         entries={allEntries} 
//                         theme={theme}
//                     />
//                 </div>
//             )}
//         </div>
//     );
// };
