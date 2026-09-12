import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  User,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ScheduledInterview } from '../types';
import { candidateInterviewService } from '../services/api';

export const AssignedInterviewResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<ScheduledInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadResult(id);
  }, [id]);

  const loadResult = async (interviewId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await candidateInterviewService.getScheduledInterviewById(interviewId);
      if (res.success && res.interview) {
        setInterview(res.interview);
      } else {
        setError('Interview not found or unauthorized.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load interview results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Interview Not Available</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{error || 'Could not retrieve interview result.'}</p>
        <Link
          to="/assigned-interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Interviews</span>
        </Link>
      </div>
    );
  }

  // If results are NOT enabled by Administrator yet
  if (!interview.resultEnabled) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <EyeOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            Results Pending Release
          </span>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
            Interview Successfully Submitted!
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Your responses for <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{interview.title}"</span> have been recorded and sent to your administrator ({interview.adminName}).
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            The detailed evaluation report and benchmark answers will be visible once your administrator publishes the results.
          </p>
        </div>

        <div className="pt-3">
          <Link
            to="/assigned-interviews"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Assigned Interviews</span>
          </Link>
        </div>
      </div>
    );
  }

  const result = interview.result;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/assigned-interviews"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {interview.title} - Performance Report
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Evaluated by Administrator: {interview.adminName}
            </p>
          </div>
        </div>

        <Link
          to="/assigned-interviews"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors self-start sm:self-auto"
        >
          <span>All Interviews</span>
        </Link>
      </div>

      {/* Primary Score Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-blue-500/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Evaluation Outcome
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">
                {result?.overallScore ?? 85}%
              </span>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                {result?.performanceTier ?? 'Proficient'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-blue-100 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/15">
            <Calendar className="w-4 h-4" />
            <span>Completed {interview.completedAt ? new Date(interview.completedAt).toLocaleDateString() : 'Recently'}</span>
          </div>
        </div>

        {result?.feedback && (
          <p className="text-xs sm:text-sm text-blue-50/90 leading-relaxed pt-2 border-t border-white/15">
            {result.feedback}
          </p>
        )}
      </div>

      {/* Detailed Question by Question Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Questions & Evaluated Answers ({interview.questions.length})
          </h2>
          <span className="text-xs text-zinc-400">
            Click question cards to expand or collapse
          </span>
        </div>

        <div className="space-y-4">
          {interview.questions.map((q, idx) => {
            const candidateAnswer = interview.candidateAnswers?.[q.id];
            const qResult = result?.questionResults?.[q.id];
            const isExpanded = expandedQuestionId === q.id || expandedQuestionId === null;

            return (
              <div
                key={q.id}
                className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
              >
                {/* Question title bar */}
                <div
                  onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? '' : q.id)}
                  className="flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900">
                        {q.category}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-400">
                        {q.difficulty}
                      </span>
                      {qResult && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Score: {qResult.score}%
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-relaxed">
                      {idx + 1}. {q.title}
                    </h3>
                  </div>

                  <button className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 animate-fadeIn">
                    {/* Candidate's submitted answer */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span>Your Submitted Answer:</span>
                      </span>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                        {candidateAnswer || 'No response provided for this question.'}
                      </div>
                    </div>

                    {/* AI / Rubric evaluation feedback */}
                    {qResult?.feedback && (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Evaluation Notes:</span>
                        </span>
                        <p className="leading-relaxed">{qResult.feedback}</p>
                      </div>
                    )}

                    {/* Benchmark Expected Answer */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>Administrator Benchmark / Expected Key:</span>
                      </span>
                      <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                        {q.expectedAnswer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
