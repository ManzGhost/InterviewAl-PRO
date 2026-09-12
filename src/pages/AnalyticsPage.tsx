import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Sparkles,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { dashboardService } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats().then((res) => {
      if (res.success && res.stats) {
        setStats(res.stats);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const progressData = [
    { session: 'Session 1', score: 62, technical: 65, communication: 60 },
    { session: 'Session 2', score: 68, technical: 70, communication: 64 },
    { session: 'Session 3', score: 74, technical: 76, communication: 72 },
    { session: 'Session 4', score: 81, technical: 82, communication: 80 },
    { session: 'Session 5', score: 85, technical: 88, communication: 82 },
    { session: 'Session 6', score: 91, technical: 93, communication: 89 },
  ];

  const categoryBreakdown = [
    { category: 'Technical Depth', score: 88, benchmark: 75 },
    { category: 'System Architecture', score: 82, benchmark: 70 },
    { category: 'Communication', score: 85, benchmark: 78 },
    { category: 'STAR Behavioral', score: 79, benchmark: 72 },
    { category: 'Problem Solving', score: 91, benchmark: 80 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Longitudinal Performance Diagnostics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Candidate Analytics & Trajectory
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Track historical progression across your mock interview sessions and compare against market benchmarks.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-400">Total Practice Rounds</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats?.totalInterviews || 6}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-400">Average Composite Score</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats?.averageScore || 82}%
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-400">MCQs Solved</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats?.mcqCount || 35}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-400">ATS Resume Health</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats?.atsScore || 84}/100
          </p>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Score Velocity Trend
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Historical improvement from Session 1 to present.</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/60">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+29% Growth</span>
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis dataKey="session" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  backgroundColor: '#18181b',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#scoreColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competency Benchmark Bar Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-zinc-900 dark:text-white">
          Skills vs Industry Candidate Benchmark
        </h3>
        <p className="text-xs text-zinc-500">Comparing your latest averages against top tech tier percentiles.</p>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  backgroundColor: '#18181b',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="score" name="Your Score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="benchmark" name="Market Benchmark" fill="#94a3b8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
