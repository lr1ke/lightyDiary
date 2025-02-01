import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import DiaryContract from '../artifacts/contracts/DiaryContract.sol/DiaryContract.json';
import '../styles/EntryForm.css';
import { useContract } from '@/context/ContractContext';





const CreateComp = () => {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCollaborative, setIsCollaborative] = useState(false);
    const [error, setError] = useState('');
    const [location, setLocation] = useState('');
    const [locationError, setLocationError] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    const  contract  = useContract();
  


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
        } catch (error) {
            console.error('Error creating entry:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="container">


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
            </div>
            )
};

export default CreateComp;
