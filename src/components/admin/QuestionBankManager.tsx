import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  BookOpen,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InterviewQuestion } from '../../types';
import { adminService } from '../../services/api';

interface QuestionBankManagerProps {
  onQuestionListChanged?: () => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({ onQuestionListChanged }) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Question to delete
  const [questionToDelete, setQuestionToDelete] = useState<InterviewQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Java');
  const [formDifficulty, setFormDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [formExpectedAnswer, setFormExpectedAnswer] = useState('');

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await adminService.getInterviewQuestions();
      if (res.success && res.questions) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormTitle('');
    setFormCategory('Java');
    setFormDifficulty('Intermediate');
    setFormExpectedAnswer('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (q: InterviewQuestion) => {
    setEditingQuestion(q);
    setFormTitle(q.title);
    setFormCategory(q.category);
    setFormDifficulty(q.difficulty);
    setFormExpectedAnswer(q.expectedAnswer);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Question title is required.');
      return;
    }
    if (!formExpectedAnswer.trim()) {
      setFormError('Expected answer / evaluation criteria is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingQuestion) {
        const res = await adminService.updateInterviewQuestion(editingQuestion.id, {
          title: formTitle,
          category: formCategory,
          difficulty: formDifficulty,
          expectedAnswer: formExpectedAnswer,
        });
        if (res.success) {
          setActionFeedback('Question updated successfully!');
        }
      } else {
        const res = await adminService.createInterviewQuestion({
          title: formTitle,
          category: formCategory,
          difficulty: formDifficulty,
          expectedAnswer: formExpectedAnswer,
        });
        if (res.success) {
          setActionFeedback('New question added to Question Bank!');
        }
      }

      setIsModalOpen(false);
      await loadQuestions();
      if (onQuestionListChanged) onQuestionListChanged();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save question.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    setDeleting(true);
    try {
      const res = await adminService.deleteInterviewQuestion(questionToDelete.id);
      if (res.success) {
        setActionFeedback('Question deleted from Question Bank.');
        setQuestionToDelete(null);
        await loadQuestions();
        if (onQuestionListChanged) onQuestionListChanged();
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err: any) {
      console.error('Delete question error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Categories list
  const categories = Array.from(new Set(['Java', 'Spring Boot', 'React', 'SQL', 'System Design', 'Behavioral', ...questions.map((q) => q.category)]));

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.expectedAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'ALL' || q.category === categoryFilter;
    const matchDifficulty = difficultyFilter === 'ALL' || q.difficulty === difficultyFilter;
    return matchSearch && matchCategory && matchDifficulty;
  });

  return (
    <div className="space-y-6">
      {/* Action banner & feedback */}
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
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Question Bank Management</h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Create, categorize, and maintain structured technical and behavioral interview questions with expected answers.
          </p>
        </div>

        <button
          id="btn-add-interview-question"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            id="search-question-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by title, category, or expected concepts..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 dark:text-white placeholder-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="filter-category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            id="filter-difficulty-select"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <HelpCircle className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No questions found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'ALL' || difficultyFilter !== 'ALL'
              ? 'Try adjusting your search query or filters to find questions.'
              : 'Your question bank is empty. Click "Add New Question" above to start building questions.'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Question</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 px-1 font-medium">
            Showing {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} in Question Bank
          </div>

          <div className="grid gap-3">
            {filteredQuestions.map((q, idx) => {
              const isExpanded = expandedId === q.id;
              const difficultyBadgeClass =
                q.difficulty === 'Beginner'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                  : q.difficulty === 'Advanced'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800';

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900">
                          {q.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${difficultyBadgeClass}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-[11px] text-zinc-400">ID: {q.id}</span>
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-relaxed">
                        {idx + 1}. {q.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-zinc-200 dark:border-zinc-800 transition-colors"
                        title="Edit question details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQuestionToDelete(q)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-zinc-200 dark:border-zinc-800 transition-colors"
                        title="Delete question from bank"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
                        title={isExpanded ? 'Hide expected answer' : 'View expected answer'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Expected Answer section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Expected Answer & Architectural Key Points:</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 font-sans whitespace-pre-line">
                        {q.expectedAnswer}
                      </p>
                      {q.createdAt && (
                        <div className="text-[10px] text-zinc-400 pt-1">
                          Created {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Question */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {editingQuestion ? 'Edit Interview Question' : 'Add Question to Bank'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Question Title / Statement *
                </label>
                <input
                  type="text"
                  id="input-question-title"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., HashMap internal working and collision resolution in Java 8"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    id="input-question-category"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g., Java, Spring Boot, React, SQL..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Difficulty Level *
                  </label>
                  <select
                    id="select-question-difficulty"
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Expected Answer / Benchmark Evaluation Key *
                </label>
                <textarea
                  id="textarea-expected-answer"
                  required
                  rows={5}
                  value={formExpectedAnswer}
                  onChange={(e) => setFormExpectedAnswer(e.target.value)}
                  placeholder="Detail the expected concepts, core keywords, architectural trade-offs, and optimal explanation the candidate should provide..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-question"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{editingQuestion ? 'Update Question' : 'Save to Bank'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Question</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Are you sure you want to delete <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{questionToDelete.title}"</span>? This will remove it from the Question Bank.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setQuestionToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuestion}
                disabled={deleting}
                id="btn-confirm-delete-question"
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
