import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Sparkles,
  CheckCircle2,
  Lock,
  User as UserIcon,
  History,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { gamificationService } from '../services/api';
import { LeaderboardEntry, Achievement } from '../types';
import { useAuth } from '../context/AuthContext';
import { XPTransactionHistory } from '../components/gamification';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'XP_HISTORY'>('LEADERBOARD');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const fetchLeaderboardData = async () => {
    try {
      const [lbRes, achRes] = await Promise.all([
        gamificationService.getLeaderboard(),
        gamificationService.getAchievements(),
      ]);
      if (lbRes.success && lbRes.leaderboard) {
        setLeaderboard(lbRes.leaderboard);
        setUserStats(lbRes.currentUser);
      }
      if (achRes.success && achRes.achievements) {
        setAchievements(achRes.achievements);
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboardData();
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Community Benchmarking & Badges</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Global Leaderboard & Achievements
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Earn XP by clearing mock interview sessions, answering MCQs, and maintaining daily streaks.
        </p>
      </div>

      {/* Current User Snapshot Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{user?.name}</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase">
                {userStats?.badge || 'Rising Star'}
              </span>
            </div>
            <p className="text-xs text-blue-100">{user?.preferredJobRole || 'Software Engineer'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-2xl font-black">
              {userStats?.rank
                ? `#${userStats.rank}`
                : `#${leaderboard.find((e) => (e.id || (e as any).userId) === user?.id)?.rank || 1}`}
            </span>
            <span className="text-[10px] text-blue-200 block font-semibold">Your Rank</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black">
              {userStats?.xp ?? user?.xpPoints ?? user?.xp ?? 240}
            </span>
            <span className="text-[10px] text-blue-200 block font-semibold">Total XP</span>
            <button
              type="button"
              onClick={() => setActiveTab('XP_HISTORY')}
              className="text-[10px] text-blue-100 hover:text-white underline font-semibold mt-1 transition-colors cursor-pointer"
            >
              View History →
            </button>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span className="text-2xl font-black">
                {userStats?.streakDays ?? user?.streakDays ?? user?.currentStreak ?? 3}
              </span>
            </div>
            <span className="text-[10px] text-blue-200 block font-semibold">Day Streak</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 w-fit">
        <button
          id="tab-btn-leaderboard"
          type="button"
          onClick={() => setActiveTab('LEADERBOARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'LEADERBOARD'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Leaderboard & Badges</span>
        </button>

        <button
          id="tab-btn-xp-history"
          type="button"
          onClick={() => setActiveTab('XP_HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'XP_HISTORY'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4 text-blue-500" />
          <span>XP Transaction History (Deductions & Refunds)</span>
        </button>
      </div>

      {activeTab === 'XP_HISTORY' ? (
        <XPTransactionHistory
          title="My XP Transaction History"
          subtitle="Chronological audit log of all XP deductions, refunds, and adjustments on your account"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Candidates Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Top Interview Candidates</span>
              </h3>
              <button
                id="leaderboard-weekly-refresh-btn"
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Click to refresh leaderboard rankings"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200/70 dark:border-zinc-700/60 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
              >
                <RefreshCw
                  className={`w-3 h-3 text-zinc-500 dark:text-zinc-400 ${
                    refreshing ? 'animate-spin text-blue-500 dark:text-blue-400' : ''
                  }`}
                />
                <span>{refreshing ? 'Refreshing...' : justRefreshed ? 'Updated!' : 'Weekly Refresh'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                  No public leaderboard entries yet.
                </div>
              ) : (
                leaderboard.map((entry, index) => {
                  const entryKey =
                    entry.id ||
                    (entry as any).userId ||
                    `leaderboard-${entry.rank ?? index}-${entry.name || 'user'}`;
                  const isCurrentUser = (entry.id || (entry as any).userId) === user?.id;
                  const role = entry.preferredJobRole || (entry as any).jobRole || 'Software Engineer';
                  const xp = entry.xpPoints ?? (entry as any).xp ?? 0;

                  return (
                    <div
                      key={entryKey}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isCurrentUser
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 text-center font-black text-sm">
                          {entry.rank === 1 ? (
                            <span className="text-amber-500 font-bold">🥇 1</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-slate-400 font-bold">🥈 2</span>
                          ) : entry.rank === 3 ? (
                            <span className="text-amber-700 font-bold">🥉 3</span>
                          ) : (
                            <span className="text-zinc-500 font-bold">#{entry.rank}</span>
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-xs text-zinc-900 dark:text-white">
                            {entry.name} {isCurrentUser && <span className="text-[10px] text-blue-500 font-bold">(You)</span>}
                          </p>
                          <span className="text-[10px] text-zinc-400">{role}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                          {xp} XP
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          {entry.interviewsCompleted || 0} sessions
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Achievements Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Skill Badges & Milestones</span>
            </h3>

            <div className="space-y-3">
              {achievements.map((ach, index) => {
                const achKey = ach.id || `achievement-${index}-${ach.title || 'badge'}`;

                return (
                  <div
                    key={achKey}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                      ach.unlocked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
                        : 'bg-zinc-50/60 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        ach.unlocked ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {ach.unlocked ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                          {ach.title}
                        </h4>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          +{ach.xpReward} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {ach.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};
