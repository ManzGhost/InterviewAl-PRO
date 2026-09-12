import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Coins,
  ShieldCheck,
  Filter,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  FileText,
  Sparkles,
  Info,
  Calendar,
  X,
  ExternalLink,
} from 'lucide-react';
import { XpTransaction, XpTransactionType, XpAction } from '../../types';
import { xpService } from '../../services/api';

export interface XPTransactionHistoryProps {
  /** Optional pre-fetched transactions list. If omitted, fetches via xpService.getMyTransactions() */
  transactions?: XpTransaction[];
  /** Optional title override */
  title?: string;
  /** Optional subtitle override */
  subtitle?: string;
  /** Default filter tab */
  defaultFilter?: 'ALL' | 'DEDUCTIONS' | 'REFUNDS';
  /** Show summary statistics cards */
  showStats?: boolean;
  /** Compact card mode for sidebars, profile widgets or modals */
  compact?: boolean;
  /** Custom additional container classes */
  className?: string;
  /** Callback triggered when the refresh button is clicked */
  onRefresh?: () => void;
  /** Callback when user clicks a transaction for custom handling */
  onSelectTransaction?: (tx: XpTransaction) => void;
  /** Optional maximum items to display */
  limit?: number;
}

// Map transaction types to human-readable names, badges and icons
const TRANSACTION_TYPE_CONFIG: Record<
  string,
  { label: string; badge: string; icon: typeof ArrowDownRight; color: string }
> = {
  INTERVIEW_SCHEDULING: {
    label: 'Interview Slot Scheduling',
    badge: 'Interview',
    icon: ArrowDownRight,
    color: 'text-amber-600 dark:text-amber-400',
  },
  AI_INTERVIEW: {
    label: 'AI Mock Interview',
    badge: 'Mock Interview',
    icon: ArrowDownRight,
    color: 'text-amber-600 dark:text-amber-400',
  },
  CODING_INTERVIEW: {
    label: 'Coding Assessment Session',
    badge: 'Coding IDE',
    icon: ArrowDownRight,
    color: 'text-amber-600 dark:text-amber-400',
  },
  MCQ_PRACTICE: {
    label: 'MCQ Practice Quiz',
    badge: 'Practice Quiz',
    icon: ArrowDownRight,
    color: 'text-amber-600 dark:text-amber-400',
  },
  ASSIGNMENT_INTERVIEW: {
    label: 'Assignment Evaluation',
    badge: 'Assignment',
    icon: ArrowDownRight,
    color: 'text-amber-600 dark:text-amber-400',
  },
  INTERVIEW_CANCELLED_REFUND: {
    label: 'Interview Cancelled Refund',
    badge: 'Auto Refund',
    icon: RotateCcw,
    color: 'text-blue-600 dark:text-blue-400',
  },
  SYSTEM_ERROR_REFUND: {
    label: 'System Error Refund',
    badge: 'Auto Refund',
    icon: RotateCcw,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  XP_REFUNDED: {
    label: 'XP Refund Credited',
    badge: 'Refund',
    icon: RotateCcw,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  XP_DEDUCTED: {
    label: 'XP Deduction',
    badge: 'Deduction',
    icon: ArrowDownRight,
    color: 'text-rose-600 dark:text-rose-400',
  },
  XP_PURCHASE: {
    label: 'XP Package Purchase',
    badge: 'Top-up',
    icon: ArrowUpRight,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  BONUS_EARNED: {
    label: 'Bonus / Welcome Credit',
    badge: 'Starter Bonus',
    icon: Sparkles,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  ADMIN_ADJUSTMENT: {
    label: 'Admin Balance Adjustment',
    badge: 'Adjustment',
    icon: ShieldCheck,
    color: 'text-purple-600 dark:text-purple-400',
  },
};

export const XPTransactionHistory: React.FC<XPTransactionHistoryProps> = ({
  transactions: initialTransactions,
  title = 'XP Transaction History',
  subtitle = 'Chronological ledger of all XP deductions, refunds, and adjustments',
  defaultFilter = 'ALL',
  showStats = true,
  compact = false,
  className = '',
  onRefresh,
  onSelectTransaction,
  limit,
}) => {
  const [transactions, setTransactions] = useState<XpTransaction[]>(
    initialTransactions || []
  );
  const [loading, setLoading] = useState<boolean>(!initialTransactions);
  const [error, setError] = useState<string | null>(null);

  // Filters and Sorting
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DEDUCTIONS' | 'REFUNDS'>(
    defaultFilter
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [selectedTx, setSelectedTx] = useState<XpTransaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch transactions if not supplied externally
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await xpService.getMyTransactions();
      if (res.success && Array.isArray(res.transactions)) {
        setTransactions(res.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Failed to load XP transactions:', err);
      setError(
        err?.response?.data?.message ||
          'Unable to load your XP transaction history at this time.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTransactions) {
      setTransactions(initialTransactions);
      setLoading(false);
    } else {
      loadTransactions();
    }
  }, [initialTransactions]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    if (!initialTransactions) {
      loadTransactions();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to determine if a transaction is a refund
  const isRefundTx = (tx: XpTransaction): boolean => {
    const typeStr = (tx.type || '').toUpperCase();
    const desc = (tx.description || '').toLowerCase();
    const reason = (tx.reason || '').toLowerCase();
    return (
      typeStr.includes('REFUND') ||
      desc.includes('refund') ||
      reason.includes('refund') ||
      (tx.action === 'ADDITION' && !typeStr.includes('PURCHASE') && !typeStr.includes('BONUS'))
    );
  };

  // Helper to determine if a transaction is a deduction
  const isDeductionTx = (tx: XpTransaction): boolean => {
    return tx.action === 'DEDUCTION' || (tx.amount < 0 && !isRefundTx(tx));
  };

  // Calculate summary statistics
  const stats = useMemo(() => {
    let totalDeductionsCount = 0;
    let totalDeductionsAmount = 0;
    let totalRefundsCount = 0;
    let totalRefundsAmount = 0;

    transactions.forEach((tx) => {
      const absAmount = Math.abs(tx.amount);
      if (isDeductionTx(tx)) {
        totalDeductionsCount += 1;
        totalDeductionsAmount += absAmount;
      } else if (isRefundTx(tx)) {
        totalRefundsCount += 1;
        totalRefundsAmount += absAmount;
      }
    });

    const netChange = totalRefundsAmount - totalDeductionsAmount;

    return {
      totalDeductionsCount,
      totalDeductionsAmount,
      totalRefundsCount,
      totalRefundsAmount,
      netChange,
      totalCount: transactions.length,
    };
  }, [transactions]);

  // Filtered & Chronologically Sorted transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by type: Deductions vs Refunds vs All
    if (activeFilter === 'DEDUCTIONS') {
      result = result.filter((t) => isDeductionTx(t));
    } else if (activeFilter === 'REFUNDS') {
      result = result.filter((t) => isRefundTx(t));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const config = TRANSACTION_TYPE_CONFIG[t.type];
        const typeName = (config?.label || t.type).toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const reason = (t.reason || '').toLowerCase();
        const refId = (t.referenceId || '').toLowerCase();
        const txId = (t.id || '').toLowerCase();
        return (
          typeName.includes(query) ||
          desc.includes(query) ||
          reason.includes(query) ||
          refId.includes(query) ||
          txId.includes(query)
        );
      });
    }

    // Chronological Sort: Compare timestamps
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [transactions, activeFilter, searchQuery, sortOrder, limit]);

  // Format date nicely
  const formatTimestamp = (
    isoDate: string
  ): { formatted: string; dateOnly: string; timeOnly: string } => {
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) {
        return { formatted: isoDate, dateOnly: isoDate, timeOnly: '' };
      }

      const dateStr = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        formatted: `${dateStr} • ${timeStr}`,
        dateOnly: dateStr,
        timeOnly: timeStr,
      };
    } catch {
      return { formatted: isoDate, dateOnly: isoDate, timeOnly: '' };
    }
  };

  // Helper for relative time (e.g. 5 mins ago)
  const getRelativeTime = (isoDate: string): string => {
    try {
      const ms = new Date(isoDate).getTime();
      const diff = Math.floor((Date.now() - ms) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      return new Date(isoDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      id="xp-transaction-history"
      className={`rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white tracking-tight">
                  {title}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  <Coins className="w-3 h-3" />
                  {transactions.length} Total
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort order toggle */}
            <button
              id="xp-history-sort-toggle"
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'NEWEST' ? 'OLDEST' : 'NEWEST'))
              }
              title={`Chronological Order: ${
                sortOrder === 'NEWEST' ? 'Newest First' : 'Oldest First'
              }`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>{sortOrder === 'NEWEST' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            {/* Refresh button */}
            <button
              id="xp-history-refresh-btn"
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh transaction history"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Banner (Optional) */}
        {showStats && !compact && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                  XP Deductions
                </span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                  -{stats.totalDeductionsAmount} XP
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60">
                {stats.totalDeductionsCount} txns
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                  XP Refunds Issued
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  +{stats.totalRefundsAmount} XP
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
                {stats.totalRefundsCount} txns
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                  Net Session Flow
                </span>
                <span
                  className={`text-base font-black mt-0.5 block ${
                    stats.netChange >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {stats.netChange >= 0 ? `+${stats.netChange}` : stats.netChange} XP
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                Auto-audited
              </span>
            </div>
          </div>
        )}

        {/* Filter Pills and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 overflow-x-auto">
            <button
              id="xp-filter-all"
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Activity ({transactions.length})
            </button>
            <button
              id="xp-filter-deductions"
              type="button"
              onClick={() => setActiveFilter('DEDUCTIONS')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'DEDUCTIONS'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              <ArrowDownRight className="w-3 h-3" />
              <span>Deductions ({stats.totalDeductionsCount})</span>
            </button>
            <button
              id="xp-filter-refunds"
              type="button"
              onClick={() => setActiveFilter('REFUNDS')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === 'REFUNDS'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Refunds ({stats.totalRefundsCount})</span>
            </button>
          </div>

          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              id="xp-history-search"
              type="text"
              placeholder="Search type, reference, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6">
        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold">Failed to load transactions</p>
              <p className="mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-3.5 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="w-24 h-2.5 rounded bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="w-16 h-4 rounded bg-zinc-200 dark:bg-zinc-700 ml-auto" />
                  <div className="w-20 h-2.5 rounded bg-zinc-200 dark:bg-zinc-700 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTransactions.length === 0 && (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
              {searchQuery
                ? 'No matching transactions found'
                : activeFilter === 'REFUNDS'
                ? 'No refunds recorded yet'
                : activeFilter === 'DEDUCTIONS'
                ? 'No deductions recorded yet'
                : 'No XP transactions recorded yet'}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {searchQuery
                ? `No transactions matched "${searchQuery}". Try adjusting your keywords or clearing the filter.`
                : activeFilter === 'REFUNDS'
                ? 'When an interview session is canceled or a technical glitch occurs, refunded XP will appear here automatically.'
                : 'XP deductions occur when scheduling or attending interviews. All changes are logged here in real time.'}
            </p>
            {(searchQuery || activeFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('ALL');
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Chronological List of Transactions */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const isDeduction = isDeductionTx(tx);
              const isRefund = isRefundTx(tx);
              const config =
                TRANSACTION_TYPE_CONFIG[tx.type] || {
                  label: tx.type.replace(/_/g, ' '),
                  badge: tx.action === 'DEDUCTION' ? 'Deduction' : 'Credit',
                  icon: isDeduction ? ArrowDownRight : ArrowUpRight,
                  color: isDeduction
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400',
                };
              const Icon = config.icon;
              const { formatted, dateOnly, timeOnly } = formatTimestamp(tx.createdAt);
              const relativeTime = getRelativeTime(tx.createdAt);
              const absAmount = Math.abs(tx.amount);
              const isStatusRefunded = tx.status === 'REFUNDED';

              return (
                <div
                  key={tx.id}
                  id={`xp-txn-card-${tx.id}`}
                  onClick={() => {
                    setSelectedTx(tx);
                    if (onSelectTransaction) onSelectTransaction(tx);
                  }}
                  className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    selectedTx?.id === tx.id
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 shadow-sm'
                      : 'bg-zinc-50/60 hover:bg-white dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-700/60 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    {/* Left: Icon & Description */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isDeduction
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400'
                            : isRefund
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                            {config.label}
                          </h4>

                          {/* Action Pill */}
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              isDeduction
                                ? 'bg-rose-100/70 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/70'
                                : isRefund
                                ? 'bg-blue-100/70 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/70'
                                : 'bg-emerald-100/70 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/70'
                            }`}
                          >
                            {isDeduction ? 'Deduction' : isRefund ? 'Refund' : 'Credit'}
                          </span>

                          {/* Status Badge */}
                          {isStatusRefunded ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              REFUNDED
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {tx.status || 'COMPLETED'}
                            </span>
                          )}
                        </div>

                        {/* Description / Subtext */}
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate mt-0.5">
                          {tx.description || tx.reason || 'XP transaction processed'}
                        </p>

                        {/* Chronological Timestamp and Reference ID */}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{formatted}</span>
                          </span>
                          {relativeTime && (
                            <span className="text-zinc-400 dark:text-zinc-500">
                              ({relativeTime})
                            </span>
                          )}
                          {tx.referenceId && (
                            <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                              Ref: {tx.referenceId.slice(0, 16)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount and Balance Progression */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm sm:text-base font-black tracking-tight ${
                          isDeduction
                            ? 'text-rose-600 dark:text-rose-400'
                            : isRefund
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isDeduction ? `-${absAmount}` : `+${absAmount}`} XP
                      </div>

                      {typeof tx.balanceBefore === 'number' &&
                        typeof tx.balanceAfter === 'number' && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono block mt-0.5">
                            {tx.balanceBefore} → {tx.balanceAfter} XP
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Transaction Audit Details Modal / Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                    isDeductionTx(selectedTx)
                      ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:border-rose-900/60 dark:text-rose-400'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-900/60 dark:text-emerald-400'
                  }`}
                >
                  {isDeductionTx(selectedTx) ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Transaction Audit Details
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ID: {selectedTx.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Amount Highlight */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                    Transaction Amount
                  </span>
                  <div
                    className={`text-2xl font-black ${
                      isDeductionTx(selectedTx)
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isDeductionTx(selectedTx)
                      ? `-${Math.abs(selectedTx.amount)} XP`
                      : `+${Math.abs(selectedTx.amount)} XP`}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-xs mt-0.5 ${
                      selectedTx.status === 'REFUNDED'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedTx.status || 'COMPLETED'}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 font-semibold block">
                    Transaction Type
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white mt-0.5 block font-mono text-[11px]">
                    {selectedTx.type}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 font-semibold block">
                    Action Type
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white mt-0.5 block font-mono text-[11px]">
                    {selectedTx.action}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 font-semibold block">
                    Timestamp (Chronological)
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-white mt-0.5 block">
                    {formatTimestamp(selectedTx.createdAt).formatted}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 font-semibold block">
                    Balance Progression
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white mt-0.5 block font-mono">
                    {selectedTx.balanceBefore} XP → {selectedTx.balanceAfter} XP
                  </span>
                </div>
              </div>

              {/* Description & Reason */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 space-y-1">
                <span className="text-[10px] text-zinc-400 font-semibold block">
                  Description / Audit Reason
                </span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {selectedTx.description || 'Standard transaction execution.'}
                </p>
                {selectedTx.reason && selectedTx.reason !== selectedTx.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                    Reason: {selectedTx.reason}
                  </p>
                )}
              </div>

              {/* Reference ID & Copy */}
              {selectedTx.referenceId && (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 font-semibold block">
                      Associated Reference ID
                    </span>
                    <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate block">
                      {selectedTx.referenceId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(selectedTx.referenceId!, selectedTx.id)
                    }
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
                    title="Copy reference ID"
                  >
                    {copiedId === selectedTx.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Original Deduction ID (For Refunds) */}
              {selectedTx.originalTransactionId && (
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/50 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
                      Linked Original Deduction Transaction ID
                    </span>
                    <span className="font-mono text-[11px] text-purple-800 dark:text-purple-300 truncate block">
                      {selectedTx.originalTransactionId}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 shrink-0">
                    Rollback Link
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs transition-colors cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XPTransactionHistory;
