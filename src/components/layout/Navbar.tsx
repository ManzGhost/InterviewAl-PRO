import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Award,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Shield,
  CheckCheck,
  Menu,
  Zap,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAssessmentSecurity } from '../../context/AssessmentSecurityContext';
import { gamificationService } from '../../services/api';
import { NotificationItem } from '../../types';
import { XPStoreModal } from '../gamification/XPStoreModal';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isSecureMode, terminateAssessment } = useAssessmentSecurity();
  const navigate = useNavigate();

  const handleNavIntercept = (e: React.MouseEvent, target: string) => {
    if (isSecureMode) {
      e.preventDefault();
      e.stopPropagation();
      terminateAssessment(
        'UNAUTHORIZED_NAVIGATION',
        `Candidate clicked navigation to "${target}" during active assessment.`
      );
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showXpModal, setShowXpModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (user) {
      gamificationService.getNotifications().then((res) => {
        if (res.success && res.notifications) {
          setNotifications(res.notifications);
        }
      }).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await gamificationService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left branding & mobile toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              id="sidebar-toggle-btn"
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link
            to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"}
            onClick={(e) => handleNavIntercept(e, 'Dashboard')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
                Interview<span className="text-blue-600 dark:text-blue-400">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                PRO
              </span>
            </div>
          </Link>

          {isSecureMode && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wide animate-pulse">
              <Lock className="w-3.5 h-3.5" />
              <span>SECURE MODE ACTIVE</span>
            </div>
          )}
        </div>

        {/* Right user & system actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              {/* Streak badge */}
              <div
                title="Current Daily Practice Streak"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-semibold"
              >
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>{user.currentStreak || 1}d Streak</span>
              </div>

              {/* XP & Level badge with XP buying action */}
              <div
                id="header-xp-badge"
                role="button"
                tabIndex={0}
                onClick={() => setShowXpModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowXpModal(true);
                  }
                }}
                title={`${user.xpPoints || 100} XP • Deducted ONLY when Administrator schedules an interview slot • Click to Buy XP`}
                className="hidden sm:flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-gradient-to-r from-blue-50/95 via-indigo-50/90 to-blue-50/80 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-blue-950/30 hover:from-blue-100 hover:via-indigo-100 hover:to-blue-100 dark:hover:from-blue-900/60 dark:hover:via-indigo-900/60 dark:hover:to-blue-900/50 border border-blue-200/90 dark:border-blue-700/80 hover:border-blue-400 dark:hover:border-blue-500 text-blue-900 dark:text-blue-200 text-xs font-semibold cursor-pointer shadow-sm hover:shadow-md hover:shadow-blue-500/20 ring-1 ring-blue-500/10 hover:ring-blue-500/30 transition-all duration-200 group select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-bold tracking-tight">{user.xpPoints || 100} XP</span>

                <button
                  id="header-buy-xp-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowXpModal(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 ml-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-[10px] font-bold tracking-tight shadow-sm transition-all cursor-pointer group-hover:shadow-blue-500/25"
                  title="Open XP Store & Buy Boosters with Razorpay"
                >
                  <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>+ Buy XP</span>
                </button>
              </div>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  id="notifications-menu-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">Notifications</h4>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {unreadCount} unread
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            className={`p-3 rounded-xl text-xs cursor-pointer transition-colors ${
                              n.read
                                ? 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                                : 'bg-blue-50/70 dark:bg-blue-950/40 text-zinc-900 dark:text-white border border-blue-100 dark:border-blue-900/40'
                            }`}
                          >
                            <div className="flex items-center justify-between font-medium">
                              <span>{n.title}</span>
                              {!n.read && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                            </div>
                            <p className="mt-1 text-zinc-500 dark:text-zinc-400 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/60 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                aria-label={`Current theme: ${theme}. Click to switch to ${theme === 'dark' ? 'light' : 'dark'} mode.`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 drop-shadow-sm transition-transform duration-200 hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
                )}
              </button>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-500/30 transition-all"
                >
                  <img
                    src={user.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2 z-50">
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {user.role}
                      </span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={(e) => {
                          setShowUserMenu(false);
                          handleNavIntercept(e, 'My Profile');
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile
                      </Link>

                      {!isAdmin && (
                        <Link
                          to="/assigned-interviews"
                          onClick={(e) => {
                            setShowUserMenu(false);
                            handleNavIntercept(e, 'My Assigned Interviews');
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          My Assigned Interviews
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={(e) => {
                            setShowUserMenu(false);
                            handleNavIntercept(e, 'Admin Console');
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Console
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                id="theme-toggle-btn"
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/60 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                aria-label={`Current theme: ${theme}. Click to switch to ${theme === 'dark' ? 'light' : 'dark'} mode.`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 drop-shadow-sm transition-transform duration-200 hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
                )}
              </button>

              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>

    <XPStoreModal
      isOpen={showXpModal}
      onClose={() => setShowXpModal(false)}
      currentXp={user?.xpPoints || 100}
      currentLevel={user?.level || 'Beginner'}
      onSuccess={(_newXp, _newLevel, updatedUser) => {
        if (updatedUser) {
          updateUser(updatedUser);
        }
      }}
    />
    </>
  );
};
