import React, { useState, useEffect } from 'react';
import { useContract } from '@/context/ContractContext';
import { Mic, MicOff, Radio, RadioTower, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const [activeCard, setActiveCard] = useState(0);

    const contract = useContract();

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
        } else {
            console.error('Speech recognition is not supported in this browser.');
        }
    }, [isCollaborative, content]);

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

    const PromptCard = ({ title, content, isActive, onNext, onPrev, isFirst, isLast }) => (
        <div className={`absolute top-0 left-0 w-full transition-opacity duration-300 ${
            isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{content}</p>

                <div className="flex justify-between mt-4">
                    <button
                        onClick={onPrev}
                        className={`p-2 rounded-full ${isFirst ? 'invisible' : 'bg-gray-100 hover:bg-gray-200'}`}
                        disabled={isFirst}
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={onNext}
                        className={`p-2 rounded-full ${isLast ? 'invisible' : 'bg-gray-100 hover:bg-gray-200'}`}
                        disabled={isLast}
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );

    const prompts = [
        {
            title: "Morning Debrief",
            content: "What's top of mind? \nHow am I feeling? \nWhat am I excited about?"
        },
        {
            title: "Evening Reflection",
            content: "What did I accomplish? \nWhat did I learn? \nOne win, one challenge, one grateful moment."
        },
        {
            title: "Weekly Insights",
            content: "Reflect on your week's journey.\nWhat patterns emerged?\nWhat lessons stood out?"
        }
    ];

    return (
        <main className="min-h-screen bg-gray-50 py-8">
            <div className="w-full max-w-7xl mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 mb-8 px-4">Create New Entry</h1>

                <div className="w-full max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 order-2 lg:order-1">
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                                <form onSubmit={handleSubmit}>
                                    <div className="flex items-center space-x-4 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsCollaborative(false)}
                                            className={`flex items-center px-4 py-2 rounded-full text-sm ${
                                                !isCollaborative
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Radio className="w-4 h-4 mr-2" />
                                            Personal Entry
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsCollaborative(true)}
                                            className={`flex items-center px-4 py-2 rounded-full text-sm ${
                                                isCollaborative
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            <RadioTower className="w-4 h-4 mr-2" />
                                            Collaborative Entry
                                        </button>
                                    </div>

                                    {isCollaborative && (
                                        <div className="mb-4">
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Enter theme/title for collaboration..."
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="relative">
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder={isCollaborative ? "Start a collaborative entry..." : "Write your diary entry..."}
                                            className="w-full min-h-[400px] p-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleListening}
                                            className={`absolute bottom-4 right-4 p-2 rounded-full transition-all ${
                                                isListening
                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading || !content.trim() || (isCollaborative && !title.trim())}
                                            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
                                        >
                                            {isCollaborative ? "Create Collaborative Entry" : "Create Entry"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-1 order-1 lg:order-2">
                            <div className="relative h-[200px] lg:h-auto">
                                {prompts.map((prompt, index) => (
                                    <PromptCard
                                        key={index}
                                        title={prompt.title}
                                        content={prompt.content}
                                        isActive={activeCard === index}
                                        onNext={() => setActiveCard(Math.min(prompts.length - 1, activeCard + 1))}
                                        onPrev={() => setActiveCard(Math.max(0, activeCard - 1))}
                                        isFirst={index === 0}
                                        isLast={index === prompts.length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CreateComp;


