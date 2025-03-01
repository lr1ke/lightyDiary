'use client';

import { BookOpenIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { lusitana } from '@/app/ui/fonts';
import React, { useState, useEffect } from 'react';
import { useContract } from '@/context/ContractContext';
import Link from 'next/link';






export default function RandomPicks() {

    const contract = useContract();
    const [randomEntries, setRandomEntries] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchRandomEntries = async () => {
            if (!contract) return;

            try {
                setLoading(true);

                const allEntries = await contract.getAllEntries();
                
                // Shuffle array and get first 3 entries
                const entriesArray = Array.from(allEntries);
                const shuffled = entriesArray
                    .map(value => ({ value, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ value }) => value)
                    .slice(0, 3)
                    .map(entry => ({
                        id: Number(entry.id),
                        content: entry.content,
                        timestamp: new Date(Number(entry.timestamp) * 1000).toLocaleDateString(),
                        isCollaborative: entry.isCollaborative,
                        title: entry.title
                    }));

                setRandomEntries(shuffled);
            } catch (error) {
                console.error('Error fetching random entries:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRandomEntries();
    }, [contract]);

    if (loading) {
        return <div>Loading random entries...</div>;
    }

  return (
    <>
    <div className="flex w-full flex-col md:col-span-4">
    <div className="rounded-xl p-4">
    <div className="rounded-xl  p-4">

    <div className="rounded-md bg-white p-4">

    <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Random Picks 
      </h2> 
    {/* <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4"> */}
    <div className="flex grow flex-col justify-between rounded-xl p-4">

        {randomEntries?.map((entry) => (
            <div key={entry.id} className="bg-white px-6 py-4 rounded-lg mb-4">
                <p className="text-sm text-gray-500 line-clamp-5">{entry.content}</p>
                <small className="text-gray-400">{entry.timestamp}</small>
                <Link 
                    href={`/dashboard/global?highlight=${entry.id}#entry-${entry.id}`}
                    className="text-gray-400 hover:text-gray-600"
                    >
                     <BookOpenIcon className="h-5 w-5 text-gray-500" />

                </Link>
            </div>
        ))}
    </div>
</div>
</div>
</div>
</div>
</>
   );
 }


    {/* <div className="flex w-full flex-col md:col-span-4">

      <div className="flex grow flex-col justify-between rounded-xl  p-4">
         <div className="bg-white px-6">
    {randomEntries?.map((entry, i) => {

            return (
              <div
                key={entry.id}
                className={clsx(
                  'flex flex-row items-center justify-between py-4',
                  {
                    'border-t': i !== 0,
                  },
                )}
              >
                <div className="flex items-center flex-1 mr-4">
            
                  <div className="min-w-0">
                  <p className="text-sm font-semibold md:text-base line-clamp-3">
                  {entry.content}
                    </p>
                    <p className="hidden text-sm text-gray-500 sm:block">
                      {entry.timestamp}
                    </p>
                  </div>
                </div>
                <Link 
                    href={`/dashboard/global?highlight=${entry.id}#entry-${entry.id}`}
                    className="text-gray-400 hover:text-gray-600"
                    >
                     <BookOpenIcon className="h-5 w-5 text-gray-500" />

                </Link>
              </div>
            );
          })} 
        
        <div className="flex items-center pb-2 pt-6">
         <ArrowPathIcon className="h-5 w-5 text-gray-500" />
         <h3 className="ml-2 text-sm text-gray-500 ">Show other </h3>
        </div>
      </div>
    </div>
    </div> */}

