import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Clock, Calendar, CheckCircle2, Lock, ArrowLeft, HelpCircle } from 'lucide-react';
import { assessmentSecurityApi } from '../services/api';
import { SecureAssessmentSession } from '../types';

export const SessionTerminatedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assessmentId = searchParams.get('id');
  const [session, setSession] = useState<SecureAssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to fetch session details if ID is present
    if (assessmentId) {
      assessmentSecurityApi
        .getSession(assessmentId)
        .then((res) => {
          if (res.success && res.session) {
            setSession(res.session);
          }
        })
        .catch((err) => {
          console.warn('Could not load session details:', err);
        })
        .finally(() => setLoading(false));
    } else {
      // Check if there was an active assessment terminated
      assessmentSecurityApi
        .getActive()
        .then((res) => {
          if (res.activeAssessment && res.activeAssessment.status === 'TERMINATED') {
            setSession(res.activeAssessment);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [assessmentId]);

  const latestViolation = session?.violations && session.violations.length > 0
    ? session.violations[session.violations.length - 1]
    : null;

  const violationLabelMap: Record<string, string> = {
    TAB_SWITCH: 'Browser Tab Switched or Inactive',
    WINDOW_BLUR: 'Browser Window Lost Focus',
    PAGE_HIDDEN: 'Assessment Screen Visibility Lost',
    FULLSCREEN_EXIT: 'Fullscreen Mode Exited',
    UNAUTHORIZED_NAVIGATION: 'Attempted Unauthorized Navigation',
    CONCURRENT_ASSESSMENT_ATTEMPT: 'Concurrent Assessment Attempted',
    DEVTOOLS_OPEN: 'Developer Tools / Unauthorized Console Open',
  };

  const readableViolation = latestViolation
    ? violationLabelMap[latestViolation.type] || latestViolation.type.replace(/_/g, ' ')
    : 'Unauthorized tab switch or window focus loss';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 rounded-2xl shadow-xl overflow-hidden">
        {/* Top Alert Banner */}
        <div className="bg-red-600 dark:bg-red-700 px-6 py-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
          <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20 shadow-inner flex-shrink-0">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-1.5">
              Zero-Tolerance Security Enforcement
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              Session Terminated
            </h1>
            <p className="text-red-100 text-sm mt-0.5">
              Automated anti-cheating system triggered
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Required Message */}
          <div className="p-4 sm:p-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-base sm:text-lg text-red-900 dark:text-red-300">
                  Your assessment session has been terminated because unauthorized activity was detected.
                </p>
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-300/80 mt-1 leading-relaxed">
                  InterviewAI operates a zero-tolerance policy. To protect assessment integrity, unauthorized tab switching, window focus loss, or fullscreen exits immediately end candidate sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Violation Details Grid */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-5 border border-zinc-200 dark:border-zinc-700/60 space-y-4">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Recorded Incident Report
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-700">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-0.5">Status</span>
                <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                  <Lock className="w-4 h-4" />
                  <span>TERMINATED</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-700">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-0.5">Termination Reason</span>
                <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded">
                  {session?.terminationReason || 'CHEATING_DETECTED'}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-700 sm:col-span-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-0.5">Detected Violation</span>
                <p className="font-semibold text-red-700 dark:text-red-400">
                  {readableViolation}
                </p>
                {latestViolation?.details && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Details: {latestViolation.details}
                  </p>
                )}
              </div>

              {session && (
                <>
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-700">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-0.5">Assessment Mode</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {session.assessmentType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/80 dark:border-zinc-700">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-0.5">Timestamp</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {new Date(session.endedAt || session.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Policy Information */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Next Steps & Policy Information</p>
              <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                Your progress up to the point of termination has been securely stored in the audit logs. The administrator has been notified of this incident. This assessment cannot be resumed or re-entered.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-sm shadow transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
