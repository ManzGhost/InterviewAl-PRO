import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Video,
  FileText,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ScheduledInterview } from '../types';
import { candidateInterviewService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AssignedInterviewsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMyInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await candidateInterviewService.getMyScheduledInterviews();
      if (res.success && res.interviews) {
        setInterviews(res.interviews);
      }
    } catch (err: any) {
      console.error('Error loading assigned interviews:', err);
      setError(err?.response?.data?.message || 'Failed to load assigned interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyInterviews();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
            <Video className="w-3.5 h-3.5 text-blue-500" />
            <span>{isAdmin ? 'Administrator Evaluation Overview' : 'Assigned Candidate Evaluations'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {isAdmin ? 'Scheduled Candidate Interviews' : 'My Scheduled Interviews'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {isAdmin
              ? 'Preview, test, and supervise scheduled candidate interviews across your organization.'
              : 'View interviews curated and scheduled specifically for you by your assigned administrator.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Admin Console</span>
            </Link>
          )}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors self-start md:self-auto"
          >
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadMyInterviews}
            className="px-3 py-1 rounded-lg bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold hover:bg-rose-300/60 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center p-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {isAdmin ? 'No Candidate Interviews Scheduled Yet' : 'No Assigned Interviews Yet'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {isAdmin
              ? 'You have not scheduled any structured candidate evaluations yet. You can configure technical topics, question sets, and assign them directly to candidates in the Admin Console.'
              : 'Your assigned administrator has not scheduled any structured interviews for you yet. Once an interview is scheduled, it will appear here with the designated date, time, and questions.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md shadow-purple-600/20"
              >
                <span>Open Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20"
              >
                <span>Practice with AI Mock Interview</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {interviews.map((item) => {
            const isCompleted = item.status === 'COMPLETED';
            const isInProgress = item.status === 'IN_PROGRESS';
            const isScheduled = item.status === 'SCHEDULED';

            return (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left meta */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900'
                            : isInProgress
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Administrator: {item.adminName}</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Scheduled: {item.scheduledDate} at {item.scheduledTime}</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.durationMinutes} Minutes</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span>{item.questions.length} Questions</span>
                      </div>
                    </div>

                    {item.adminNotes && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Notes from Administrator: </span>
                        {item.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Right Action Button */}
                  <div className="shrink-0 flex items-center gap-3">
                    {isScheduled || isInProgress ? (
                      <button
                        onClick={() => navigate(`/attend-interview/${item.id}`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                        <span>{isInProgress ? 'Resume Interview' : 'Attend Interview'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : isCompleted ? (
                      item.resultEnabled ? (
                        <button
                          onClick={() => navigate(`/assigned-interview/result/${item.id}`)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Results & Feedback</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs">
                          <EyeOff className="w-4 h-4 text-amber-500" />
                          <span>Results pending administrator release</span>
                        </div>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Question badges overview */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-400">Questions:</span>
                  {item.questions.map((q, idx) => (
                    <span
                      key={q.id}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                    >
                      {idx + 1}. {q.category} ({q.difficulty})
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
