import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// Import the ABI from the JSON file instead of .sol file
import DiaryContract from '../artifacts/contracts/DiaryContract.sol/DiaryContract.json';

const EntryForm = () => {
    const [content, setContent] = useState('');
    const [contract, setContract] = useState(null);
    
    useEffect(() => {
        const initContract = async () => {
            try {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contractInstance = new ethers.Contract(
                    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
                    DiaryContract.abi,
                    signer
                );
                setContract(contractInstance);
            } catch (error) {
                console.error('Error initializing contract:', error);
            }
        };

        initContract();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            if (!contract) {
                alert('Please connect your wallet first');
                return;
            }
            const tx = await contract.createEntry(content);
            await tx.wait();
            setContent('');
            console.log('Entry created successfully!');
        } catch (error) {
            console.error('Error creating entry:', error);
            alert('Error creating entry. Check console for details.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Write your entry..." 
            />
            <button type="submit">Create Entry</button>
        </form>
    );
};

export default EntryForm;
