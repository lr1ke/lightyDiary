'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import DiaryContract from '../artifacts/contracts/DiaryContract.sol/DiaryContract.json';

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
    const [contract, setContract] = useState(null);


    useEffect(() => {
        const initContract = async () => {
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
                
                setContract(contractInstance);
            };
        initContract();
    }, []);

    return (
        <ContractContext.Provider value={ contract }>
            {children}
        </ContractContext.Provider>
    );
};

export const useContract = () => useContext(ContractContext);





// const ContractProvider = ({ children }) => {
//     const [contract, setContract] = useState(null);
//     const [entries, setEntries] = useState([]); // State to hold entries

//     useEffect(() => {
//         const initContract = async () => {
//             // Load the contract
//             try {
//                 const provider = new ethers.BrowserProvider(window.ethereum);
//                 const signer = await provider.getSigner();
//                 const contractAddress = '0x02C4bCE808937Ef2Ace44F89557Bb8cD217D3473';
//                 const contractInstance = new ethers.Contract(contractAddress, DiaryContract.abi, signer);
//                 setContract(contractInstance);
//             } catch (error) {
//                 console.error('Error initializing contract:', error);
//             }
//         };

//         // Check last initialization time
//         const lastInitTime = localStorage.getItem('lastInitTime');
//         const currentTime = Date.now();
//         const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

//         if (!lastInitTime || (currentTime - lastInitTime > twentyFourHours)) {
//             // If it's the first time or 24 hours have passed, reinitialize the contract
//             initContract();
//             localStorage.setItem('lastInitTime', currentTime); // Update last initialization time

//             // Fetch all entries excluding today's entries
//             await fetchAllEntriesExcludingRecent();
//         } else {
//             // If less than 24 hours, just use the existing contract instance
//             console.log("Using existing contract instance.");
//             // Fetch all entries without filtering
//             await fetchAllEntries(); // Fetch all entries without filtering
//         }

//         // Cleanup listeners on unmount
//         return () => {
//             // ... existing cleanup code ...
//         };
//     }, []); // Ensure this runs only once on mount

// const fetchAllEntriesExcludingRecent = async () => {
//     // Logic to fetch all entries from the contract
//     console.log("Fetching all entries.");
//     const allEntries = await contract.getAllEntries(); // Example function to get all entries

//     // Map through the entries to convert timestamps to human-readable format
//     const formattedEntries = allEntries.map(entry => {
//         return {
//             ...entry,
//             date: new Date(entry.timestamp * 1000) // Convert timestamp to Date object
//         };
//     });

//     // Sort entries by date (oldest first)
//     formattedEntries.sort((a, b) => a.date - b.date);

//     // Get the current time
//     const now = new Date();
//     const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

//     // Filter entries to find the first entry older than 24 hours
//     const olderEntries = formattedEntries.filter(entry => entry.date < twentyFourHoursAgo);

//     setEntries(olderEntries); // Update state with filtered entries
// };

// const fetchAllEntries = async () => {
//     // Logic to fetch all entries from the contract
//     console.log("Fetching all entries.");
//     const allEntries = await contract.getAllEntries(); // Example function to get all entries
//     const formattedEntries = allEntries.map(entry => {
//         return {
//             ...entry,
//             date: new Date(entry.timestamp * 1000) // Convert timestamp to Date object
//         };
//     });
//     setEntries(formattedEntries); // Update state with all entries
// };

//     return (
//         <ContractContext.Provider value={{ contract, entries }}>
//             {children}
//         </ContractContext.Provider>
//     );
// };