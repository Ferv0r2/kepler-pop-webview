'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0B0C1D] to-[#101340]">
      <div className="flex flex-col items-center">
        <Loader2 className="w-16 h-16 text-white animate-spin" />
        <p className="mt-4 text-lg font-semibold text-white" aria-live="polite">
          Loading...
        </p>
      </div>
    </div>
  );
}
