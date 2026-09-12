import React, { useState, useEffect } from 'react';
import {
  Code2,
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  HardDrive,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  X,
  RefreshCw,
  Trash2,
  FileCode,
  Tag,
  Shield,
  Lock,
  FileText,
  Eye,
  BookOpen,
} from 'lucide-react';
import { aiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAssessmentSecurity } from '../context/AssessmentSecurityContext';
import {
  Problem,
  initialProblems,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getStarterCode,
  getSolutionCode,
} from '../data/codingProblems';

export type { Problem };

export const CodingInterviewPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { startSecureAssessment, completeAssessment, isSecureMode, activeSession } = useAssessmentSecurity();

  const [allProblems, setAllProblems] = useState<Problem[]>(() => {
    try {
      const saved = localStorage.getItem('custom_coding_problems');
      if (saved) {
        const custom: Problem[] = JSON.parse(saved);
        return [...initialProblems, ...custom];
      }
    } catch {
      // ignore error
    }
    return initialProblems;
  });

  const [selectedProblem, setSelectedProblem] = useState<Problem>(initialProblems[0]);
  const [language, setLanguage] = useState<SupportedLanguage>('Python');
  const [code, setCode] = useState(() => getStarterCode(initialProblems[0], 'Python'));
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false);

  // Solution and Hints Tab states
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'hints' | 'solution'>('description');
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [solutionLanguage, setSolutionLanguage] = useState<SupportedLanguage>('Python');
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [copiedAiSolution, setCopiedAiSolution] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Sync if active secure session exists on mount
  useEffect(() => {
    if (activeSession && activeSession.assessmentType === 'CODING_INTERVIEW' && activeSession.status === 'IN_PROGRESS') {
      setIsAssessmentStarted(true);
    }
  }, [activeSession]);

  const handleStartAssessment = async () => {
    const assessmentId = `code_${selectedProblem.id}_${user?.id || 'candidate'}`;
    const res = await startSecureAssessment({
      assessmentId,
      assessmentType: 'CODING_INTERVIEW',
      assessmentTitle: `${selectedProblem.title} Coding Assessment`,
      durationMinutes: 45,
      initialProgress: { code, language, problemId: selectedProblem.id },
      getProgress: () => ({ code, language, problemId: selectedProblem.id, reviewResult }),
    });

    if (res.success) {
      setIsAssessmentStarted(true);
    }
  };

  const handleFinishAssessment = async () => {
    await completeAssessment({ code, language, problemId: selectedProblem.id, reviewResult });
    setIsAssessmentStarted(false);
  };

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('Dynamic Programming');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // New Question Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Arrays & Hash Table');
  const [newDifficulty, setNewDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newDesc, setNewDesc] = useState('');
  const [newConstraints, setNewConstraints] = useState('');
  const [newExampleInput, setNewExampleInput] = useState('');
  const [newExampleOutput, setNewExampleOutput] = useState('');
  const [newExampleExp, setNewExampleExp] = useState('');
  const [newPythonCode, setNewPythonCode] = useState('');
  const [newJavaCode, setNewJavaCode] = useState('');
  const [newJsCode, setNewJsCode] = useState('');
  const [newCppCode, setNewCppCode] = useState('');
  const [newTsCode, setNewTsCode] = useState('');
  const [newGoCode, setNewGoCode] = useState('');
  const [newSolutionPython, setNewSolutionPython] = useState('');
  const [newSolutionJava, setNewSolutionJava] = useState('');
  const [newSolutionJs, setNewSolutionJs] = useState('');
  const [newSolutionCpp, setNewSolutionCpp] = useState('');
  const [newSolutionTs, setNewSolutionTs] = useState('');
  const [newSolutionGo, setNewSolutionGo] = useState('');
  const [newSolutionApproach, setNewSolutionApproach] = useState('');
  const [newTimeComplexity, setNewTimeComplexity] = useState('O(n)');
  const [newSpaceComplexity, setNewSpaceComplexity] = useState('O(1)');
  const [newHints, setNewHints] = useState('');
  const [formError, setFormError] = useState('');
  const [customCodeTab, setCustomCodeTab] = useState<SupportedLanguage>('Python');

  const handleSelectProblem = (p: Problem) => {
    setSelectedProblem(p);
    setCode(getStarterCode(p, language));
    setReviewResult(null);
    setRevealedHints(0);
    setActiveLeftTab('description');
    setNotificationMsg(null);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setSolutionLanguage(lang);
    setCode(getStarterCode(selectedProblem, lang));
  };

  const handleCopySolution = () => {
    const sol = getSolutionCode(selectedProblem, solutionLanguage);
    navigator.clipboard.writeText(sol);
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2000);
  };

  const handleCopyAiSolution = (optCode: string) => {
    navigator.clipboard.writeText(optCode);
    setCopiedAiSolution(true);
    setTimeout(() => setCopiedAiSolution(false), 2000);
  };

  const handleLoadOfficialSolution = () => {
    const sol = getSolutionCode(selectedProblem, language);
    setCode(sol);
    setNotificationMsg(`Official ${language} reference solution loaded into editor.`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleResetSkeleton = () => {
    setCode(getStarterCode(selectedProblem, language));
    setNotificationMsg(`Code editor reset to starter ${language} skeleton.`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleApplyAiSolution = (optCode: string) => {
    setCode(optCode);
    setNotificationMsg('AI optimized solution applied to code editor.');
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleReviewCode = async () => {
    if (!code.trim()) return;
    setReviewing(true);
    try {
      const res = await aiService.reviewCode({
        problemTitle: selectedProblem.title,
        problemDescription: selectedProblem.description,
        language,
        code,
      });
      if (res.success && res.review) {
        setReviewResult(res.review);
      }
    } catch (err) {
      console.error('Code review error:', err);
    } finally {
      setReviewing(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sample template loader for custom question modal
  const handleLoadSampleQuestion = () => {
    setNewTitle('Search in Rotated Sorted Array');
    setNewCategory('Binary Search');
    setNewDifficulty('Medium');
    setNewDesc(
      'Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.'
    );
    setNewConstraints('1 <= nums.length <= 5000\n-10^4 <= nums[i] <= 10^4\nAll values of nums are unique');
    setNewExampleInput('nums = [4,5,6,7,0,1,2], target = 0');
    setNewExampleOutput('4');
    setNewExampleExp('Target 0 is found at index 4 in the rotated array.');
    setNewPythonCode(`class Solution:
    def search(self, nums: list[int], target: int) -> int:
        # TODO: Implement O(log n) search in rotated sorted array
        return -1`);
    setNewJavaCode(`class Solution {
    public int search(int[] nums, int target) {
        // TODO: Implement O(log n) search in rotated sorted array
        return -1;
    }
}`);
    setNewJsCode(`function search(nums, target) {
  // TODO: Implement O(log n) search in rotated sorted array
  return -1;
}`);
    setNewSolutionPython(`class Solution:
    def search(self, nums: list[int], target: int) -> int:
        low, high = 0, len(nums) - 1
        while low <= high:
            mid = (low + high) // 2
            if nums[mid] == target:
                return mid
            if nums[low] <= nums[mid]:
                if nums[low] <= target < nums[mid]:
                    high = mid - 1
                else:
                    low = mid + 1
            else:
                if nums[mid] < target <= nums[high]:
                    low = mid + 1
                else:
                    high = mid - 1
        return -1`);
    setNewSolutionJava(`class Solution {
    public int search(int[] nums, int target) {
        int low = 0, high = nums.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) return mid;
            if (nums[low] <= nums[mid]) {
                if (target >= nums[low] && target < nums[mid]) high = mid - 1;
                else low = mid + 1;
            } else {
                if (target > nums[mid] && target <= nums[high]) low = mid + 1;
                else high = mid - 1;
            }
        }
        return -1;
    }
}`);
    setNewSolutionJs(`function search(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    if (nums[low] <= nums[mid]) {
      if (target >= nums[low] && target < nums[mid]) high = mid - 1;
      else low = mid + 1;
    } else {
      if (target > nums[mid] && target <= nums[high]) low = mid + 1;
      else high = mid - 1;
    }
  }
  return -1;
}`);
    setNewSolutionApproach(
      'Binary Search on rotated sorted array: Identify which half is uniformly sorted at each midpoint, and check if the target lies within that sorted range to narrow the search space logarithmically.'
    );
    setNewTimeComplexity('O(log n)');
    setNewSpaceComplexity('O(1)');
    setNewHints(
      'Check which side of the midpoint is monotonically increasing.\nIf nums[low] <= nums[mid], the left subarray is sorted; otherwise the right is sorted.\nCheck if target falls inside the sorted subarray boundaries.'
    );
    setFormError('');
  };

  // Add custom question handler (Admin Only)
  const handleCreateCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Access restricted: Only platform administrators can add coding questions.');
      return;
    }
    if (!newTitle.trim() || !newDesc.trim()) {
      setFormError('Please provide at least a problem title and description.');
      return;
    }

    const created: Problem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      difficulty: newDifficulty,
      description: newDesc.trim(),
      constraints: newConstraints
        ? newConstraints.split('\n').map((c) => c.trim()).filter(Boolean)
        : ['Standard runtime memory limits apply.'],
      examples: [
        {
          input: newExampleInput || 'Sample input',
          output: newExampleOutput || 'Sample output',
          explanation: newExampleExp || undefined,
        },
      ],
      starterCodePython:
        newPythonCode.trim() ||
        `class Solution:\n    def solve(self):\n        # Write your solution here\n        return 0`,
      starterCodeJava:
        newJavaCode.trim() ||
        `class Solution {\n    public int solve() {\n        // Write your solution here\n        return 0;\n    }\n}`,
      starterCodeJs:
        newJsCode.trim() ||
        `function solve() {\n  // Write your solution here\n  return 0;\n}`,
      starterCodeCpp:
        newCppCode.trim() ||
        `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve() {\n        return 0;\n    }\n};`,
      starterCodeTs:
        newTsCode.trim() ||
        `function solve(): number {\n  // Write your solution here\n  return 0;\n}`,
      starterCodeGo:
        newGoCode.trim() ||
        `package main\n\nfunc solve() int {\n    return 0;\n}`,
      solutionPython: newSolutionPython.trim() || newPythonCode.trim(),
      solutionJava: newSolutionJava.trim() || newJavaCode.trim(),
      solutionJs: newSolutionJs.trim() || newJsCode.trim(),
      solutionCpp: newSolutionCpp.trim() || newCppCode.trim(),
      solutionTs: newSolutionTs.trim() || newTsCode.trim(),
      solutionGo: newSolutionGo.trim() || newGoCode.trim(),
      solutionApproach: newSolutionApproach.trim() || 'Optimal algorithm addressing core constraints.',
      timeComplexity: newTimeComplexity.trim() || 'O(n)',
      spaceComplexity: newSpaceComplexity.trim() || 'O(1)',
      hints: newHints
        ? newHints.split('\n').map((h) => h.trim()).filter(Boolean)
        : ['Consider boundary conditions and edge cases.'],
      isCustom: true,
    };

    const updated = [...allProblems, created];
    setAllProblems(updated);

    // Save only custom problems to localStorage
    const customOnly = updated.filter((p) => p.isCustom);
    try {
      localStorage.setItem('custom_coding_problems', JSON.stringify(customOnly));
    } catch {
      // ignore error
    }

    // Select this problem immediately
    setSelectedProblem(created);
    setCode(getStarterCode(created, language));
    setReviewResult(null);

    // Reset and close modal
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewConstraints('');
    setNewExampleInput('');
    setNewExampleOutput('');
    setNewExampleExp('');
    setNewPythonCode('');
    setNewJavaCode('');
    setNewJsCode('');
    setNewCppCode('');
    setNewTsCode('');
    setNewGoCode('');
    setNewSolutionPython('');
    setNewSolutionJava('');
    setNewSolutionJs('');
    setNewSolutionCpp('');
    setNewSolutionTs('');
    setNewSolutionGo('');
    setNewSolutionApproach('');
    setNewTimeComplexity('O(n)');
    setNewSpaceComplexity('O(1)');
    setNewHints('');
    setFormError('');
  };

  // AI Generate Problem handler (Admin Only)
  const handleGenerateAiProblem = async () => {
    if (!isAdmin) return;
    setAiGenerating(true);
    try {
      const res = await aiService.generateCodingProblem({
        topic: aiTopic,
        difficulty: aiDifficulty,
      });

      if (res.success && res.problem) {
        const generated: Problem = {
          ...res.problem,
          isCustom: true,
          category: res.problem.category || aiTopic,
        };

        const updated = [...allProblems, generated];
        setAllProblems(updated);

        const customOnly = updated.filter((p) => p.isCustom);
        try {
          localStorage.setItem('custom_coding_problems', JSON.stringify(customOnly));
        } catch {
          // ignore error
        }

        setSelectedProblem(generated);
        setCode(getStarterCode(generated, language));
        setReviewResult(null);
        setShowAiModal(false);
      }
    } catch (err) {
      console.error('Failed to generate coding problem:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Delete custom problem (Admin Only)
  const handleDeleteCustomProblem = (pId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const updated = allProblems.filter((p) => p.id !== pId);
    setAllProblems(updated);

    const customOnly = updated.filter((p) => p.isCustom);
    try {
      localStorage.setItem('custom_coding_problems', JSON.stringify(customOnly));
    } catch {
      // ignore
    }

    if (selectedProblem.id === pId) {
      const fallback = updated[0] || initialProblems[0];
      setSelectedProblem(fallback);
      setCode(getStarterCode(fallback, language));
    }
  };

  // Filter problems
  const filteredProblems = allProblems.filter((p) => {
    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiff && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Interactive Algorithmic Sandbox</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Coding Interview Sandbox & IDE
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {isAdmin
              ? 'Admin Authoring Console: Create custom coding questions, synthesize AI challenges, or test solutions.'
              : 'Candidate Sandbox: Solve DSA challenges curated by administrators with instant Big-O analysis and Gemini AI reviews.'}
          </p>
        </div>

        {/* Action Buttons: Add Custom Question & AI Generate (ONLY ADMIN) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Admin Mode</span>
              </div>

              <button
                type="button"
                id="btn-add-coding-question"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Coding Question</span>
              </button>

              <button
                type="button"
                id="btn-ai-generate-question"
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Generate</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium shadow-xs">
              <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Candidate Mode • Curated Questions Bank</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Problem Selection Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Level:</span>
            </span>
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  difficultyFilter === diff
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problems or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Problem selector horizontal chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {filteredProblems.map((p) => {
            const isSelected = selectedProblem.id === p.id;
            return (
              <div
                key={p.id}
                id={`problem-pill-${p.id}`}
                onClick={() => handleSelectProblem(p)}
                className={`group shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                }`}
              >
                <span>{p.title}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : p.difficulty === 'Easy'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : p.difficulty === 'Medium'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {p.difficulty}
                </span>

                {isAdmin && p.isCustom && (
                  <button
                    type="button"
                    title="Delete custom question (Admin only)"
                    onClick={(e) => handleDeleteCustomProblem(p.id, e)}
                    className="p-0.5 rounded text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Sandbox Layout: Spec on Left, Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Problem Spec with Tabs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">
                  {selectedProblem.category || 'Algorithms'}
                </span>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {selectedProblem.title}
                </h2>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  selectedProblem.difficulty === 'Easy'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800'
                    : selectedProblem.difficulty === 'Medium'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:border-amber-800'
                    : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800'
                }`}
              >
                {selectedProblem.difficulty}
              </span>
            </div>

            {/* Spec Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => setActiveLeftTab('description')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeLeftTab === 'description'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Description</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLeftTab('hints')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeLeftTab === 'hints'
                    ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Hints</span>
                {selectedProblem.hints && selectedProblem.hints.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-mono">
                    {selectedProblem.hints.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                id="tab-solution-btn"
                onClick={() => setActiveLeftTab('solution')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeLeftTab === 'solution'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Solution</span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold">
                  Optimal
                </span>
              </button>
            </div>

            {/* Tab Content: 1. Description */}
            {activeLeftTab === 'description' && (
              <div className="space-y-4 animate-in fade-in">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {selectedProblem.description}
                </p>

                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-2">Examples & Test Cases:</h4>
                  <div className="space-y-2">
                    {selectedProblem.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1 border border-zinc-200/50 dark:border-zinc-700/50"
                      >
                        <div>
                          <strong className="text-blue-600 dark:text-blue-400">Input: </strong>
                          {ex.input}
                        </div>
                        <div>
                          <strong className="text-emerald-600 dark:text-emerald-400">Output: </strong>
                          {ex.output}
                        </div>
                        {ex.explanation && (
                          <p className="text-zinc-400 text-[10px] font-sans mt-1">{ex.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1.5">Constraints:</h4>
                  <ul className="list-disc list-inside text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5 font-mono">
                    {selectedProblem.constraints.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab Content: 2. Hints */}
            {activeLeftTab === 'hints' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Progressive Hints</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {revealedHints} of {selectedProblem.hints?.length || 0} revealed
                  </span>
                </div>

                {selectedProblem.hints && selectedProblem.hints.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProblem.hints.slice(0, revealedHints).map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-1 animate-in fade-in"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-[11px]">
                          <span className="w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-900 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>Hint {idx + 1}</span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pl-5">
                          {hint}
                        </p>
                      </div>
                    ))}

                    {revealedHints < selectedProblem.hints.length ? (
                      <button
                        type="button"
                        onClick={() => setRevealedHints((prev) => prev + 1)}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Reveal Hint {revealedHints + 1}</span>
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-center space-y-1">
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          All hints have been revealed.
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Ready to view the complete solution and complexity analysis?
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveLeftTab('solution')}
                          className="mt-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          View Official Solution →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-center text-xs text-zinc-500">
                    No sequential hints specified for this problem. Review constraints or open the Official Solution tab.
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: 3. Official Editorial & Solution */}
            {activeLeftTab === 'solution' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Complexities and Approach */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        Official Editorial & Complexity
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Time: {selectedProblem.timeComplexity || 'O(n)'}</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        <HardDrive className="w-3 h-3 text-emerald-600" />
                        <span>Space: {selectedProblem.spaceComplexity || 'O(1)'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {selectedProblem.solutionApproach ||
                      'Optimal algorithmic solution utilizing standard data structures and edge case handling.'}
                  </p>
                </div>

                {/* Solution Code Section */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Solution Language Toggle */}
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-x-auto max-w-full">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setSolutionLanguage(lang.id)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            solutionLanguage === lang.id
                              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopySolution}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                        title="Copy solution code"
                      >
                        {copiedSolution ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        id="load-solution-into-editor-btn"
                        onClick={handleLoadOfficialSolution}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        title="Load this solution directly into the code editor"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Load into Editor</span>
                      </button>
                    </div>
                  </div>

                  {/* Code display block */}
                  <pre className="p-3.5 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 border border-zinc-800">
                    <code>
                      {getSolutionCode(selectedProblem, solutionLanguage)}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Code Editor & Review */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Solution Editor ({language})
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Solution Shortcut button */}
                <button
                  type="button"
                  id="editor-view-solution-btn"
                  onClick={() => setActiveLeftTab('solution')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLeftTab === 'solution'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                  title="View official editorial solution"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Official Solution</span>
                </button>

                {/* Load Solution into editor */}
                <button
                  type="button"
                  id="editor-load-solution-btn"
                  onClick={handleLoadOfficialSolution}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                  title="Replace editor code with official solution"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Load Solution</span>
                </button>

                {/* Reset to skeleton */}
                <button
                  type="button"
                  id="editor-reset-skeleton-btn"
                  onClick={handleResetSkeleton}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-bold transition-colors cursor-pointer"
                  title="Reset code editor to starter skeleton"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                {/* Language selection */}
                <select
                  id="coding-language-select"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label} ({lang.version})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={copyCode}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Notification message bar if any */}
            {notificationMsg && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-semibold animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{notificationMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationMsg(null)}
                  className="p-0.5 text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Code Input Area */}
            <div className="p-4 bg-zinc-950 text-zinc-100 font-mono text-xs">
              <textarea
                rows={16}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 leading-relaxed font-mono resize-y"
              />
            </div>

            {/* Submit / Secure Assessment Action */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/50">
              <span className="text-[11px] text-zinc-400">
                Safe Gemini AI evaluation • assesses logic, Big-O complexity, and missed boundaries
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {/* AI Review Code button is ALWAYS available for interactive practice */}
                <button
                  id="review-code-btn"
                  type="button"
                  onClick={handleReviewCode}
                  disabled={reviewing || !code.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {reviewing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reviewing...</span>
                    </div>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>AI Review Code</span>
                    </>
                  )}
                </button>

                {/* Secure Assessment Actions */}
                {!isAdmin && !isAssessmentStarted && (
                  <button
                    id="start-coding-assessment-btn"
                    type="button"
                    onClick={handleStartAssessment}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Start Assessment (Secure Mode)</span>
                  </button>
                )}

                {!isAdmin && isAssessmentStarted && (
                  <button
                    id="finish-coding-assessment-btn"
                    type="button"
                    onClick={handleFinishAssessment}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submit Solution</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Review Results Card */}
          {reviewResult && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 shadow-lg space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {reviewResult.isCorrect || reviewResult.logicStatus?.toLowerCase().includes('correct') || reviewResult.logicStatus?.toLowerCase().includes('optimal') ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {reviewResult.logicStatus || (reviewResult.isCorrect ? 'Solution Correct & Accepted' : 'Refinement Recommended')}
                  </h3>
                </div>

                <div className="flex gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{reviewResult.timeComplexity || 'O(N)'}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{reviewResult.spaceComplexity || 'O(1)'}</span>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {reviewResult.suggestions?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Algorithmic Suggestions:</h4>
                  <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {reviewResult.suggestions.map((sug: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Edge cases */}
              {(reviewResult.handledEdgeCases || reviewResult.edgeCasesConsidered)?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Handled Edge Cases:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(reviewResult.handledEdgeCases || reviewResult.edgeCasesConsidered).map((ec: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-300"
                      >
                        ✓ {ec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missed edge cases */}
              {reviewResult.missedEdgeCases?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Potential Blind Spots:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewResult.missedEdgeCases.map((ec: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] font-mono text-amber-700 dark:text-amber-300"
                      >
                        ⚠ {ec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Refactored / Optimized Code block if returned */}
              {reviewResult.optimizedCode && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Optimized Solution</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyAiSolution(reviewResult.optimizedCode)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {copiedAiSolution ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyAiSolution(reviewResult.optimizedCode)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Apply to Editor
                      </button>
                    </div>
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 border border-zinc-800">
                    <code>{reviewResult.optimizedCode}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Custom Question (Admin Only) */}
      {isAdmin && showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Add New Coding Question
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Create a custom DSA problem to practice and evaluate in the sandbox.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleQuestion}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 cursor-pointer"
                >
                  Load Sample
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-600 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Find Peak Element"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Difficulty
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Category / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Binary Search, Dynamic Programming, Arrays"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Problem Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the task, inputs, outputs, and any algorithmic rules..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Example Input
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. nums = [1,2,3,1]"
                    value={newExampleInput}
                    onChange={(e) => setNewExampleInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Example Output
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2"
                    value={newExampleOutput}
                    onChange={(e) => setNewExampleOutput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Constraints (one per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="1 <= nums.length <= 10^5&#10;All elements are integers"
                  value={newConstraints}
                  onChange={(e) => setNewConstraints(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>

              {/* Multi-language Starter Code & Solution Tabs */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Starter Code & Reference Solutions
                  </span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 overflow-x-auto max-w-full">
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setCustomCodeTab(l.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          customCodeTab === l.id
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {customCodeTab === 'Python' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                        Python 3 Starter Skeleton
                      </label>
                      <textarea
                        rows={3}
                        placeholder="class Solution:\n    def solve(self):\n        return 0"
                        value={newPythonCode}
                        onChange={(e) => setNewPythonCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        Python 3 Reference Solution (Optional)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Full working Python 3 reference solution..."
                        value={newSolutionPython}
                        onChange={(e) => setNewSolutionPython(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {customCodeTab === 'Java' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                        Java 21 Starter Skeleton
                      </label>
                      <textarea
                        rows={3}
                        placeholder="class Solution {\n    public int solve() {\n        return 0;\n    }\n}"
                        value={newJavaCode}
                        onChange={(e) => setNewJavaCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        Java 21 Reference Solution (Optional)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Full working Java reference solution..."
                        value={newSolutionJava}
                        onChange={(e) => setNewSolutionJava(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {customCodeTab === 'JavaScript' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                        JavaScript Starter Skeleton
                      </label>
                      <textarea
                        rows={3}
                        placeholder="function solve() {\n    return 0;\n}"
                        value={newJsCode}
                        onChange={(e) => setNewJsCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        JavaScript Reference Solution (Optional)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Full working JavaScript reference solution..."
                        value={newSolutionJs}
                        onChange={(e) => setNewSolutionJs(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {customCodeTab === 'C++' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                        C++ 20 Starter Skeleton
                      </label>
                      <textarea
                        rows={3}
                        placeholder="#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve() {\n        return 0;\n    }\n};"
                        value={newCppCode}
                        onChange={(e) => setNewCppCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        C++ 20 Reference Solution (Optional)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Full working C++ reference solution..."
                        value={newSolutionCpp}
                        onChange={(e) => setNewSolutionCpp(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {customCodeTab === 'TypeScript' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                        TypeScript Starter Skeleton
                      </label>
                      <textarea
                        rows={3}
                        placeholder="function solve(): number {\n    return 0;\n}"
                        value={newTsCode}
                        onChange={(e) => setNewTsCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        TypeScript Reference Solution (Optional)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Full working TypeScript reference solution..."
                        value={newSolutionTs}
                        onChange={(e) => setNewSolutionTs(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {customCodeTab === 'Go' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                        Go Starter Skeleton
                      </label>
                      <textarea
                        rows={3}
                        placeholder="package main\n\nfunc solve() int {\n    return 0;\n}"
                        value={newGoCode}
                        onChange={(e) => setNewGoCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        Go Reference Solution (Optional)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Full working Go reference solution..."
                        value={newSolutionGo}
                        onChange={(e) => setNewSolutionGo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Solution Approach & Editorial Explanation
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain optimal algorithm, why it works, and key insight..."
                  value={newSolutionApproach}
                  onChange={(e) => setNewSolutionApproach(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Time Complexity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. O(n) or O(log n)"
                    value={newTimeComplexity}
                    onChange={(e) => setNewTimeComplexity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Space Complexity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. O(1) or O(n)"
                    value={newSpaceComplexity}
                    onChange={(e) => setNewSpaceComplexity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">
                  Progressive Hints (one per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="First clue for candidate...&#10;Second clue if still stuck..."
                  value={newHints}
                  onChange={(e) => setNewHints(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-custom-problem"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Add Question to Sandbox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Generate Problem (Admin Only) */}
      {isAdmin && showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    AI Generate Coding Problem
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Gemini will synthesize a real interview challenge.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Algorithmic Topic
                </label>
                <select
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white"
                >
                  <option value="Dynamic Programming">Dynamic Programming (Memoization / Tabulation)</option>
                  <option value="Trees & Graphs">Trees, DFS & BFS Graph Traversal</option>
                  <option value="Sliding Window & Two Pointers">Sliding Window & Two Pointers</option>
                  <option value="Binary Search & Divide and Conquer">Binary Search & Divide and Conquer</option>
                  <option value="System Design & Caching">LRU / LFU System Design & Caching</option>
                  <option value="Backtracking & Recursion">Backtracking & Recursion</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Target Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAiDifficulty(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        aiDifficulty === d
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                id="generate-coding-question-btn"
                onClick={handleGenerateAiProblem}
                disabled={aiGenerating}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
              >
                {aiGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Problem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

