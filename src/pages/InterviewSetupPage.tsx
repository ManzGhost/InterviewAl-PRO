import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Building2,
  Briefcase,
  Layers,
  HelpCircle,
  Mic,
  FileText,
  ArrowRight,
  Info,
  Video,
  Eye,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { interviewService } from '../services/api';
import { LiveVideoDetection } from '../components/interview/LiveVideoDetection';
import { XPStoreModal } from '../components/gamification/XPStoreModal';
import { Zap } from 'lucide-react';

export const InterviewSetupPage: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [jobRole, setJobRole] = useState(user?.preferredJobRole || 'Java Full Stack Developer');
  const [customRole, setCustomRole] = useState('');
  const [companyName, setCompanyName] = useState('Google');
  const [interviewType, setInterviewType] = useState('Technical Interview');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [mode, setMode] = useState<'Live Video AI' | 'Voice' | 'Text'>('Live Video AI');
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [showXpModal, setShowXpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const INTERVIEW_XP_COST = 10;
  const userXp = user?.xpPoints ?? 0;
  const hasEnoughXp = userXp >= INTERVIEW_XP_COST;

  const predefinedRoles = [
    'Java Full Stack Developer',
    'Frontend React Developer',
    'Backend Software Engineer',
    'DevOps & Cloud Engineer',
    'Data Engineer',
    'Full Stack MERN Developer',
    'Custom Role',
  ];

  const companies = [
    'Google',
    'Amazon',
    'Microsoft',
    'Netflix',
    'Meta',
    'TCS',
    'Infosys',
    'High Growth Startup',
  ];

  const interviewTypes = [
    {
      type: 'Technical Interview',
      desc: 'Deep dive into architecture, coding paradigms, frameworks, and system trade-offs.',
    },
    {
      type: 'Behavioral Interview',
      desc: 'Situational leadership and conflict questions evaluated via the STAR method.',
    },
    {
      type: 'HR Interview',
      desc: 'Culture fit, career trajectory, salary negotiation, and motivation.',
    },
    {
      type: 'Coding Interview',
      desc: 'Algorithmic problem breakdown, data structures, and edge-case thinking.',
    },
    {
      type: 'Mixed Interview',
      desc: 'Comprehensive simulation with both technical and behavioral prompts.',
    },
  ];

  const handleStart = async () => {
    setError(null);

    if (!hasEnoughXp) {
      setError('Insufficient XP. Please earn more XP to start this assessment.');
      setShowXpModal(true);
      return;
    }

    setLoading(true);

    try {
      const finalRole = jobRole === 'Custom Role' && customRole.trim() ? customRole.trim() : jobRole;
      const res = await interviewService.startInterview({
        jobRole: finalRole,
        interviewType,
        difficulty,
        companyName,
        totalQuestions,
        mode,
      });

      if (res.success && res.interview) {
        refreshProfile?.().catch(() => {});
        navigate(`/interview/room/${res.interview.id}`);
      } else {
        throw new Error('Failed to initialize session.');
      }
    } catch (err: any) {
      if (err?.response?.data?.insufficientXp) {
        setError('Insufficient XP. Please earn more XP to start this assessment.');
        setShowXpModal(true);
      } else {
        setError(err?.response?.data?.message || err?.message || 'Error initializing interview session.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Configurable AI Interview Simulation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Setup Your Mock Interview
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Customize your role, company focus, round type, and difficulty level before stepping into the room.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Configuration Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-8">
        {/* Step 1: Target Role */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white mb-3">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>1. Target Engineering Role</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {predefinedRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setJobRole(role)}
                className={`p-3 text-left rounded-xl text-xs font-semibold border transition-all ${
                  jobRole === role
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {jobRole === 'Custom Role' && (
            <div className="mt-3">
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Enter custom role title, e.g. iOS Swift Engineer"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Step 2: Target Company Style */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>2. Target Company Pattern</span>
            </label>
            <span className="text-[11px] text-zinc-400 italic">
              *AI-generated practice questions inspired by company patterns
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {companies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCompanyName(c)}
                className={`p-3 text-center rounded-xl text-xs font-bold border transition-all ${
                  companyName === c
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Interview Type */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white mb-3">
            <Layers className="w-4 h-4 text-violet-600" />
            <span>3. Interview Type</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {interviewTypes.map((it) => (
              <div
                key={it.type}
                onClick={() => setInterviewType(it.type)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  interviewType === it.type
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{it.type}</h4>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      interviewType === it.type ? 'border-blue-600 bg-blue-600' : 'border-zinc-400'
                    }`}
                  >
                    {interviewType === it.type && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Difficulty, Question Count, and Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2 text-center text-xs font-bold rounded-xl border transition-all ${
                    difficulty === lvl
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalQuestions(num)}
                  className={`py-2 text-center text-xs font-bold rounded-xl border transition-all ${
                    totalQuestions === num
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Practice Mode
              </label>
              {mode === 'Live Video AI' && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live AI Vision
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('Live Video AI')}
                className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  mode === 'Live Video AI'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white border-blue-500 shadow-md shadow-blue-500/25 ring-1 ring-blue-400/40'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Live Video AI</span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-red-500 text-white tracking-widest uppercase">
                  LIVE
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('Voice')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  mode === 'Voice'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Audio</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('Text')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  mode === 'Text'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Video Detection Information & Test Chamber */}
        {mode === 'Live Video AI' && (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-violet-50/50 dark:from-zinc-900/90 dark:via-blue-950/20 dark:to-zinc-900/90 border border-blue-200/80 dark:border-blue-900/50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Live Video AI Vision & Non-Verbal Telemetry
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Real-time eye contact tracking, head posture centering, and facial expression analysis.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCameraTest((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  showCameraTest
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <span>{showCameraTest ? 'Hide Camera Check' : 'Test Camera & HUD'}</span>
              </button>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-blue-100 dark:border-zinc-800">
                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Eye Gaze Focus</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-blue-100 dark:border-zinc-800">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Posture Centering</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-blue-100 dark:border-zinc-800">
                <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>Expression Sentiment</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-blue-100 dark:border-zinc-800">
                <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Voice Audio Spectrum</span>
              </div>
            </div>

            {/* Live Camera Pre-Check Preview */}
            {showCameraTest && (
              <div className="pt-2 animate-in fade-in duration-200">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  Camera Pre-Flight Check:
                </p>
                <div className="max-w-md mx-auto">
                  <LiveVideoDetection compact />
                </div>
              </div>
            )}
          </div>
        )}

        {/* XP Session Cost & Balance Card */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            hasEnoughXp
              ? 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60'
              : 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
          }`}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
              hasEnoughXp ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'
            }`}>
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">AI Interview Cost:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {INTERVIEW_XP_COST} XP
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Current Balance: <strong className="text-zinc-900 dark:text-white font-bold">{userXp} XP</strong>
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {hasEnoughXp
                  ? `Balance after start: ${userXp - INTERVIEW_XP_COST} XP. Deducted securely with duplicate prevention.`
                  : 'Insufficient XP. Please recharge or earn more XP before entering.'}
              </p>
            </div>
          </div>

          <button
            id="recharge-xp-setup-btn"
            type="button"
            onClick={() => setShowXpModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold text-xs shadow-sm hover:shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Buy XP (Razorpay)</span>
          </button>
        </div>

        {/* Launch Button */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Info className="w-4 h-4 text-blue-500" />
            <span>AI adaptively increases or reduces question difficulty as you answer.</span>
          </div>

          <button
            id="start-interview-btn"
            type="button"
            onClick={handleStart}
            disabled={loading || !hasEnoughXp}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title={!hasEnoughXp ? 'Insufficient XP. Please earn more XP to start this assessment.' : 'Enter Interview Room'}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Question 1...</span>
              </div>
            ) : (
              <>
                <span>Enter Interview Room</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <XPStoreModal
        isOpen={showXpModal}
        onClose={() => {
          setShowXpModal(false);
          refreshProfile?.().catch(() => {});
        }}
        currentXp={userXp}
        currentLevel={user?.level || 'Beginner'}
        onSuccess={(_newXp, _newLevel, updatedUser) => {
          if (updatedUser && updateUser) {
            updateUser(updatedUser);
          }
          refreshProfile?.().catch(() => {});
        }}
      />
    </div>
  );
};
