'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
      if (session) {
        router?.replace('/upload-page');
      } else {
        router?.replace('/login');
      }
    });
  }, [router]);

  return null;
}