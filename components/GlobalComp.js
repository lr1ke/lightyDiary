import React, { useState, useEffect, Suspense } from 'react';
import '../styles/EntryForm.css';
import GlobalEntriesAnalysis from './GlobalEntriesAnalysis';
import { useContract } from '@/context/ContractContext';
import { useSearchParams } from 'next/navigation';
import '@/styles/EntryForm.css';   
import { BookOpen, Users, Lock, CheckCircle, MapPin, Clock, User, MoreHorizontal, MessageCircle, Repeat2, Heart, Share, Megaphone } from 'lucide-react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';


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
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-6 bg-gray-50">
            <div className=" top-0 z-10 bg-gradient-to-b from-blue-50 to-gray-50 border-b border-blue-100 rounded-t-lg shadow-sm mb-4 sm:mb-6">
                <div className="px-3 sm:px-6 py-3 sm:py-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🌍 Global  </h2>
                </div>
            </div>
            
            {allEntries.length > 0 && (
                    <GlobalEntriesAnalysis entries={allEntries} />
                )}

            {error && (
                <div className="p-3 sm:p-4 mb-4 text-red-700 bg-red-100 rounded-lg border border-red-200 text-sm sm:text-base">
                    {error}
                </div>
            )}

            <div className="space-y-4 sm:space-y-6">
                {allEntries.map(entry => (
                    <div 
                        key={entry.id}
                        id={`entry-${entry.id}`}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm 
                            hover:shadow-md transition-all duration-200"
                    >
                        <div className="p-3 sm:p-6">
                            <div className="flex space-x-2 sm:space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-100 to-gray-100 
                                                    border border-gray-200 flex items-center justify-center shadow-inner">
                                    <SpeakerWaveIcon className="w-6 h-6 text-blue-400" />            
                                    </div>
                                </div>
                                    <div className="flex-1 min-w-0"> 
                                    <div className="flex items-center space-x-2 flex-wrap">
                                    </div>

                                    {entry.isCollaborative && (
                                        <div className="mt-2 px-2 sm:px-3 py-1 bg-blue-50 rounded-full inline-block">
                                            <span className="text-xs sm:text-sm font-medium text-blue-600 truncate">
                                                Theme: {entry.title}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-3 text-sm sm:text-base text-gray-800 whitespace-pre-wrap break-words">
                                        {entry.content}
                                    </div>

                                    <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-4">
                                            <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-600">
                                             <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                             <span className="text-xs sm:text-sm">
                                             {new Date(entry.timestamp * 1000).toLocaleTimeString([], { 
                                                     hour: '2-digit', 
                                                     minute: '2-digit' 
                                                 })}
                                             </span>
                                         </button>
                                        <button className="flex items-center space-x-1 text-red-400 hover:text-red-500">
                                             <span className="text-xs sm:text-sm text-gray-500 hover:text-purple-600">
                                             {new Date(entry.timestamp * 1000).toLocaleDateString()}
                                         </span>
                                         </button>

                                        {entry.location && (
                                             <button>
                                             <span className="flex items-center space-x-1 px-2 py-1 bg-blue- text-gray-400 rounded-full">
                                                 <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                                 <span className="truncate max-w-[150px]">{entry.location}</span>
                                             </span>
                                             </button>
                                         )}
                                    </div>

                                    {entry.isCollaborative && entryContributions[entry.id] && (
                                        <div className="mt-4 sm:mt-6 pl-3 sm:pl-6 border-l-2 border-blue-100">
                                            {entryContributions[entry.id].map((contribution, index) => (
                                                <div key={index} className="mb-3 sm:mb-4 last:mb-0 bg-gray-50 rounded-lg p-3 sm:p-4">
                                                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                                                        <span className="text-gray-500">
                                                            {new Date(contribution.timestamp * 1000).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm break-words">{contribution.content}</p>
                                                    {contribution.location && (
                                                        <div className="mt-2 flex items-center space-x-1 text-gray-500">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="text-xs truncate max-w-[150px]">{contribution.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GlobalCompWrapper = () => (
    <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
    }>
        <GlobalComp />
    </Suspense>
    );

export default GlobalCompWrapper;





