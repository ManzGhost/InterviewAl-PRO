import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Code2,
  ListOrdered,
  FileText,
  Target,
  Compass,
  FileCode,
  BarChart3,
  History,
  Trophy,
  Shield,
  User,
  X,
  Trash2,
  Calendar,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAssessmentSecurity } from '../../context/AssessmentSecurityContext';
import { interviewService } from '../../services/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { isSecureMode, terminateAssessment } = useAssessmentSecurity();
  const [confirmingHistoryClear, setConfirmingHistoryClear] = useState(false);
  const [historyFeedback, setHistoryFeedback] = useState<string | null>(null);

  const handleLinkClick = (e: React.MouseEvent, targetPath: string) => {
    if (isSecureMode) {
      e.preventDefault();
      e.stopPropagation();
      terminateAssessment(
        'UNAUTHORIZED_NAVIGATION',
        `Candidate clicked navigation to "${targetPath}" during active assessment.`
      );
      return;
    }
    onClose();
  };

  const handleClearHistory = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await interviewService.clearAllHistory();
      setConfirmingHistoryClear(false);
      setHistoryFeedback(res.success ? 'Cleared!' : 'Done');
      window.dispatchEvent(new CustomEvent('interview-history-updated'));
      setTimeout(() => setHistoryFeedback(null), 2500);
    } catch (err) {
      console.error(err);
      setConfirmingHistoryClear(false);
    }
  };

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(!isAdmin
      ? [{ name: 'Assigned Interviews', path: '/assigned-interviews', icon: Calendar, badge: 'Assigned' }]
      : []),
    { name: 'Live Video AI Interview', path: '/interview/setup', icon: Video, badge: 'LIVE' },
    { name: 'Coding Interview', path: '/coding', icon: Code2, badge: 'IDE' },
    { name: 'MCQ Practice', path: '/mcq', icon: ListOrdered, badge: 'Quiz' },
    { name: 'Resume ATS Analysis', path: '/resume', icon: FileText },
    { name: 'Job Match Analyzer', path: '/job-match', icon: Target },
  ];

  const intelligenceNav = [
    { name: 'Gemini AI Chatbot', path: '/chat', icon: MessageSquare, badge: 'AI' },
    { name: 'Learning Roadmap', path: '/roadmap', icon: Compass, badge: 'Guide' },
    { name: 'AI Cheat Sheet', path: '/cheat-sheet', icon: FileCode },
    { name: 'Performance Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Interview History', path: '/history', icon: History },
    { name: 'Leaderboard & XP', path: '/leaderboard', icon: Trophy, badge: 'Live' },
  ];

  const systemNav = [
    { name: 'User Profile', path: '/profile', icon: User, badge: 'Account' },
  ];

  if (isAdmin) {
    systemNav.unshift({ name: 'Admin Console', path: '/admin', icon: Shield, badge: 'Admin' });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto px-3 py-4 space-y-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between px-3 lg:hidden">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Navigation</span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick User card in sidebar */}
          {user && (
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <img
                  src={user.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user.preferredJobRole || 'Software Engineer'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Prep Tools */}
          <div>
            <p className="px-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Interview Engine
            </p>
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const isInterviewLink = item.path === '/interview/setup';
                const isCodingLink = item.path === '/coding';
                const isMcqLink = item.path === '/mcq';
                return (
                  <NavLink
                    key={item.path}
                    id={`sidebar-link-${item.path.replace(/\//g, '-').replace(/^-/, '')}`}
                    to={item.path}
                    onClick={(e) => handleLinkClick(e, item.path)}
                    className={({ isActive }) => {
                      if (isInterviewLink) {
                        return `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold shadow-md shadow-blue-500/30 ring-1 ring-blue-400/40'
                            : 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200/60 dark:hover:border-blue-800/40 active:scale-[0.98]'
                        }`;
                      }
                      if (isCodingLink) {
                        return `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-md shadow-indigo-500/25 ring-1 ring-indigo-400/40'
                            : 'text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-transparent hover:border-indigo-200/50 dark:hover:border-indigo-800/40 active:scale-[0.98]'
                        }`;
                      }
                      if (isMcqLink) {
                        return `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/40'
                            : 'text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200/50 dark:hover:border-emerald-800/40 active:scale-[0.98]'
                        }`;
                      }
                      return `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-sm shadow-blue-500/25 ring-1 ring-blue-500'
                          : 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-[0.98]'
                      }`;
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <item.icon
                            className={`w-4 h-4 transition-transform ${
                              isInterviewLink
                                ? `group-hover:scale-110 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`
                                : isCodingLink
                                ? `group-hover:scale-110 group-hover:rotate-6 ${isActive ? 'text-white drop-shadow-sm' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`
                                : isMcqLink
                                ? `group-hover:scale-110 group-hover:-rotate-6 ${isActive ? 'text-white drop-shadow-sm' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`
                                : `group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`
                            }`}
                          />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-md transition-colors ${
                              isInterviewLink
                                ? isActive
                                  ? 'bg-white/25 text-white border border-white/30 font-black text-[9px] tracking-wider'
                                  : 'bg-red-50 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/60 font-black text-[9px] tracking-wider'
                                : isCodingLink
                                ? isActive
                                  ? 'bg-white/20 text-white font-mono text-[9px] font-black tracking-wider'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 font-mono text-[9px] font-black tracking-wider'
                                : isMcqLink
                                ? isActive
                                  ? 'bg-white/20 text-white font-mono text-[9px] font-black tracking-wider'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 font-mono text-[9px] font-black tracking-wider'
                                : isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                            }`}
                          >
                            {isInterviewLink && (
                              <span className="relative flex h-2 w-2 mr-1.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-white' : 'bg-red-500'}`} />
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-white' : 'bg-red-500'}`} />
                              </span>
                            )}
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Career Intelligence */}
          <div>
            <p className="px-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Career Intelligence
            </p>
            <nav className="space-y-1">
              {intelligenceNav.map((item) => (
                <NavLink
                  key={item.path}
                  id={`sidebar-link-${item.path.replace(/\//g, '-').replace(/^-/, '')}`}
                  to={item.path}
                  onClick={(e) => handleLinkClick(e, item.path)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-sm shadow-blue-500/25 ring-1 ring-blue-500'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-[0.98]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.path === '/history' && (
                          historyFeedback ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              {historyFeedback}
                            </span>
                          ) : confirmingHistoryClear ? (
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <button
                                id="sidebar-confirm-remove-history-btn"
                                type="button"
                                onClick={handleClearHistory}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer"
                                title="Confirm clear all interview history"
                              >
                                Clear?
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConfirmingHistoryClear(false);
                                }}
                                className="text-[10px] font-bold px-1 py-0.5 rounded bg-zinc-600 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              id="sidebar-remove-history-btn"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmingHistoryClear(true);
                              }}
                              className={`p-1 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer ${
                                isActive
                                  ? 'text-white/80 hover:text-white hover:bg-white/20'
                                  : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                              }`}
                              title="Remove / Clear Interview History"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md transition-colors ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Platform & System */}
          <div>
            <p className="px-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Platform & Developer
            </p>
            <nav className="space-y-1">
              {systemNav.map((item) => (
                <NavLink
                  key={item.path}
                  id={`sidebar-link-${item.path.replace(/\//g, '-').replace(/^-/, '')}`}
                  to={item.path}
                  onClick={(e) => handleLinkClick(e, item.path)}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-sm shadow-blue-500/25 ring-1 ring-blue-500'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-[0.98]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md transition-colors ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};
