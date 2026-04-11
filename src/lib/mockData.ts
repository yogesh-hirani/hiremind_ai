// ── Shared interfaces ──────────────────────────────────────────────────────

export interface ParsedCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalExperience: number;
  skills: string[];
  workExperience: { role: string; company: string; duration: string; years: number }[];
  education: { degree: string; institution: string; year: number }[];
  projects: string[];
  certifications: string[];
  resumeFileName: string;
  parsedAt: string;
}

export interface CandidateScore {
  candidateId: string;
  skillMatch: number;
  experienceMatch: number;
  relevanceScore: number;
  finalScore: number;
  fitTag: 'Top Fit' | 'Good Fit' | 'Low Fit';
  confidenceLevel: 'High' | 'Medium' | 'Low';
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  aiExplanation: string;
}

export interface JobRequirements {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumExperience: number;
  roleType: string;
  postedAt: string;
}

// Re-export store helpers so existing imports keep working
export {
  getScoredCandidates,
  getCandidateById,
  getScoreById,
  saveSession,
  clearSession,
  getSessionJob,
  getSessionCandidates,
} from './candidateStore';