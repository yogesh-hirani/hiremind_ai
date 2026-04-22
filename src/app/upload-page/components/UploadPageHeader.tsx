import React from 'react';
import { Upload, Sparkles } from 'lucide-react';

export default function UploadPageHeader() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero messaging */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-8 text-white shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
          HireMind AI — Smart Candidate Screening System
        </h1>
        <p className="text-blue-100 text-base sm:text-lg max-w-2xl leading-relaxed mb-5">
          Upload resumes and analyze candidates instantly using AI-powered parsing and a smart scoring engine.
        </p>
        <div className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-5 py-2.5">
          <Upload size={16} className="text-white" />
          <span className="text-sm font-semibold text-white">Upload resumes to get started</span>
        </div>
      </div>

      {/* Existing sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Upload size={16} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upload & Analyze</h2>
          </div>
          <p className="text-sm text-slate-500 ml-10">
            Upload candidate resumes and paste a job description to start AI-powered screening.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200">
          <Sparkles size={14} className="text-violet-600" />
          <span className="text-xs font-semibold text-violet-700">Gemini AI Powered</span>
        </div>
      </div>
    </div>
  );
}