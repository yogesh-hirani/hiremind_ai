'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, GitCompare, Download, RefreshCw, Clock } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Dashboard</h1>
        </div>
        <div className="flex items-center gap-3 ml-10">
          <p className="text-sm text-slate-500">Senior Full-Stack Engineer · 12 candidates scored</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={11} />
            <span>Updated Apr 06 2026, 5:50 PM</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-secondary text-xs py-2 px-3">
          <RefreshCw size={13} />
          Re-analyze
        </button>
        <button className="btn-secondary text-xs py-2 px-3">
          <Download size={13} />
          Export CSV
        </button>
        <Link href="/comparison-page" className="btn-primary text-xs py-2 px-3">
          <GitCompare size={13} />
          Compare Candidates
        </Link>
      </div>
    </div>
  );
}