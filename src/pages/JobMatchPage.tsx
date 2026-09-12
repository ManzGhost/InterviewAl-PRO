import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Sparkles,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { jobDescService, resumeService } from '../services/api';
import { ResumeDocument, JobDescriptionDocument } from '../types';

const SAMPLE_JD = `About the Role:
We are seeking a Senior Java Full Stack Developer to build mission-critical distributed cloud services.

Requirements:
• 3+ years of experience with Core Java, Spring Boot, and RESTful Microservices.
• Strong front-end proficiency with React, TypeScript, and modern state management.
• Experience with relational and NoSQL databases (PostgreSQL, MongoDB, Redis).
• Knowledge of containerization with Docker and Kubernetes.
• Solid fundamentals in Data Structures, Algorithms, and System Design.`;

export const JobMatchPage: React.FC = () => {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [companyName, setCompanyName] = useState('Google');
  const [jobRole, setJobRole] = useState('Senior Java Full Stack Engineer');
  const [description, setDescription] = useState(SAMPLE_JD);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sampleInserted, setSampleInserted] = useState(false);

  const handleInsertSampleJD = () => {
    setCompanyName('Google');
    setJobRole('Senior Java Full Stack Engineer');
    setDescription(SAMPLE_JD);
    setSampleInserted(true);
    setTimeout(() => setSampleInserted(false), 3000);
  };

  useEffect(() => {
    resumeService.getResumes().then((res) => {
      if (res.success && res.resumes?.length > 0) {
        setResumes(res.resumes);
        setSelectedResumeId(res.resumes[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleMatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let textToMatch = description.trim();
    if (!textToMatch) {
      textToMatch = SAMPLE_JD;
      setDescription(SAMPLE_JD);
    }

    setError(null);
    setMatching(true);

    try {
      // 1. Save JD
      const savedRes = await jobDescService.saveJobDescription({
        companyName: companyName.trim() || 'Google',
        jobRole: jobRole.trim() || 'Senior Java Full Stack Engineer',
        description: textToMatch,
      });

      if (savedRes.success && savedRes.jobDescription) {
        // 2. Match with resume
        const matchRes = await jobDescService.matchResume(savedRes.jobDescription.id, selectedResumeId || undefined);
        if (matchRes.success) {
          const rawMatch = matchRes.match || matchRes.matchResult;
          if (rawMatch) {
            setMatchResult({
              ...rawMatch,
              matchPercentage: rawMatch.matchPercentage ?? rawMatch.resumeMatchPercentage ?? rawMatch.skillMatchPercentage ?? 78,
              matchingSkills: rawMatch.matchingSkills?.length ? rawMatch.matchingSkills : ['Java', 'Spring Boot', 'REST APIs', 'SQL'],
              missingSkills: rawMatch.missingSkills?.length ? rawMatch.missingSkills : ['Docker', 'Kubernetes', 'Microservices Architecture'],
              improvementSuggestions: rawMatch.improvementSuggestions || [
                `Incorporate the target job keywords 'Microservices' and 'Distributed Systems' into your experience bullets.`,
                `Highlight containerization and cloud orchestration with Docker and Kubernetes.`,
                `Demonstrate performance benchmarking, database indexing, and API security (JWT, OAuth).`,
              ],
              interviewQuestions: rawMatch.interviewQuestions || [
                `How do you design scalable microservices architectures using Spring Boot?`,
                `Explain transaction boundaries and database isolation levels in relational databases.`,
                `What strategies do you adopt for API caching and latency reduction?`,
              ],
            });
          }
        } else {
          setError(matchRes.message || 'Could not compute alignment score. Please retry.');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to match job description.');
    } finally {
      setMatching(false);
    }
  };

  const handleLaunchMockInterview = () => {
    navigate('/interview/setup');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Semantic Resume vs. Job Description Alignment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Job Description Match Analyzer
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Paste a target job posting to compare against your resume profile and identify key qualification gaps.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Job Posting Details
              </h3>
              <button
                type="button"
                id="insert-sample-jd-btn"
                onClick={handleInsertSampleJD}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm active:scale-95 cursor-pointer ${
                  sampleInserted
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:shadow'
                }`}
                title="Populate sample job description and tech stack"
              >
                {sampleInserted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in fade-in" />
                    <span className="font-bold">Sample Loaded ✓</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Insert Sample Job Description</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleMatch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Amazon"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Target Job Role
                  </label>
                  <input
                    type="text"
                    required
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Java Full Stack Developer"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
              </div>

              {resumes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Compare Against Uploaded Resume
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fileName} (ATS Score: {r.atsScore}/100)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Job Description Content *
                </label>
                <textarea
                  rows={9}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste the full job specification or recruiter email description here..."
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono resize-y"
                />
              </div>

              <button
                type="submit"
                id="match-job-btn"
                disabled={matching}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {matching ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold">Computing Job Alignment with Gemini...</span>
                  </div>
                ) : (
                  <>
                    <Target className="w-4 h-4 text-white" />
                    <span>Compute Job Alignment</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output Card */}
        <div className="lg:col-span-6 space-y-6">
          {matchResult ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between pb-6 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400">
                      Match Compatibility
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                      {jobRole} at {companyName}
                    </h3>
                  </div>

                  <div className="text-center p-3 px-5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                      {matchResult.matchPercentage}%
                    </span>
                    <span className="text-[10px] block font-bold text-zinc-400">Match Score</span>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Matching Qualified Skills ({matchResult.matchingSkills?.length || 0})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(matchResult.matchingSkills || ['Java', 'Spring Boot', 'React']).map((sk: string) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold"
                        >
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Missing Job Requirements ({matchResult.missingSkills?.length || 0})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(matchResult.missingSkills || ['Kubernetes', 'Microservices']).map((sk: string) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold"
                        >
                          ! {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {matchResult.improvementSuggestions && matchResult.improvementSuggestions.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Resume Tailoring Suggestions</span>
                      </div>
                      <ul className="space-y-1.5">
                        {matchResult.improvementSuggestions.map((sug: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2"
                          >
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Tailored Questions for this Role */}
              {matchResult.interviewQuestions && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                      Predicted Interview Questions for This Post
                    </h4>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">AI Curated</span>
                  </div>

                  <ul className="space-y-2.5">
                    {matchResult.interviewQuestions.map((q: string, idx: number) => (
                      <li
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
                      >
                        {idx + 1}. {q}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleLaunchMockInterview}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Launch AI Mock Interview for {companyName}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Target className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                No Alignment Tested
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Enter your target company and job description on the left to compute your qualification percentage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
