'use client';


import {
    BanknotesIcon,
    ClockIcon,
    UserGroupIcon,
    InboxIcon,
  } from '@heroicons/react/24/outline';
  import { lusitana } from '@/app/ui/fonts';

import React, { useState, useEffect } from 'react';
import { useContract } from '@/context/ContractContext';




  const iconMap = {
    collected: BanknotesIcon,
    customers: UserGroupIcon,
    pending: ClockIcon,
    invoices: InboxIcon,
  };
  
  export default function CardWrapper() {
    const contract = useContract();
    const [stats, setStats] = useState({
        numberAllEntries: 0,
        numberYourEntries: 0,
        numberCollabThreads: 0
    });
    
    useEffect(() => {
        const fetchContractData = async () => {
            if (!contract) return;
            
            try {
                // Get total entries count
                const entryCount = await contract.entryCount();
                
                // Get user's entries
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                const userAddress = accounts[0];
                const userEntries = await contract.getUserEntries(userAddress);
                
                // Get Number of collaborative threads
                const allEntries = await contract.getAllEntries();
                const collabCount = await allEntries.filter(entry => entry.isCollaborative).length;

                
                setStats({
                    numberAllEntries: Number(entryCount),
                    numberYourEntries: userEntries.length,
                    numberCollabThreads: collabCount
                });
            } catch (error) {
                console.log('Error fetching contract data:');
            }
        };

        fetchContractData();
    }, [contract]);


    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card title="All Entries" value={stats.numberAllEntries} type="collected" />
      <Card title="Your Entries" value={stats.numberYourEntries} type="pending" />
      <Card 
        title="Collaborative Threads" 
        value={stats.numberCollabThreads} 
        type="invoices" 
      />
    </div>
  );
}  


  //       <div className="flex flex-row gap-4 justify-between">
  //           <Card title="All Entries" value={stats.numberAllEntries} type="collected" />
  //           <Card title="Your Entries" value={stats.numberYourEntries} type="pending" />
  //           <Card title="Collaborative Threads" value={stats.numberCollabThreads} type="invoices" />
  //       </div>
  //   );
  // }
  
  export function Card({
    title,
    value,
    type,
  }) {
    const Icon = iconMap[type];
  
    return (
      // <div className="rounded-xl bg-gray-50 p-2 shadow-sm w-full">
      <div className="rounded-xl   shadow-sm w-full">

      <div className="flex items-center p-4">
        {Icon && <Icon className="h-5 w-5 text-gray-700" />}
        <h3 className="ml-2 text-sm font-medium ">{title}</h3>
      </div>
      <p className={`
        ${lusitana.className}
        truncate 
        rounded-xl 
        bg-white 
        px-4 
        py-8 
        text-center 
        text-xl
        sm:text-2xl
      `}>
        {value}
      </p>
    </div>
  );
}
  