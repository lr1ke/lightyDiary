import React, { useState, useEffect, useMemo } from 'react';
import '../styles/EntryForm.css';
import { useContract } from '@/context/ContractContext';
import DiaryAnalysis from './DiaryAnalysis';
// import { BookOpen, Users, Lock, CheckCircle, MapPin, Clock, User } from 'lucide-react';
import { BookOpen, Users, Lock, CheckCircle, MapPin, Clock, User, MoreHorizontal, MessageCircle, Repeat2, Heart, Share, Megaphone } from 'lucide-react';



const PersonalComp = () => {
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [myContributions, setMyContributions] = useState({});
    const [expandedAddress, setExpandedAddress] = useState(null);
    const [expandedLocation, setExpandedLocation] = useState(null);
    const [userAddress, setUserAddress] = useState('');
    const [error, setError] = useState('');
    
    const contract = useContract();

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
        if (!contract || !userAddress) return;
        console.log("no userAssress or contract");

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
            console.error('Error loading entires:', error);
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

    
    // const loadMyContributions = async (entryId) => {

    //         const contributionsMap = {};
    //         const contributions = await contract.getEntryContributions(entryId);

    //         const myContributionsToEntry = Array.from(contributions).filter(
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
    //         setMyContributions(contributionsMap);
    // };

    const loadMyContributions = async (entryId) => {  
        try {
            const contributions = await contract.getEntryContributions(entryId);
            const myContributionsToEntry = Array.from(contributions).filter(
                contribution => contribution.contributor.toLowerCase() === userAddress.toLowerCase()
            );

            if (myContributionsToEntry.length > 0) {
                setMyContributions(prev => ({
                    ...prev,
                    [entryId]: {
                        entryTitle: allEntries.find(e => e.id === entryId)?.title,
                        contributions: myContributionsToEntry.map(contribution => ({
                            content: contribution.content,
                            timestamp: Number(contribution.timestamp),
                            location: contribution.location,
                            contributor: contribution.contributor  
                        }))
                    }
                }));
            }
        } catch (error) {
            console.error('Error loading contributions:', error);
        }
    };

    const finalizeEntry = async (entryId) => {
        try {
            if (!contract || !userAddress) {
                console.error('Contract not initialized or user not connected');
                return;
            }

            setLoading(true);
            const tx = await contract.finalizeEntry(entryId);
            await tx.wait();
            
            // Refresh entries after finalizing
            const myEntriesResult = await contract.getUserEntries(userAddress);
            const formattedEntries = formatEntries(myEntriesResult);
            setAllEntries(formattedEntries);
        } catch (error) {
            console.error('Error finalizing entry:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="top-0 z-10 bg-white border-b border-gray-200">
            <div className="px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-800">Personal</h2>
            </div>
            {allEntries.length > 0 && (
                    <DiaryAnalysis entries={allEntries} />
                )}
            </div>

            {error && (
                <div className="p-3 sm:p-4 mb-4 text-red-700 bg-red-100 rounded-lg border border-red-200 text-sm sm:text-base">
                    {error}
                </div>
            )}

            <div className="divide-y divide-gray-200">
                {allEntries.map(entry => (
                    <div key={entry.id} className="p-4 hover:bg-blue-50 transition-colors">
                        <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                                 {/* <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-6 h-6 text-gray-500" />
                                </div>  */}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    {/* <div className="flex items-center space-x-1">
                                         <span className="text-sm text-gray-500">
                                            {new Date(entry.timestamp * 1000).toLocaleDateString()}
                                        </span>
                                    </div> */}
                                                                        <button className="flex items-center space-x-2 hover:text-red-500">
                                         {/* <Heart className="w-4 h-4" /> */}
                                        <span className="text-sm text-blue-200">
                                             <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </span>
                                    </button> 
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </div>

                                {entry.isCollaborative && (
                                    <div className="mt-1">
                                        <span className="text-sm font-medium text-gray-500">
                                            Theme: {entry.title}
                                        </span>
                                    </div>
                                )}
                                <p className="mt-2 text-gray-900 whitespace-pre-wrap">{entry.content}</p>
                                  <div className="mt-3 flex justify-between items-center text-gray-500">
                                    <button className="flex items-center space-x-2 hover:text-blue-500">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-xs sm:text-sm">
                                             {new Date(entry.timestamp * 1000).toLocaleTimeString([], { 
                                                     hour: '2-digit', 
                                                     minute: '2-digit' 
                                                 })}
                                             </span>                                    </button>
                                    <button className="flex items-center space-x-2 hover:text-green-500">
                                    {new Date(entry.timestamp * 1000).toLocaleDateString()}
                                    </button>

                                    <button className="flex items-center space-x-2 hover:text-blue-500"> 
                                    {entry.location && (
                                        <span className="flex items-center space-x-1">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-xs">{entry.location}</span>
                                        </span>
                                    )}                                   
                                      </button>
                                </div> 

                                {entry.isCollaborative && myContributions[entry.id] && (
                                    <div className="mt-4 pl-4 border-l-2 border-gray-200">
                                        {myContributions[entry.id].contributions.map((contribution, index) => (
                                            <div key={index} className="mt-3 first:mt-0">
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <span className="font-medium text-gray-900">
                                                        {`${contribution.contributor.slice(0, 6)}...${contribution.contributor.slice(-4)}`}
                                                    </span>
                                                    <span className="text-gray-500">·</span>
                                                    <span className="text-gray-500">
                                                        {new Date(contribution.timestamp * 1000).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-gray-900">{contribution.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {entry.isCollaborative && 
                                    !entry.isFinalized && 
                                    entry.owner.toLowerCase() === userAddress.toLowerCase() && (
                                    <div className="mt-4">
                                        <button 
                                            onClick={() => finalizeEntry(entry.id)}
                                            disabled={loading}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-full
                                                     hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Finalize Thread
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

//     return (
//         <div className="max-w-3xl mx-auto px-8 py-8">
//             <div className="mt-4">
//                 <div className="flex justify-between items-center mb-6">
//                     <h2 className="text-2xl font-medium text-gray-900">My Diary</h2>
//                     {/* {allEntries.length > 0 && (
//                         <button 
//                             onClick={() => setShowAnalysis(!showAnalysis)}
//                             className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 
//                                      hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-900 
//                                      transition-all focus:outline-none focus:ring-2 focus:ring-gray-900"
//                         >
//                             <ChartBar className="w-4 h-4" />
//                             Analyze Entries
//                         </button>
//                     )}
//                 </div>

//                 {showAnalysis && allEntries.length > 0 && (
//                     <div className="mb-8 p-4 border border-gray-200 rounded-md">
//                         <DiaryAnalysis entries={allEntries} />
//                     </div>
//                 )} */}
//                 </div>

//                 {allEntries.map(entry => (
//                     <div key={entry.id} className="mb-8 pb-6 border-b border-gray-200">
//                         <div className="relative">
//                             {/* Compact header with all metadata */}
//                             <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
//                                 <span className="flex items-center gap-1">
//                                     {entry.isCollaborative ? 
//                                         <Users className="w-3 h-3" /> : 
//                                         <BookOpen className="w-3 h-3" />}
//                                     {entry.isCollaborative ? 'Collaborative' : 'Regular'}
//                                 </span>
//                                 {entry.isCollaborative && (
//                                     <span className="flex items-center gap-1">
//                                         {entry.isFinalized ? 
//                                             <CheckCircle className="w-3 h-3" /> : 
//                                             <Lock className="w-3 h-3" />}
//                                         {entry.isFinalized ? 'Finalized' : 'Open'}
//                                     </span>
//                                 )}
//                                 <span className="flex items-center gap-1">
//                                     <User className="w-3 h-3" />
//                                     {expandedAddress === entry.owner ? entry.owner : `${entry.owner.slice(0, 5)}...`}
//                                 </span>
//                                 <span className="flex items-center gap-1">
//                                     <Clock className="w-3 h-3" />
//                                     {new Date(Number(entry.timestamp) * 1000).toLocaleString()}
//                                 </span>
//                                 {entry.location && (
//                                     <span className="flex items-center gap-1">
//                                         <MapPin className="w-3 h-3" />
//                                         {expandedLocation === entry.id ? entry.location : `${entry.location.slice(0, 15)}...`}
//                                     </span>
//                                 )}
//                             </div>
                            
//                             {/* Title for collaborative entries */}
//                             {entry.isCollaborative && (
//                                 <h3 className="text-sm font-medium text-gray-900 mb-2">Theme: {entry.title}</h3>
//                             )}
                            
//                             {/* Main content */}
//                             <div className="my-4 p-4 bg-gray-50 rounded-md">
//                                 <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
//                                     {entry.content}
//                                 </p>
//                             </div>

//                             {/* Contributions section */}
//                             {entry.isCollaborative && myContributions[entry.id] && (
//                                 <div className="mt-3 ml-4 pl-4 border-l border-gray-200">
//                                     {myContributions[entry.id].contributions.map((contribution, index) => (
//                                         <div key={`${entry.id}-${index}`} className="mb-4">
//                                             <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
//                                                 <span className="flex items-center gap-1">
//                                                     <Users className="w-3 h-3" />
//                                                     Contribution
//                                                 </span>
//                                                 <span className="flex items-center gap-1">
//                                                     <User className="w-3 h-3" />
//                                                     {expandedAddress === contribution.contributor 
//                                                         ? contribution.contributor 
//                                                         : `${contribution.contributor.slice(0, 5)}...`}
//                                                 </span>
//                                                 <span className="flex items-center gap-1">
//                                                     <Clock className="w-3 h-3" />
//                                                     {new Date(contribution.timestamp * 1000).toLocaleString()}
//                                                 </span>
//                                                 {contribution.location && (
//                                                     <span className="flex items-center gap-1">
//                                                         <MapPin className="w-3 h-3" />
//                                                         {contribution.location}
//                                                     </span>
//                                                 )}
//                                             </div>
//                                             <div className="p-4 bg-gray-50 rounded-md">
//                                                 <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
//                                                     {contribution.content}
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}

//                             {/* Finalize button */}
//                             {entry.isCollaborative && 
//                                 !entry.isFinalized && 
//                                 entry.owner.toLowerCase() === userAddress.toLowerCase() && (
//                                 <div className="mt-3">
//                                     <button 
//                                         onClick={() => finalizeEntry(entry.id)}
//                                         className="text-xs border border-gray-900 text-gray-900 px-3 py-1
//                                                  hover:bg-gray-900 hover:text-white transition-all
//                                                  disabled:opacity-50 disabled:cursor-not-allowed"
//                                         disabled={loading}
//                                     >
//                                         Finalize Thread
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

//     return (
//         <div className="max-w-3xl mx-auto px-8 py-8">
//             <div className="mt-8">
//                 <h2 className="text-2xl font-medium text-gray-900 mb-8">My Diary</h2>
//                 {allEntries.length > 0 && (
//                     <DiaryAnalysis entries={allEntries} />
//                 )}

//                 {allEntries.map(entry => (
//                     <div key={entry.id} className="mb-10 pb-8 border-b border-gray-200">
//                         <div className="relative">
//                             <div className="flex justify-between items-start mb-4 text-gray-500">
//                                 <div className="flex items-center gap-4">
//                                     <span className="flex items-center gap-1 text-sm">
//                                         {entry.isCollaborative ? 
//                                             <Users className="w-4 h-4" /> : 
//                                             <BookOpen className="w-4 h-4" />}
//                                         {entry.isCollaborative ? 'Collaborative' : 'Regular'}
//                                     </span>
//                                     {entry.isCollaborative && (
//                                         <div>
//                                             <h3 className="text-lg font-medium text-gray-900 m-0">Theme: {entry.title}</h3>
//                                         </div>
//                                     )}
//                                 </div>
//                                 {entry.isCollaborative && (
//                                     <span className="flex items-center gap-1 text-sm">
//                                         {entry.isFinalized ? 
//                                             <CheckCircle className="w-4 h-4" /> : 
//                                             <Lock className="w-4 h-4" />}
//                                         {entry.isFinalized ? 'Finalized' : 'Open for contributions'}
//                                     </span>
//                                 )}
//                             </div>
                            
//                             <div className="my-6 p-6 bg-gray-50 rounded-lg">
//                                 <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
//                                     {entry.content}
//                                 </p>
//                             </div>

//                             <div className="flex gap-6 text-sm text-gray-500 mt-4">
//                                 <small className="flex items-center gap-1 cursor-pointer hover:text-gray-900 transition-colors">
//                                     <User className="w-4 h-4" />
//                                     {expandedAddress === entry.owner ? entry.owner : `${entry.owner.slice(0, 5)}...`}
//                                 </small>
//                                 <small className="flex items-center gap-1">
//                                     <Clock className="w-4 h-4" />
//                                     {new Date(Number(entry.timestamp) * 1000).toLocaleString()}
//                                 </small>
//                                 {entry.location && (
//                                     <small className="flex items-center gap-1 cursor-pointer hover:text-gray-900 transition-colors">
//                                         <MapPin className="w-4 h-4" />
//                                         {expandedLocation === entry.id ? entry.location : `${entry.location.slice(0, 15)}...`}
//                                     </small>
//                                 )}
//                             </div>

//                             {entry.isCollaborative && myContributions[entry.id] && (
//                                 <div className="mt-6 ml-8 pl-4 border-l border-gray-200">
//                                     {myContributions[entry.id].contributions.map((contribution, index) => (
//                                         <div key={`${entry.id}-${index}`} className="mb-6">
//                                             <span className="text-sm text-gray-500 flex items-center gap-1 mb-4">
//                                                 <Users className="w-4 h-4" />
//                                                 My Contribution
//                                             </span>
//                                             <div className="p-6 bg-gray-50 rounded-lg">
//                                                 <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
//                                                     {contribution.content}
//                                                 </p>
//                                             </div>
//                                             <div className="flex gap-6 text-sm text-gray-500 mt-4">
//                                                 <div className="flex items-center gap-1">
//                                                     <User className="w-4 h-4" />
//                                                     {expandedAddress === contribution.contributor 
//                                                         ? contribution.contributor 
//                                                         : `${contribution.contributor.slice(0, 5)}...`}
//                                                 </div>
//                                                 <small className="flex items-center gap-1">
//                                                     <Clock className="w-4 h-4" />
//                                                     {new Date(contribution.timestamp * 1000).toLocaleString()}
//                                                 </small>
//                                                 {contribution.location && (
//                                                     <small className="flex items-center gap-1">
//                                                         <MapPin className="w-4 h-4" />
//                                                         {contribution.location}
//                                                     </small>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}

//                             {entry.isCollaborative && 
//                                 !entry.isFinalized && 
//                                 entry.owner.toLowerCase() === userAddress.toLowerCase() && (
//                                 <div className="mt-6">
//                                     <button 
//                                         onClick={() => finalizeEntry(entry.id)}
//                                         className="border border-gray-900 text-gray-900 px-4 py-2 text-sm
//                                                  hover:bg-gray-900 hover:text-white transition-all
//                                                  disabled:opacity-50 disabled:cursor-not-allowed"
//                                         disabled={loading}
//                                     >
//                                         Finalize Thread
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };


    // return (
    //     <div className="container">
    //             <div className="entries-section">
    //             <h2>My Diary</h2>
    //             {allEntries.length > 0 && (
    //                 <DiaryAnalysis entries={allEntries} />
    //             )}

    //             {allEntries.map(entry => (
    //                 <div key={entry.id} className="entry-container">
    //                     <div className="entry">
    //                         <div className="entry-header">
    //                             <div className="entry-title">
    //                                 <span className="entry-type-tag">
    //                                     {entry.isCollaborative ? '👥 Collaborative' : '📝 Regular'}
    //                                 </span>
    //                                 {entry.isCollaborative && (
    //                                     <div className="collaborative-title">
    //                                         <h3>Theme: {entry.title}</h3>
    //                                     </div>
    //                                 )}
    //                             </div>
    //                             <span className="entry-status">
    //                                 {entry.isCollaborative && (entry.isFinalized ? '✅ Finalized' : '🔓 Open for contributions')}
    //                             </span>
    //                         </div>
    //                         <p className="entry-content">{entry.content}</p>
    //                         <div className="entry-metadata">
    //                             <small className="clickable" onClick={() => setExpandedAddress(expandedAddress === entry.owner ? null : entry.owner)}>
    //                                 Created by: {expandedAddress === entry.owner ? entry.owner : `${entry.owner.slice(0, 5)}...`}
    //                             </small>
    //                             <small>Date: {new Date(Number(entry.timestamp) * 1000).toLocaleString()}</small>
    //                             {entry.location && (
    //                                 <small 
    //                                     className="contribution-location clickable"
    //                                     onClick={() => setExpandedLocation(expandedLocation === entry.id ? null : entry.id)}
    //                                 >
    //                                     📍 {expandedLocation === entry.id ? entry.location : `${entry.location.slice(0, 15)}...`}
    //                                 </small>
    //                             )}
    //                         </div>



    //                             {entry.isCollaborative && myContributions[entry.id] && (
    //                 <div className="contributions-container">
    //                     {myContributions[entry.id].contributions.map((contribution, index) => (
    //                         <div key={`${entry.id}-${index}`} className="contribution">
    //                             <div className="entry-header">
    //                                 <div className="entry-title">
    //                                     <span className="entry-type-tag">💭 My Contribution</span>
    //                                 </div>
    //                             </div>
    //                             <p className="entry-content">{contribution.content}</p>
    //                             <div className="entry-metadata">
    //                                 <div className="contributor-address">
    //                                     <span className="address-label">Contributor:</span>
    //                                     <span className="address-value clickable">
    //                                         {expandedAddress === contribution.contributor 
    //                                             ? contribution.contributor 
    //                                             : `${contribution.contributor.slice(0, 5)}...`}
    //                                     </span>
    //                                 </div>
    //                                 <small>Date: {new Date(contribution.timestamp * 1000).toLocaleString()}</small>
    //                                 {contribution.location && (
    //                                     <small className="contribution-location clickable">
    //                                         📍 {contribution.location}
    //                                     </small>
    //                                 )}
    //                             </div>
    //                         </div>
    //                     ))}
    //                 </div>
    //                             )}


    //     {entry.isCollaborative && 
    //         !entry.isFinalized && 
    //         entry.owner.toLowerCase() === userAddress.toLowerCase() && (
    //         <div className="entry-actions">
    //             <button 
    //                 onClick={() => finalizeEntry(entry.id)}
    //                 className="finalize-button"
    //                 disabled={loading}
    //             >
    //                 Finalize Thread
    //             </button>
    //         </div>
    //     )}
    //                 </div>
    //                 </div>
    //             ))}
    //         </div>
    //         </div>
    //         );
    //         };

export default PersonalComp;
