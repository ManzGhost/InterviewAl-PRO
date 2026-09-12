import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Flame,
  Award,
  Clock,
  ArrowRight,
  Sparkles,
  FileText,
  Target,
  Code2,
  TrendingUp,
  BarChart2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import { DashboardStats, PerformanceAnalyticsData } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<PerformanceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getPerformance(),
        ]);
        if (statsRes.success) setStats(statsRes.stats);
        if (analyticsRes.success) setAnalytics(analyticsRes);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-zinc-900 text-white shadow-xl shadow-blue-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Target Role: {user?.preferredJobRole || 'Java Full Stack Developer'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready for your next round, {user?.name?.split(' ')[0] || 'Engineer'}?
            </h1>
            <p className="mt-1 text-sm text-zinc-300 max-w-xl">
              Gemini AI is ready to evaluate your technical answers, STAR behavioral responses, and resume alignment.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/assigned-interviews"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Assigned Interviews</span>
            </Link>
            <Link
              to="/interview/setup"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-sm shadow-lg transition-all"
            >
              <Video className="w-4 h-4 text-blue-600" />
              <span>Practice AI Mock</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Interviews</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {stats?.totalInterviews ?? 3}
            </span>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {stats?.completedInterviews ?? 3} completed sessions
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Average AI Score</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {stats?.averageScore ?? 84}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">/ 100</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Best score: <strong className="text-zinc-700 dark:text-zinc-300">{stats?.bestScore ?? 92}/100</strong>
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Active Streak</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {stats?.currentStreak ?? 5}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Days</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Keep practicing daily to build momentum
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">XP & Current Level</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {stats?.xpPoints ?? 1250}
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">XP</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Level: <strong className="text-indigo-600 dark:text-indigo-400">{stats?.currentLevel ?? 'Intermediate'}</strong>
          </p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Curve */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Interview Score Progress
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Historical performance trend</p>
            </div>
            <Link to="/analytics" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Detailed breakdown
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.performanceOverTime || []}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic-wise Mastery */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Topic-Wise Mastery
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Average score per technical domain</p>
            </div>
            <Link to="/mcq" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Practice weak topics
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topicPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="topic" stroke="#888888" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Access Feature Hub */}
      <div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
          Prepare & Practice Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/resume"
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Resume & ATS Check</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Scan your resume against technical keywords and calculate ATS match score.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
              <span>Scan Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/job-match"
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Job Description Match</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Paste any recruiter job description to identify skill gaps and tailored questions.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
              <span>Match Job</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/coding"
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Coding Interview</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Solve algorithmic problems and get Big-O space/time feedback with Gemini code review.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:gap-2 transition-all">
              <span>Practice Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/mcq"
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">MCQ Practice</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Timed test series covering Java, Spring Boot, React, SQL, MongoDB, and DSA.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:gap-2 transition-all">
              <span>Start Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
