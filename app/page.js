'use client';

import EntryForm from '../components/EntryForm'

export default function Home() {
  'use client';  // Add this if you get hydration errors
  
  return (
    <main>
      <h1>My Blockchain Diary</h1>
      <EntryForm />
    </main>
  )
}
