import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/upload-page';

  // Always use the configured site URL for redirects
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${siteUrl}${next}`);
      }
      console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    } catch (err) {
      console.error('[auth/callback] unexpected error:', err);
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_failed`);
}
