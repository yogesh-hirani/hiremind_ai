'use client';

import { Toaster } from 'sonner';

export default function Toast() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
        },
        duration: 3000,
      }}
    />
  );
}