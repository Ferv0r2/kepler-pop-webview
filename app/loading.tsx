'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <Loader2 className="w-16 h-16 text-gray-400 animate-spin" />
        <p className="mt-4 text-lg font-semibold text-gray-700" aria-live="polite">
          Loading...
        </p>
      </div>
    </div>
  );
}
