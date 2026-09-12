import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Lock,
  Save,
  CheckCircle2,
  Flame,
  Award,
  Sparkles,
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
  FileText,
  Video,
  Layers,
  History,
  Coins,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { XPTransactionHistory } from '../components/gamification';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, deleteAccount, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [profileTab, setProfileTab] = useState<'DETAILS' | 'XP_HISTORY'>('DETAILS');
  const [name, setName] = useState(user?.name || '');
  const [preferredJobRole, setPreferredJobRole] = useState(user?.preferredJobRole || 'Java Full Stack Developer');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await authService.updateProfile({
        name,
        preferredJobRole,
      });

      if (res.success && res.user) {
        updateUser(res.user);
        setSuccessMsg('Profile updated successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setSuccessMsg('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handlePermanentDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteAccount(deletePassword || undefined);
      if (res.success) {
        navigate('/register', { replace: true });
      }
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || err?.message || 'Failed to delete account. Please verify credentials.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Candidate Account Settings
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your personal details, target role preference, and security credentials.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* User Stats Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={user?.profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800"
          />
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">{user?.name}</h3>
            <p className="text-xs text-zinc-400">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-xl font-black text-amber-500">{user?.streakDays || 3}</span>
            <span className="text-[10px] text-zinc-400 block font-semibold">Day Streak</span>
          </div>
          <button
            type="button"
            onClick={() => setProfileTab('XP_HISTORY')}
            className="text-center group cursor-pointer"
            title="Click to view full XP deduction and refund history"
          >
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 group-hover:underline">
              {user?.xp || 240}
            </span>
            <span className="text-[10px] text-zinc-400 group-hover:text-blue-500 flex items-center justify-center gap-1 font-semibold">
              XP Points <History className="w-2.5 h-2.5" />
            </span>
          </button>
        </div>
      </div>

      {/* Profile & XP History Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 w-fit">
        <button
          id="profile-tab-details"
          type="button"
          onClick={() => setProfileTab('DETAILS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            profileTab === 'DETAILS'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4 text-blue-500" />
          <span>Profile & Account Settings</span>
        </button>

        <button
          id="profile-tab-xp-history"
          type="button"
          onClick={() => setProfileTab('XP_HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            profileTab === 'XP_HISTORY'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4 text-emerald-500" />
          <span>XP Transaction History (Deductions & Refunds)</span>
        </button>
      </div>

      {profileTab === 'XP_HISTORY' ? (
        <XPTransactionHistory
          title="My XP Transaction History"
          subtitle="Chronological audit log of all XP deductions for mock interviews and refunds"
        />
      ) : (
        <>
          {/* Profile Details Form */}
      <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
          Personal Profile & Preferences
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address (Immutable)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {isAdmin ? 'Company Position' : 'Preferred Engineering Role'}
            </label>
            <input
              type="text"
              required
              value={preferredJobRole}
              onChange={(e) => setPreferredJobRole(e.target.value)}
              placeholder={isAdmin ? 'e.g. Technical Recruiter, Hiring Manager' : 'e.g. Java Full Stack Developer'}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* Security Form */}
      <form onSubmit={handleChangePassword} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
          Security & Password
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Update Password</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Permanent Account & Data Deletion */}
      <div className="p-6 sm:p-8 rounded-3xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone: Permanent Account Deletion</span>
            </div>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-1 max-w-xl leading-relaxed">
              Permanently delete your {user?.role === 'ADMIN' ? 'administrator' : 'candidate'} account and erase all associated data. Once initiated, all your uploaded resumes, mock interview recordings, AI evaluation feedback reports, coding tests, achievements, notifications, and XP points are permanently deleted from the database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('');
              setDeletePassword('');
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-sm shadow-red-600/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account & All Data</span>
          </button>
        </div>
      </div>
      </>
      )}

      {/* Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    Permanent Account Deletion
                  </h3>
                  <p className="text-xs text-zinc-500">Irreversible Action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 space-y-2">
              <p className="font-bold">
                You are about to permanently delete your {user?.role} account ({user?.email}).
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-600 dark:text-red-400">
                <li>All resume documents and ATS analysis records</li>
                <li>All AI mock interview transcripts, feedback, and roadmap plans</li>
                <li>All performance analytics history and scores</li>
                <li>All badges, streak counter, and earned XP</li>
                <li>All system notifications and preferences</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Type <span className="font-mono text-red-600 font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Enter your password (optional verification):
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Account password"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteConfirmText.trim() !== 'DELETE' || deleting}
                onClick={handlePermanentDeleteAccount}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting Account & Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
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
