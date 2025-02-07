'use client';

import DDebrief from '@/app/ui/dashboard/ddebrief';
import WeeklyIdea from '@/app/ui/dashboard/weekly-idea';
import DaiyIdea from '@/app/ui/dashboard/daily-idea';
import EveDebrief from '@/app/ui/dashboard/evening-debrief';
import RandomEntry from '@/app/ui/dashboard/randomEntry';
import RandomPicks from '@/app/ui/dashboard/listRandom';
import { lusitana } from '@/app/ui/fonts';
import { fetchCardData } from '@/app/lib/data';
import { Suspense, useEffect, useState } from 'react';
import CardWrapper from '@/app/ui/dashboard/cards';
import { RevenueChartSkeleton, LatestInvoicesSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
import React from 'react';
import { useContract } from '@/context/ContractContext';


export default function Page() {
  const  contract  = useContract();
  // const [globalEntryCount, setGlobalEntryCount] = useState(0);

  // useEffect(() => {
  //   const fetchGlobalEntryCount = async () => {
  //     if (contract) {
  //       const globalEntryCount = await contract.entryCount();
  //       setGlobalEntryCount(Number(globalEntryCount));
  //     }
  //   };
  //   fetchGlobalEntryCount();
  // }, [contract]);


  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
         <Suspense fallback={<RevenueChartSkeleton />}>
          <DDebrief  /> 
         </Suspense>
         <Suspense fallback={< LatestInvoicesSkeleton />}>
          <RandomEntry  /> 
         </Suspense>  
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense>
          <RandomPicks />
        </Suspense>
        <Suspense>
          <WeeklyIdea />
        </Suspense>
        <Suspense>
          <DaiyIdea />
        </Suspense>
      </div>




      
    </main>
  );
}