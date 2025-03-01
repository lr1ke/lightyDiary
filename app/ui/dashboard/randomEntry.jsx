'use client';
import { ArrowPathIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { useEffect, useState } from 'react';
import { useContract } from '@/context/ContractContext';
import Link from 'next/link';
import { BookOpenIcon } from '@heroicons/react/24/outline';

export default function RandomEntry() {
  const [randomEntry, setRandomEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
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
    if (!contract || !userAddress) return;

    const fetchRandomEntry = async () => {
      try {
        const entries = await contract.getUserEntries(userAddress);
        if (entries.length === 0) {
          setError('No entries found for the current user.');
          return;
        }
        const randomIndex = Math.floor(Math.random() * entries.length);
        setRandomEntry(entries[randomIndex]);
      } catch (err) {
        console.error('Error fetching random entry:', err);
        setError('An error occurred while fetching the random entry.');
      } finally {
        setLoading(false);
      }
    };

    fetchRandomEntry();
  }, [contract, userAddress]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!randomEntry) return <div>No entry found</div>;



return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl text-gray-500`}>
      Blast from the Past
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl  p-4">

         <div className="bg-white px-6 py-4 rounded-lg mb-4">
         <p className=" text-gray-900 line-clamp-5">{randomEntry.content}</p>
                <Link 
                    href={`/dashboard/personal?highlight=${randomEntry.id}#entry-${randomEntry.id}`}
                    className="text-gray-400 hover:text-gray-600"
                    >
                     <BookOpenIcon className="h-5 w-5 text-gray-500 " />

                </Link>
        </div>
        <div className="flex items-center pb-2 pt-6">
          <SpeakerWaveIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Listen</h3>
        </div>
      </div>
    </div>
  );
}
