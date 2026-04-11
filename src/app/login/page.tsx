'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'microsoft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const supabase = createClient();

  // Always resolve the callback URL at call-time so it works in all environments
  const getCallbackUrl = (next: string) => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/auth/callback?next=${next}`;
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading('google');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getCallbackUrl('/upload-page'),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(null);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setError(null);
      setLoading('microsoft');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email profile openid',
          redirectTo: getCallbackUrl('/upload-page'),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Microsoft');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {/* Logo & Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AppLogo size={44} />
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-xl leading-tight tracking-tight">
                  HireMind
                </span>
                <span className="text-sm text-blue-600 font-semibold flex items-center gap-1">
                  <Sparkles size={12} />
                  AI
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1 text-center">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? (
                <svg className="animate-spin h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {loading === 'google' ? 'Signing in…' : 'Continue with Google'}
            </button>

            {/* Microsoft */}
            <button
              onClick={handleMicrosoftLogin}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading === 'microsoft' ? (
                <svg className="animate-spin h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
                  <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
                  <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
                  <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
                </svg>
              )}
              {loading === 'microsoft' ? 'Signing in…' : 'Continue with Microsoft'}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              By signing in, you agree to our{' '}
              <span className="text-blue-600 cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-blue-600 cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {year ?? ''} HireMind AI. All rights reserved.
        </p>
      </div>
    </div>
  );
}
