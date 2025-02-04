'use client';

import CreateComp from '@/components/CreateComp';
import EveDebrief from '@/app/ui/dashboard/evening-debrief';
import DDebrief from '@/app/ui/dashboard/ddebrief';
import WeeklyDebrief from '@/app/ui/dashboard/weekly-debrief';
import WeeklyIdea from '@/app/ui/dashboard/weekly-idea';
import DaiyIdea from '@/app/ui/dashboard/daily-idea';


export default function Create() {
  'use client';  // Add this if you get hydration errors
  
  return (
    <main>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
      <WeeklyIdea />
      <DaiyIdea />  
      </div>



      <CreateComp />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
       
        <DDebrief  /> 
        <EveDebrief />
        <WeeklyDebrief />

      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">

      </div>
    </main>
  )
}