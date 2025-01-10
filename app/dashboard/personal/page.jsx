'use client';

import PersonalComp from '@/components/PersonalComp'

export default function Personal() {
  'use client';  // Add this if you get hydration errors
  
  return (
    <main>
      <PersonalComp />
    </main>
  )
}