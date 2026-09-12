import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode,
  Sparkles,
  Search,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  Bookmark,
  Video,
} from 'lucide-react';
import { aiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CheatSheetPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cheatSheets, setCheatSheets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [loading, setLoading] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    aiService.getCheatSheet(user?.preferredJobRole).then((res) => {
      if (res.success && res.cheatSheet) {
        setCheatSheets(res.cheatSheet);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const topics = ['All', ...new Set(cheatSheets.map((c) => c.topic))];

  const filtered = cheatSheets.filter((c) => {
    const matchesTopic = selectedTopic === 'All' || c.topic === selectedTopic;
    const matchesSearch =
      c.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.quickNotes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.concepts?.some((concept: string) => concept.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTopic && matchesSearch;
  });

  const copySheet = (item: any, idx: number) => {
    const text = `[${item.topic} - Cheat Sheet]\nKey Concepts: ${(item.concepts || []).join(', ')}\n\nNotes:\n${item.quickNotes}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const toggleBookmark = (idx: number) => {
    setBookmarked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Rapid Interview Memory Aid</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          AI Technical Cheat Sheets
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          High-yield architecture definitions, tricky edge questions, and quick revision notes before your interview.
        </p>
      </div>

      {/* Search & Topic Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts or notes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                selectedTopic === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Cheat Sheet Cards */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <FileCode className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">No cheat sheets found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try another search query or topic filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item, idx) => {
            const isBookmarked = !!bookmarked[idx];
            const isCopied = copiedIdx === idx;

            return (
              <div
                key={idx}
                id={`cheatsheet-card-${idx + 1}`}
                className={`p-6 rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                  isBookmarked
                    ? 'bg-blue-50/20 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {item.topic}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copySheet(item, idx)}
                        title="Copy cheat sheet notes"
                        className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(idx)}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark cheat sheet'}
                        className={`p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.concepts?.map((c: string, cIdx: number) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-[11px] font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.quickNotes}
                  </p>
                </div>

                <div className="pt-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">★ High Priority</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/mcq')}
                      className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Practice MCQ →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
