import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Plus,
  Shield,
  Lock,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { mcqService } from '../services/api';
import { McqQuestion } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAssessmentSecurity } from '../context/AssessmentSecurityContext';

export const McqPracticePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { startSecureAssessment, completeAssessment, isSecureMode, activeSession } = useAssessmentSecurity();

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Java');
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false);

  // Sync if active secure session exists on mount
  useEffect(() => {
    if (activeSession && activeSession.assessmentType === 'MCQ_PRACTICE' && activeSession.status === 'IN_PROGRESS') {
      setIsAssessmentStarted(true);
    }
  }, [activeSession]);

  const handleStartAssessment = async () => {
    const assessmentId = `mcq_${selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${user?.id || 'candidate'}`;
    const res = await startSecureAssessment({
      assessmentId,
      assessmentType: 'MCQ_PRACTICE',
      assessmentTitle: `${selectedCategory} MCQ Assessment`,
      durationMinutes: 20,
      initialProgress: { userAnswers },
      getProgress: () => ({ userAnswers }),
    });

    if (res.success) {
      setIsAssessmentStarted(true);
    }
  };

  // Admin Question Authoring state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('Java');
  const [newDifficulty, setNewDifficulty] = useState('Intermediate');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectIdx, setNewCorrectIdx] = useState(0);
  const [newExplanation, setNewExplanation] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    mcqService.getCategories().then((res) => {
      if (res.success && res.categories) {
        setCategories(res.categories);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadQuestions(selectedCategory);
  }, [selectedCategory]);

  const loadQuestions = async (category: string) => {
    setLoading(true);
    setTestResult(null);
    setUserAnswers({});
    try {
      const res = await mcqService.getQuestions(category);
      if (res.success && res.questions) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error('Failed to load MCQ questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (testResult) return; // Prevent changing after submit
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formatted = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: userAnswers[q.id] ?? -1,
      }));

      await completeAssessment({ userAnswers: formatted });
      const res = await mcqService.submitTest(formatted);
      if (res.success) {
        setTestResult(res);
      }
    } catch (err) {
      console.error('MCQ test submission error:', err);
    } finally {
      setSubmitting(false);
      setIsAssessmentStarted(false);
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setTestResult(null);
    setIsAssessmentStarted(false);
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setAddError('Access restricted: Only platform administrators can add MCQ questions.');
      return;
    }
    if (!newQuestionText.trim()) {
      setAddError('Question text is required.');
      return;
    }
    if (newOptions.some((opt) => !opt.trim())) {
      setAddError('Please fill out all 4 option fields.');
      return;
    }
    setSubmittingQuestion(true);
    setAddError('');
    try {
      const res = await mcqService.addQuestion({
        category: newCategory,
        difficulty: newDifficulty,
        question: newQuestionText.trim(),
        options: newOptions.map((o) => o.trim()),
        correctAnswerIndex: newCorrectIdx,
        explanation: newExplanation.trim(),
      });
      if (res.success) {
        setAddSuccess('MCQ question successfully added to the question bank!');
        if (selectedCategory === newCategory) {
          loadQuestions(newCategory);
        }
        setNewQuestionText('');
        setNewOptions(['', '', '', '']);
        setNewExplanation('');
        setTimeout(() => {
          setAddSuccess('');
          setShowAddModal(false);
        }, 1200);
      } else {
        setAddError('Failed to add question.');
      }
    } catch (err: any) {
      setAddError(err?.response?.data?.message || 'Error creating question.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Core Engineering Multiple Choice Practice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            MCQ Technical Quiz
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {isAdmin
              ? 'Administrator Mode: Curate and manage the question bank or simulate candidate test evaluations.'
              : 'Validate your fundamental knowledge in Java, Spring Boot, React, SQL, and DSA with administrator-curated questions.'}
          </p>
        </div>

        {/* Admin Action vs Candidate Mode Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Admin Mode</span>
              </div>

              <button
                type="button"
                id="btn-add-mcq-question"
                onClick={() => {
                  setNewCategory(selectedCategory);
                  setShowAddModal(true);
                  setAddError('');
                  setAddSuccess('');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add MCQ Question</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium shadow-xs">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Candidate Mode • Questions Curated by Admins</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test Score Card (shown after submission) */}
      {testResult && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <span className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400">
                Quiz Evaluation
              </span>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {selectedCategory} Mastery Score
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center p-3 px-5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {testResult.scorePercentage}%
                </span>
                <span className="text-[10px] block font-bold text-zinc-400">Score</span>
              </div>

              <div className="text-center p-3 px-5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  +{testResult.xpAwarded}
                </span>
                <span className="text-[10px] block font-bold text-zinc-400">XP Gained</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Answered correctly: <strong className="text-zinc-800 dark:text-zinc-200">{testResult.correctCount} / {testResult.totalQuestions}</strong>
            </span>

            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* Question List or Start Assessment Gate */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <HelpCircle className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
            No questions available for {selectedCategory}
          </h3>
        </div>
      ) : !isAdmin && !isAssessmentStarted && !testResult ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
              {selectedCategory} Secure MCQ Assessment
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto">
              This assessment mode is governed by a strict <strong>Zero-Tolerance Anti-Cheating System</strong>. Once you click Start Assessment, Secure Mode is activated.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-left space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
            <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Zero-Tolerance Strict Rules</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400 pl-1">
              <li>Assessment must be taken in <strong>Fullscreen Mode</strong>.</li>
              <li>Switching tabs, opening new tabs, or window blur causes <strong>immediate termination</strong>.</li>
              <li>Exiting fullscreen or navigating away will automatically terminate your session.</li>
              <li>There are <strong>no warnings and no second chances</strong>. Terminated sessions cannot be resumed.</li>
            </ul>
          </div>

          <button
            type="button"
            id="start-mcq-assessment-btn"
            onClick={handleStartAssessment}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <Lock className="w-4 h-4" />
            <span>Start Assessment (Secure Mode)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qIndex) => {
            const resultItem = testResult?.results?.find((r: any) => r.questionId === q.id);

            return (
              <div
                key={q.id}
                className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-relaxed">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">{qIndex + 1}.</span>
                    {q.question}
                  </h3>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {q.difficulty}
                  </span>
                </div>

                <div className="space-y-2">
                  {q.options.map((option, optIdx) => {
                    const isSelected = userAnswers[q.id] === optIdx;
                    let optionStyle = 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300';

                    if (testResult && resultItem) {
                      if (optIdx === resultItem.correctAnswerIndex) {
                        optionStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                      } else if (isSelected && !resultItem.isCorrect) {
                        optionStyle = 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 font-bold';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-bold';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{option}</span>
                        {testResult && resultItem && (
                          <>
                            {optIdx === resultItem.correctAnswerIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            {isSelected && !resultItem.isCorrect && (
                              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Answer Explanation */}
                {resultItem && (
                  <div className="mt-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400">
                    <strong className="text-zinc-800 dark:text-zinc-200">Explanation: </strong>
                    {resultItem.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {!testResult && (
            <div className="flex justify-end pt-4">
              <button
                id="submit-mcq-btn"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Grading Answers...' : 'Submit MCQ Test'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admin Add MCQ Question Modal (Only accessible to Admins - Candidates forbidden) */}
      {isAdmin && showAddModal && (
        <div
          id="admin-add-mcq-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Add MCQ Question to Bank
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Administrator privilege active • Adds question permanently to quiz bank
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{addSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    id="mcq-category-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Java">Java</option>
                        <option value="Spring Boot">Spring Boot</option>
                        <option value="React">React</option>
                        <option value="JavaScript">JavaScript</option>
                        <option value="SQL">SQL</option>
                        <option value="DSA">DSA</option>
                        <option value="DBMS">DBMS</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    id="mcq-difficulty-select"
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Question Text *
                </label>
                <textarea
                  id="mcq-question-input"
                  required
                  rows={3}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="e.g. Which Java collection allows null keys and is not synchronized?"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Options & Correct Answer *
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    Select the radio button for the correct option
                  </span>
                </div>
                {newOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      id={`correct-opt-${i}`}
                      checked={newCorrectIdx === i}
                      onChange={() => setNewCorrectIdx(i)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      id={`mcq-opt-${i}`}
                      required
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newOptions];
                        updated[i] = e.target.value;
                        setNewOptions(updated);
                      }}
                      className={`flex-1 px-3 py-2 text-xs rounded-xl border text-zinc-900 dark:text-white ${
                        newCorrectIdx === i
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 ring-1 ring-emerald-400/30'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                      }`}
                    />
                    <span className="text-[11px] font-mono font-bold text-zinc-400 w-5 text-center">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Explanation
                </label>
                <textarea
                  id="mcq-explanation-input"
                  rows={2}
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Explain why this answer is correct and provide learning context..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-new-mcq"
                  disabled={submittingQuestion}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submittingQuestion ? (
                    'Publishing...'
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Publish Question to Bank</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
