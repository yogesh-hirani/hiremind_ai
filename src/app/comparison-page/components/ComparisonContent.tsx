'use client';

import React, { useState, useEffect } from 'react';
import {
  getScoredCandidates,
  getCandidateById,
  getScoreById,
} from '@/lib/mockData';
import { getSessionJob } from '@/lib/candidateStore';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import {
  ChevronDown,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trophy,
  Users,
  GitCompare,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { compareCandidates, ComparisonResult } from '@/lib/ai/geminiService';

function CandidateSelector({
  label,
  value,
  onChange,
  excludeId,
  color,
  allCandidates,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  excludeId: string;
  color: string;
  allCandidates: any[];
}) {
  const [open, setOpen] = useState(false);
  const selected = allCandidates.find((sc) => sc.candidate.id === value);

  return (
    <div className="relative">
      <p className="section-label mb-2">{label}</p>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 bg-white hover:bg-slate-50 transition-all duration-150 text-left ${
          color === 'blue' ? 'border-blue-200 hover:border-blue-400' : 'border-violet-200 hover:border-violet-400'
        }`}
      >
        {selected ? (
          <>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white ${
              color === 'blue' ? 'bg-blue-600' : 'bg-violet-600'
            }`}>
              {selected.candidate.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{selected.candidate.name}</p>
              <p className="text-xs text-slate-500">{selected.candidate.totalExperience} yrs exp · Score {selected.score.finalScore}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <Users size={18} />
            <span className="text-sm">Select a candidate...</span>
          </div>
        )}
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-modal z-20 max-h-64 overflow-y-auto animate-slide-up">
          {allCandidates.filter((sc) => sc.candidate.id !== excludeId).map((sc) => (
            <button
              key={sc.candidate.id}
              onClick={() => { onChange(sc.candidate.id); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                {sc.candidate.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{sc.candidate.name}</p>
                <p className="text-xs text-slate-500">{sc.candidate.totalExperience} yrs · {sc.score.fitTag}</p>
              </div>
              <span className={`text-xs font-bold font-mono tabular-nums ${
                sc.score.finalScore >= 80 ? 'text-emerald-600' : sc.score.finalScore >= 60 ? 'text-amber-600' : 'text-red-500'
              }`}>
                {sc.score.finalScore}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono font-bold tabular-nums text-slate-800 w-8 text-right">{value}%</span>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  if (level === 'High') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <ShieldCheck size={10} />
        High Confidence
      </span>
    );
  }
  if (level === 'Medium') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
        <ShieldAlert size={10} />
        Medium Confidence
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">
      <ShieldOff size={10} />
      Low Confidence
    </span>
  );
}

interface RadarTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function RadarTooltip({ active, payload, label }: RadarTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-card px-3 py-2.5 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={`radar-tip-${i}`} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function ComparisonContent() {
  const [mounted, setMounted] = useState(false);
  const [candidateAId, setCandidateAId] = useState('');
  const [candidateBId, setCandidateBId] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const ALL_CANDIDATES = mounted ? getScoredCandidates() : [];
  const sessionJob = mounted ? getSessionJob() : null;

  // Set default selections once candidates are loaded
  useEffect(() => {
    if (ALL_CANDIDATES.length >= 1 && !candidateAId) {
      setCandidateAId(ALL_CANDIDATES[0]?.candidate.id || '');
    }
    if (ALL_CANDIDATES.length >= 2 && !candidateBId) {
      const secondIdx = ALL_CANDIDATES.length >= 4 ? 3 : 1;
      setCandidateBId(ALL_CANDIDATES[secondIdx]?.candidate.id || ALL_CANDIDATES[1]?.candidate.id || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, ALL_CANDIDATES.length]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<ComparisonResult | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);

  const candA = mounted ? getCandidateById(candidateAId) : undefined;
  const candB = mounted ? getCandidateById(candidateBId) : undefined;
  const scoreA = mounted ? getScoreById(candidateAId) : undefined;
  const scoreB = mounted ? getScoreById(candidateBId) : undefined;

  const jobTitle = sessionJob?.title || 'the role';
  const requiredSkills = sessionJob?.requiredSkills || [];
  const minimumExperience = sessionJob?.minimumExperience || 0;

  const handleRunComparison = async () => {
    if (!candA || !candB || !scoreA || !scoreB) return;
    setIsGenerating(true);
    setAiGenerated(false);
    setAiResult(null);
    try {
      const result = await compareCandidates(
        {
          id: candA.id,
          name: candA.name,
          skills: candA.skills,
          experience: candA.totalExperience,
          score: scoreA.finalScore,
          strengths: scoreA.strengths,
          weaknesses: scoreA.weaknesses,
        },
        {
          id: candB.id,
          name: candB.name,
          skills: candB.skills,
          experience: candB.totalExperience,
          score: scoreB.finalScore,
          strengths: scoreB.strengths,
          weaknesses: scoreB.weaknesses,
        },
        jobTitle,
        requiredSkills
      );
      setAiResult(result);
      setAiGenerated(true);
      toast.success('Gemini AI comparison complete — recommendation ready.');
    } catch {
      toast.error('Comparison failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const radarData = [
    { subject: 'Skill Match', A: scoreA?.skillMatch || 0, B: scoreB?.skillMatch || 0 },
    { subject: 'Exp. Match', A: scoreA?.experienceMatch || 0, B: scoreB?.experienceMatch || 0 },
    { subject: 'Relevance', A: scoreA?.relevanceScore || 0, B: scoreB?.relevanceScore || 0 },
    { subject: 'Final Score', A: scoreA?.finalScore || 0, B: scoreB?.finalScore || 0 },
    { subject: 'Yrs Exp×10', A: Math.min((candA?.totalExperience || 0) * 10, 100), B: Math.min((candB?.totalExperience || 0) * 10, 100) },
  ];

  const winner = aiResult
    ? (aiResult.winnerId === candA?.id ? candA : candB)
    : scoreA && scoreB
    ? scoreA.finalScore > scoreB.finalScore ? candA : scoreA.finalScore < scoreB.finalScore ? candB : null
    : null;

  const canCompare = candidateAId && candidateBId && candidateAId !== candidateBId;

  const getRiskFactors = (candidateId: string): string[] => {
    if (!aiResult) return [];
    return aiResult.riskFactors.find((r) => r.candidateId === candidateId)?.risks || [];
  };

  if (mounted && ALL_CANDIDATES.length === 0) {
    return (
      <div className="mt-6 card p-16 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <GitCompare size={28} className="text-slate-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-700">No candidates to compare</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Upload resumes and run analysis from the Upload page first, then come back to compare candidates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Candidate selectors */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CandidateSelector
            label="Candidate A"
            value={candidateAId}
            onChange={(id) => { setCandidateAId(id); setAiGenerated(false); setAiResult(null); }}
            excludeId={candidateBId}
            color="blue"
            allCandidates={ALL_CANDIDATES}
          />
          <CandidateSelector
            label="Candidate B"
            value={candidateBId}
            onChange={(id) => { setCandidateBId(id); setAiGenerated(false); setAiResult(null); }}
            excludeId={candidateAId}
            color="violet"
            allCandidates={ALL_CANDIDATES}
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Job: <span className="font-semibold text-slate-700">{jobTitle}</span>
            {minimumExperience > 0 && ` · Min ${minimumExperience} yrs exp required`}
          </p>
          <button
            onClick={handleRunComparison}
            disabled={!canCompare || isGenerating}
            className="btn-primary text-sm py-2.5"
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating with Gemini...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Run AI Comparison
              </>
            )}
          </button>
        </div>
      </div>

      {canCompare && candA && candB && scoreA && scoreB && (
        <>
          {/* Score overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { cand: candA, score: scoreA, color: 'blue', isWinner: winner?.id === candA.id },
              { cand: candB, score: scoreB, color: 'violet', isWinner: winner?.id === candB.id },
            ].map(({ cand, score, color, isWinner }) => (
              <div
                key={`overview-${cand.id}`}
                className={`card p-5 relative overflow-hidden border-2 transition-all duration-200 ${
                  isWinner
                    ? color === 'blue' ? 'border-blue-400 bg-blue-50/20' : 'border-violet-400 bg-violet-50/20'
                    : 'border-slate-200'
                }`}
              >
                {isWinner && (
                  <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    color === 'blue' ? 'bg-blue-600 text-white' : 'bg-violet-600 text-white'
                  }`}>
                    <Trophy size={11} />
                    Better Fit
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    color === 'blue' ? 'bg-blue-600' : 'bg-violet-600'
                  }`}>
                    {cand.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{cand.name}</p>
                    <p className="text-xs text-slate-500">
                      {cand.workExperience[0]?.role}{cand.workExperience[0]?.company ? ` · ${cand.workExperience[0].company}` : ''}
                    </p>
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div className="space-y-2.5 mb-4">
                  <ScoreBar
                    label="Final Score"
                    value={score.finalScore}
                    color={score.finalScore >= 80 ? 'bg-emerald-500' : score.finalScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}
                  />
                  <ScoreBar
                    label="Skill Match"
                    value={score.skillMatch}
                    color={color === 'blue' ? 'bg-blue-500' : 'bg-violet-500'}
                  />
                  <ScoreBar
                    label="Exp. Match"
                    value={score.experienceMatch}
                    color={color === 'blue' ? 'bg-blue-400' : 'bg-violet-400'}
                  />
                  <ScoreBar
                    label="Relevance"
                    value={score.relevanceScore}
                    color={color === 'blue' ? 'bg-blue-300' : 'bg-violet-300'}
                  />
                </div>

                {/* Fit tag + experience + confidence */}
                <div className="flex items-center gap-2 flex-wrap mb-4 pb-4 border-b border-slate-100">
                  {score.fitTag === 'Top Fit' && <span className="badge-top-fit">● Top Fit</span>}
                  {score.fitTag === 'Good Fit' && <span className="badge-good-fit">● Good Fit</span>}
                  {score.fitTag === 'Low Fit' && <span className="badge-low-fit">● Low Fit</span>}
                  <ConfidenceBadge level={score.confidenceLevel} />
                  <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums ml-auto">
                    {cand.totalExperience} yrs total experience
                  </span>
                </div>

                {/* Matched / missing skills */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">Matched Required Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {requiredSkills
                        .filter((s) => cand.skills.map((cs: string) => cs.toLowerCase()).includes(s.toLowerCase()))
                        .map((s) => (
                          <span key={`${cand.id}-matched-${s}`} className="skill-chip-matched">✓ {s}</span>
                        ))}
                      {requiredSkills.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No required skills data</span>
                      )}
                    </div>
                  </div>
                  {score.missingSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1.5">Missing Required Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {score.missingSkills.map((s: string) => (
                          <span key={`${cand.id}-missing-${s}`} className="skill-chip-missing">✗ {s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Strengths & weaknesses */}
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <p className="text-xs font-semibold text-slate-700">Strengths</p>
                    </div>
                    <ul className="space-y-1">
                      {score.strengths.map((s: string, i: number) => (
                        <li key={`${cand.id}-str-${i}`} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <XCircle size={13} className="text-red-400" />
                      <p className="text-xs font-semibold text-slate-700">Weaknesses</p>
                    </div>
                    <ul className="space-y-1">
                      {score.weaknesses.map((w: string, i: number) => (
                        <li key={`${cand.id}-weak-${i}`} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5 shrink-0">−</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Radar chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Skill Dimension Radar</h3>
                <p className="text-xs text-slate-500 mt-0.5">Multi-axis comparison across 5 scoring dimensions</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'DM Sans' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    axisLine={false}
                  />
                  <Radar
                    name={candA.name}
                    dataKey="A"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Radar
                    name={candB.name}
                    dataKey="B"
                    stroke="#7c3aed"
                    fill="#7c3aed"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', fontFamily: 'DM Sans', paddingTop: '8px' }}
                  />
                  <Tooltip content={<RadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Recommendation */}
          {aiGenerated && aiResult && (
            <div className={`card p-6 border-2 ${winner ? (winner.id === candA.id ? 'border-blue-300 bg-blue-50/30' : 'border-violet-300 bg-violet-50/30') : 'border-slate-200'} animate-slide-up`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">AI Hiring Recommendation</h3>
                  <p className="text-xs text-slate-500">Generated by Gemini AI · {jobTitle}</p>
                </div>
                {winner && (
                  <div className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
                    winner.id === candA.id ? 'bg-blue-600 text-white' : 'bg-violet-600 text-white'
                  }`}>
                    <Trophy size={15} />
                    Recommend: {winner.name}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-blue-600" />
                    <p className="text-sm font-semibold text-slate-800">
                      {winner ? `Why ${winner.name} is the better hire` : 'AI Analysis'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {aiResult.reasoning}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[candA, candB].map((cand) => {
                    const risks = getRiskFactors(cand.id);
                    return (
                      <div key={`risk-${cand.id}`} className="p-4 rounded-xl bg-white border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={14} className="text-amber-500" />
                          <p className="text-sm font-semibold text-slate-800">Risk Factors — {cand.name}</p>
                        </div>
                        {risks.length > 0 ? (
                          <ul className="space-y-1">
                            {risks.map((r, i) => (
                              <li key={`risk-item-${cand.id}-${i}`} className="text-xs text-slate-600 flex items-start gap-1.5">
                                <span className="text-amber-400 shrink-0 mt-0.5">▸</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-emerald-600">No significant risk factors identified.</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Score Summary</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: candA.name, score: scoreA, color: 'text-blue-600' },
                      { name: candB.name, score: scoreB, color: 'text-violet-600' },
                    ].map(({ name, score, color }) => (
                      <div key={`summary-${name}`}>
                        <p className={`text-sm font-bold ${color} mb-1`}>{name}</p>
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <p>Final: <span className="font-mono font-bold">{score.finalScore}/100</span></p>
                          <p>Skills: <span className="font-mono font-bold">{score.skillMatch}%</span></p>
                          <p>Experience: <span className="font-mono font-bold">{score.experienceMatch}%</span></p>
                          <div className="mt-1"><ConfidenceBadge level={score.confidenceLevel} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state when no candidates selected */}
      {!canCompare && (
        <div className="card p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <GitCompare size={28} className="text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-700">No candidates selected</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Select two different candidates from the dropdowns above to generate a side-by-side AI comparison.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}