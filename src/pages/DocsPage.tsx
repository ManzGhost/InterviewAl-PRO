import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'architecture'>('endpoints');

  const endpointGroups = [
    {
      group: 'Authentication & Security',
      endpoints: [
        { method: 'POST', path: '/api/auth/register', desc: 'Register candidate account with bcrypt password hashing' },
        { method: 'POST', path: '/api/auth/login', desc: 'Authenticate with email & password, returns JWT tokens' },
        { method: 'POST', path: '/api/auth/refresh', desc: 'Rotate access token via refresh token' },
        { method: 'GET', path: '/api/auth/me', desc: 'Fetch currently logged-in user profile & role' },
      ],
    },
    {
      group: 'AI Mock Interviews',
      endpoints: [
        { method: 'POST', path: '/api/interviews/start', desc: 'Initialize interview session & generate first question via Gemini' },
        { method: 'GET', path: '/api/interviews/:id', desc: 'Retrieve full session state, questions, and telemetry' },
        { method: 'POST', path: '/api/interviews/:id/submit-answer', desc: 'Submit candidate answer for 6-dimensional AI critique' },
        { method: 'POST', path: '/api/interviews/:id/complete', desc: 'Finalize session, compute 5-day roadmap, and build score report' },
        { method: 'GET', path: '/api/interviews/history', desc: 'List candidate previous interview sessions' },
      ],
    },
    {
      group: 'AI Intelligence & Diagnostic Services',
      endpoints: [
        { method: 'POST', path: '/api/ai/evaluate-answer', desc: 'Direct evaluation of candidate answer with STAR metrics' },
        { method: 'POST', path: '/api/ai/code-review', desc: 'Algorithmic DSA code review for Big-O, edge cases, and bugs' },
        { method: 'GET', path: '/api/ai/roadmap', desc: 'Synthesize personalized 5-day preparation curriculum' },
        { method: 'GET', path: '/api/ai/cheat-sheet', desc: 'Retrieve high-yield interview revision concepts' },
      ],
    },
    {
      group: 'Resume & Job Alignment',
      endpoints: [
        { method: 'POST', path: '/api/resumes/upload', desc: 'Upload resume and trigger Gemini ATS parsing' },
        { method: 'GET', path: '/api/resumes', desc: 'Retrieve user stored resume versions' },
        { method: 'POST', path: '/api/job-descriptions', desc: 'Save target job description' },
        { method: 'POST', path: '/api/job-descriptions/:id/match-resume', desc: 'Calculate match percentage & keyword gaps' },
      ],
    },
    {
      group: 'Technical MCQs & Gamification',
      endpoints: [
        { method: 'GET', path: '/api/mcq/questions', desc: 'Retrieve curated MCQ technical questions by category' },
        { method: 'POST', path: '/api/mcq/submit-test', desc: 'Grade quiz, award XP points, and return explanations' },
        { method: 'GET', path: '/api/gamification/leaderboard', desc: 'Retrieve community rankings and user rank' },
        { method: 'GET', path: '/api/gamification/achievements', desc: 'List candidate badges and unlocked milestones' },
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
          <span>OpenAPI 3.0 & Architecture Specifications</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          API & Architecture Documentation
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Complete interface contracts for the Express/Node.js server, Java Spring Boot microservice, and Gemini AI pipeline.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'endpoints'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          REST API Reference (OpenAPI)
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'architecture'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          Java & Spring Boot 3.2.4 Blueprint
        </button>
      </div>

      {activeTab === 'endpoints' ? (
        <div className="space-y-6">
          {endpointGroups.map((group, gIdx) => (
            <div
              key={gIdx}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3"
            >
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                {group.group}
              </h3>

              <div className="space-y-2">
                {group.endpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          ep.method === 'POST'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : ep.method === 'GET'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{ep.path}</span>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{ep.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Enterprise Java Spring Boot 3.2.4 Architecture
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Scaffolded in `/backend` with Java 21, Spring Security 6, MongoDB Document persistence, and Maven.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <span className="font-bold text-zinc-900 dark:text-white">Backend Entry Point</span>
              <p className="text-zinc-500 font-mono">com.interviewai.InterviewAiApplication.java</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <span className="font-bold text-zinc-900 dark:text-white">Build Manifest</span>
              <p className="text-zinc-500 font-mono">/backend/pom.xml (Spring Boot Starter Web, Security, Data-MongoDB)</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <span className="font-bold text-zinc-900 dark:text-white">Domain Entities</span>
              <p className="text-zinc-500 font-mono">com.interviewai.model.User, InterviewSession, Question</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <span className="font-bold text-zinc-900 dark:text-white">Security Layer</span>
              <p className="text-zinc-500 font-mono">Stateless JWT Filter & BCrypt Password Encoder</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
