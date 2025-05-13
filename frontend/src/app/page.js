// app/page.js
'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-100">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-6">
          🍽️ FoodVision
        </h1>
        <p className="text-xl text-black-100 mb-10">
          Upload a food image and let our AI model identify it from 11 different categories.
          Experience the magic of deep learning in food recognition!
        </p>
        <button
          onClick={() => router.push('/inference')}
          className="relative inline-block px-8 py-3 font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-md hover:from-blue-600 hover:to-cyan-600 hover:scale-105"
        >
          Let’s Go →
        </button>
      </div>
    </main>
  );
}
