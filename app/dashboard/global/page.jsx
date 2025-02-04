'use client';

import GlobalCompWrapper from '@/components/GlobalComp'

export default function Global() {
  'use client';  // Add this if you get hydration errors
  
  return (
    <main>
      <GlobalCompWrapper />
    </main>
  )
}