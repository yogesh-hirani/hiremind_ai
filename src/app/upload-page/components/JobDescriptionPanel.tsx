'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Sparkles, ChevronDown, ChevronUp, Loader2, ArrowRight, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeJobDescription, parseResume, scoreCandidate } from '@/lib/ai/geminiService';
import { saveSession } from '@/lib/candidateStore';
import type { ParsedCandidate, CandidateScore, JobRequirements } from '@/lib/mockData';
import type { ParsedResumeFile } from './UploadZone';

interface ExtractedRequirement {
  id: string;
  type: 'required' | 'preferred' | 'experience' | 'role';
  label: string;
  value: string;
}

interface JobDescriptionPanelProps {
  parsedFiles: ParsedResumeFile[];
}

export default function JobDescriptionPanel({ parsedFiles }: JobDescriptionPanelProps) {
  const router = useRouter();
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);
  const [showExtracted, setShowExtracted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedRequirements, setExtractedRequirements] = useState<ExtractedRequirement[]>([]);
  const [extractedTitle, setExtractedTitle] = useState('');
  const charCount = jdText.length;

  const handleExtract = async () => {
    if (jdText.trim().length < 50) {
      toast.error('Job description is too short. Please paste the full JD.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeJobDescription(jdText);
      const reqs: ExtractedRequirement[] = [
        { id: 'req-001', type: 'required', label: 'Required Skills', value: result.requiredSkills.join(', ') },
        { id: 'req-002', type: 'preferred', label: 'Preferred Skills', value: result.preferredSkills.join(', ') },
        { id: 'req-003', type: 'experience', label: 'Min. Experience', value: `${result.minimumExperience}+ years` },
        { id: 'req-004', type: 'role', label: 'Role Type', value: result.roleType },
      ];
      setExtractedRequirements(reqs);
      setExtractedTitle(result.title);
      setIsExtracted(true);
      toast.success('Job requirements extracted successfully with Gemini AI.');
    } catch {
      toast.error('Failed to extract requirements. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeCandidates = async () => {
    if (!isExtracted) {
      toast.error('Please extract job requirements first before analyzing candidates.');
      return;
    }

    const filesToAnalyze = parsedFiles.filter((f) => f.extractedText.trim().length > 50);

    if (filesToAnalyze.length === 0) {
      toast.error('No parsed resumes available. Please upload PDF or DOCX resume files first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const jdResult = await analyzeJobDescription(jdText);

      const job: JobRequirements = {
        id: `job-${Date.now()}`,
        title: jdResult.title,
        description: jdText,
        requiredSkills: jdResult.requiredSkills,
        preferredSkills: jdResult.preferredSkills,
        minimumExperience: jdResult.minimumExperience,
        roleType: jdResult.roleType,
        postedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      };

      // Parse each uploaded resume with Gemini, then score — sequential to avoid Gemini 429 rate limits
      const scoredCandidates: { candidate: ParsedCandidate; score: CandidateScore }[] = [];
      for (let idx = 0; idx < filesToAnalyze.length; idx++) {
        const resumeFile = filesToAnalyze[idx];
        const parsed = await parseResume(resumeFile.extractedText);

        const candidate: ParsedCandidate = {
          id: `cand-${Date.now()}-${idx}`,
          name: parsed.name || resumeFile.fileName.replace(/\.(pdf|docx|doc)$/i, ''),
          email: parsed.email || '',
          phone: parsed.phone || '',
          totalExperience: parsed.totalExperience,
          skills: parsed.skills,
          workExperience: parsed.workExperience,
          education: parsed.education,
          projects: parsed.projects,
          certifications: parsed.certifications,
          resumeFileName: resumeFile.fileName,
          parsedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        };

        const scoringResult = await scoreCandidate(
          candidate.name,
          candidate.skills,
          candidate.totalExperience,
          candidate.workExperience.map((w) => `${w.role} at ${w.company} (${w.duration})`).join('; '),
          jdResult.requiredSkills,
          jdResult.preferredSkills,
          jdResult.minimumExperience,
          jdResult.title,
          resumeFile.extractedText
        );

        const score: CandidateScore = {
          candidateId: candidate.id,
          ...scoringResult,
        };

        scoredCandidates.push({ candidate, score });

        // Small delay between candidates to respect Gemini rate limits
        if (idx < filesToAnalyze.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      saveSession(job, scoredCandidates);

      toast.success(`Analysis complete — ${filesToAnalyze.length} candidate${filesToAnalyze.length > 1 ? 's' : ''} scored and ranked with Gemini AI.`);
      router.push('/dashboard-page');
    } catch {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const readyCount = parsedFiles.filter((f) => f.extractedText.trim().length > 50).length;

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Job Description</h2>
          <p className="text-xs text-slate-500 mt-0.5">Paste the full job description for accurate AI matching</p>
        </div>
        {extractedTitle && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Briefcase size={13} className="text-slate-500" />
            <span className="text-xs font-medium text-slate-600 max-w-[160px] truncate">{extractedTitle}</span>
          </div>
        )}
      </div>

      {/* Resume readiness indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
        readyCount > 0
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}>
        <FileText size={13} />
        {readyCount > 0
          ? `${readyCount} resume${readyCount > 1 ? 's' : ''} ready for analysis`
          : 'Upload resumes on the left to enable candidate analysis'}
      </div>

      {/* Textarea */}
      <div className="relative">
        <label className="block text-xs font-semibold text-slate-600 mb-2">
          Job Description Text
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          value={jdText}
          onChange={(e) => { setJdText(e.target.value); setIsExtracted(false); }}
          rows={12}
          placeholder="Paste the full job description here — including required skills, experience, and responsibilities..."
          className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-lg bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                     placeholder:text-slate-400 transition-all duration-150 resize-none font-sans leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-slate-400">{charCount} characters</p>
          {charCount < 100 && charCount > 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle size={11} />
              JD seems short — more detail improves scoring accuracy
            </p>
          )}
        </div>
      </div>

      {/* Extract button */}
      <button
        onClick={handleExtract}
        disabled={isAnalyzing || jdText.trim().length < 10}
        className={`btn-secondary w-full justify-center ${isAnalyzing ? 'opacity-75' : ''}`}
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={15} className="animate-spin text-blue-500" />
            <span>Extracting with Gemini AI...</span>
          </>
        ) : isExtracted ? (
          <>
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>Requirements extracted — re-extract</span>
          </>
        ) : (
          <>
            <Sparkles size={15} className="text-violet-500" />
            <span>Extract Requirements with Gemini AI</span>
          </>
        )}
      </button>

      {/* Extracted requirements panel */}
      {isExtracted && extractedRequirements.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 overflow-hidden animate-slide-up">
          <button
            onClick={() => setShowExtracted(!showExtracted)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">Extracted Requirements</span>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                {extractedRequirements.length} fields
              </span>
            </div>
            {showExtracted ? (
              <ChevronUp size={15} className="text-emerald-600" />
            ) : (
              <ChevronDown size={15} className="text-emerald-600" />
            )}
          </button>

          {showExtracted && (
            <div className="px-4 pb-4 space-y-3 border-t border-emerald-200">
              {extractedRequirements.map((req) => (
                <div key={req.id} className="flex flex-col gap-0.5 pt-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      req.type === 'required' ? 'bg-blue-100 text-blue-700' :
                      req.type === 'preferred' ? 'bg-violet-100 text-violet-700' :
                      req.type === 'experience' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {req.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{req.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analyze button */}
      <button
        onClick={handleAnalyzeCandidates}
        disabled={isSubmitting || readyCount === 0 || !isExtracted}
        className={`btn-primary w-full justify-center text-base py-3 ${(readyCount === 0 || !isExtracted) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Analyzing with Gemini AI...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>
              Analyze {readyCount > 0 ? `${readyCount} Candidate${readyCount > 1 ? 's' : ''}` : 'Candidates'} with Gemini
            </span>
            <ArrowRight size={15} className="ml-auto" />
          </>
        )}
      </button>

      {!isExtracted && (
        <p className="text-xs text-center text-slate-400">
          Extract requirements first, then analyze all uploaded resumes
        </p>
      )}
    </div>
  );
}