import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Trophy,
  Calendar,
  Building2,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';
import { interviewService } from '../services/api';
import { InterviewSession } from '../types';

export const InterviewHistoryPage: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<InterviewSession | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchHistory = () => {
    interviewService.getHistory().then((res) => {
      if (res.success && res.interviews) {
        setInterviews(res.interviews);
      } else {
        setInterviews([]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();

    const handleSync = () => {
      fetchHistory();
    };
    window.addEventListener('interview-history-updated', handleSync);
    return () => window.removeEventListener('interview-history-updated', handleSync);
  }, []);

  const handleDeleteInterview = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await interviewService.deleteInterview(id);
      if (res.success) {
        setInterviews((prev) => prev.filter((i) => i.id !== id));
        setActionNotice('Interview session removed successfully.');
        window.dispatchEvent(new CustomEvent('interview-history-updated'));
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch (err) {
      console.error('Failed to remove interview session:', err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await interviewService.clearAllHistory();
      if (res.success) {
        setInterviews([]);
        setConfirmClearAll(false);
        setActionNotice('All interview history records have been cleared.');
        window.dispatchEvent(new CustomEvent('interview-history-updated'));
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch (err) {
      console.error('Failed to clear interview history:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Interview History
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Review past mock interview questions, your answers, and AI critiques.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {interviews.length > 0 && (
            confirmClearAll ? (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-2">Clear all records?</span>
                <button
                  id="btn-confirm-clear-all-history"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="btn-clear-all-history"
                onClick={() => setConfirmClearAll(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-900/60 bg-white dark:bg-zinc-900 text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 font-bold text-xs shadow-sm transition-all cursor-pointer"
                title="Remove all interview history sessions"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )
          )}

          <Link
            to="/interview/setup"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20"
          >
            <span>Start New Interview</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <History className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">No interviews found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            You haven't conducted any mock interview sessions yet.
          </p>
          <Link
            to="/interview/setup"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            Start your first session
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-blue-500/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {item.interviewType}
                    </span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                      {item.jobRole}
                    </h3>
                  </div>

                  {item.overallScore ? (
                    <div className="text-right">
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                        {item.overallScore}
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-semibold">/ 100</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200">
                      IN PROGRESS
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  {item.companyName && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {item.companyName}
                    </span>
                  )}
                  <span>•</span>
                  <span>{item.difficulty}</span>
                  <span>•</span>
                  <span>{item.totalQuestions} Questions</span>
                  <span>•</span>
                  <span>{new Date(item.startedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  to={`/interview/result/${item.id}`}
                  className="flex-1 py-2 text-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition-colors"
                >
                  View Full Report
                </Link>
                <button
                  onClick={() => setSelectedInterview(item)}
                  className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Inspect Q&A"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {confirmDeleteId === item.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-confirm-delete-${item.id}`}
                      onClick={() => handleDeleteInterview(item.id)}
                      disabled={deletingId === item.id}
                      className="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    id={`btn-remove-interview-${item.id}`}
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove interview from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Q&A Modal Inspector */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                  Q&A Breakdown: {selectedInterview.jobRole}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedInterview.interviewType} • {selectedInterview.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {selectedInterview.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2"
                >
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-blue-600 dark:text-blue-400">Question {idx + 1} ({q.category})</span>
                    {q.aiEvaluation && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Score: {q.aiEvaluation.overallScore}/10
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white leading-relaxed">
                    {q.question}
                  </p>

                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-zinc-500">Your Answer: </span>
                    <span className="text-zinc-700 dark:text-zinc-300 italic">
                      {q.userAnswer || 'No answer submitted.'}
                    </span>
                  </div>

                  {q.aiEvaluation?.betterAnswerExample && (
                    <div className="mt-2 p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-xs text-zinc-700 dark:text-zinc-300">
                      <strong className="text-blue-600 dark:text-blue-400">AI Model Answer: </strong>
                      {q.aiEvaluation.betterAnswerExample}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
