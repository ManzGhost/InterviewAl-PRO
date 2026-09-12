import React, { useState, useEffect } from 'react';
import {
  Coins,
  Award,
  Settings,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Save,
  Clock,
  User,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { XpSettings, XpTransaction } from '../../types';
import { xpService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { XPStoreModal } from '../gamification/XPStoreModal';

export const AdminXpManager: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<XpSettings>({
    adminScheduleInterviewCost: 10,
    aiInterviewCost: 10,
    mcqPracticeCost: 5,
    codingInterviewCost: 10,
    assignmentInterviewCost: 10,
    initialUserXp: 100,
  });

  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Filters for ledger
  const [searchFilter, setSearchFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'DEDUCTION' | 'ADDITION'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // XP Store modal
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, txnsRes] = await Promise.all([
        xpService.getAdminXpSettings(),
        xpService.getAdminXpTransactions(),
      ]);
      if (settingsRes.success && settingsRes.settings) {
        setSettings(settingsRes.settings);
      }
      if (txnsRes.success && txnsRes.transactions) {
        setTransactions(txnsRes.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch XP administration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const res = await xpService.updateAdminXpSettings(settings);
      if (res.success) {
        setSettings(res.settings);
        setSettingsSuccess('XP costs and rules saved successfully.');
        setTimeout(() => setSettingsSuccess(null), 4000);
      } else {
        setSettingsError(res.message || 'Failed to update settings.');
      }
    } catch (err: any) {
      setSettingsError(err?.response?.data?.message || err?.message || 'Error updating settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.userName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(searchFilter.toLowerCase())) ||
      t.description.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || t.action === actionFilter;
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;

    return matchesSearch && matchesAction && matchesType;
  });

  const adminXp = user?.xpPoints ?? 1000;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Administrator Balance & Overview */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backend-Authoritative XP Ledger & Deductions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrator XP & Economy Control
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Every action is validated server-side to prevent tampering. When you schedule an interview,
              {settings.adminScheduleInterviewCost} XP is deducted automatically after interview creation with atomic idempotency.
            </p>
          </div>

          {/* Balance card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 shrink-0">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Administrator XP Balance</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                <span>{adminXp}</span>
                <span className="text-lg font-bold text-amber-300">XP</span>
              </div>
              <div className="text-[11px] text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sufficient for {Math.floor(adminXp / Math.max(1, settings.adminScheduleInterviewCost))} interview slots</span>
              </div>
            </div>

            <button
              id="admin-recharge-xp-btn"
              type="button"
              onClick={() => setIsStoreOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Buy XP Packages</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: XP Cost Configuration & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cost Configuration Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">XP Cost Configuration</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Adjust action deduction rules</p>
              </div>
            </div>
          </div>

          {settingsSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          {settingsError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{settingsError}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Admin Schedule Interview Cost</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{settings.adminScheduleInterviewCost} XP</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.adminScheduleInterviewCost}
                  onChange={(e) =>
                    setSettings({ ...settings, adminScheduleInterviewCost: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-400 font-medium">XP</span>
              </div>
              <p className="text-[11px] text-zinc-400">Deducted from Administrator when scheduling an interview.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Candidate AI Interview Cost</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{settings.aiInterviewCost} XP</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.aiInterviewCost}
                  onChange={(e) =>
                    setSettings({ ...settings, aiInterviewCost: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-400 font-medium">XP</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Candidate MCQ Practice Cost</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{settings.mcqPracticeCost} XP</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.mcqPracticeCost}
                  onChange={(e) =>
                    setSettings({ ...settings, mcqPracticeCost: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-400 font-medium">XP</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Candidate Coding Interview Cost</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{settings.codingInterviewCost} XP</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.codingInterviewCost}
                  onChange={(e) =>
                    setSettings({ ...settings, codingInterviewCost: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-400 font-medium">XP</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Candidate Assignment Interview Cost</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{settings.assignmentInterviewCost} XP</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.assignmentInterviewCost}
                  onChange={(e) =>
                    setSettings({ ...settings, assignmentInterviewCost: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-400 font-medium">XP</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Initial Candidate Starter Pack</span>
                <span className="text-zinc-600 dark:text-zinc-400 font-bold">{settings.initialUserXp} XP</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={settings.initialUserXp}
                  onChange={(e) =>
                    setSettings({ ...settings, initialUserXp: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-400 font-medium">XP</span>
              </div>
            </div>

            <button
              type="submit"
              id="btn-save-xp-settings"
              disabled={savingSettings}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {savingSettings ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Configuration</span>
            </button>
          </form>
        </div>

        {/* XP Rules & Safeguards Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">XP Security & Verification Rules</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Enforced strictly in server/db.ts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Backend-Authoritative</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Balances are stored in the server database. Frontend never directly mutates or authorizes XP balance.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                  <span>Admin Cancellation 100% Refund</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  100% XP refund (+10 XP) is credited if cancelled before candidate starts, or if candidate is deleted.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Zero-Tolerance: No Refund on Abuse</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Zero refund if candidate exits, switches tabs, triggers cheating violations, or runs out of time.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>System Error Auto-Refund & Idempotency</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Auto-rollback on server error. Unique IDs and status checks strictly prevent duplicate deductions and duplicate refunds.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Total Entries</div>
              <div className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{transactions.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Deductions</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {transactions.filter((t) => t.action === 'DEDUCTION').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Refunds Issued</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {transactions.filter((t) => t.type.includes('REFUND') || t.description.toLowerCase().includes('refund')).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Credits / Purchases</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {transactions.filter((t) => t.action === 'ADDITION' && !t.type.includes('REFUND') && !t.description.toLowerCase().includes('refund')).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organization XP Transaction Ledger */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">XP Transaction Ledger</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Complete historical record of all XP movements across the platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by user, email, description, or reference ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Actions</option>
              <option value="DEDUCTION">Deductions (-)</option>
              <option value="ADDITION">Additions (+)</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="INTERVIEW_SCHEDULING">Interview Scheduling (Admin)</option>
              <option value="INTERVIEW_CANCELLED_REFUND">Interview Cancelled Refund (Admin)</option>
              <option value="SYSTEM_ERROR_REFUND">System Failure Refund</option>
              <option value="AI_INTERVIEW">AI Interview (Candidate)</option>
              <option value="MCQ_PRACTICE">MCQ Practice (Candidate)</option>
              <option value="CODING_INTERVIEW">Coding Interview (Candidate)</option>
              <option value="ASSIGNMENT_INTERVIEW">Assignment Interview (Candidate)</option>
              <option value="XP_PURCHASE">XP Purchase</option>
              <option value="BONUS_EARNED">Bonus / Initial Credit</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Action & Type</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Balance Change</th>
                <th className="p-3.5">Description & Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isDeduction = tx.action === 'DEDUCTION';
                  const isRefund =
                    tx.type === 'INTERVIEW_CANCELLED_REFUND' ||
                    tx.type === 'SYSTEM_ERROR_REFUND' ||
                    tx.type === 'XP_REFUNDED' ||
                    tx.description.toLowerCase().includes('refund');

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="p-3.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-zinc-900 dark:text-white">{tx.userName}</div>
                        <div className="text-[10px] text-zinc-400">{tx.userEmail}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isRefund
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : isDeduction
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {isRefund ? (
                              <RotateCcw className="w-3 h-3 text-blue-600" />
                            ) : isDeduction ? (
                              <ArrowDownRight className="w-3 h-3 text-amber-600" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            )}
                            <span>{tx.type.replace(/_/g, ' ')}</span>
                          </span>
                          {tx.status === 'REFUNDED' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold tracking-wider">
                              REFUNDED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-bold">
                        <span
                          className={
                            isRefund
                              ? 'text-blue-600 dark:text-blue-400'
                              : isDeduction
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {isDeduction ? `${tx.amount} XP` : `+${tx.amount} XP`}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                        <span>{tx.balanceBefore} XP</span>
                        <span className="text-zinc-400 mx-1.5">→</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{tx.balanceAfter} XP</span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-zinc-900 dark:text-zinc-200 font-medium">{tx.description}</div>
                        {tx.reason && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            Reason: {tx.reason}
                          </div>
                        )}
                        {tx.referenceId && (
                          <div className="text-[10px] font-mono text-zinc-400 truncate max-w-xs">
                            Ref: {tx.referenceId}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <XPStoreModal
        isOpen={isStoreOpen}
        onClose={() => {
          setIsStoreOpen(false);
          fetchData();
          refreshProfile?.().catch(() => {});
        }}
        currentXp={adminXp}
        currentLevel={user?.level || 'System Administrator'}
        onSuccess={(_newXp, _newLevel, updatedUser) => {
          if (updatedUser && updateUser) {
            updateUser(updatedUser);
          }
          fetchData();
          refreshProfile?.().catch(() => {});
        }}
      />
    </div>
  );
};
