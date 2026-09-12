import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  Code2,
  ArrowRight,
  Search,
  GraduationCap,
  Shield,
  X,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Video,
  KeyRound,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Filter,
  Calendar,
  BookOpen,
  Coins,
} from 'lucide-react';
import { adminService, candidateService, mcqService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, InterviewQuestion } from '../types';
import { QuestionBankManager } from '../components/admin/QuestionBankManager';
import { ScheduleInterviewModal } from '../components/admin/ScheduleInterviewModal';
import { ScheduledInterviewsList } from '../components/admin/ScheduledInterviewsList';
import { AdminXpManager } from '../components/admin/AdminXpManager';

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'questionBank' | 'scheduledInterviews' | 'xpManagement'>('portfolio');
  const [stats, setStats] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule Interview modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [candidateForSchedule, setCandidateForSchedule] = useState<string | undefined>(undefined);
  const [refreshInterviewKey, setRefreshInterviewKey] = useState(0);

  // Search & Filter state for candidates
  const [userSearch, setUserSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteUserFeedback, setDeleteUserFeedback] = useState<string | null>(null);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);

  // Admin Code copy state
  const [copiedAdminCode, setCopiedAdminCode] = useState(false);

  // MCQ state & Question Management
  const [showAddMcq, setShowAddMcq] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('ALL');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<any | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState({
    category: 'Java',
    difficulty: 'Intermediate',
    question: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: '',
  });

  const handleCopyAdminCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedAdminCode(true);
    setTimeout(() => setCopiedAdminCode(false), 2500);
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAdmin, user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [portfolioRes, statsRes, qRes, interviewQRes] = await Promise.all([
        adminService.getPortfolio().catch(async () => {
          const candRes = await candidateService.getCandidates();
          return {
            success: true,
            admin: user,
            count: candRes.candidates?.length || 0,
            candidates: candRes.candidates || [],
          };
        }),
        adminService.getStats().catch(() => ({ success: false, stats: null })),
        mcqService.getQuestions().catch(() => ({ success: false, questions: [] })),
        adminService.getInterviewQuestions().catch(() => ({ success: false, questions: [] })),
      ]);

      if (portfolioRes.success) {
        if (portfolioRes.candidates) {
          setCandidates(portfolioRes.candidates);
        }
        if (portfolioRes.admin) {
          setAdminProfile(portfolioRes.admin);
        }
      }
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (qRes.success && qRes.questions) {
        setQuestions(qRes.questions);
      }
      if (interviewQRes.success && interviewQRes.questions) {
        setInterviewQuestions(interviewQRes.questions);
      }
    } catch (err) {
      console.error('Admin loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newQuestion.question.trim()) return;

    try {
      const res = await adminService.createQuestion(newQuestion);
      if (res.success && res.question) {
        setQuestions((prev) => [res.question, ...prev]);
        setShowAddMcq(false);
        setNewQuestion({
          category: 'Java',
          difficulty: 'Intermediate',
          question: '',
          options: ['', '', '', ''],
          correctAnswerIndex: 0,
          explanation: '',
        });
      }
    } catch (err) {
      console.error('Failed to add MCQ question:', err);
    }
  };

  const handleDeleteQuestionClick = (q: any) => {
    if (!isAdmin) return;
    setQuestionError(null);
    setQuestionFeedback(null);
    setQuestionToDelete(q);
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!questionToDelete || !isAdmin) return;
    setDeletingQuestion(true);
    setQuestionError(null);
    try {
      const res = await adminService.deleteQuestion(questionToDelete.id);
      if (res.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionToDelete.id));
        setQuestionFeedback(
          res.message || `Question "${questionToDelete.question.slice(0, 45)}..." permanently removed from question bank.`
        );
        setQuestionToDelete(null);
      } else {
        setQuestionError(res.message || 'Failed to delete question.');
      }
    } catch (err: any) {
      setQuestionError(err?.response?.data?.message || err?.message || 'Failed to delete question from platform.');
    } finally {
      setDeletingQuestion(false);
    }
  };

  const handleConfirmPermanentDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    setDeleteUserError(null);
    try {
      const res = await candidateService.deleteCandidate(userToDelete.id).catch(async () => {
        return await adminService.deleteUser(userToDelete.id);
      });

      if (res.success) {
        setCandidates((prev) => prev.filter((c) => c.id !== userToDelete.id));
        setDeleteUserFeedback(
          res.message || `Candidate ${userToDelete.name} and all associated records permanently removed.`
        );
        setUserToDelete(null);

        // Refresh stats
        const statsRes = await adminService.getStats().catch(() => null);
        if (statsRes?.success && statsRes.stats) {
          setStats(statsRes.stats);
        }
      } else {
        setDeleteUserError(res.message || 'Failed to delete candidate.');
      }
    } catch (err: any) {
      setDeleteUserError(err?.response?.data?.message || err?.message || 'Failed to delete candidate.');
    } finally {
      setDeletingUser(false);
    }
  };

  // Active administrator strictly bound to the authenticated user session
  const currentAdmin = adminProfile || user;

  // Filter candidates assigned strictly to this authenticated administrator
  const candidateQuery = userSearch.toLowerCase().trim();
  const filteredCandidates = candidates.filter((c) => {
    if (!candidateQuery) return true;
    return (
      c.name?.toLowerCase().includes(candidateQuery) ||
      c.email?.toLowerCase().includes(candidateQuery) ||
      c.preferredJobRole?.toLowerCase().includes(candidateQuery) ||
      c.college?.toLowerCase().includes(candidateQuery) ||
      (c.skills && c.skills.some((s) => s.toLowerCase().includes(candidateQuery)))
    );
  });

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Access restricted: Only authenticated platform administrators can view this console or manage assigned candidates.
        </p>
        <Link
          to="/mcq"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
        >
          <span>Go to MCQ Practice</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            <span>Administrator Control Center</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-200/80 dark:bg-indigo-900 text-[10px] font-bold text-indigo-800 dark:text-indigo-200">
              Isolated Session
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Administrator Portfolio Console
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your dedicated candidate portfolio, view evaluation footprints, and author question banks.
          </p>
        </div>

        {/* Current Authenticated Administrator Header Badge */}
        <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3 self-start md:self-auto">
          <img
            src={
              currentAdmin?.profileImage ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentAdmin?.name || 'Admin')}`
            }
            alt={currentAdmin?.name || 'Admin'}
            className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover shrink-0 bg-indigo-50 dark:bg-zinc-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">{currentAdmin?.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {currentAdmin?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">{currentAdmin?.email}</div>
          </div>
        </div>
      </div>

      {/* KPI Stats - Isolated to Current Administrator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold">Assigned Candidates</span>
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
            {candidates.length}
          </p>
          <span className="text-[11px] text-zinc-400">Candidates in your portfolio</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold">Portfolio Status</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            Active
          </p>
          <span className="text-[11px] text-zinc-400">Strict data isolation enforced</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold">Mock Sessions</span>
            <Video className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats?.totalInterviews ?? candidates.reduce((acc, c) => acc + (c.interviewsCount || 0), 0)}
          </p>
          <span className="text-[11px] text-zinc-400">Completed by your candidates</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold">Average Candidate Score</span>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats?.averagePlatformScore ?? 81}%
          </p>
          <span className="text-[11px] text-zinc-400">Performance benchmark</span>
        </div>
      </div>

      {/* Administrator View Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          type="button"
          id="tab-candidates-portfolio"
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'portfolio'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Candidates Portfolio ({candidates.length})</span>
        </button>

        <button
          type="button"
          id="tab-question-bank"
          onClick={() => setActiveTab('questionBank')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'questionBank'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Question Bank ({interviewQuestions.length})</span>
        </button>

        <button
          type="button"
          id="tab-scheduled-interviews"
          onClick={() => setActiveTab('scheduledInterviews')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'scheduledInterviews'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Interviews</span>
        </button>

        <button
          type="button"
          id="tab-xp-management"
          onClick={() => setActiveTab('xpManagement')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'xpManagement'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>XP System & Ledger</span>
        </button>
      </div>

      {activeTab === 'portfolio' && (
        <>
          {/* Administrator Profile & Assigned Candidates Section */}
          <div id="admin-portfolio-section" className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        {/* Administrator Profile Card (Automatically loaded from current authenticated user session) */}
        {currentAdmin && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-50 via-indigo-50/20 to-zinc-50 dark:from-zinc-800/60 dark:via-indigo-950/20 dark:to-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={
                  currentAdmin.profileImage ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentAdmin.name || 'Admin')}`
                }
                alt={currentAdmin.name}
                className="w-14 h-14 rounded-2xl border-2 border-indigo-500/20 dark:border-indigo-400/20 object-cover bg-white dark:bg-zinc-900 shrink-0 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    {currentAdmin.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {currentAdmin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Portfolio Administrator'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Logged In</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                  <span>{currentAdmin.email}</span>
                  {currentAdmin.college && (
                    <>
                      <span>•</span>
                      <span>{currentAdmin.college}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Code & Portfolio Metrics */}
            <div className="flex items-center gap-3 flex-wrap">
              {currentAdmin.adminCode && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs shadow-xs">
                  <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Your Admin Code</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white text-xs tracking-wider">
                      {currentAdmin.adminCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAdminCode(currentAdmin.adminCode!)}
                    title="Copy Administrator Code to share with candidates"
                    className="ml-1 p-1 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {copiedAdminCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              <div className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs flex flex-col shadow-xs">
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Assigned Candidates</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {candidates.length} {candidates.length === 1 ? 'Candidate' : 'Candidates'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Feedback banners */}
        {deleteUserFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{deleteUserFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setDeleteUserFeedback(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {deleteUserError && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{deleteUserError}</span>
            </div>
            <button
              type="button"
              onClick={() => setDeleteUserError(null)}
              className="text-red-600 dark:text-red-400 hover:opacity-80 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Candidates Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Your Assigned Candidates ({filteredCandidates.length})</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Candidates strictly assigned to your administrator portfolio. Other administrators' data is not exposed.
              </p>
            </div>

            {/* Candidate Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search candidates by name, email, role..."
                className="w-full pl-9 pr-7 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Candidates Table */}
          {filteredCandidates.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700 text-center space-y-3">
              <UserPlus className="w-8 h-8 text-zinc-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {userSearch
                    ? `No candidates match "${userSearch}".`
                    : 'No candidates currently assigned to your administrator portfolio.'}
                </p>
                <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                  {userSearch
                    ? 'Try clearing or modifying your search keywords.'
                    : `Candidates who register with your Administrator Code (${currentAdmin?.adminCode || 'N/A'}) will automatically link to your portfolio.`}
                </p>
              </div>
              {!userSearch && currentAdmin?.adminCode && (
                <button
                  type="button"
                  onClick={() => handleCopyAdminCode(currentAdmin.adminCode!)}
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Admin Code ({currentAdmin.adminCode})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 text-zinc-400">
                    <th className="py-3 px-4 font-semibold">Candidate</th>
                    <th className="py-3 px-4 font-semibold">Target Role & College</th>
                    <th className="py-3 px-4 font-semibold">Data Footprint</th>
                    <th className="py-3 px-4 font-semibold">XP & Streak</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      {/* Candidate */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              c.profileImage ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(c.name || 'Candidate')}`
                            }
                            alt={c.name}
                            className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                              <span>{c.name}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400">{c.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Target Role & College */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200">
                          {c.preferredJobRole || 'Software Engineer'}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                          {c.college || 'Engineering Institute'}
                        </div>
                      </td>

                      {/* Data Footprint */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-medium">
                            {c.resumesCount || 0} resumes
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-medium">
                            {c.interviewsCount || 0} mocks
                          </span>
                        </div>
                      </td>

                      {/* XP & Streak */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-500">{c.xpPoints || c.xp || 100} XP</span>
                          <span className="text-[11px] text-zinc-400">• {c.currentStreak || 1}d streak</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCandidateForSchedule(c.id);
                              setIsScheduleModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white border border-purple-200 dark:border-purple-900/60 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            title={`Schedule interview for ${c.name}`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule</span>
                          </button>
                          <button
                            type="button"
                            id={`delete-user-btn-${c.id}`}
                            onClick={() => {
                              setDeleteUserError(null);
                              setDeleteUserFeedback(null);
                              setUserToDelete(c);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white border border-red-200 dark:border-red-900/60 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                            title={`Permanently delete ${c.name} and all associated data`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Permanent Deletion Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    Candidate Record Deletion
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Remove candidate from your portfolio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteUserError(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 space-y-2">
              <p className="font-bold">
                Permanently purge {userToDelete.name} ({userToDelete.email})?
              </p>
              <p className="text-[11px] leading-relaxed">
                Deleting this candidate will permanently delete all records associated with user ID{' '}
                <code className="font-mono bg-red-200/60 dark:bg-red-900/60 px-1 py-0.5 rounded">
                  {userToDelete.id}
                </code>
                :
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                <li>All resume files and parsed skill profiles</li>
                <li>All mock interview transcripts, audio data, and recordings</li>
                <li>All performance analytics metrics and score roadmaps</li>
                <li>Candidate XP points and streak records</li>
              </ul>
            </div>

            {deleteUserError && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold">
                {deleteUserError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="cancel-delete-user-btn"
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteUserError(null);
                }}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                id="confirm-delete-user-btn"
                disabled={deletingUser}
                onClick={handleConfirmPermanentDeleteUser}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {deletingUser ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Purging Candidate Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === 'questionBank' && (
        <div className="space-y-8">
          {/* Administrator Question Bank Manager */}
          <QuestionBankManager
            onQuestionListChanged={async () => {
              const res = await adminService.getInterviewQuestions();
              if (res.success && res.questions) {
                setInterviewQuestions(res.questions);
              }
            }}
          />

          {/* Coding Interview Question Authoring Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-zinc-900/80 border border-blue-500/30 dark:border-blue-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Coding Interview Question Bank</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Admin Only Authoring
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
              Author custom DSA coding problems with test cases and starter templates in Java 21 & JavaScript, or generate new challenges via Gemini AI.
            </p>
          </div>
        </div>

        <Link
          to="/coding"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer self-start md:self-auto"
        >
          <span>Open Coding Authoring IDE</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* MCQ Question Bank Management */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Quiz Question Bank Management</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {questions.length}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Add, preview, and curate technical questions used by the MCQ practice engine.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMcq(!showAddMcq)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddMcq ? 'Close Form' : 'Add Question'}</span>
          </button>
        </div>

        {/* Success/Error Banners for Questions */}
        {questionFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{questionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setQuestionFeedback(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {questionError && (
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{questionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setQuestionError(null)}
              className="text-red-600 dark:text-red-400 hover:opacity-80 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar for Questions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {['ALL', 'Java', 'Spring Boot', 'React', 'SQL', 'DSA'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setQuestionCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  questionCategoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat === 'ALL' ? 'All Questions' : cat}
              </button>
            ))}
          </div>

          {/* Question Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {questionSearch && (
              <button
                type="button"
                onClick={() => setQuestionSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Add Question Form */}
        {showAddMcq && (
          <form onSubmit={handleAddQuestion} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Category</label>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-800"
                >
                  <option value="Java">Java</option>
                  <option value="Spring Boot">Spring Boot</option>
                  <option value="React">React</option>
                  <option value="SQL">SQL</option>
                  <option value="DSA">DSA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Difficulty</label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-800"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Question Text</label>
              <input
                type="text"
                required
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="What is the time complexity of searching in a HashMap?"
                className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {newQuestion.options.map((opt, idx) => (
                <div key={idx}>
                  <label className="block text-[11px] font-semibold mb-0.5">
                    Option {idx + 1} {newQuestion.correctAnswerIndex === idx && '(Correct)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newQuestion.options];
                      updated[idx] = e.target.value;
                      setNewQuestion({ ...newQuestion, options: updated });
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-800"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Correct Option Index (0-3)</label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={newQuestion.correctAnswerIndex}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswerIndex: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Explanation</label>
                <input
                  type="text"
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  placeholder="Because hashCode() allows O(1) bucket lookups."
                  className="w-full px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Save Question
            </button>
          </form>
        )}

        {/* Questions List */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {questions
            .filter((q) => {
              const matchesCat =
                questionCategoryFilter === 'ALL' ||
                q.category?.toLowerCase() === questionCategoryFilter.toLowerCase();
              const query = questionSearch.toLowerCase().trim();
              if (!query) return matchesCat;
              return (
                matchesCat &&
                (q.question?.toLowerCase().includes(query) ||
                  q.category?.toLowerCase().includes(query) ||
                  q.explanation?.toLowerCase().includes(query))
              );
            })
            .map((q) => {
              const isExpanded = expandedQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 p-3.5 transition-all text-xs space-y-2.5 hover:border-zinc-300 dark:hover:border-zinc-600/80"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 pr-2">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                        {q.category}
                      </span>
                      {q.difficulty && (
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            q.difficulty === 'Advanced'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : q.difficulty === 'Intermediate'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      )}
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {q.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Expand Options & Answers button */}
                      <button
                        type="button"
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="px-2.5 py-1.5 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-700/60 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title={isExpanded ? 'Hide Options' : 'View Options & Answer'}
                      >
                        <span>{isExpanded ? 'Hide' : 'Options'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Targeted Working Delete Button with SVG */}
                      <button
                        type="button"
                        id={`delete-question-btn-${q.id}`}
                        onClick={() => handleDeleteQuestionClick(q)}
                        className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-red-50 dark:hover:bg-red-950/50 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700/60 hover:border-red-200 dark:hover:border-red-900/60 transition-all cursor-pointer inline-flex items-center justify-center active:scale-95 group focus:outline-none focus:ring-2 focus:ring-red-500/40"
                        title={`Permanently delete question: ${q.question}`}
                        aria-label="Delete question"
                      >
                        <Trash2 className="w-4 h-4 text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-transform group-hover:scale-110" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Options & Explanation Details */}
                  {isExpanded && (
                    <div className="pt-2.5 border-t border-zinc-200 dark:border-zinc-700/60 space-y-2 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {q.options?.map((opt: string, idx: number) => {
                          const isCorrect = q.correctAnswerIndex === idx;
                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                                  : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              <span className="truncate">
                                <span className="font-mono font-bold mr-1.5 opacity-70">
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                {opt}
                              </span>
                              {isCorrect && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold">Explanation:</strong> {q.explanation}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Question Permanent Deletion Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    Delete MCQ Question
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Remove question from MCQ Practice bank
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuestionToDelete(null);
                  setQuestionError(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-200/80 dark:bg-red-900 text-red-800 dark:text-red-200 shrink-0">
                  {questionToDelete.category}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-white truncate">
                  {questionToDelete.question}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-red-600 dark:text-red-400">
                Are you sure you want to permanently delete this question? It will no longer appear in practice mock quizzes.
              </p>
            </div>

            {questionError && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold">
                {questionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="cancel-delete-question-btn"
                onClick={() => {
                  setQuestionToDelete(null);
                  setQuestionError(null);
                }}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                id="confirm-delete-question-btn"
                disabled={deletingQuestion}
                onClick={handleConfirmDeleteQuestion}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {deletingQuestion ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting Question...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Question</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Scheduled Interviews Tab */}
      {activeTab === 'scheduledInterviews' && (
        <ScheduledInterviewsList
          onOpenScheduleModal={() => {
            setCandidateForSchedule(undefined);
            setIsScheduleModalOpen(true);
          }}
          refreshKey={refreshInterviewKey}
        />
      )}

      {/* XP System & Ledger Tab */}
      {activeTab === 'xpManagement' && <AdminXpManager />}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setCandidateForSchedule(undefined);
        }}
        candidates={candidates}
        questions={interviewQuestions}
        initialCandidateId={candidateForSchedule}
        onInterviewScheduled={() => {
          setRefreshInterviewKey((prev) => prev + 1);
          setActiveTab('scheduledInterviews');
        }}
      />
    </div>
  );
};
