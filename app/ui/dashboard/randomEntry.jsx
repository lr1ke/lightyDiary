'use client';
import { ArrowPathIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { useEffect, useState } from 'react';
import { useContract } from '@/context/ContractContext';

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
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}> 
        Blast from the Past
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">

         <div className="bg-white px-6">
            <p>{ randomEntry.content } </p>
          {/* {latestInvoices.map((invoice, i) => {
            return (
              <div
                key={invoice.id}
                className={clsx(
                  'flex flex-row items-center justify-between py-4',
                  {
                    'border-t': i !== 0,
                  },
                )}
              >
                <div className="flex items-center">
                  <Image
                    src={invoice.image_url}
                    alt={`${invoice.name}'s profile picture`}
                    className="mr-4 rounded-full"
                    width={32}
                    height={32}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold md:text-base">
                      {invoice.name}
                    </p>
                    <p className="hidden text-sm text-gray-500 sm:block">
                      {invoice.email}
                    </p>
                  </div>
                </div>
                <p
                  className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
                >
                  {invoice.amount}
                </p>
              </div>
            );
          })} */}
        </div> 
        <div className="flex items-center pb-2 pt-6">
          <SpeakerWaveIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Listen</h3>
        </div>
      </div>
    </div>
  );
}
