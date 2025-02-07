'use client';

import { CalendarIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function WeeklyIdea() {
   
  return (
    <div className="w-full md:col-span-4">


       <div className="rounded-xl bg-gray-50 p-4">
        {/* <div className="sm:grid-cols-13 mt-0 grid grid-cols-12 items-end gap-2 rounded-md bg-white p-4 md:gap-4"> */}
        <div className="rounded-md bg-white p-4">
          <div
            className="mb-6 text-sm text-gray-400 leading-relaxed"
          >
            Look back <br />
            The weekly debrief is your chance to
            reflect on what worked, cut what didn't 
            and set yourself up for a successful week ahead. <br />

            Use this to clear out mental clutter 
 
          </div>

        </div>
        <div className="flex items-center pb-2 pt-6">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">  </h3>
        </div>
      </div> 
    </div>
  );
}
