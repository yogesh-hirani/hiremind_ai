import React from 'react';
import { GitCompare, Sparkles } from 'lucide-react';

export default function ComparisonHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <GitCompare size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compare Candidates</h1>
        </div>
        <p className="text-sm text-slate-500 ml-10">
          Select two candidates for a deep side-by-side analysis with AI-powered hiring recommendation.
        </p>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200">
        <Sparkles size={14} className="text-violet-600" />
        <span className="text-xs font-semibold text-violet-700">Gemini AI Powered</span>
      </div>
    </div>
  );
}