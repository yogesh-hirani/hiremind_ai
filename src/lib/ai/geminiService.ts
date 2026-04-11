import { getChatCompletion } from './chatCompletion';

const PROVIDER = 'GEMINI';
const MODEL = 'gemini/gemini-2.0-flash';
const TEMPERATURE = 0.2;

// Delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiWithRetry(messages: { role: string; content: string }[], maxRetries = 3): Promise<string> {
  const attempt = async (): Promise<string> => {
    const response = await getChatCompletion(PROVIDER, MODEL, messages, {
      temperature: TEMPERATURE,
      max_tokens: 2048,
    });
    return response.choices[0].message.content || '';
  };

  for (let i = 0; i < maxRetries; i++) {
    try {
      const raw = await attempt();
      JSON.parse(extractJSON(raw)); // validate JSON
      return raw;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isRateLimit =
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('RateLimitError') ||
        errMsg.includes('quota');

      if (isRateLimit) {
        if (i < maxRetries - 1) {
          // Exponential backoff with jitter: 2s, 4s, 8s + up to 1s jitter
          const backoff = Math.pow(2, i + 1) * 1000 + Math.random() * 1000;
          await delay(backoff);
          continue;
        }
        // Exhausted retries on rate limit — propagate
        throw err;
      }

      // Non-rate-limit error: retry once more, then throw
      if (i === maxRetries - 1) {
        throw new Error('Gemini returned invalid JSON after retries');
      }
    }
  }

  throw new Error('Gemini call failed after all retries');
}

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Try to find first { or [
  const start = text.search(/[{[]/);
  if (start !== -1) return text.slice(start);
  return text;
}

export interface ParsedResumeResult {
  name: string;
  email: string;
  phone: string;
  totalExperience: number;
  skills: string[];
  workExperience: { role: string; company: string; duration: string; years: number }[];
  education: { degree: string; institution: string; year: number }[];
  projects: string[];
  certifications: string[];
}

export interface JDAnalysisResult {
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumExperience: number;
  roleType: string;
}

export interface ScoringResult {
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

export interface ComparisonResult {
  winnerId: string;
  winnerName: string;
  reasoning: string;
  riskFactors: { candidateId: string; risks: string[] }[];
}

// Rule-based fallback scoring
function ruleBasedScore(
  candidateSkills: string[],
  candidateExperience: number,
  requiredSkills: string[],
  preferredSkills: string[],
  minimumExperience: number
): ScoringResult {
  const matchedRequired = requiredSkills.filter((s) =>
    candidateSkills.map((cs) => cs.toLowerCase()).includes(s.toLowerCase())
  );
  const matchedPreferred = preferredSkills.filter((s) =>
    candidateSkills.map((cs) => cs.toLowerCase()).includes(s.toLowerCase())
  );
  const missingSkills = requiredSkills.filter(
    (s) => !candidateSkills.map((cs) => cs.toLowerCase()).includes(s.toLowerCase())
  );

  const skillMatch = Math.round((matchedRequired.length / Math.max(requiredSkills.length, 1)) * 100);
  const expRatio = Math.min(candidateExperience / Math.max(minimumExperience, 1), 1.3);
  const experienceMatch = Math.min(Math.round(expRatio * 100), 100);
  const relevanceBonus = Math.round((matchedPreferred.length / Math.max(preferredSkills.length, 1)) * 20);
  const relevanceScore = Math.min(skillMatch * 0.6 + experienceMatch * 0.2 + relevanceBonus + 10, 100);
  const finalScore = Math.round(skillMatch * 0.5 + experienceMatch * 0.3 + relevanceScore * 0.2);

  const fitTag: 'Top Fit' | 'Good Fit' | 'Low Fit' =
    finalScore >= 80 ? 'Top Fit' : finalScore >= 60 ? 'Good Fit' : 'Low Fit';

  const confidenceLevel: 'High' | 'Medium' | 'Low' =
    skillMatch >= 75 && experienceMatch >= 75
      ? 'High'
      : skillMatch >= 50 || experienceMatch >= 50
      ? 'Medium' :'Low';

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (matchedRequired.length === requiredSkills.length) strengths.push('All required skills matched');
  if (candidateExperience > minimumExperience + 1) strengths.push(`${candidateExperience} yrs experience exceeds requirement`);
  if (matchedPreferred.length >= 3) strengths.push(`${matchedPreferred.length} preferred skills matched`);
  if (missingSkills.length > 0) weaknesses.push(`Missing: ${missingSkills.slice(0, 3).join(', ')}`);
  if (candidateExperience < minimumExperience) weaknesses.push(`Only ${candidateExperience} yrs exp (min ${minimumExperience} required)`);

  return {
    skillMatch,
    experienceMatch,
    relevanceScore: Math.round(relevanceScore),
    finalScore,
    fitTag,
    confidenceLevel,
    strengths: strengths.length > 0 ? strengths : ['Shows potential in core areas'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No major weaknesses identified'],
    missingSkills,
    aiExplanation: `Rule-based scoring: ${matchedRequired.length}/${requiredSkills.length} required skills matched, ${candidateExperience} yrs experience.`,
  };
}

export async function parseResume(resumeText: string): Promise<ParsedResumeResult> {
  const messages = [
    {
      role: 'system',
      content: 'You are a resume parser. Extract structured data from resumes. Always respond with valid JSON only — no extra text, no markdown.',
    },
    {
      role: 'user',
      content: `Parse this resume and return ONLY a JSON object with these exact fields:
{
  "name": string,
  "email": string,
  "phone": string,
  "totalExperience": number (years),
  "skills": string[],
  "workExperience": [{"role": string, "company": string, "duration": string, "years": number}],
  "education": [{"degree": string, "institution": string, "year": number}],
  "projects": string[],
  "certifications": string[]
}

Resume:
${resumeText}`,
    },
  ];

  try {
    let raw = await callGeminiWithRetry(messages);
    return JSON.parse(extractJSON(raw)) as ParsedResumeResult;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('RateLimitError') || errMsg.includes('quota')) {
      // Return a minimal fallback so the upload still succeeds
      return {
        name: '',
        email: '',
        phone: '',
        totalExperience: 0,
        skills: [],
        workExperience: [],
        education: [],
        projects: [],
        certifications: [],
      };
    }
    throw new Error('Failed to parse resume with Gemini');
  }
}

export async function analyzeJobDescription(jdText: string): Promise<JDAnalysisResult> {
  const messages = [
    {
      role: 'system',
      content: 'You are a job description analyzer. Extract structured requirements. Always respond with valid JSON only — no extra text, no markdown.',
    },
    {
      role: 'user',
      content: `Analyze this job description and return ONLY a JSON object with these exact fields:
{
  "title": string,
  "requiredSkills": string[],
  "preferredSkills": string[],
  "minimumExperience": number (years),
  "roleType": string
}

Job Description:
${jdText}`,
    },
  ];

  try {
    let raw = await callGeminiWithRetry(messages);
    return JSON.parse(extractJSON(raw)) as JDAnalysisResult;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('RateLimitError') || errMsg.includes('quota')) {
      return {
        title: '',
        requiredSkills: [],
        preferredSkills: [],
        minimumExperience: 0,
        roleType: '',
      };
    }
    throw new Error('Failed to analyze job description with Gemini');
  }
}

export async function scoreCandidate(
  candidateName: string,
  candidateSkills: string[],
  candidateExperience: number,
  workHistory: string,
  requiredSkills: string[],
  preferredSkills: string[],
  minimumExperience: number,
  jobTitle: string,
  resumeText?: string
): Promise<ScoringResult> {
  const messages = [
    {
      role: 'system',
      content: `You are a senior technical recruiter and hiring expert. Your job is to accurately score candidates against specific job requirements.

CRITICAL SCORING RULES:
1. Skill matching must be SEMANTIC — "React.js" matches "React", "Node\" matches \"Node.js", "ML\" matches \"Machine Learning", "AWS\" matches \"Amazon Web Services", etc. 2. Consider RELATED skills — a candidate with"Vue.js" experience has transferable frontend skills for a React role
3. Work history context matters — a "Software Engineer" at a tech company likely has more relevant experience than the same title at a non-tech company
4. Seniority alignment — match the candidate's level to the role level (Junior/Mid/Senior/Lead)
5. Domain relevance — weight experience in the same industry/domain higher
6. Do NOT penalize for having MORE experience than required
7. finalScore = (skillMatch × 0.45) + (experienceMatch × 0.25) + (relevanceScore × 0.30)
8. relevanceScore should reflect how well the candidate's OVERALL profile (domain, seniority, work context) fits the role — not just skills
9. Always respond with valid JSON only — no extra text, no markdown`,
    },
    {
      role: 'user',
      content: `Score this candidate for the role and return ONLY a JSON object:

{
  "skillMatch": number (0-100, semantic matching — count related/equivalent skills, not just exact matches),
  "experienceMatch": number (0-100, 100 if meets or exceeds requirement, scale proportionally below),
  "relevanceScore": number (0-100, holistic fit: domain relevance, seniority alignment, work context, career trajectory),
  "finalScore": number (0-100, weighted: skillMatch×0.45 + experienceMatch×0.25 + relevanceScore×0.30),
  "fitTag": "Top Fit" | "Good Fit" | "Low Fit",
  "confidenceLevel": "High" | "Medium" | "Low",
  "strengths": string[] (3-5 specific, concrete strengths relevant to THIS role),
  "weaknesses": string[] (2-3 specific gaps or concerns for THIS role),
  "missingSkills": string[] (required skills the candidate clearly lacks — use semantic matching before listing as missing),
  "aiExplanation": string (3-4 sentences: why this score, key differentiators, hiring recommendation)
}

=== JOB REQUIREMENTS ===
Role: ${jobTitle}
Required Skills: ${requiredSkills.join(', ')}
Preferred Skills: ${preferredSkills.join(', ')}
Minimum Experience: ${minimumExperience} years

=== CANDIDATE PROFILE ===
Name: ${candidateName}
Listed Skills: ${candidateSkills.join(', ')}
Total Experience: ${candidateExperience} years
Work History: ${workHistory}
${resumeText ? `\nFull Resume Context:\n${resumeText.slice(0, 3000)}` : ''}

=== SCORING RULES ===
- fitTag: "Top Fit" if finalScore >= 78, "Good Fit" if >= 58, else "Low Fit"
- confidenceLevel: "High" if skillMatch >= 70 AND experienceMatch >= 70, "Medium" if skillMatch >= 45 OR experienceMatch >= 45, "Low" otherwise
- Use semantic skill matching — do NOT mark skills as missing if equivalent/related skills are present
- Be specific in strengths/weaknesses — reference actual skills, companies, or experience from the resume`,
    },
  ];

  try {
    const raw = await callGeminiWithRetry(messages);
    return JSON.parse(extractJSON(raw)) as ScoringResult;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const isRateLimit =
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('RateLimitError') ||
      errMsg.includes('quota');
    if (isRateLimit) {
      // Graceful fallback to rule-based scoring on quota exhaustion
      return ruleBasedScore(candidateSkills, candidateExperience, requiredSkills, preferredSkills, minimumExperience);
    }
    return ruleBasedScore(candidateSkills, candidateExperience, requiredSkills, preferredSkills, minimumExperience);
  }
}

export async function compareCandidates(
  candidateA: { id: string; name: string; skills: string[]; experience: number; score: number; strengths: string[]; weaknesses: string[] },
  candidateB: { id: string; name: string; skills: string[]; experience: number; score: number; strengths: string[]; weaknesses: string[] },
  jobTitle: string,
  requiredSkills: string[]
): Promise<ComparisonResult> {
  const messages = [
    {
      role: 'system',
      content: 'You are an AI hiring advisor. Compare two candidates and recommend the better hire. Always respond with valid JSON only — no extra text, no markdown.',
    },
    {
      role: 'user',
      content: `Compare these two candidates for the role: ${jobTitle}
Required Skills: ${requiredSkills.join(', ')}

Candidate A (ID: ${candidateA.id}):
- Name: ${candidateA.name}
- Skills: ${candidateA.skills.join(', ')}
- Experience: ${candidateA.experience} years
- Score: ${candidateA.score}/100
- Strengths: ${candidateA.strengths.join('; ')}
- Weaknesses: ${candidateA.weaknesses.join('; ')}

Candidate B (ID: ${candidateB.id}):
- Name: ${candidateB.name}
- Skills: ${candidateB.skills.join(', ')}
- Experience: ${candidateB.experience} years
- Score: ${candidateB.score}/100
- Strengths: ${candidateB.strengths.join('; ')}
- Weaknesses: ${candidateB.weaknesses.join('; ')}

Return ONLY this JSON:
{
  "winnerId": string (the ID of the better candidate),
  "winnerName": string,
  "reasoning": string (3-4 sentences explaining why this candidate is the better hire),
  "riskFactors": [
    {"candidateId": string, "risks": string[]},
    {"candidateId": string, "risks": string[]}
  ]
}`,
    },
  ];

  try {
    let raw = await callGeminiWithRetry(messages);
    return JSON.parse(extractJSON(raw)) as ComparisonResult;
  } catch {
    // Fallback: pick higher score
    const winner = candidateA.score >= candidateB.score ? candidateA : candidateB;
    return {
      winnerId: winner.id,
      winnerName: winner.name,
      reasoning: `${winner.name} has a higher overall score (${winner.score}/100) and better skill alignment with the role requirements.`,
      riskFactors: [
        { candidateId: candidateA.id, risks: candidateA.weaknesses },
        { candidateId: candidateB.id, risks: candidateB.weaknesses },
      ],
    };
  }
}
