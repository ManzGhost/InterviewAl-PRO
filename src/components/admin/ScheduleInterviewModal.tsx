import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle2,
  X,
  AlertCircle,
  Search,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import { InterviewQuestion, ScheduledInterview, User as UserType } from '../../types';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: UserType[];
  questions: InterviewQuestion[];
  initialCandidateId?: string;
  onInterviewScheduled: (interview: ScheduledInterview) => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  candidates,
  questions,
  initialCandidateId,
  onInterviewScheduled,
}) => {
  const [title, setTitle] = useState('Technical Screening Interview');
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    initialCandidateId || candidates[0]?.id || ''
  );

  useEffect(() => {
    if (initialCandidateId) {
      setSelectedCandidateId(initialCandidateId);
    } else if (candidates.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(candidates[0].id);
    }
  }, [initialCandidateId, candidates]);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [resultEnabled, setResultEnabled] = useState(true);
  const [adminNotes, setAdminNotes] = useState('Please answer all technical questions thoroughly. Code snippets and diagrams are encouraged.');

  const { user, refreshProfile, updateUser } = useAuth();
  const SCHEDULE_XP_COST = 10;
  const adminXp = user?.xpPoints ?? 0;
  const hasEnoughXp = adminXp >= SCHEDULE_XP_COST;

  const requestIdRef = useRef<string>(`sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  useEffect(() => {
    if (isOpen) {
      requestIdRef.current = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
  }, [isOpen]);

  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (candidates.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(candidates[0].id);
    }
  }, [candidates, selectedCandidateId]);

  useEffect(() => {
    // Select first 3 questions by default if none selected
    if (questions.length > 0 && selectedQuestionIds.length === 0) {
      setSelectedQuestionIds(questions.slice(0, 3).map((q) => q.id));
    }
  }, [questions, selectedQuestionIds]);

  if (!isOpen) return null;

  const toggleQuestionSelection = (qid: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qid) ? prev.filter((id) => id !== qid) : [...prev, qid]
    );
  };

  const categories = Array.from(new Set(questions.map((q) => q.category)));

  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.title.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.category.toLowerCase().includes(questionSearch.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || q.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Rule 1: Check whether the Administrator has enough XP before scheduling
    if (!hasEnoughXp) {
      setError('Insufficient XP to schedule this interview.');
      return;
    }

    if (!title.trim()) {
      setError('Interview title is required.');
      return;
    }
    if (!selectedCandidateId) {
      setError('Please select a candidate.');
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      setError('Date and time are required.');
      return;
    }
    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one question from the Question Bank.');
      return;
    }

    setSubmitting(true);
    try {
      const isSelectAll = selectedCandidateId === 'ALL';
      const res = await adminService.createScheduledInterview({
        title,
        candidateId: selectedCandidateId,
        candidateIds: isSelectAll ? candidates.map((c) => c.id) : undefined,
        scheduledDate,
        scheduledTime,
        durationMinutes,
        questionIds: selectedQuestionIds,
        resultEnabled,
        adminNotes,
        clientRequestId: requestIdRef.current,
      });

      const scheduledItem = res.interview || (res.interviews && res.interviews[0]);
      if (res.success && scheduledItem) {
        // Update user XP locally if provided
        if (typeof res.currentXp === 'number' && user && updateUser) {
          updateUser({ ...user, xpPoints: res.currentXp });
        }
        refreshProfile?.().catch(() => {});
        onInterviewScheduled(scheduledItem);
        onClose();
      } else {
        setError(res.message || 'Failed to schedule interview.');
      }
    } catch (err: any) {
      if (err?.response?.data?.insufficientXp) {
        setError('Insufficient XP to schedule this interview.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Error scheduling interview.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Create & Schedule Interview
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Assign structured questions from your Question Bank to a candidate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Candidate Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Interview Title *
              </label>
              <input
                type="text"
                id="input-schedule-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Java Backend Full Stack Round 1"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Select Candidate *
                </label>
                {candidates.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCandidateId(selectedCandidateId === 'ALL' ? candidates[0]?.id || '' : 'ALL')
                    }
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {selectedCandidateId === 'ALL' ? 'Select Individual' : `Select All (${candidates.length})`}
                  </button>
                )}
              </div>
              <select
                id="select-schedule-candidate"
                required
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {candidates.length === 0 ? (
                  <option value="">No candidates assigned</option>
                ) : (
                  <>
                    <option value="ALL">
                      👥 Select All Candidates ({candidates.length} candidates)
                    </option>
                    <optgroup label="Individual Candidates">
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email}) {c.preferredJobRole ? `- ${c.preferredJobRole}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
              {selectedCandidateId === 'ALL' && candidates.length > 0 && (
                <p className="mt-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>This interview will be scheduled and assigned to all {candidates.length} candidates at once.</span>
                </p>
              )}
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Scheduled Date *
              </label>
              <input
                type="date"
                id="input-schedule-date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Scheduled Time *
              </label>
              <input
                type="time"
                id="input-schedule-time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Duration (Minutes) *
              </label>
              <select
                id="select-schedule-duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
              </select>
            </div>
          </div>

          {/* Result Visibility & Notes */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  {resultEnabled ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
                  Allow Candidate to View Results
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {resultEnabled
                    ? 'Candidate can view their scores, evaluation feedback, and benchmark answers once submitted.'
                    : 'Results will be hidden from the candidate until you publish/enable them manually.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-schedule-result-visibility"
                  checked={resultEnabled}
                  onChange={(e) => setResultEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Administrator Notes / Instructions for Candidate
              </label>
              <textarea
                id="input-schedule-notes"
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Optional instructions for the candidate..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Question Bank Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-zinc-900 dark:text-white">
                  Select Questions from Question Bank *
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {selectedQuestionIds.length} question{selectedQuestionIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuestionIds(questions.map((q) => q.id))}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedQuestionIds([])}
                  className="text-[11px] text-zinc-500 hover:underline font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Filter available questions..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                />
              </div>

              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Questions Picker list */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50/50 dark:bg-zinc-900/50">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 dark:text-zinc-400">
                  No questions match your filter.
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestionSelection(q.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/70 shadow-xs'
                          : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                            {q.category}
                          </span>
                          <span className="text-[10px] text-zinc-400">{q.difficulty}</span>
                        </div>
                        <p className="font-semibold text-zinc-900 dark:text-white leading-snug">{q.title}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          Key: {q.expectedAnswer}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* XP Calculation & Balance Preview */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              hasEnoughXp
                ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-900/60'
                : 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
            }`}
          >
            <div className="space-y-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Administrator XP:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{adminXp} XP</span>
                </div>
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                  <span>Schedule Interview Cost:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">10 XP</span>
                </div>
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                After Scheduling: <span className="font-semibold text-zinc-900 dark:text-zinc-200">{adminXp} XP - 10 XP = {Math.max(0, adminXp - 10)} XP</span>
              </div>
            </div>

            {!hasEnoughXp ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Insufficient XP to schedule this interview.</span>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                Deducted securely only after creation.
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {!hasEnoughXp && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Insufficient XP to schedule this interview.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-confirm-schedule-interview"
                disabled={submitting || candidates.length === 0 || !hasEnoughXp}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={!hasEnoughXp ? 'Insufficient XP to schedule this interview.' : 'Schedule interview and deduct 10 XP'}
              >
                {submitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Schedule Interview</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
