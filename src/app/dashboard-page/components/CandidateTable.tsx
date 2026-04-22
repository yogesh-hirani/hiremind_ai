'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  GitCompare,
  Eye,
  Star,
  Filter,
  X,
  CheckSquare,
  Trophy,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  XCircle,
  AlertTriangle,
  BookOpen,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
} from 'lucide-react';
import { getScoredCandidates } from '@/lib/mockData';
import { getSessionJob } from '@/lib/candidateStore';
import { toast } from 'sonner';

type SortField = 'name' | 'finalScore' | 'skillMatch' | 'experienceMatch' | 'totalExperience';
type SortDir = 'asc' | 'desc';
type FitFilter = 'All' | 'Top Fit' | 'Good Fit' | 'Low Fit';

function FitBadge({ tag }: { tag: 'Top Fit' | 'Good Fit' | 'Low Fit' }) {
  if (tag === 'Top Fit') return <span className="badge-top-fit">● Top Fit</span>;
  if (tag === 'Good Fit') return <span className="badge-good-fit">● Good Fit</span>;
  return <span className="badge-low-fit">● Low Fit</span>;
}

function ConfidenceBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  if (level === 'High') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <ShieldCheck size={9} />
        High
      </span>
    );
  }
  if (level === 'Medium') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
        <ShieldAlert size={9} />
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">
      <ShieldOff size={9} />
      Low
    </span>
  );
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-semibold tabular-nums text-slate-700 w-7 text-right">{value}</span>
    </div>
  );
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={13} className="text-slate-300" />;
  return dir === 'asc'
    ? <ChevronUp size={13} className="text-blue-500" />
    : <ChevronDown size={13} className="text-blue-500" />;
}

// ── Why Not Selected Card ──────────────────────────────────────────────────
interface WhyNotSelectedCardProps {
  sc: ReturnType<typeof getScoredCandidates>[number];
  minimumExperience: number;
}

function WhyNotSelectedCard({ sc, minimumExperience }: WhyNotSelectedCardProps) {
  const [expanded, setExpanded] = useState(false);

  const missingSkills = sc.score.missingSkills ?? [];
  const expGap = minimumExperience - sc.candidate.totalExperience;
  const hasExpGap = expGap > 0;

  // Derive risk factors from weaknesses + low scores
  const riskFactors: string[] = [];
  if (sc.score.skillMatch < 50) riskFactors.push('Low skill coverage — significant training required');
  if (sc.score.experienceMatch < 50) riskFactors.push('Below minimum experience threshold');
  if (sc.score.confidenceLevel === 'Low') riskFactors.push('Low AI confidence in candidate fit');
  if (sc.score.fitTag === 'Low Fit') riskFactors.push('Classified as Low Fit for this role');
  // Add weaknesses that aren't already covered
  sc.score.weaknesses.forEach((w) => {
    if (!riskFactors.some((r) => r.toLowerCase().includes(w.toLowerCase().slice(0, 15)))) {
      riskFactors.push(w);
    }
  });

  return (
    <div className="rounded-xl border border-red-100 bg-red-50/30 overflow-hidden transition-all duration-200 hover:shadow-sm">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50/60 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <XCircle size={14} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{sc.candidate.name}</p>
          <p className="text-xs text-slate-500 truncate">{sc.candidate.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-sm font-bold text-red-600 tabular-nums">{sc.score.finalScore}</span>
          <FitBadge tag={sc.score.fitTag} />
          <ConfidenceBadge level={sc.score.confidenceLevel} />
          {expanded
            ? <ChevronUpIcon size={14} className="text-slate-400" />
            : <ChevronDownIcon size={14} className="text-slate-400" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-red-100 pt-3">
          {/* AI Explanation */}
          <p className="text-xs text-slate-600 leading-relaxed italic">"{sc.score.aiExplanation}"</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Missing Skills */}
            <div className="rounded-lg bg-white border border-red-100 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} className="text-red-500 flex-shrink-0" />
                <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Missing Skills</span>
              </div>
              {missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {missingSkills.map((skill) => (
                    <span
                      key={`missing-${sc.candidate.id}-${skill}`}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No required skills missing</p>
              )}
            </div>

            {/* Experience Gap */}
            <div className="rounded-lg bg-white border border-amber-100 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Experience Gap</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Candidate</span>
                  <span className="font-mono font-bold text-slate-700">{sc.candidate.totalExperience} yrs</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Required</span>
                  <span className="font-mono font-bold text-slate-700">{minimumExperience} yrs</span>
                </div>
                <div className="h-px bg-slate-100 my-0.5" />
                {hasExpGap ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-600 font-semibold">Gap</span>
                    <span className="font-mono font-bold text-amber-600">−{expGap} yr{expGap !== 1 ? 's' : ''}</span>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-semibold">Meets experience requirement</p>
                )}
                <ScoreBar value={sc.score.experienceMatch} />
              </div>
            </div>

            {/* Risk Factors */}
            <div className="rounded-lg bg-white border border-orange-100 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldAlert size={12} className="text-orange-500 flex-shrink-0" />
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Risk Factors</span>
              </div>
              {riskFactors.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {riskFactors.slice(0, 4).map((risk, i) => (
                    <li key={`risk-${sc.candidate.id}-${i}`} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No significant risk factors</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────
const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const TOP_CANDIDATE_STYLES = [
  { border: 'border-amber-300', bg: 'bg-amber-50/60', badge: 'bg-amber-100 text-amber-700 border-amber-300', ring: 'ring-1 ring-amber-200' },
  { border: 'border-slate-300', bg: 'bg-slate-50/80', badge: 'bg-slate-100 text-slate-600 border-slate-300', ring: 'ring-1 ring-slate-200' },
  { border: 'border-orange-200', bg: 'bg-orange-50/40', badge: 'bg-orange-100 text-orange-700 border-orange-200', ring: 'ring-1 ring-orange-100' },
];

export default function CandidateTable() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allCandidates = mounted ? getScoredCandidates() : [];
  const sessionJob = mounted ? getSessionJob() : null;
  const [search, setSearch] = useState('');
  const [fitFilter, setFitFilter] = useState<FitFilter>('All');
  const [sortField, setSortField] = useState<SortField>('finalScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [whyNotExpanded, setWhyNotExpanded] = useState(true);
  const perPage = 8;

  // Top 3 candidates always sorted descending by finalScore
  const topCandidates = useMemo(() => {
    return [...allCandidates]
      .sort((a, b) => b.score.finalScore - a.score.finalScore)
      .slice(0, 3);
  }, [allCandidates]);

  const topCandidateIds = useMemo(() => new Set(topCandidates.map((sc) => sc.candidate.id)), [topCandidates]);

  // Non-shortlisted candidates sorted descending by score
  const notSelectedCandidates = useMemo(() => {
    return [...allCandidates]
      .filter((sc) => !topCandidateIds.has(sc.candidate.id))
      .sort((a, b) => b.score.finalScore - a.score.finalScore);
  }, [allCandidates, topCandidateIds]);

  // Minimum experience from real job data
  const minimumExperience = useMemo(() => {
    return sessionJob?.minimumExperience ?? 0;
  }, [sessionJob]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    return allCandidates.filter((sc) => {
      const matchSearch =
        sc.candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        sc.candidate.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchFit = fitFilter === 'All' || sc.score.fitTag === fitFilter;
      return matchSearch && matchFit;
    });
  }, [allCandidates, search, fitFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortField === 'name') { av = a.candidate.name; bv = b.candidate.name; }
      else if (sortField === 'finalScore') { av = a.score.finalScore; bv = b.score.finalScore; }
      else if (sortField === 'skillMatch') { av = a.score.skillMatch; bv = b.score.skillMatch; }
      else if (sortField === 'experienceMatch') { av = a.score.experienceMatch; bv = b.score.experienceMatch; }
      else if (sortField === 'totalExperience') { av = a.candidate.totalExperience; bv = b.candidate.totalExperience; }

      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((sc) => sc.candidate.id)));
    }
  };

  const handleShortlist = () => {
    toast.success(`${selectedIds.size} candidate${selectedIds.size > 1 ? 's' : ''} shortlisted successfully.`);
    setSelectedIds(new Set());
  };

  const colHeaders: { id: string; label: string; field?: SortField; width?: string }[] = [
    { id: 'col-select', label: '' },
    { id: 'col-rank', label: '#', width: 'w-8' },
    { id: 'col-name', label: 'Candidate', field: 'name' },
    { id: 'col-score', label: 'Final Score', field: 'finalScore' },
    { id: 'col-confidence', label: 'Confidence' },
    { id: 'col-fit', label: 'Fit Tag' },
    { id: 'col-skill', label: 'Skill Match', field: 'skillMatch' },
    { id: 'col-exp-match', label: 'Exp. Match', field: 'experienceMatch' },
    { id: 'col-exp', label: 'Experience', field: 'totalExperience' },
    { id: 'col-skills', label: 'Key Skills' },
    { id: 'col-actions', label: '' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {allCandidates.length === 0 ? (
        <div className="card p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Trophy size={28} className="text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-700">No candidates yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Upload resumes and run analysis from the Upload page to see scored candidates here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Top Candidates Section ── */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Trophy size={15} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Top Candidates</h2>
                <p className="text-xs text-slate-500">Automatically selected · Highest scoring</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Auto-shortlisted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topCandidates.map((sc, idx) => {
                const style = TOP_CANDIDATE_STYLES[idx];
                return (
                  <div
                    key={`top-${sc.candidate.id}`}
                    className={`relative rounded-xl border ${style.border} ${style.bg} ${style.ring} p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-md`}
                  >
                    {/* Recommended badge */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        <Sparkles size={10} />
                        Recommended
                      </span>
                      <span className="text-lg">{RANK_MEDALS[idx]}</span>
                    </div>

                    {/* Candidate info */}
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{sc.candidate.name}</p>
                      <p className="text-xs text-slate-500 truncate">{sc.candidate.email}</p>
                    </div>

                    {/* Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Final Score</span>
                      <span className="font-mono font-bold text-base text-emerald-600 tabular-nums">{sc.score.finalScore}</span>
                    </div>

                    {/* Score bar */}
                    <ScoreBar value={sc.score.finalScore} />

                    {/* Fit tag + experience */}
                    <div className="flex items-center justify-between">
                      <FitBadge tag={sc.score.fitTag} />
                      <span className="text-xs text-slate-500 font-mono">{sc.candidate.totalExperience} yrs exp</span>
                    </div>

                    {/* Confidence badge */}
                    <ConfidenceBadge level={sc.score.confidenceLevel} />

                    {/* Top skills */}
                    <div className="flex flex-wrap gap-1">
                      {sc.candidate.skills.slice(0, 3).map((skill) => (
                        <span key={`top-${sc.candidate.id}-${skill}`} className="skill-chip">{skill}</span>
                      ))}
                      {sc.candidate.skills.length > 3 && (
                        <span className="text-xs text-slate-400 font-medium self-center">+{sc.candidate.skills.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Why Not Selected Section ── */}
          <div className="card overflow-hidden">
            {/* Section header */}
            <button
              className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-50/60 transition-colors border-b border-slate-100"
              onClick={() => setWhyNotExpanded((v) => !v)}
            >
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle size={15} className="text-red-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-slate-900">Why Not Selected</h2>
                <p className="text-xs text-slate-500">
                  AI-generated reasons for candidates outside the top 3 shortlist
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  {notSelectedCandidates.length} not shortlisted
                </span>
                {whyNotExpanded
                  ? <ChevronUpIcon size={15} className="text-slate-400" />
                  : <ChevronDownIcon size={15} className="text-slate-400" />
                }
              </div>
            </button>

            {/* Candidate cards */}
            {whyNotExpanded && (
              <div className="p-5 flex flex-col gap-2">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mb-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={11} className="text-red-500" />
                    Missing Skills — required skills the candidate lacks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={11} className="text-amber-500" />
                    Experience Gap — years below the minimum requirement
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert size={11} className="text-orange-500" />
                    Risk Factors — AI-identified concerns for this role
                  </span>
                </div>

                {notSelectedCandidates.map((sc) => (
                  <WhyNotSelectedCard
                    key={`why-not-${sc.candidate.id}`}
                    sc={sc}
                    minimumExperience={minimumExperience}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── All Candidates Table ── */}
          <div className="card flex flex-col">
            {/* Table header / filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 border-b border-slate-100">
              <div className="relative flex-1 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by name or skill..."
                  className="input-field pl-9 py-2 text-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X size={13} className="text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Filter size={13} className="text-slate-400" />
                {(['All', 'Top Fit', 'Good Fit', 'Low Fit'] as FitFilter[]).map((f) => (
                  <button
                    key={`filter-${f}`}
                    onClick={() => { setFitFilter(f); setPage(1); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${
                      fitFilter === f
                        ? f === 'Top Fit' ? 'bg-emerald-600 text-white border-emerald-600'
                        : f === 'Good Fit' ? 'bg-amber-500 text-white border-amber-500'
                        : f === 'Low Fit'? 'bg-red-500 text-white border-red-500' :'bg-blue-600 text-white border-blue-600' :'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="ml-auto text-xs text-slate-500 font-medium">
                {filtered.length} of {allCandidates.length} candidates
              </div>
            </div>

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border-b border-blue-200 animate-slide-up">
                <CheckSquare size={15} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">{selectedIds.size} selected</span>
                <button onClick={handleShortlist} className="btn-primary text-xs py-1.5 px-3">
                  <Star size={12} />
                  Shortlist Selected
                </button>
                <Link href="/comparison-page" className="btn-secondary text-xs py-1.5 px-3">
                  <GitCompare size={12} />
                  Compare
                </Link>
                <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-slate-500 hover:text-slate-700">
                  Clear
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {colHeaders.map((col) => (
                      <th
                        key={col.id}
                        className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap ${col.width || ''} ${col.field ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}
                        onClick={col.field ? () => handleSort(col.field!) : undefined}
                      >
                        {col.id === 'col-select' ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.size === paginated.length && paginated.length > 0}
                            onChange={toggleAll}
                            className="rounded border-slate-300 text-blue-600 cursor-pointer"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            {col.label}
                            {col.field && (
                              <SortIcon field={col.field} active={sortField === col.field} dir={sortDir} />
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-slate-400 text-sm">
                        No candidates match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((sc, idx) => {
                      const globalRank = sorted.indexOf(sc) + 1;
                      const isSelected = selectedIds.has(sc.candidate.id);
                      const isTopCandidate = topCandidateIds.has(sc.candidate.id);
                      const topRank = isTopCandidate ? topCandidates.findIndex((t) => t.candidate.id === sc.candidate.id) : -1;
                      return (
                        <tr
                          key={sc.candidate.id}
                          className={`border-b transition-colors duration-100 group
                            ${isTopCandidate
                              ? topRank === 0
                                ? 'bg-amber-50/70 border-amber-100 hover:bg-amber-50'
                                : topRank === 1
                                ? 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/60' :'bg-orange-50/40 border-orange-100 hover:bg-orange-50/60'
                              : isSelected
                              ? 'bg-blue-50/60 border-slate-50'
                              : idx % 2 === 0
                              ? 'bg-white border-slate-50 hover:bg-slate-50' :'bg-slate-50/40 border-slate-50 hover:bg-slate-50'
                            }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(sc.candidate.id)}
                              className="rounded border-slate-300 text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono font-semibold text-slate-400 tabular-nums">
                              {globalRank <= 3 ? RANK_MEDALS[globalRank - 1] : globalRank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 whitespace-nowrap">{sc.candidate.name}</span>
                                {isTopCandidate && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                    <Sparkles size={8} />
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">{sc.candidate.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 min-w-[110px]">
                            <div className="flex items-center gap-1.5">
                              <ScoreBar value={sc.score.finalScore} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ConfidenceBadge level={sc.score.confidenceLevel} />
                          </td>
                          <td className="px-4 py-3">
                            <FitBadge tag={sc.score.fitTag} />
                          </td>
                          <td className="px-4 py-3 min-w-[100px]">
                            <ScoreBar value={sc.score.skillMatch} />
                          </td>
                          <td className="px-4 py-3 min-w-[100px]">
                            <ScoreBar value={sc.score.experienceMatch} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">
                              {sc.candidate.totalExperience} yr{sc.candidate.totalExperience !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {sc.candidate.skills.slice(0, 3).map((skill) => (
                                <span key={`${sc.candidate.id}-skill-${skill}`} className="skill-chip">{skill}</span>
                              ))}
                              {sc.candidate.skills.length > 3 && (
                                <span className="text-xs text-slate-400 font-medium">+{sc.candidate.skills.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <Link
                                href="/comparison-page"
                                className="w-7 h-7 rounded-md hover:bg-blue-50 flex items-center justify-center transition-colors"
                                title="Compare this candidate"
                              >
                                <GitCompare size={14} className="text-blue-500" />
                              </Link>
                              <button
                                className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center transition-colors"
                                title="View candidate detail"
                                onClick={() => toast.info(`Viewing ${sc.candidate.name}'s profile`)}
                              >
                                <Eye size={14} className="text-slate-500" />
                              </button>
                              <button
                                className="w-7 h-7 rounded-md hover:bg-amber-50 flex items-center justify-center transition-colors"
                                title="Shortlist candidate"
                                onClick={() => toast.success(`${sc.candidate.name} added to shortlist.`)}
                              >
                                <Star size={14} className="text-amber-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing {Math.min((page - 1) * perPage + 1, sorted.length)}–{Math.min(page * perPage, sorted.length)} of {sorted.length} candidates
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 text-xs font-semibold rounded-md transition-colors ${
                      page === p
                        ? 'bg-blue-600 text-white' :'text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}