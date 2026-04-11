'use client';

import type { ParsedCandidate, CandidateScore, JobRequirements } from './mockData';

export interface ScoredCandidate {
  candidate: ParsedCandidate;
  score: CandidateScore;
}

const STORE_KEY = 'hiremind_session';

interface SessionData {
  job: JobRequirements | null;
  candidates: ScoredCandidate[];
}

function readStore(): SessionData {
  if (typeof window === 'undefined') return { job: null, candidates: [] };
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return { job: null, candidates: [] };
    return JSON.parse(raw) as SessionData;
  } catch {
    return { job: null, candidates: [] };
  }
}

function writeStore(data: SessionData): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

export function saveSession(job: JobRequirements, candidates: ScoredCandidate[]): void {
  writeStore({ job, candidates });
}

export function clearSession(): void {
  if (typeof window !== 'undefined') sessionStorage.removeItem(STORE_KEY);
}

export function getSessionJob(): JobRequirements | null {
  return readStore().job;
}

export function getSessionCandidates(): ScoredCandidate[] {
  return readStore().candidates;
}

/** Returns candidates sorted descending by finalScore */
export function getScoredCandidates(): ScoredCandidate[] {
  return [...getSessionCandidates()].sort((a, b) => b.score.finalScore - a.score.finalScore);
}

export function getCandidateById(id: string): ParsedCandidate | undefined {
  return getSessionCandidates().find((sc) => sc.candidate.id === id)?.candidate;
}

export function getScoreById(id: string): CandidateScore | undefined {
  return getSessionCandidates().find((sc) => sc.candidate.id === id)?.score;
}
