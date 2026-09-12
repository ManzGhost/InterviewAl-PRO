import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  FileText,
  X,
  Search,
  Check,
  Award,
  ArrowRight,
  RotateCcw,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import { ScheduledInterview } from '../../types';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ScheduledInterviewsListProps {
  onOpenScheduleModal: () => void;
  refreshKey?: number;
}

export const ScheduledInterviewsList: React.FC<ScheduledInterviewsListProps> = ({
  onOpenScheduleModal,
  refreshKey,
}) => {
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Results Review Modal
  const [reviewInterview, setReviewInterview] = useState<ScheduledInterview | null>(null);
  const [interviewToDelete, setInterviewToDelete] = useState<ScheduledInterview | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cancellation Modal
  const [interviewToCancel, setInterviewToCancel] = useState<ScheduledInterview | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const { user, updateUser, refreshProfile } = useAuth();

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const res = await adminService.getScheduledInterviews();
      if (res.success && res.interviews) {
        setInterviews(res.interviews);
      }
    } catch (err) {
      console.error('Failed to load scheduled interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [refreshKey]);

  const handleToggleResultVisibility = async (interview: ScheduledInterview) => {
    const nextState = !interview.resultEnabled;
    try {
      const res = await adminService.toggleResultVisibility(interview.id, nextState);
      if (res.success) {
        setInterviews((prev) =>
          prev.map((item) => (item.id === interview.id ? { ...item, resultEnabled: nextState } : item))
        );
        setActionFeedback(
          nextState
            ? `Candidate can now view results for "${interview.title}".`
            : `Results hidden for "${interview.title}".`
        );
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err: any) {
      console.error('Toggle result visibility failed:', err);
    }
  };

  const confirmCancelInterview = async () => {
    if (!interviewToCancel) return;
    setCancelling(true);
    try {
      const res = await adminService.cancelScheduledInterview(
        interviewToCancel.id,
        cancelReason.trim() || 'Administrator cancelled interview before candidate started'
      );
      if (res.success) {
        setInterviews((prev) =>
          prev.map((item) => (item.id === interviewToCancel.id ? res.interview : item))
        );
        if (typeof res.currentXp === 'number' && user && updateUser) {
          updateUser({ ...user, xpPoints: res.currentXp });
        }
        if (refreshProfile) refreshProfile();

        setInterviewToCancel(null);
        setCancelReason('');
        setActionFeedback(res.message);
        setTimeout(() => setActionFeedback(null), 5000);
      }
    } catch (err: any) {
      console.error('Cancel interview error:', err);
      setActionFeedback(err.response?.data?.message || 'Failed to cancel scheduled interview.');
      setTimeout(() => setActionFeedback(null), 5000);
    } finally {
      setCancelling(false);
    }
  };

  const confirmDeleteInterview = async () => {
    if (!interviewToDelete) return;
    setDeleting(true);
    try {
      const res = await adminService.deleteScheduledInterview(interviewToDelete.id);
      if (res.success) {
        setInterviews((prev) => prev.filter((i) => i.id !== interviewToDelete.id));
        if (typeof res.currentXp === 'number' && user && updateUser) {
          updateUser({ ...user, xpPoints: res.currentXp });
        }
        if (refreshProfile) refreshProfile();

        setInterviewToDelete(null);
        setActionFeedback(res.message || 'Scheduled interview deleted.');
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setActionFeedback(err.response?.data?.message || 'Failed to delete interview.');
      setTimeout(() => setActionFeedback(null), 4000);
    } finally {
      setDeleting(false);
    }
  };

  const filteredInterviews = interviews.filter((i) => {
    const matchSearch =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Action feedback */}
      {actionFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Scheduled Interviews & Evaluations</h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Monitor upcoming candidate sessions, track completion, and inspect submitted answers and AI scores.
          </p>
        </div>

        <button
          id="btn-schedule-new-interview"
          onClick={onOpenScheduleModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule New Interview</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, email, or interview title..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-900 dark:text-white placeholder-zinc-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled (Refunded)</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {/* Interview List Cards */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <Calendar className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No scheduled interviews found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No interviews match your filter.'
              : 'Schedule your first interview by picking a candidate and selecting questions from your Question Bank.'}
          </p>
          <button
            onClick={onOpenScheduleModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule First Interview</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInterviews.map((item) => {
            const isCompleted = item.status === 'COMPLETED';
            const isInProgress = item.status === 'IN_PROGRESS';
            const isCancelled = item.status === 'CANCELLED';
            const isScheduled = item.status === 'SCHEDULED';
            const isTerminated = (item.status as string) === 'TERMINATED';

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {item.title}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900'
                            : isInProgress
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900'
                            : isCancelled
                            ? 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                            : isTerminated
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900'
                        }`}
                      >
                        {item.status}
                      </span>
                      {isCancelled && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          <span>100% XP Refunded</span>
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400">ID: {item.id}</span>
                    </div>

                    {/* Candidate & Schedule Meta */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{item.candidateName}</span>
                        <span className="text-zinc-400 font-normal">({item.candidateEmail})</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.scheduledDate} at {item.scheduledTime}</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.durationMinutes} min</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <FileText className="w-3.5 h-3.5 text-purple-500" />
                        <span>{item.questions.length} questions</span>
                      </div>
                    </div>

                    {item.adminNotes && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Admin Instructions: </span>
                        {item.adminNotes}
                      </p>
                    )}

                    {item.cancelledAt && (
                      <div className="text-[11px] bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-2.5 rounded-xl border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            <strong>Cancelled & Refunded (+10 XP): </strong>
                            {item.cancelReason || 'Cancelled before candidate started'}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 shrink-0 font-mono">
                          {new Date(item.cancelledAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                    {/* Result visibility toggle */}
                    <button
                      onClick={() => handleToggleResultVisibility(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        item.resultEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                      }`}
                      title={item.resultEnabled ? 'Click to hide results from candidate' : 'Click to enable candidate viewing results'}
                    >
                      {item.resultEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{item.resultEnabled ? 'Results Public' : 'Results Hidden'}</span>
                    </button>

                    {/* View answers and score */}
                    <button
                      onClick={() => setReviewInterview(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isCompleted ? 'Review Answers & Score' : 'View Questions'}</span>
                    </button>

                    {/* Cancel Interview with 100% Refund (Allowed only if SCHEDULED) */}
                    {isScheduled && (
                      <button
                        onClick={() => setInterviewToCancel(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Cancel interview before candidate starts (100% XP Refund)"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cancel (+10 XP)</span>
                      </button>
                    )}

                    {isInProgress && (
                      <span
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 text-xs font-medium cursor-not-allowed"
                        title="Cannot cancel: candidate has already started this interview"
                      >
                        Active
                      </span>
                    )}

                    {/* Delete interview */}
                    <button
                      onClick={() => setInterviewToDelete(item)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-zinc-200 dark:border-zinc-800 transition-colors"
                      title="Delete scheduled interview"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Completed quick score summary badge */}
                {isCompleted && item.result && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        Overall Performance Score:
                      </span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        {item.result.overallScore}%
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                        {item.result.performanceTier}
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-400">
                      Completed {item.completedAt ? new Date(item.completedAt).toLocaleString() : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Answers & Results Modal */}
      {reviewInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {reviewInterview.title} - Candidate Evaluation
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Candidate: {reviewInterview.candidateName} ({reviewInterview.candidateEmail})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewInterview(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Overall stats card if completed */}
              {reviewInterview.result ? (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                        Interview Evaluation Summary
                      </span>
                      <div className="text-2xl font-black text-purple-950 dark:text-white mt-0.5">
                        {reviewInterview.result.overallScore}% Score
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-xs">
                        {reviewInterview.result.performanceTier}
                      </span>
                    </div>
                  </div>

                  {reviewInterview.result.feedback && (
                    <p className="text-xs text-purple-900/90 dark:text-purple-200/90 leading-relaxed font-sans bg-white/70 dark:bg-zinc-900/70 p-3 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                      {reviewInterview.result.feedback}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Interview status: <strong>{reviewInterview.status}</strong>. Candidate has not yet submitted their answers.</span>
                </div>
              )}

              {/* Questions and Candidate Answers */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Questions & Submitted Responses ({reviewInterview.questions.length})
                </h4>

                {reviewInterview.questions.map((q, idx) => {
                  const candidateAnswer = reviewInterview.candidateAnswers?.[q.id];
                  const qResult = reviewInterview.result?.questionResults?.[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          Q{idx + 1}. {q.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                            {q.category}
                          </span>
                          {qResult && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {qResult.score}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Candidate Submitted Answer */}
                      <div>
                        <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span>Candidate's Response:</span>
                        </div>
                        {candidateAnswer ? (
                          <div className="text-xs font-mono p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                            {candidateAnswer}
                          </div>
                        ) : (
                          <div className="text-xs italic text-zinc-400 p-2">
                            No answer submitted yet for this question.
                          </div>
                        )}
                      </div>

                      {/* Administrator Expected Answer */}
                      <div>
                        <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Administrator Benchmark Key:</span>
                        </div>
                        <div className="text-xs p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                          {q.expectedAnswer}
                        </div>
                      </div>

                      {/* Evaluation feedback */}
                      {qResult && qResult.feedback && (
                        <div className="text-xs p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200">
                          <span className="font-semibold">AI Evaluation Note: </span>
                          {qResult.feedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleToggleResultVisibility(reviewInterview)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  reviewInterview.resultEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                }`}
              >
                {reviewInterview.resultEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{reviewInterview.resultEnabled ? 'Results are Visible to Candidate' : 'Results are Hidden from Candidate'}</span>
              </button>

              <button
                onClick={() => setReviewInterview(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {interviewToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Cancel Scheduled Interview</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Cancel <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{interviewToCancel.title}"</span> for {interviewToCancel.candidateName}.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                <Coins className="w-4 h-4 text-blue-600" />
                <span>100% XP Refund Guaranteed</span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                Because the candidate has not started this interview, <strong>10 XP</strong> will be refunded immediately back to your balance upon cancellation.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Candidate requested reschedule, Position filled"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setInterviewToCancel(null);
                  setCancelReason('');
                }}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Keep Scheduled
              </button>
              <button
                type="button"
                onClick={confirmCancelInterview}
                disabled={cancelling}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {cancelling ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Confirm Cancellation & Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {interviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Scheduled Interview</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Are you sure you want to delete <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{interviewToDelete.title}"</span> for {interviewToDelete.candidateName}?
              </p>
            </div>

            {interviewToDelete.status === 'SCHEDULED' && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-700 dark:text-blue-300">
                <strong>Refund note:</strong> Since this interview has not started, deleting it will automatically credit a 100% XP refund (+10 XP) back to your balance.
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setInterviewToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInterview}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
