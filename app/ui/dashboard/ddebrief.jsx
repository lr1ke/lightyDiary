'use client';

import { CalendarIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';



export default function DDebrief() {
   
  return (
    <div className="w-full md:col-span-4">
      {/* <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Daily (De)brief
      </h2> */}

       <div className="rounded-xl bg-gray-50 p-4">
        {/* <div className="sm:grid-cols-13 mt-0 grid grid-cols-12 items-end gap-2 rounded-md bg-white p-4 md:gap-4"> */}
        <div className="rounded-md bg-white p-4">
          <div
            className="mb-6 text-sm text-gray-700 leading-relaxed"
          >
            What's top of mind? <br /> How am I feeling? <br /> What am i excited about?
 
          </div>

        </div>
        {/* <div className="flex items-center pb-2 pt-6">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 "> Daily Morning (De)Brief </h3>
        </div> */}
      </div> 
    </div>
  );
}
