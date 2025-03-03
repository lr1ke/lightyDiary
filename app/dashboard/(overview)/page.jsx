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

  return (
    <main className="p-4 sm:p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg border-b border-blue-100 p-4">
        <h1 className={`${lusitana.className} text-xl sm:text-2xl font-bold text-gray-800`}>
          Overview
        </h1>
      </div>



      {/* Main Content */}
      <div className="space-y-6">
        {/* First Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<RevenueChartSkeleton />}>
            <DDebrief />
          </Suspense>
          <Suspense fallback={<LatestInvoicesSkeleton />}>
            <RandomEntry />
          </Suspense>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Overview Cards */}
      <div className="mb-6">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>

      </div>
    </main>
  );
}

