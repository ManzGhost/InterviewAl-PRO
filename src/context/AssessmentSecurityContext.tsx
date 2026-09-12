import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assessmentSecurityApi } from '../services/api';
import { AssessmentType, SecureAssessmentSession, ViolationType } from '../types';

interface AssessmentSecurityContextType {
  activeSession: SecureAssessmentSession | null;
  isSecureMode: boolean;
  remainingSeconds: number;
  isFullscreen: boolean;
  startSecureAssessment: (params: {
    assessmentId: string;
    assessmentType: AssessmentType;
    assessmentTitle: string;
    durationMinutes?: number;
    initialProgress?: any;
    getProgress?: () => any;
  }) => Promise<{ success: boolean; error?: string; restored?: boolean }>;
  terminateAssessment: (violationType: ViolationType, details: string) => Promise<void>;
  completeAssessment: (finalProgress?: any) => Promise<void>;
  updateProgress: (progress: any) => Promise<void>;
  enterFullscreen: () => Promise<void>;
  registerProgressGetter: (getter: () => any) => void;
}

const AssessmentSecurityContext = createContext<AssessmentSecurityContextType | null>(null);

export const AssessmentSecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<SecureAssessmentSession | null>(null);
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(45 * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isTerminatingRef = useRef(false);
  const progressGetterRef = useRef<(() => any) | null>(null);
  const expectedPathRef = useRef<string | null>(null);

  // Enter Fullscreen helper
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request blocked or not permitted:', err);
    }
  }, []);

  // Terminate assessment immediately (Zero-Tolerance)
  const terminateAssessment = useCallback(
    async (violationType: ViolationType, details: string) => {
      if (isTerminatingRef.current) return;
      isTerminatingRef.current = true;

      const currentId = activeSession?.assessmentId;
      const finalProgress = progressGetterRef.current ? progressGetterRef.current() : null;

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (e) {}
      }

      setIsSecureMode(false);
      setIsFullscreen(false);

      if (currentId) {
        try {
          await assessmentSecurityApi.terminateSession({
            assessmentId: currentId,
            violationType,
            details,
            finalProgress,
          });
        } catch (err) {
          console.error('Failed to report termination to server:', err);
        }
      }

      setActiveSession((prev) => (prev ? { ...prev, status: 'TERMINATED', terminationReason: 'CHEATING_DETECTED' } : null));

      // Redirect immediately to Session Terminated page
      navigate(`/session-terminated${currentId ? `?id=${encodeURIComponent(currentId)}` : ''}`, { replace: true });
    },
    [activeSession?.assessmentId, navigate]
  );

  // Complete assessment normally
  const completeAssessment = useCallback(
    async (finalProgress?: any) => {
      const currentId = activeSession?.assessmentId;
      if (!currentId) return;

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (e) {}
      }

      try {
        const res = await assessmentSecurityApi.completeSession(currentId, finalProgress);
        if (res.success && res.session) {
          setActiveSession(res.session);
        }
      } catch (err) {
        console.error('Failed to complete assessment session:', err);
      } finally {
        setIsSecureMode(false);
        setIsFullscreen(false);
        expectedPathRef.current = null;
      }
    },
    [activeSession?.assessmentId]
  );

  // Update progress
  const updateProgress = useCallback(
    async (progress: any) => {
      const currentId = activeSession?.assessmentId;
      if (!currentId || !isSecureMode) return;

      try {
        await assessmentSecurityApi.saveProgress(currentId, progress);
      } catch (err: any) {
        if (err?.response?.data?.terminated) {
          terminateAssessment('UNAUTHORIZED_NAVIGATION', 'Assessment was marked terminated on server.');
        }
      }
    },
    [activeSession?.assessmentId, isSecureMode, terminateAssessment]
  );

  // Register progress getter
  const registerProgressGetter = useCallback((getter: () => any) => {
    progressGetterRef.current = getter;
  }, []);

  // Start or restore secure assessment
  const startSecureAssessment = useCallback(
    async (params: {
      assessmentId: string;
      assessmentType: AssessmentType;
      assessmentTitle: string;
      durationMinutes?: number;
      initialProgress?: any;
      getProgress?: () => any;
    }) => {
      isTerminatingRef.current = false;
      if (params.getProgress) {
        progressGetterRef.current = params.getProgress;
      }

      try {
        // Request fullscreen mode
        await enterFullscreen();

        const res = await assessmentSecurityApi.startSession({
          assessmentId: params.assessmentId,
          assessmentType: params.assessmentType,
          assessmentTitle: params.assessmentTitle,
          durationMinutes: params.durationMinutes || 45,
          initialProgress: params.initialProgress,
        });

        if (res.conflict) {
          isTerminatingRef.current = true;
          navigate(`/session-terminated?id=${encodeURIComponent(params.assessmentId)}`, { replace: true });
          return { success: false, error: res.message || 'Concurrent assessment conflict.' };
        }

        if (res.terminated || (res.session && res.session.status === 'TERMINATED')) {
          isTerminatingRef.current = true;
          navigate(`/session-terminated?id=${encodeURIComponent(params.assessmentId)}`, { replace: true });
          return { success: false, error: 'Assessment is terminated.' };
        }

        if (res.success && res.session) {
          setActiveSession(res.session);
          setIsSecureMode(true);
          expectedPathRef.current = location.pathname;

          if (typeof res.session.remainingSeconds === 'number') {
            setRemainingSeconds(res.session.remainingSeconds);
          } else {
            setRemainingSeconds((res.session.durationMinutes || 45) * 60);
          }

          return { success: true, restored: !!res.restored };
        }

        return { success: false, error: res.message || 'Failed to start secure session.' };
      } catch (err: any) {
        if (err?.response?.data?.terminated || err?.response?.data?.conflict) {
          isTerminatingRef.current = true;
          navigate(`/session-terminated?id=${encodeURIComponent(params.assessmentId)}`, { replace: true });
          return { success: false, error: err?.response?.data?.message };
        }
        return { success: false, error: 'Network error starting secure assessment.' };
      }
    },
    [enterFullscreen, location.pathname, navigate]
  );

  // Check active assessment on initial app mount (Refresh Handling)
  useEffect(() => {
    let isMounted = true;
    assessmentSecurityApi
      .getActive()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.activeAssessment) {
          const sess = res.activeAssessment;
          if (sess.status === 'TERMINATED') {
            navigate(`/session-terminated?id=${encodeURIComponent(sess.assessmentId)}`, { replace: true });
            return;
          }

          if (sess.status === 'IN_PROGRESS') {
            setActiveSession(sess);
            if (typeof sess.remainingSeconds === 'number') {
              setRemainingSeconds(sess.remainingSeconds);
            }
            // Check if current route is the expected assessment room
            // If candidate refreshed the page on their assessment route, restore securely!
            const isAssessmentRoute =
              location.pathname.includes('/attend-interview/') ||
              location.pathname.includes('/interview/room/') ||
              location.pathname.includes('/mcq') ||
              location.pathname.includes('/coding');

            if (isAssessmentRoute) {
              setIsSecureMode(true);
              expectedPathRef.current = location.pathname;
            } else {
              // Direct URL navigation to other candidate sections during active assessment!
              terminateAssessment(
                'UNAUTHORIZED_NAVIGATION',
                'Candidate attempted to navigate to another section during active assessment.'
              );
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Active assessment check warning:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Timer countdown loop when in Secure Mode
  useEffect(() => {
    if (!isSecureMode) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          completeAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSecureMode, completeAssessment]);

  // Periodic progress saving (every 10s)
  useEffect(() => {
    if (!isSecureMode || !activeSession) return;

    const interval = setInterval(() => {
      if (isTerminatingRef.current) return;
      if (progressGetterRef.current) {
        const progress = progressGetterRef.current();
        if (progress) {
          updateProgress(progress);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isSecureMode, activeSession, updateProgress]);

  // ZERO-TOLERANCE SECURITY EVENT LISTENERS
  useEffect(() => {
    if (!isSecureMode) return;

    // 1. Tab switch or page lost visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        terminateAssessment('TAB_SWITCH', 'Candidate switched to another browser tab or minimized window.');
      }
    };

    // 2. Window focus loss (clicked outside browser, opened other window/app)
    const handleWindowBlur = () => {
      terminateAssessment('WINDOW_BLUR', 'Browser window lost focus.');
    };

    // 3. Fullscreen exit
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && !isTerminatingRef.current) {
        terminateAssessment('FULLSCREEN_EXIT', 'Candidate exited fullscreen mode.');
      }
    };

    // 4. Beforeunload warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Zero-tolerance secure assessment is active. Leaving will terminate your session.';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSecureMode, terminateAssessment]);

  // Intercept unauthorized in-app navigation during Secure Mode
  useEffect(() => {
    if (!isSecureMode || !expectedPathRef.current) return;

    // If candidate navigated away from expected assessment path (and not to session-terminated)
    if (location.pathname !== expectedPathRef.current && !location.pathname.startsWith('/session-terminated')) {
      terminateAssessment(
        'UNAUTHORIZED_NAVIGATION',
        `Candidate attempted to navigate away to "${location.pathname}" during an active assessment.`
      );
    }
  }, [location.pathname, isSecureMode, terminateAssessment]);

  return (
    <AssessmentSecurityContext.Provider
      value={{
        activeSession,
        isSecureMode,
        remainingSeconds,
        isFullscreen,
        startSecureAssessment,
        terminateAssessment,
        completeAssessment,
        updateProgress,
        enterFullscreen,
        registerProgressGetter,
      }}
    >
      {children}
    </AssessmentSecurityContext.Provider>
  );
};

export const useAssessmentSecurity = () => {
  const context = useContext(AssessmentSecurityContext);
  if (!context) {
    throw new Error('useAssessmentSecurity must be used within an AssessmentSecurityProvider');
  }
  return context;
};
