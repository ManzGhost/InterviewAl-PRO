import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Clock,
  Send,
  SkipForward,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Brain,
  Video,
  VideoOff,
  Eye,
  ShieldCheck,
  Smile,
  Activity,
  Camera,
  Tv,
} from 'lucide-react';
import { interviewService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAssessmentSecurity } from '../context/AssessmentSecurityContext';
import { InterviewSession, QuestionItem, AnswerEvaluation, VideoDetectionMetrics } from '../types';
import { LiveVideoDetection } from '../components/interview/LiveVideoDetection';
import { InterviewerAvatarFeed } from '../components/interview/InterviewerAvatarFeed';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateUser, refreshProfile } = useAuth();
  const { startSecureAssessment, completeAssessment } = useAssessmentSecurity();

  const [interview, setInterview] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Live Video Detection States
  const [videoChamberActive, setVideoChamberActive] = useState(true);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [mediaPermissionGranted, setMediaPermissionGranted] = useState<boolean | null>(null);
  const [videoLayout, setVideoLayout] = useState<'split' | 'candidate' | 'interviewer'>('split');
  const [activeVideoMetrics, setActiveVideoMetrics] = useState<VideoDetectionMetrics | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Completely stop and release all hardware camera, microphone, speech recognition, and audio streams
  const stopAllMediaAndSensors = useCallback(() => {
    setIsSessionEnded(true);
    setVideoChamberActive(false);

    // 1. Stop and abort Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort?.();
      } catch (err) {
        console.warn('Speech recognition abort error:', err);
      }
      setIsRecording(false);
    }

    // 2. Stop Text-to-Speech synthesis
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {}
      setIsSpeaking(false);
    }

    // 3. Stop all media tracks on any media elements (webcam video and audio)
    try {
      const mediaElements = document.querySelectorAll<HTMLMediaElement>('video, audio');
      mediaElements.forEach((el) => {
        if (el.srcObject && el.srcObject instanceof MediaStream) {
          el.srcObject.getTracks().forEach((track) => {
            try {
              track.stop();
              track.enabled = false;
            } catch (e) {}
          });
          el.srcObject = null;
        }
        try {
          el.pause();
        } catch (e) {}
      });
    } catch (err) {
      console.warn('Media element stream release error:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMediaAndSensors();
    };
  }, [stopAllMediaAndSensors]);

  // Load interview details
  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      try {
        const res = await interviewService.getInterview(id);
        if (res.success && res.interview) {
          setInterview(res.interview);

          // If session already completed, redirect to results
          if (res.interview.status === 'COMPLETED') {
            navigate(`/interview/result/${res.interview.id}`);
            return;
          }

          // If session terminated, immediately stop media and redirect to termination page
          if (res.interview.status === 'TERMINATED') {
            stopAllMediaAndSensors();
            navigate(`/session-terminated?id=${encodeURIComponent(res.interview.id)}`, { replace: true });
            return;
          }

          const qIndex = res.interview.currentQuestionIndex || 0;
          const activeQ = res.interview.questions[qIndex] || res.interview.questions[0];
          setCurrentQuestion(activeQ);

          if (activeQ?.aiEvaluation) {
            setCurrentEvaluation(activeQ.aiEvaluation);
          }

          // Activate Secure Mode for AI Interview
          if (res.interview.status === 'IN_PROGRESS') {
            startSecureAssessment({
              assessmentId: res.interview.id,
              assessmentType: 'AI_INTERVIEW',
              assessmentTitle: `${res.interview.interviewType} - ${res.interview.jobRole}`,
              durationMinutes: Math.max(15, (res.interview.totalQuestions || 5) * 5),
              getProgress: () => ({
                interviewId: res.interview.id,
                currentQuestionIndex: res.interview.currentQuestionIndex,
                currentQuestionId: activeQ?.id,
              }),
            });
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, navigate]);

  // Timer loop
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentQuestion?.id]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          setUserAnswer((prev) => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSpeakQuestion = () => {
    if (!currentQuestion?.question) return;

    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleSubmitAnswer = async (skip = false) => {
    if (!interview || !currentQuestion) return;
    if (!skip && !userAnswer.trim()) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setSubmitting(true);
    try {
      const res = await interviewService.submitAnswer(interview.id, {
        questionId: currentQuestion.id,
        userAnswer: skip ? 'Question skipped by candidate.' : userAnswer,
        timeSpentSeconds: timerSeconds,
        skip,
        videoMetrics: activeVideoMetrics || undefined,
      });

      if (res.success && res.interview) {
        setInterview(res.interview);
        setCurrentEvaluation(res.evaluation);
      }
    } catch (err) {
      console.error('Answer submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!interview) return;

    // Check if interview completed
    if (interview.status === 'COMPLETED') {
      stopAllMediaAndSensors();
      navigate(`/interview/result/${interview.id}`);
      return;
    }

    const nextIndex = (interview.currentQuestionIndex || 0) + 1;
    if (nextIndex >= interview.totalQuestions) {
      // Complete interview and automatically shut off camera and voice mic
      stopAllMediaAndSensors();
      try {
        await completeAssessment({ interviewId: interview.id });
        const res = await interviewService.completeInterview(interview.id);
        if (res?.user) {
          updateUser(res.user);
        } else {
          refreshProfile().catch(() => {});
        }
      } catch (err) {
        console.error('Failed to complete interview on server:', err);
      }
      navigate(`/interview/result/${interview.id}`);
    } else {
      const nextQ = interview.questions[nextIndex];
      setCurrentQuestion(nextQ);
      setUserAnswer('');
      setCurrentEvaluation(null);
      setTimerSeconds(0);
    }
  };

  const handleEndEarly = () => {
    if (!interview) return;
    setShowEndModal(true);
  };

  const confirmEndSession = async () => {
    if (!interview || isEnding) return;
    setIsEnding(true);

    // Automatically stop camera, microphone, and speech recognition hardware immediately
    stopAllMediaAndSensors();

    try {
      await completeAssessment({ interviewId: interview.id });
      const res = await interviewService.completeInterview(interview.id);
      if (res?.user) {
        updateUser(res.user);
      } else {
        refreshProfile().catch(() => {});
      }
      navigate(`/interview/result/${interview.id}`);
    } catch (err) {
      console.error('Failed to complete interview on server, navigating to results:', err);
      // Graceful fallback to avoid trapping user
      navigate(`/interview/result/${interview.id}`);
    } finally {
      setIsEnding(false);
      setShowEndModal(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !interview || !currentQuestion) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Entering AI Interview Chamber...
        </p>
      </div>
    );
  }

  const qNumber = (interview.currentQuestionIndex || 0) + 1;
  const progressPercent = Math.round((qNumber / interview.totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Session Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-white">
                {interview.jobRole}
              </span>
              {interview.companyName && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                  {interview.companyName}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{interview.interviewType}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Question stopwatch */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {/* Camera & Microphone Permission and Live Status Badge */}
          {videoChamberActive && !isSessionEnded && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Cam & Mic: Active</span>
            </div>
          )}

          <button
            id="end-session-btn"
            type="button"
            onClick={handleEndEarly}
            disabled={isEnding}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100/90 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="End interview session early and view report"
          >
            {isEnding ? (
              <div className="w-3.5 h-3.5 border-2 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            )}
            <span className="inline font-semibold">End Session</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span>Question {qNumber} of {interview.totalQuestions}</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Live Video Detection & Interview Stage Section */}
      <div className="space-y-3">
        {/* Stage Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-black text-white border border-zinc-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${videoChamberActive ? 'bg-red-500' : 'bg-zinc-500'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${videoChamberActive ? 'bg-red-500' : 'bg-zinc-500'}`} />
              </span>
              <span className="text-xs font-black tracking-wider uppercase text-zinc-100 flex items-center gap-1.5">
                Live Video Detection & Stage
              </span>
            </div>

            {activeVideoMetrics && videoChamberActive && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 pl-3 border-l border-zinc-800 font-mono">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span className={(activeVideoMetrics.eyeContactScore ?? activeVideoMetrics.eyeContactPercentage ?? 0) >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                    Eye Contact: {activeVideoMetrics.eyeContactScore ?? activeVideoMetrics.eyeContactPercentage ?? 0}%
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span className={activeVideoMetrics.postureStatus === 'Upright & Centered' ? 'text-emerald-400' : 'text-amber-400'}>
                    Posture: {activeVideoMetrics.postureStatus}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Layout selector */}
            <div className="flex items-center p-0.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs">
              <button
                type="button"
                onClick={() => setVideoLayout('split')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  videoLayout === 'split' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Two-Way Stage (AI Interviewer + Candidate)"
              >
                Split Stage
              </button>
              <button
                type="button"
                onClick={() => setVideoLayout('candidate')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  videoLayout === 'candidate' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Candidate Camera & CV HUD"
              >
                Camera Only
              </button>
              <button
                type="button"
                onClick={() => setVideoLayout('interviewer')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  videoLayout === 'interviewer' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="AI Interviewer Feed"
              >
                Interviewer
              </button>
            </div>

            {/* Video enable toggle */}
            <button
              type="button"
              onClick={() => setVideoChamberActive((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                videoChamberActive
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              {videoChamberActive ? (
                <>
                  <Video className="w-3.5 h-3.5 text-red-400" />
                  <span>Camera Active</span>
                </>
              ) : (
                <>
                  <VideoOff className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Camera Off</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Stage Feeds */}
        {videoChamberActive ? (
          <div className="animate-in fade-in duration-200">
            {videoLayout === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InterviewerAvatarFeed
                  interviewerName="Alex Vance (Senior Engineering Leader)"
                  companyName={interview.companyName}
                  isSpeaking={isSpeaking}
                  questionCategory={currentQuestion.category}
                />
                <LiveVideoDetection
                  active={videoChamberActive && !isSessionEnded}
                  onMetricsUpdate={(m) => setActiveVideoMetrics(m)}
                  onPermissionChange={(granted) => setMediaPermissionGranted(granted)}
                />
              </div>
            )}

            {videoLayout === 'candidate' && (
              <div className="max-w-2xl mx-auto">
                <LiveVideoDetection
                  active={videoChamberActive && !isSessionEnded}
                  onMetricsUpdate={(m) => setActiveVideoMetrics(m)}
                  onPermissionChange={(granted) => setMediaPermissionGranted(granted)}
                />
              </div>
            )}

            {videoLayout === 'interviewer' && (
              <div className="max-w-2xl mx-auto">
                <InterviewerAvatarFeed
                  interviewerName="Alex Vance (Senior Engineering Leader)"
                  companyName={interview.companyName}
                  isSpeaking={isSpeaking}
                  questionCategory={currentQuestion.category}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              <VideoOff className="w-4 h-4 text-zinc-400" />
              <span>Live video detection is currently paused. You can enable it at any time to record non-verbal metrics.</span>
            </div>
            <button
              type="button"
              onClick={() => setVideoChamberActive(true)}
              className="px-3 py-1 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer"
            >
              Turn Camera On
            </button>
          </div>
        )}
      </div>

      {/* AI Interviewer Question Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                AI Interviewer
              </p>
              <span className="text-[11px] font-medium text-zinc-400">
                Category: {currentQuestion.category} • {currentQuestion.difficulty}
              </span>
            </div>
          </div>

          {/* Speech synthesis prompt reader */}
          <button
            onClick={handleSpeakQuestion}
            className={`p-2.5 rounded-xl border transition-all ${
              isSpeaking
                ? 'bg-blue-600 text-white border-blue-600 animate-pulse'
                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
            }`}
            title="Read Question Out Loud"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white leading-relaxed">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Answer Form & Live Evaluation */}
      {!currentEvaluation ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Your Answer
            </label>

            {speechSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white border-red-500 animate-pulse'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening... (Click to stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-blue-500" />
                    <span>Speak Answer</span>
                  </>
                )}
              </button>
            )}
          </div>

          <textarea
            rows={7}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your explanation, architectural thoughts, or STAR response here, or click 'Speak Answer' to talk..."
            className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 leading-relaxed resize-y"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => handleSubmitAnswer(true)}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip Question</span>
            </button>

            <button
              id="submit-answer-btn"
              type="button"
              onClick={() => handleSubmitAnswer(false)}
              disabled={submitting || !userAnswer.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating with Gemini AI...</span>
                </div>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Instant AI Feedback & Evaluation Panel */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 shadow-lg space-y-6 animate-in fade-in zoom-in-95">
          {/* Header & Overall Score */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <span className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                Instant AI Critique
              </span>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Answer Evaluation
              </h3>
            </div>

            <div className="flex items-baseline gap-1 px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-black text-2xl">
              <span>{currentEvaluation.overallScore}</span>
              <span className="text-xs font-semibold text-blue-500">/ 10</span>
            </div>
          </div>

          {/* 6-Dimensional Score Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Technical Depth</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentEvaluation.technicalScore}/10</p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Communication</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentEvaluation.communicationScore}/10</p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Confidence</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentEvaluation.confidenceScore}/10</p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Completeness</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentEvaluation.completenessScore}/10</p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Problem Solving</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentEvaluation.problemSolvingScore}/10</p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Relevance</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{currentEvaluation.relevanceScore}/10</p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Observed Strengths</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                {currentEvaluation.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Areas to Polish</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                {currentEvaluation.weaknesses.map((wk, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500">•</span>
                    <span>{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Behavioral STAR Method breakdown if present */}
          {currentEvaluation.starEvaluation && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2 block">
                Behavioral STAR Evaluation
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <strong className="text-indigo-600 dark:text-indigo-300">Situation:</strong>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{currentEvaluation.starEvaluation.situation}</p>
                </div>
                <div>
                  <strong className="text-indigo-600 dark:text-indigo-300">Task:</strong>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{currentEvaluation.starEvaluation.task}</p>
                </div>
                <div>
                  <strong className="text-indigo-600 dark:text-indigo-300">Action:</strong>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{currentEvaluation.starEvaluation.action}</p>
                </div>
                <div>
                  <strong className="text-indigo-600 dark:text-indigo-300">Result:</strong>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{currentEvaluation.starEvaluation.result}</p>
                </div>
              </div>
            </div>
          )}

          {/* Better Answer Example */}
          {currentEvaluation.betterAnswerExample && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white mb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Recommended Model Response</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                "{currentEvaluation.betterAnswerExample}"
              </p>
            </div>
          )}

          {/* Next Question / Finish Action */}
          <div className="pt-2 flex justify-end">
            <button
              id="next-question-btn"
              type="button"
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all"
            >
              <span>
                {qNumber >= interview.totalQuestions ? 'Finish & Generate Final Report' : 'Next Question'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 shrink-0">
                <VideoOff className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  End Interview & Turn Off Camera/Mic?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Ending this session will <strong className="text-zinc-800 dark:text-zinc-200">automatically turn off your camera and voice microphone</strong>, finalize your answered questions, and generate your comprehensive AI evaluation and analytics.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Camera hardware stream and microphone audio will be immediately disconnected.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEnding}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                Continue Practice
              </button>
              <button
                type="button"
                onClick={confirmEndSession}
                disabled={isEnding}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 shadow-md shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isEnding ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Closing Media & Finalizing...</span>
                  </>
                ) : (
                  <>
                    <VideoOff className="w-4 h-4" />
                    <span>End Session & Turn Off Camera/Mic</span>
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
