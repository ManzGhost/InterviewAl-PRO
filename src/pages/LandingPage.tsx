import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Video,
  FileText,
  Target,
  Brain,
  Award,
  CheckCircle2,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-8">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>AI-Powered Career Intelligence & Mock Interview System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] max-w-4xl mx-auto">
            Ace Technical & Behavioral Interviews with{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Gemini AI
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Practice real-time mock interviews with adaptive difficulty, get ATS resume diagnostics, match job descriptions, and unlock personalized roadmaps tailored to your dream tech company.
          </p>

          {/* Call to action buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all"
              >
                <span>Go to Candidate Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all"
                >
                  <span>Start Free Preparation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Social Proof metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-zinc-200 dark:border-zinc-800 pt-10">
            <div>
              <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">6-Dim</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Answer Evaluation</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">STAR</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Method Behavioral Grading</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">98%</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">ATS Keyword Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">Adaptive</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Dynamic Question Engine</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 mb-2">
              Everything You Need
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              A Complete Intelligence Suite for Job Seekers
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Real-Time AI Mock Interviews
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Technical, HR, Behavioral (STAR), and Coding interviews with live feedback on technical depth, communication, and confidence.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                AI Resume & ATS Scanner
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Extracts skills, flags missing keywords, calculates ATS match probability, and suggests impact-oriented bullet rewrites.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-violet-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Job Description Matcher
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Paste any job posting to calculate match percentage, view missing required skills, and receive tailored questions.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-amber-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Safe Coding Practice
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Java and JavaScript code editor with AI Big-O space/time complexity analysis and edge case detection without risky server execution.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                5-Day Personalized Roadmaps
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Dynamic roadmaps and interview cheat sheets generated automatically from your weak performance areas.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-pink-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-pink-600/10 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Gamification & Streaks
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Earn XP points, unlock badges (First Interview, 7-Day Streak, 80+ Score), and rank on the public leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Companies Section */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 mb-6">
            Practice Inspired by Top Industry Engineering Standards
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-zinc-500 dark:text-zinc-400 font-bold text-lg">
            <span>Google</span>
            <span>•</span>
            <span>Amazon</span>
            <span>•</span>
            <span>Microsoft</span>
            <span>•</span>
            <span>Netflix</span>
            <span>•</span>
            <span>Meta</span>
            <span>•</span>
            <span>Infosys</span>
            <span>•</span>
            <span>TCS</span>
          </div>
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
            *AI-generated practice questions inspired by engineering roles and company patterns.
          </p>
        </div>
      </section>
    </div>
  );
};
