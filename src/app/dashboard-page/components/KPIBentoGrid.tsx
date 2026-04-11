'use client';

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { getScoredCandidates } from '@/lib/mockData';
import Icon from '@/components/ui/AppIcon';


export default function KPIBentoGrid() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scoredCandidates = mounted ? getScoredCandidates() : [];
  const totalCandidates = scoredCandidates.length;

  if (totalCandidates === 0) {
    return (
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {[
          { id: 'kpi-total', label: 'Total Candidates', value: '0', icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', bg: 'bg-white', border: 'border-slate-200', trend: 'No resumes uploaded yet', trendColor: 'text-slate-400', description: 'Resumes uploaded and parsed' },
          { id: 'kpi-avg', label: 'Average Score', value: '—', icon: TrendingUp, iconBg: 'bg-slate-100', iconColor: 'text-slate-400', bg: 'bg-white', border: 'border-slate-200', trend: 'Run analysis to see scores', trendColor: 'text-slate-400', description: 'Weighted composite score' },
          { id: 'kpi-topfit', label: 'Top Fit Candidates', value: '0', icon: Star, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', bg: 'bg-white', border: 'border-slate-200', trend: 'Score ≥ 80 — ready to interview', trendColor: 'text-violet-600', description: 'Score ≥ 80 — ready to interview' },
          { id: 'kpi-gap', label: 'Top Skill Gap', value: '—', icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-500', bg: 'bg-red-50/30', border: 'border-red-200', trend: 'No data yet', trendColor: 'text-slate-400', description: 'Most common missing required skill' },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <div key={kpi.id} className={`card ${kpi.bg} border ${kpi.border} p-5 flex flex-col gap-3`}>
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                  <KpiIcon size={18} className={kpi.iconColor} />
                </div>
                <p className="section-label">{kpi.label}</p>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tabular-nums text-slate-900 font-mono">{kpi.value}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{kpi.description}</p>
              </div>
              <p className={`text-xs font-semibold ${kpi.trendColor}`}>{kpi.trend}</p>
            </div>
          );
        })}
      </div>
    );
  }

  const avgScore = Math.round(
    scoredCandidates.reduce((sum, sc) => sum + sc.score.finalScore, 0) / totalCandidates
  );
  const topFitCount = scoredCandidates.filter((sc) => sc.score.fitTag === 'Top Fit').length;

  // Most common missing skill
  const missingSkillCounts: Record<string, number> = {};
  scoredCandidates.forEach((sc) => {
    sc.score.missingSkills.forEach((skill) => {
      missingSkillCounts[skill] = (missingSkillCounts[skill] || 0) + 1;
    });
  });
  const topMissingSkill = Object.entries(missingSkillCounts).sort((a, b) => b[1] - a[1])[0];

  const kpis = [
    {
      id: 'kpi-total',
      label: 'Total Candidates',
      value: totalCandidates.toString(),
      suffix: '',
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      bg: 'bg-white',
      border: 'border-slate-200',
      trend: `${totalCandidates} resume${totalCandidates !== 1 ? 's' : ''} analyzed`,
      trendColor: 'text-emerald-600',
      description: 'Resumes uploaded and parsed',
    },
    {
      id: 'kpi-avg',
      label: 'Average Score',
      value: avgScore.toString(),
      suffix: '/100',
      icon: TrendingUp,
      iconBg: avgScore >= 70 ? 'bg-emerald-100' : 'bg-amber-100',
      iconColor: avgScore >= 70 ? 'text-emerald-600' : 'text-amber-600',
      bg: avgScore >= 70 ? 'bg-emerald-50/30' : 'bg-amber-50/30',
      border: avgScore >= 70 ? 'border-emerald-200' : 'border-amber-200',
      trend: avgScore >= 70 ? 'Strong talent pool' : 'Below target (target: 70)',
      trendColor: avgScore >= 70 ? 'text-emerald-600' : 'text-amber-600',
      description: 'Weighted composite score',
    },
    {
      id: 'kpi-topfit',
      label: 'Top Fit Candidates',
      value: topFitCount.toString(),
      suffix: '',
      icon: Star,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      bg: 'bg-white',
      border: 'border-slate-200',
      trend: `${Math.round((topFitCount / totalCandidates) * 100)}% of pool`,
      trendColor: 'text-violet-600',
      description: 'Score ≥ 80 — ready to interview',
    },
    {
      id: 'kpi-gap',
      label: 'Top Skill Gap',
      value: topMissingSkill ? topMissingSkill[0] : 'None',
      suffix: '',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      bg: 'bg-red-50/30',
      border: 'border-red-200',
      trend: topMissingSkill ? `Missing in ${topMissingSkill[1]} candidates` : 'All skills covered',
      trendColor: 'text-red-500',
      description: 'Most common missing required skill',
    },
  ];

  return (
    // 4 cards → 4-col single row on xl+, 2×2 on md
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`card ${kpi.bg} border ${kpi.border} p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                <Icon size={18} className={kpi.iconColor} />
              </div>
              <p className="section-label">{kpi.label}</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums text-slate-900 font-mono">{kpi.value}</span>
                {kpi.suffix && <span className="text-sm font-medium text-slate-400">{kpi.suffix}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.description}</p>
            </div>
            <p className={`text-xs font-semibold ${kpi.trendColor}`}>{kpi.trend}</p>
          </div>
        );
      })}
    </div>
  );
}