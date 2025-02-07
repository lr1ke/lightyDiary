import { useState, useEffect } from 'react';
import { useContract } from '@/context/ContractContext';

export const useRandomUserEntry = () => {
  const { contract } = useContract();
  const [randomEntry, setRandomEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAddress, setUserAddress] = useState(null);

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
    if (!contract ) return;

    const fetchRandomEntry = async () => {
      try {
        // const signer = contract.signer;
        // console.log("Signer", signer);
        // const userAddress = await signer.getAddress();
        const entries = await contract.getUserEntries(userAddress);
        console.log("Entries", entries);
        if (entries.length === 0) {
          setError('No entries found for the current user.');
          setLoading(false);
          return;
        }
        const randomIndex = Math.floor(Math.random() * entries.length);
        setRandomEntry(entries[randomIndex]);
        console.log("Random Entry", entries[randomIndex]);
      } catch (err) {
        console.error('Error fetching random entry:', err);
        setError('An error occurred while fetching the random entry.');
      } finally {
        setLoading(false);
      }
    };

    fetchRandomEntry();
  }, [contract]);

  return { randomEntry, loading, error };
};
