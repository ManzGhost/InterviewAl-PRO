import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, LogIn, Mail, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recommended / Latest Login Gmail account
  const [recommendedAccount, setRecommendedAccount] = useState<{
    email: string;
    name: string;
    role: string;
    avatar?: string;
  }>(() => {
    const savedEmail = localStorage.getItem('interviewai_last_login_email') || 'daviddhawan876@gmail.com';
    const savedName = localStorage.getItem('interviewai_last_login_name') || 'David Dhawan';
    const savedRole = localStorage.getItem('interviewai_last_login_role') || 'Administrator';
    return {
      email: savedEmail,
      name: savedName,
      role: savedRole === 'ADMIN' ? 'Administrator' : savedRole === 'USER' ? 'Candidate' : savedRole,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(savedName),
    };
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem('interviewai_last_login_email');
    const savedName = localStorage.getItem('interviewai_last_login_name');
    const savedRole = localStorage.getItem('interviewai_last_login_role');
    if (savedEmail) {
      setRecommendedAccount({
        email: savedEmail,
        name: savedName || savedEmail.split('@')[0],
        role: savedRole === 'ADMIN' ? 'Administrator' : savedRole === 'USER' ? 'Candidate' : savedRole || 'User',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(savedName || savedEmail),
      });
    }
  }, []);

  const selectRecommendedEmail = (recommendedEmail: string) => {
    setEmail(recommendedEmail);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      // Persist the latest login email
      localStorage.setItem('interviewai_last_login_email', email);
      if (loggedUser.role === 'ADMIN' || loggedUser.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Interview<span className="text-blue-600 dark:text-blue-400">AI</span>
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">
            Welcome back
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Sign in to continue your interview preparation
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          {/* Recommended Latest Login Gmail Banner */}
          {recommendedAccount && (
            <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white dark:from-blue-950/40 dark:via-zinc-900 dark:to-zinc-900 border border-blue-200/90 dark:border-blue-900/60 shadow-sm transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Recommended · Latest Login
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {recommendedAccount.role}
                </span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => selectRecommendedEmail(recommendedAccount.email)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    selectRecommendedEmail(recommendedAccount.email);
                  }
                }}
                id="recommended-login-card"
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-blue-100 dark:border-zinc-700/80 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 overflow-hidden">
                    {recommendedAccount.avatar ? (
                      <img
                        src={recommendedAccount.avatar}
                        alt={recommendedAccount.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{recommendedAccount.name.charAt(0).toUpperCase()}</span>
                    )}
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-white dark:bg-zinc-900 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-[7px] text-white font-bold">
                        M
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {recommendedAccount.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-red-500 shrink-0" />
                      <span className="truncate">{recommendedAccount.email}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectRecommendedEmail(recommendedAccount.email);
                  }}
                  id="use-recommended-gmail-btn"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    email === recommendedAccount.email
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20'
                  }`}
                >
                  {email === recommendedAccount.email ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 px-1">
                <span>Click to fill this Gmail</span>
                {email === recommendedAccount.email && (
                  <button
                    type="button"
                    onClick={() => setEmail('')}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline cursor-pointer"
                  >
                    Clear email
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
              Or sign in with email
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="email-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password-input"
                  ref={passwordInputRef}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="submit-login-btn"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
