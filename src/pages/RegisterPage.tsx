import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus, Eye, EyeOff, Shield, GraduationCap, KeyRound, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState<'USER' | 'ADMIN'>('USER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminCode: 'ADMIN-SYS1',
    college: '',
    education: '',
    skills: 'Java, Spring Boot, React, SQL',
    experienceYears: '5',
    preferredJobRole: 'Java Full Stack Developer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Administrator Code validation state
  const [validatingCode, setValidatingCode] = useState(false);
  const [connectedAdmin, setConnectedAdmin] = useState<{
    id: string;
    name: string;
    email: string;
    adminCode: string;
    preferredJobRole?: string;
  } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [availableCodes, setAvailableCodes] = useState<Array<{ code: string; name: string; email: string }>>([]);

  // Load available administrator codes for quick selection
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await authService.getAdminCodes();
        if (res.success && res.codes) {
          setAvailableCodes(res.codes);
          if (res.codes.length > 0) {
            setFormData((prev) => ({
              ...prev,
              adminCode: prev.adminCode && res.codes.some((c: any) => c.code === prev.adminCode)
                ? prev.adminCode
                : res.codes[0].code,
            }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch active admin codes:', err);
      }
    };
    fetchCodes();
  }, []);

  // Validate admin code on change
  useEffect(() => {
    if (accountType !== 'USER') {
      setConnectedAdmin(null);
      setCodeError(null);
      return;
    }

    const trimmedCode = formData.adminCode.trim();
    if (!trimmedCode) {
      setConnectedAdmin(null);
      setCodeError('Administrator Code is required.');
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingCode(true);
      try {
        const res = await authService.validateAdminCode(trimmedCode);
        if (res.valid && res.admin) {
          setConnectedAdmin(res.admin);
          setCodeError(null);
        } else {
          setConnectedAdmin(null);
          setCodeError(res.message || 'Invalid Administrator Code.');
        }
      } catch (err: any) {
        setConnectedAdmin(null);
        setCodeError('Failed to validate Administrator Code.');
      } finally {
        setValidatingCode(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.adminCode, accountType]);

  const candidateRoles = [
    'Java Full Stack Developer',
    'Frontend React Developer',
    'Backend Software Engineer',
    'DevOps & Cloud Engineer',
    'Data Engineer',
    'Full Stack MERN Developer',
  ];

  const adminPositions = [
    'Technical Recruiter',
    'Hiring Manager',
    'Engineering Manager',
    'Technical Lead & Interviewer',
    'Talent Acquisition Specialist',
    'Platform Administrator',
    'HR Director / People Ops',
  ];

  const handleAccountTypeChange = (type: 'USER' | 'ADMIN') => {
    setAccountType(type);
    setFormData((prev) => ({
      ...prev,
      preferredJobRole:
        type === 'ADMIN'
          ? (adminPositions.includes(prev.preferredJobRole) ? prev.preferredJobRole : 'Technical Recruiter')
          : (candidateRoles.includes(prev.preferredJobRole) ? prev.preferredJobRole : 'Java Full Stack Developer'),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (accountType === 'USER') {
      if (!formData.adminCode.trim()) {
        setError('Administrator Code is required for candidate registration.');
        return;
      }
      if (!connectedAdmin) {
        setError('Please enter a valid Administrator Code before proceeding.');
        return;
      }
    }

    setLoading(true);

    try {
      const skillsArray = accountType === 'ADMIN'
        ? [`${formData.experienceYears || '5'}+ Years Experience`, 'Technical Hiring', 'Talent Operations']
        : formData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

      await register({
        ...formData,
        experienceYears: accountType === 'ADMIN' ? formData.experienceYears : undefined,
        role: accountType === 'ADMIN' ? 'ADMIN' : 'CANDIDATE',
        adminCode: accountType === 'USER' ? formData.adminCode.trim().toUpperCase() : undefined,
        skills: skillsArray,
        preferredJobRole: accountType === 'ADMIN' ? (formData.preferredJobRole || 'Platform Administrator') : formData.preferredJobRole,
        college: accountType === 'ADMIN' ? (formData.college || 'Platform Engineering HQ') : formData.college,
      });

      if (accountType === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-lg my-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Interview<span className="text-blue-600 dark:text-blue-400">AI</span>
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">
            Register New Account
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Register as a candidate for mock interviews or as an administrator to manage platform data
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Account Type Toggle */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Select Account Role *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAccountTypeChange('USER')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  accountType === 'USER'
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-200'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${accountType === 'USER' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Candidate</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Job Seeker & Student</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAccountTypeChange('ADMIN')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  accountType === 'ADMIN'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 text-indigo-900 dark:text-indigo-200'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${accountType === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Administrator</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Recruiter & Staff</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Johnson"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@university.edu"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
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

            {/* Candidate: Required Administrator Code */}
            {accountType === 'USER' && (
              <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Administrator Code *</span>
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                      Required
                    </span>
                  </label>
                  {validatingCode && (
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Validating...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.adminCode}
                    onChange={(e) => setFormData({ ...formData, adminCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. ADMIN-DAV6714, ADMIN-A123"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm font-mono uppercase tracking-wider text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>

                {connectedAdmin ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900 dark:text-emerald-200">
                      <div className="font-semibold">
                        Connected to: {connectedAdmin.name} ({connectedAdmin.adminCode})
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {connectedAdmin.email} · {connectedAdmin.preferredJobRole || 'Platform Administrator'}
                      </div>
                      <div className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 mt-1">
                        ✓ Your candidate data will be strictly isolated to this Administrator.
                      </div>
                    </div>
                  </div>
                ) : codeError ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{codeError}</span>
                  </div>
                ) : null}

                {/* Quick Select Buttons */}
                {availableCodes.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5 font-medium">
                      Select an active Administrator Code:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCodes.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setFormData({ ...formData, adminCode: item.code })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                            formData.adminCode === item.code
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                          }`}
                        >
                          {item.code} <span className="font-sans text-[10px] opacity-75">({item.name.split(' ')[0]})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Administrator: Auto Code Generation Info */}
            {accountType === 'ADMIN' && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Automatic Unique Administrator Code</span>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  When you register, the system will automatically generate a unique Administrator Code (e.g.{' '}
                  <span className="font-mono font-bold">ADMIN-A123</span>). Share this code with your candidates to link them exclusively to your administrator dashboard with complete data isolation.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {accountType === 'ADMIN' ? 'Company Position *' : 'Target Job Role *'}
                </label>
                <select
                  id="user-position-select"
                  value={formData.preferredJobRole}
                  onChange={(e) => setFormData({ ...formData, preferredJobRole: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                    accountType === 'ADMIN'
                      ? 'bg-zinc-50 dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-800 text-zinc-900 dark:text-white focus:ring-indigo-500/30 focus:border-indigo-500 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-blue-500/30 focus:border-blue-500 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {accountType === 'ADMIN' ? (
                    <>
                      <option value="Technical Recruiter">Technical Recruiter</option>
                      <option value="Hiring Manager">Hiring Manager</option>
                      <option value="Engineering Manager">Engineering Manager</option>
                      <option value="Technical Lead & Interviewer">Technical Lead & Interviewer</option>
                      <option value="Talent Acquisition Specialist">Talent Acquisition Specialist</option>
                      <option value="Platform Administrator">Platform Administrator</option>
                      <option value="HR Director / People Ops">HR Director / People Ops</option>
                    </>
                  ) : (
                    <>
                      <option value="Java Full Stack Developer">Java Full Stack Developer</option>
                      <option value="Frontend React Developer">Frontend React Developer</option>
                      <option value="Backend Software Engineer">Backend Software Engineer</option>
                      <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                      <option value="Data Engineer">Data Engineer</option>
                      <option value="Full Stack MERN Developer">Full Stack MERN Developer</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {accountType === 'ADMIN' ? 'Company / Organization *' : 'College / University'}
                </label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder={accountType === 'ADMIN' ? 'e.g. Google, Microsoft, Tech Corp' : 'Stanford University'}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              {accountType === 'ADMIN' ? (
                <>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Experience (Years) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    required
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Total professional or recruiting experience in years.
                  </p>
                </>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Key Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="Java, Spring Boot, React, SQL, AWS"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-md disabled:opacity-50 transition-all ${
                accountType === 'ADMIN'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {accountType === 'ADMIN'
                      ? 'Register Administrator Account'
                      : 'Create Candidate Account & Get 100 XP'}
                  </span>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
