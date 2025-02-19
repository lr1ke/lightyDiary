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

//   return (
//     <div className="w-full">
//       {/* Header Section */}
//       <div className="sticky top-0 z-10 w-full bg-gradient-to-b from-blue-50 to-gray-50 border-b border-blue-100 shadow-sm">
//         <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
//           <h1 className={`${lusitana.className} text-xl sm:text-2xl font-bold text-gray-800`}>
//             📊 Dashboard
//           </h1>
//         </div>
//       </div>

//       {/* Main Content */}
//       <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 bg-gray-50">
//         <div className="flex flex-col gap-6">
//           {/* Cards Section */}
//           <div className="w-full bg-white rounded-lg shadow-sm p-4 sm:p-6">
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               <Suspense fallback={<CardsSkeleton />}>
//                 <CardWrapper />
//               </Suspense>
//             </div>
//           </div>

//           {/* First Row */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
//               <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Debrief</h2>
//               <Suspense fallback={<RevenueChartSkeleton />}>
//                 <DDebrief />
//               </Suspense>
//             </div>

//             <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
//               <h2 className="text-lg font-semibold text-gray-800 mb-4">Random Entries</h2>
//               <Suspense fallback={<LatestInvoicesSkeleton />}>
//                 <RandomEntry />
//               </Suspense>
//             </div>
//           </div>

//           {/* Second Row */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
//               <h2 className="text-lg font-semibold text-gray-800 mb-4">Random Picks</h2>
//               <Suspense>
//                 <RandomPicks />
//               </Suspense>
//             </div>

//             <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
//               <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Ideas</h2>
//               <Suspense>
//                 <WeeklyIdea />
//               </Suspense>
//             </div>

//             <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
//               <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Ideas</h2>
//               <Suspense>
//                 <DaiyIdea />
//               </Suspense>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }







//   return (
//     <main className="flex min-h-screen flex-col bg-gray-50">
//       {/* Header Section */}
//       <div className="sticky top-0 z-10 bg-gradient-to-b from-blue-50 to-gray-50 border-b border-blue-100 shadow-sm mb-6 px-4 sm:px-6 py-4">
//         <h1 className={`${lusitana.className} text-xl sm:text-2xl font-bold text-gray-800`}>
//           📊 Dashboard
//         </h1>
//       </div>

//       {/* Main Content */}
//       <div className="flex flex-col gap-6 px-4 sm:px-6">
//         {/* Cards Section */}
//         <div className="w-full overflow-hidden bg-white rounded-lg shadow-sm p-4 sm:p-6">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             <Suspense fallback={<CardsSkeleton />}>
//               <CardWrapper />
//             </Suspense>
//           </div>
//         </div>

//         {/* First Row */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Debrief</h2>
//             <Suspense fallback={<RevenueChartSkeleton />}>
//               <DDebrief />
//             </Suspense>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Random Entries</h2>
//             <Suspense fallback={<LatestInvoicesSkeleton />}>
//               <RandomEntry />
//             </Suspense>
//           </div>
//         </div>

//         {/* Second Row */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
//           <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Random Picks</h2>
//             <Suspense>
//               <RandomPicks />
//             </Suspense>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Ideas</h2>
//             <Suspense>
//               <WeeklyIdea />
//             </Suspense>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Ideas</h2>
//             <Suspense>
//               <DaiyIdea />
//             </Suspense>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

//   return (
//     <main className="p-4 sm:p-6 bg-gray-50">
//       {/* Header */}
//       <div className="mb-6 bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg border-b border-blue-100 p-4">
//         <h1 className={`${lusitana.className} text-xl sm:text-2xl font-bold text-gray-800`}>
//           📊 Dashboard
//         </h1>
//       </div>

//       {/* Overview Cards */}
//       <div className="mb-6">
//         <Suspense fallback={<CardsSkeleton />}>
//           <CardWrapper />
//         </Suspense>
//       </div>

//       {/* Main Content */}
//       <div className="space-y-6">
//         {/* First Row */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <Suspense fallback={<RevenueChartSkeleton />}>
//             <DDebrief />
//           </Suspense>
//           <Suspense fallback={<LatestInvoicesSkeleton />}>
//             <RandomEntry />
//           </Suspense>
//         </div>

//         {/* Second Row */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <Suspense>
//             <RandomPicks />
//           </Suspense>
//           <Suspense>
//             <WeeklyIdea />
//           </Suspense>
//           <Suspense>
//             <DaiyIdea />
//           </Suspense>
//         </div>
//       </div>
//     </main>
//   );
// }

//   return (
//     <main className="flex min-h-screen flex-col p-6 ">
//       {/* Header Section */}
//       <div className="flex h-16 shrink-0 items-end rounded-lg bg-gradient-to-b from-blue-50 to-gray-50 border-b border-blue-100 shadow-sm mb-6 px-6 py-4">
//         <h1 className={`${lusitana.className} text-2xl font-bold text-gray-800`}>
//          Dashboard
//         </h1>
//       </div>

//       {/* Main Content */}
//       <div className="flex flex-col gap-6">
//         {/* Cards Section */}
//         <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
//           {/* <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2> */}
//           <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//             <Suspense fallback={<CardsSkeleton />}>
//               <CardWrapper />
//             </Suspense>
//           </div>
//         </div>

//         {/* First Row */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Debrief</h2>
//             <Suspense fallback={<RevenueChartSkeleton />}>
//               <DDebrief />
//             </Suspense>
//           </div>

//           <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Random Entries</h2>
//             <Suspense fallback={<LatestInvoicesSkeleton />}>
//               <RandomEntry />
//             </Suspense>
//           </div>
//         </div>

//         {/* Second Row */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Random Picks</h2>
//             <Suspense>
//               <RandomPicks />
//             </Suspense>
//           </div>

//           <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Ideas</h2>
//             <Suspense>
//               <WeeklyIdea />
//             </Suspense>
//           </div>

//           <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Ideas</h2>
//             <Suspense>
//               <DaiyIdea />
//             </Suspense>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

  return (
    <main>
       <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dear journaler,
      </h1> 

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>




      
    </main>
  );
}
