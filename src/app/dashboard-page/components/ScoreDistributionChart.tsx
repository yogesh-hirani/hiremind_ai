'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getScoredCandidates } from '@/lib/mockData';

const BINS = [
  { id: 'bin-0-40', range: '0–40', min: 0, max: 40, color: '#ef4444' },
  { id: 'bin-40-60', range: '40–60', min: 40, max: 60, color: '#f59e0b' },
  { id: 'bin-60-70', range: '60–70', min: 60, max: 70, color: '#f59e0b' },
  { id: 'bin-70-80', range: '70–80', min: 70, max: 80, color: '#3b82f6' },
  { id: 'bin-80-90', range: '80–90', min: 80, max: 90, color: '#10b981' },
  { id: 'bin-90-100', range: '90–100', min: 90, max: 101, color: '#10b981' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card px-3 py-2.5">
      <p className="text-xs font-semibold text-slate-700">Score range: {label}</p>
      <p className="text-sm font-bold text-slate-900 mt-0.5">{payload[0].value} candidate{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function ScoreDistributionChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scoredCandidates = mounted ? getScoredCandidates() : [];

  if (scoredCandidates.length === 0) {
    return (
      <div className="card p-5 h-full flex flex-col items-center justify-center gap-3 text-center min-h-[280px]">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">No data yet</p>
          <p className="text-xs text-slate-500 mt-1">Upload and analyze resumes to see score distribution.</p>
        </div>
      </div>
    );
  }

  const chartData = BINS.map((bin) => ({
    ...bin,
    count: scoredCandidates.filter(
      (sc) => sc.score.finalScore >= bin.min && sc.score.finalScore < bin.max
    ).length,
  }));

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Score Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">Candidates by final score range</p>
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'DM Sans' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'DM Sans' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={entry.color} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { id: 'leg-low', label: 'Low Fit', color: 'bg-red-400', count: scoredCandidates.filter((sc) => sc.score.fitTag === 'Low Fit').length },
          { id: 'leg-good', label: 'Good Fit', color: 'bg-amber-400', count: scoredCandidates.filter((sc) => sc.score.fitTag === 'Good Fit').length },
          { id: 'leg-top', label: 'Top Fit', color: 'bg-emerald-500', count: scoredCandidates.filter((sc) => sc.score.fitTag === 'Top Fit').length },
        ].map((item) => (
          <div key={item.id} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs font-medium text-slate-600">{item.label}</span>
            <span className="text-sm font-bold font-mono text-slate-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}