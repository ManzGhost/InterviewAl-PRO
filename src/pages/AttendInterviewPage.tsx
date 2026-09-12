import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  BookOpen,
  Sparkles,
  HelpCircle,
  FileCheck,
  Shield,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { ScheduledInterview, InterviewQuestion } from '../types';
import { candidateInterviewService } from '../services/api';
import { useAssessmentSecurity } from '../context/AssessmentSecurityContext';
import { useAuth } from '../context/AuthContext';
import { XPStoreModal } from '../components/gamification/XPStoreModal';

export const AttendInterviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshProfile, updateUser } = useAuth();
  const { startSecureAssessment, completeAssessment, isSecureMode } = useAssessmentSecurity();

  const [interview, setInterview] = useState<ScheduledInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insufficientXp, setInsufficientXp] = useState(false);
  const [showXpModal, setShowXpModal] = useState(false);

  // Active question index
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Countdown timer in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);

  useEffect(() => {
    if (!id) return;
    loadInterview(id);
  }, [id]);

  const loadInterview = async (interviewId: string) => {
    try {
      setLoading(true);
      setError(null);
      setInsufficientXp(false);

      // Start interview and deduct candidate XP atomically
      try {
        const startRes = await candidateInterviewService.startScheduledInterview(interviewId);
        if (typeof (startRes as any)?.currentXp === 'number' && user && updateUser) {
          updateUser({ ...user, xpPoints: (startRes as any).currentXp });
        }
        refreshProfile?.().catch(() => {});
      } catch (startErr: any) {
        if (startErr?.response?.data?.insufficientXp) {
          setInsufficientXp(true);
          setError('Insufficient XP. Please earn more XP to start this assessment.');
          setLoading(false);
          return;
        }
        // If interview was already started or completed, proceed to fetch
      }

      const res = await candidateInterviewService.getScheduledInterviewById(interviewId);
      if (res.success && res.interview) {
        if (res.interview.status === 'TERMINATED') {
          navigate(`/session-terminated?id=${encodeURIComponent(interviewId)}`, { replace: true });
          return;
        }

        setInterview(res.interview);
        const initialAnswers: Record<string, string> = {};
        if (res.interview.questions) {
          res.interview.questions.forEach((q) => {
            if (q.candidateAnswer) {
              initialAnswers[q.id] = q.candidateAnswer;
            }
          });
        }
        setAnswers(initialAnswers);
        // Initialize timer based on duration
        const durationSec = (res.interview.durationMinutes || 45) * 60;
        setSecondsRemaining(durationSec);

        // Start Zero-Tolerance Secure Assessment Mode
        if (res.interview.status === 'IN_PROGRESS' || res.interview.status === 'SCHEDULED') {
          startSecureAssessment({
            assessmentId: res.interview.id,
            assessmentType: 'ASSIGNMENT_INTERVIEW',
            assessmentTitle: res.interview.title,
            durationMinutes: res.interview.durationMinutes || 45,
            initialProgress: { answers: initialAnswers },
            getProgress: () => ({ answers }),
          });
        }
      } else {
        setError('Interview not found or not assigned to your account.');
      }
    } catch (err: any) {
      if (err?.response?.data?.insufficientXp) {
        setInsufficientXp(true);
        setError('Insufficient XP. Please earn more XP to start this assessment.');
      } else {
        setError(err?.response?.data?.message || 'Failed to load interview.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Timer loop
  useEffect(() => {
    if (!interview || interview.status === 'COMPLETED') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [interview]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveCurrentAnswer = async () => {
    if (!interview || !id) return;
    const currentQ = interview.questions[activeQuestionIndex];
    if (!currentQ) return;

    const textToSave = answers[currentQ.id] || '';
    setSavingAnswer(true);
    try {
      await candidateInterviewService.submitAnswer(id, currentQ.id, textToSave);
      setSavedFeedback('Progress saved!');
      setTimeout(() => setSavedFeedback(null), 2000);
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleSubmitInterview = async () => {
    if (!interview || !id) return;
    // Save current question answer before submitting
    const currentQ = interview.questions[activeQuestionIndex];
    if (currentQ && answers[currentQ.id]) {
      await candidateInterviewService.submitAnswer(id, currentQ.id, answers[currentQ.id]).catch(() => {});
    }

    setSubmitting(true);
    try {
      await completeAssessment({ answers });
      const res = await candidateInterviewService.submitInterview(id);
      if (res.success) {
        navigate(`/assigned-interview/result/${id}`);
      } else {
        setError(res.message || 'Submission failed.');
        setShowSubmitModal(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit interview.');
      setShowSubmitModal(false);
    } finally {
      setSubmitting(false);
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
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          {insufficientXp ? 'Insufficient XP' : 'Unable to Load Interview'}
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          {error || 'Interview not found.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {insufficientXp && (
            <button
              type="button"
              onClick={() => setShowXpModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Buy XP (Razorpay)</span>
            </button>
          )}

          <Link
            to="/assigned-interviews"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assigned Interviews</span>
          </Link>
        </div>

        <XPStoreModal
          isOpen={showXpModal}
          onClose={() => {
            setShowXpModal(false);
            if (id) loadInterview(id);
          }}
          currentXp={user?.xpPoints ?? 0}
          currentLevel={user?.level || 'Beginner'}
          onSuccess={(_newXp, _newLevel, updatedUser) => {
            if (updatedUser && updateUser) {
              updateUser(updatedUser);
            }
            refreshProfile?.().catch(() => {});
            if (id) loadInterview(id);
          }}
        />
      </div>
    );
  }

  const currentQuestion = interview.questions[activeQuestionIndex];
  const answeredCount = Object.values(answers).filter((a): a is string => typeof a === 'string' && a.trim().length > 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/assigned-interviews"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
              {interview.title}
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Admin: {interview.adminName} • {interview.questions.length} questions
            </p>
          </div>
        </div>

        {/* Timer & Submit CTA */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-xs font-bold ${
              secondsRemaining < 300
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900 animate-pulse'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            id="btn-open-submit-modal"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Interview</span>
          </button>
        </div>
      </div>

      {/* Admin Notes banner if provided */}
      {interview.adminNotes && (
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Instructions from Administrator: </strong>
            <span>{interview.adminNotes}</span>
          </div>
        </div>
      )}

      {/* Main Question & Answer Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Questions Navigation Rail */}
        <div className="lg:col-span-1 space-y-3">
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <span>Questions</span>
              <span className="text-[11px] text-zinc-400">
                {answeredCount}/{interview.questions.length} answered
              </span>
            </div>

            <div className="grid grid-cols-5 lg:grid-cols-2 gap-2">
              {interview.questions.map((q, idx) => {
                const isActive = idx === activeQuestionIndex;
                const isAnswered = Boolean(answers[q.id]?.trim());

                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <span>Q{idx + 1}</span>
                    {isAnswered && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Question & Answer Workspace */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            {/* Question Header */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900">
                  {currentQuestion.category}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {currentQuestion.difficulty}
                </span>
                <span className="text-xs text-zinc-400">
                  Question {activeQuestionIndex + 1} of {interview.questions.length}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-relaxed">
                {currentQuestion.title}
              </h2>
            </div>

            {/* Answer Input Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Your Answer / Solution:
                </label>
                {savedFeedback && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-fadeIn flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {savedFeedback}
                  </span>
                )}
              </div>

              <textarea
                id="textarea-candidate-answer"
                rows={12}
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
                }}
                placeholder="Write your detailed explanation, structural steps, code snippet, or analysis here..."
                className="w-full p-4 text-xs font-mono rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* Navigation & Save Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCurrentAnswer}
                  disabled={savingAnswer}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingAnswer ? 'Saving...' : 'Save Draft'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => {
                    handleSaveCurrentAnswer();
                    setActiveQuestionIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {activeQuestionIndex < interview.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveCurrentAnswer();
                      setActiveQuestionIndex((prev) => prev + 1);
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <span>Review & Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Submit Interview</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                You have answered <span className="font-bold text-zinc-800 dark:text-zinc-200">{answeredCount}</span> of <span className="font-bold text-zinc-800 dark:text-zinc-200">{interview.questions.length}</span> questions. Once submitted, your answers will be evaluated and forwarded to your administrator.
              </p>
            </div>

            {answeredCount < interview.questions.length && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs">
                ⚠️ You still have {interview.questions.length - answeredCount} unanswered question{interview.questions.length - answeredCount !== 1 ? 's' : ''}. Are you sure you want to proceed?
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Keep Editing
              </button>

              <button
                type="button"
                onClick={handleSubmitInterview}
                disabled={submitting}
                id="btn-confirm-submit-interview"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
