import React, { useState, useEffect, useMemo } from 'react';
import '../styles/EntryForm.css';
import { useContract } from '@/context/ContractContext';
import DiaryAnalysis from './DiaryAnalysis';
import { BookOpen, Users, Lock, CheckCircle, MapPin, Clock, User, MoreHorizontal, MessageCircle, Repeat2, Heart, Share, Megaphone } from 'lucide-react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { readEntryContent } from "@/utils/textToSpeech";




const PersonalComp = () => {
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [myContributions, setMyContributions] = useState({});
    const [expandedAddress, setExpandedAddress] = useState(null);
    const [expandedLocation, setExpandedLocation] = useState(null);
    const [userAddress, setUserAddress] = useState('');
    const [error, setError] = useState('');
    const [voiceSpeed, setVoiceSpeed] = useState("default");
    const [language, setLanguage] = useState("en");
    const [translateTo, setTranslateTo] = useState("");
  
    
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
                      {/* 🔊 Read All Entries Button */}
          <button
            className="flex items-center space-x-2 text-gray-500 hover:text-red-400 py-4"
            onClick={() => readEntryContent(allEntries.map(entry => entry.content).join(". "))}
          >
            <SpeakerWaveIcon className="w-5 h-5 text-blue-300" />
            <span>Read All</span>
          </button>
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

        {/* Language, Translation & Voice Speed Selection */}
        <div className="flex space-x-4 p-4">
          <label>
            <span className="text-sm font-medium">Voice Speed:</span>
            <select
              className="ml-2 border p-1 rounded"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="slow">Slow</option>
              <option value="fast">Fast</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Translate To:</span>
            <select
              className="ml-2 border p-1 rounded"
              value={translateTo}
              onChange={(e) => setTranslateTo(e.target.value)}
            >
              <option value="">None</option>
              <option value="en">English</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ru">Russian</option>
              <option value="zh">Chinese</option>
              <option value="hi">Hindi</option>
              <option value="ar">Arabic</option>
              <option value="tr">Turkish</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </label>
        </div>

      {/* List of Diary Entries */}
            <div className="divide-y divide-gray-200">
                {allEntries.map(entry => (
                    <div key={entry.id} className="p-4 hover:bg-blue-50 transition-colors">
                        <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    {/* <button className="flex items-center space-x-2 hover:text-red-500" onClick={() => readEntryContent(entry.content)}>
                                        <span className="text-sm text-blue-300">
                                             <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </span>
                                    </button>  */}
                                                  <button
                className="flex items-center space-x-2 hover:text-red-500"
                onClick={() => readEntryContent(entry.content, voiceSpeed, translateTo)}
              >
                <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

                                    <button>
                                    <MoreHorizontal className="w-5 h-5 text-blue-300" />
                                    </button>
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

export default PersonalComp; 