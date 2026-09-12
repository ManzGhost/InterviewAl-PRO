import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  Video,
  Copy,
  Check,
  Trophy,
  Lightbulb,
  FileCode,
  RotateCcw,
} from 'lucide-react';
import { aiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Default practice questions tailored by day/topic
const defaultStudyQuestions: Record<string, Array<{ q: string; a: string; tags: string[] }>> = {
  'Day 1': [
    {
      q: 'How does Spring Security validate a JWT in a stateless architecture?',
      a: 'A custom OncePerRequestFilter intercepts the incoming HTTP Authorization header, extracts the Bearer token, validates its digital signature via SecretKey/PublicKey, extracts user claims, and sets an authenticated UsernamePasswordAuthenticationToken into SecurityContextHolder.',
      tags: ['Security', 'JWT', 'Architecture'],
    },
    {
      q: 'What is the difference between @Component, @Service, and @Repository in Spring?',
      a: '@Component is the generic stereotype for managed beans. @Service marks business logic components, while @Repository provides database exception translation (translating SQLException into Spring DataAccessException hierarchy).',
      tags: ['Spring Core', 'Dependency Injection'],
    },
  ],
  'Day 2': [
    {
      q: 'Why does B-Tree indexing outperform linear scans for range queries?',
      a: 'B-Trees maintain a balanced tree of node blocks with sorted keys and bi-directional leaf node linked lists, enabling O(log N) search traversal and fast sequentially linked disk block scans without table rewriting.',
      tags: ['Database', 'Indexing', 'Performance'],
    },
    {
      q: 'When should you choose an optimistic lock over a pessimistic lock in SQL?',
      a: 'Optimistic locking (using a @Version column) is best suited for high-read, low-contention scenarios to avoid database row locking overhead. Pessimistic locking (SELECT FOR UPDATE) is preferred when transaction conflicts are frequent and rollbacks are expensive.',
      tags: ['Concurrency', 'SQL', 'Transactions'],
    },
  ],
  'Day 3': [
    {
      q: 'How does the Circuit Breaker pattern prevent cascading failures across microservices?',
      a: 'A circuit breaker (like Resilience4j) tracks error rates across a sliding window. When failures exceed a threshold (e.g., 50%), the state trips to OPEN, instantly failing or returning fallback responses without overloading the downstream service.',
      tags: ['Microservices', 'Resilience', 'Distributed Systems'],
    },
    {
      q: 'What are the trade-offs between Kafka and RabbitMQ for asynchronous messaging?',
      a: 'RabbitMQ is an AMQP-based smart broker with complex routing (topic/fanout exchanges) best for transient point-to-point tasks. Kafka is an append-only distributed commit log optimized for high-throughput stream processing, partitioning, and message replayability.',
      tags: ['Kafka', 'Message Queues', 'Event-Driven'],
    },
  ],
  'Day 4': [
    {
      q: 'When does React useMemo actually yield performance gains versus overhead?',
      a: 'useMemo is beneficial when memoizing computationally expensive calculations (like sorting large datasets) or when passing referentially stable objects/arrays to memoized child components (React.memo). Wrapping trivial calculations adds unnecessary garbage collection overhead.',
      tags: ['React', 'Performance', 'Hooks'],
    },
    {
      q: 'Explain the difference between useEffect and useLayoutEffect.',
      a: 'useEffect runs asynchronously after the DOM paint, making it ideal for data fetching and subscriptions. useLayoutEffect fires synchronously after DOM mutations but before the screen is painted, preventing visual flickering during layout measurements.',
      tags: ['React', 'Lifecycle', 'Virtual DOM'],
    },
  ],
  'Day 5': [
    {
      q: 'How would you design a distributed rate limiter that handles 100,000 requests/sec?',
      a: 'Use Redis with the Sliding Window Counter or Token Bucket algorithm using Lua scripts for atomic increments. Distribute requests via consistent hashing and cache counters locally for sub-millisecond lookups.',
      tags: ['System Design', 'Redis', 'High Availability'],
    },
    {
      q: 'How do you handle data consistency in a microservices checkout flow?',
      a: 'Implement the Saga Pattern (orchestrated or choreographed) with compensating transactions to undo preceding steps if payment or inventory reservation fails, ensuring eventual consistency without distributed 2PC locks.',
      tags: ['Saga Pattern', 'Distributed Transactions'],
    },
  ],
};

export const RoadmapPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(user?.preferredJobRole || 'Java Full Stack Developer');
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [expandedDay, setExpandedDay] = useState<string | null>('Day 1');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [copiedDay, setCopiedDay] = useState<string | null>(null);

  const roles = [
    'Java Full Stack Developer',
    'Frontend React Developer',
    'Backend Software Engineer',
    'DevOps & Cloud Engineer',
    'Data Engineer',
  ];

  // Load completed days from localStorage on mount & role change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`roadmap_completed_${role}`);
      if (saved) {
        setCompletedDays(JSON.parse(saved));
      } else {
        setCompletedDays({});
      }
    } catch {
      setCompletedDays({});
    }
  }, [role]);

  useEffect(() => {
    loadRoadmap(role);
  }, []);

  const loadRoadmap = async (targetRole: string) => {
    setLoading(true);
    try {
      const res = await aiService.getRoadmap(targetRole);
      if (res.success && res.roadmap && res.roadmap.length > 0) {
        setRoadmap(res.roadmap);
      } else {
        // High-yield fallback structure
        setRoadmap([
          {
            day: 'Day 1',
            topic: 'Core Architectural Fundamentals & Authentication Flow',
            details: 'Deep dive into stateless authentication, filter chains, and security boundaries. Review common trap questions around session hijacking and token validation.',
            estimatedHours: 3,
            keyConcepts: ['JWT Signature Verification', 'OncePerRequestFilter', 'CORS/CSRF Policies', 'Dependency Injection'],
          },
          {
            day: 'Day 2',
            topic: 'Data Persistence, Indexing & Concurrency Controls',
            details: 'Master query profiling, B-Tree index structures, composite keys, and locking strategies (Optimistic vs. Pessimistic). Review ACID guarantees and isolation levels.',
            estimatedHours: 3.5,
            keyConcepts: ['B-Tree Indexing', 'Deadlock Resolution', 'Optimistic Locking (@Version)', 'Connection Pooling (HikariCP)'],
          },
          {
            day: 'Day 3',
            topic: 'Microservices Communication, Circuit Breakers & Resilience',
            details: 'Explore inter-service communication paradigms, Resilience4j circuit breakers, asynchronous event-driven streaming with Kafka, and distributed tracing.',
            estimatedHours: 4,
            keyConcepts: ['Circuit Breakers', 'Kafka vs RabbitMQ', 'Idempotency Keys', 'Saga Pattern'],
          },
          {
            day: 'Day 4',
            topic: 'Frontend Performance, React Internals & State Architecture',
            details: 'Analyze the browser render cycle, React reconciliation, memoization strategies, custom hook extraction, and state machine design.',
            estimatedHours: 3,
            keyConcepts: ['useMemo & useCallback', 'useLayoutEffect', 'Render Virtualization', 'Web Vitals (LCP, CLS)'],
          },
          {
            day: 'Day 5',
            topic: 'High-Level System Design & Full Mock Interview Simulation',
            details: 'Synthesize end-to-end system designs: distributed caching, rate limiters, and high-throughput notification brokers. Complete a timed mock interview.',
            estimatedHours: 4.5,
            keyConcepts: ['Distributed Rate Limiter', 'Consistent Hashing', 'CDN & Edge Caching', 'STAR Behavioral Strategy'],
          },
        ]);
      }
    } catch (err) {
      console.error('Roadmap error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    loadRoadmap(newRole);
  };

  const toggleDayComplete = (day: string) => {
    setCompletedDays((prev) => {
      const updated = { ...prev, [day]: !prev[day] };
      try {
        localStorage.setItem(`roadmap_completed_${role}`, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save roadmap progress:', err);
      }
      return updated;
    });
  };

  const toggleExpand = (day: string) => {
    setExpandedDay((prev) => (prev === day ? null : day));
  };

  const toggleAnswer = (key: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyDayNotes = (step: any) => {
    const text = `[Interview Prep Roadmap - ${step.day}]\nTopic: ${step.topic}\nTarget Hours: ${step.estimatedHours || 3} hrs\nSummary: ${step.details}\nConcepts: ${(step.keyConcepts || []).join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedDay(step.day);
    setTimeout(() => setCopiedDay(null), 2000);
  };

  const totalSteps = roadmap.length || 5;
  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Interactive Career Curriculum</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          5-Day Personalized Preparation Roadmap
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          A targeted study schedule with interactive daily tasks, high-frequency interview questions, and direct practice drills.
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r}
            id={`roadmap-role-${r.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            onClick={() => handleRoleChange(r)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              role === r
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Interactive Progress Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              Roadmap Progress: {completedCount} of {totalSteps} Days Completed ({progressPercent}%)
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {completedCount === totalSteps
              ? '🎉 All 5 days completed! You are ready for live technical rounds.'
              : 'Mark each day complete as you finish concept revision and practice questions.'}
          </p>
        </div>

        <div className="w-full sm:w-48 flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 w-9 text-right">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Roadmap List */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-zinc-500">Synthesizing 5-day curriculum with Gemini...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {roadmap.map((step, idx) => {
            const isCompleted = !!completedDays[step.day];
            const isExpanded = expandedDay === step.day;
            const studyQuestions =
              defaultStudyQuestions[step.day] || [
                {
                  q: `What is a common pitfall when designing ${step.topic}?`,
                  a: 'Failing to isolate concerns, neglecting edge cases in asynchronous state changes, and overlooking memory leakage or database lock contention.',
                  tags: ['Architecture', 'Best Practices'],
                },
              ];

            return (
              <div
                key={step.day || idx}
                id={`roadmap-day-card-${idx + 1}`}
                className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 relative overflow-hidden ${
                  isCompleted
                    ? 'bg-emerald-50/25 dark:bg-emerald-950/15 border-emerald-300/60 dark:border-emerald-800/60 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-400/80 dark:hover:border-blue-500/50 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Day Number Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {step.day}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{step.estimatedHours || 3} Hours</span>
                        </span>

                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Completed ✓
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-base font-bold mt-0.5 ${
                          isCompleted
                            ? 'text-zinc-800 dark:text-zinc-200 line-through decoration-emerald-500/60'
                            : 'text-zinc-900 dark:text-white'
                        }`}
                      >
                        {step.topic}
                      </h3>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleDayComplete(step.day)}
                      title={isCompleted ? 'Mark as Incomplete' : 'Mark Day Completed'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Mark Complete</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyDayNotes(step)}
                      title="Copy day notes"
                      className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                    >
                      {copiedDay === step.day ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(step.day)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Plan' : 'Explore Plan'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Concept Summary */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3 pl-0 sm:pl-12">
                  {step.details}
                </p>

                {/* Key Concepts Chips */}
                {step.keyConcepts && (
                  <div className="pl-0 sm:pl-12 flex flex-wrap gap-1.5 pt-2.5">
                    {step.keyConcepts.map((kc: string, kIdx: number) => (
                      <span
                        key={kIdx}
                        className="px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 font-mono font-medium border border-zinc-200/60 dark:border-zinc-700/60"
                      >
                        {kc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded Interactive Deep Dive */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 pl-0 sm:pl-12 space-y-4 animate-in fade-in duration-200">
                    {/* Practice Questions Header */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mb-2.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Curated Interview Questions for {step.day}:</span>
                      </h4>

                      <div className="space-y-2.5">
                        {studyQuestions.map((sq, qIdx) => {
                          const qKey = `${step.day}_${qIdx}`;
                          const isRevealed = !!revealedAnswers[qKey];

                          return (
                            <div
                              key={qIdx}
                              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  Q{qIdx + 1}: {sq.q}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => toggleAnswer(qKey)}
                                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                                >
                                  {isRevealed ? 'Hide Answer' : 'Show Answer'}
                                </button>
                              </div>

                              {isRevealed && (
                                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-blue-100 dark:border-blue-900/50 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed animate-in fade-in">
                                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                                    Expected Model Answer
                                  </span>
                                  {sq.a}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1">
                                {sq.tags.map((t, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-400 font-semibold"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => navigate('/interview/setup')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Mock Interview on This Topic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/mcq')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Practice MCQs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/cheat-sheet')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5 text-blue-500" />
                        <span>View Technical Cheat Sheet</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
