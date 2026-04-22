'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router?.push('/upload-page');
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history?.back();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <h1 className="text-9xl font-bold text-blue-600 opacity-20 select-none">404</h1>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Page Not Found</h2>
        <p className="text-slate-500 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors duration-150"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 px-6 py-3 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors duration-150"
          >
            <Home size={16} />
            Back to App
          </button>
        </div>
      </div>
    </div>
  );
}