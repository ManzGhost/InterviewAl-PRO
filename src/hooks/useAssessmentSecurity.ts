import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentSecurityApi } from '../services/api';
import { AssessmentType, SecureAssessmentSession, ViolationType } from '../types';

interface UseAssessmentSecurityOptions {
  assessmentId: string;
  assessmentType: AssessmentType;
  assessmentTitle?: string;
  durationMinutes?: number;
  isActive: boolean;
  getCurrentProgress?: () => any;
  onTerminated?: (session?: SecureAssessmentSession) => void;
  onRestored?: (session: SecureAssessmentSession) => void;
}

export function useAssessmentSecurity({
  assessmentId,
  assessmentType,
  assessmentTitle,
  durationMinutes = 45,
  isActive,
  getCurrentProgress,
  onTerminated,
  onRestored,
}: UseAssessmentSecurityOptions) {
  const navigate = useNavigate();
  const [session, setSession] = useState<SecureAssessmentSession | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(durationMinutes * 60);
  const [securityActive, setSecurityActive] = useState(false);

  const isTerminatingRef = useRef(false);
  const progressGetterRef = useRef(getCurrentProgress);
  progressGetterRef.current = getCurrentProgress;

  const terminateAssessment = useCallback(
    async (violationType: ViolationType, details: string) => {
      if (isTerminatingRef.current) return;
      isTerminatingRef.current = true;

      const finalProgress = progressGetterRef.current ? progressGetterRef.current() : null;

      try {
        // Exit fullscreen if active
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (e) {
            // Ignore error
          }
        }

        const res = await assessmentSecurityApi.terminateSession({
          assessmentId,
          violationType,
          details,
          finalProgress,
        });

        if (onTerminated) {
          onTerminated(res.session);
        }

        // Immediately redirect to Session Terminated page
        navigate(`/session-terminated?id=${assessmentId}`, { replace: true });
      } catch (err) {
        console.error('Termination call failed:', err);
        navigate(`/session-terminated?id=${assessmentId}`, { replace: true });
      }
    },
    [assessmentId, navigate, onTerminated]
  );

  // Request fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed or blocked:', err);
    }
  }, []);

  // Initialize and validate session when active becomes true
  useEffect(() => {
    if (!isActive || !assessmentId) return;

    let isMounted = true;
    isTerminatingRef.current = false;

    const init = async () => {
      try {
        // Attempt fullscreen
        await enterFullscreen();

        const res = await assessmentSecurityApi.startSession({
          assessmentType,
          assessmentId,
          assessmentTitle,
          durationMinutes,
          initialProgress: progressGetterRef.current ? progressGetterRef.current() : null,
        });

        if (!isMounted) return;

        // If another assessment is already active or session is already terminated
        if (res.conflict || res.terminated || (res.session && res.session.status === 'TERMINATED')) {
          isTerminatingRef.current = true;
          navigate(`/session-terminated?id=${assessmentId}`, { replace: true });
          return;
        }

        if (res.session) {
          setSession(res.session);
          setSecurityActive(true);

          if (res.restored && onRestored) {
            onRestored(res.session);
          }

          if (typeof res.session.remainingSeconds === 'number') {
            setRemainingSeconds(res.session.remainingSeconds);
          }
        }
      } catch (err: any) {
        console.error('Failed to register secure assessment session:', err);
        if (err?.response?.data?.terminated || err?.response?.data?.conflict) {
          navigate(`/session-terminated?id=${assessmentId}`, { replace: true });
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [isActive, assessmentId, assessmentType, assessmentTitle, durationMinutes, enterFullscreen, navigate, onRestored]);

  // Security Monitoring Listeners (Zero-Tolerance: Tab Switch, Window Blur, Visibility Lost, Fullscreen Exit)
  useEffect(() => {
    if (!isActive || !securityActive) return;

    // 1. Tab switch or page hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        terminateAssessment('TAB_SWITCH', 'Candidate switched browser tab or minimized window.');
      }
    };

    // 2. Window blur (click outside browser or opening new window/app)
    const handleWindowBlur = () => {
      terminateAssessment('WINDOW_BLUR', 'Browser window lost focus to another application or tab.');
    };

    // 3. Fullscreen exit
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && !isTerminatingRef.current) {
        terminateAssessment('FULLSCREEN_EXIT', 'Candidate exited fullscreen mode.');
      }
    };

    // 4. Browser navigation / refresh / close protection
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Zero-tolerance secure assessment is in progress. Leaving will terminate your session.';
      // Note: If candidate closes window, the unload will finalize progress
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
  }, [isActive, securityActive, terminateAssessment]);

  // Periodic Progress Auto-Save (Every 10 seconds)
  useEffect(() => {
    if (!isActive || !securityActive || !assessmentId) return;

    const interval = setInterval(() => {
      if (isTerminatingRef.current) return;
      if (progressGetterRef.current) {
        const progress = progressGetterRef.current();
        if (progress) {
          assessmentSecurityApi.saveProgress(assessmentId, progress).catch((err) => {
            if (err?.response?.data?.terminated) {
              terminateAssessment('UNAUTHORIZED_NAVIGATION', 'Session was terminated on server.');
            }
          });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isActive, securityActive, assessmentId, terminateAssessment]);

  // Complete assessment handler
  const completeAssessment = useCallback(
    async (finalProgress?: any) => {
      try {
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (e) {}
        }
        await assessmentSecurityApi.completeSession(assessmentId, finalProgress);
        setSecurityActive(false);
      } catch (err) {
        console.error('Failed to finalize secure assessment:', err);
      }
    },
    [assessmentId]
  );

  return {
    session,
    isFullscreen,
    remainingSeconds,
    securityActive,
    enterFullscreen,
    terminateAssessment,
    completeAssessment,
  };
}
