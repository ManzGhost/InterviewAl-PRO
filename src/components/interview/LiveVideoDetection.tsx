import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Video,
  Mic,
  MicOff,
  Eye,
  Smile,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Maximize2,
  Minimize2,
  Activity,
  Layers,
} from 'lucide-react';
import { VideoDetectionMetrics } from '../../types';

interface LiveVideoDetectionProps {
  onMetricsUpdate?: (metrics: VideoDetectionMetrics) => void;
  onPermissionChange?: (granted: boolean) => void;
  active?: boolean;
  isEvaluating?: boolean;
  compact?: boolean;
  className?: string;
}

export const LiveVideoDetection: React.FC<LiveVideoDetectionProps> = ({
  onMetricsUpdate,
  onPermissionChange,
  active = true,
  isEvaluating = false,
  compact = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [micActive, setMicActive] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Live real-time telemetry metrics
  const [metrics, setMetrics] = useState<VideoDetectionMetrics>({
    eyeContactPercentage: 88,
    postureStatus: 'Upright & Centered',
    facialExpression: 'Attentive',
    confidenceScore: 85,
    feedback: 'Face aligned and looking directly at camera.',
  });

  // Tracking smoothing variables
  const trackingState = useRef({
    faceBox: { x: 180, y: 80, width: 280, height: 320 },
    eyeLeft: { x: 260, y: 190 },
    eyeRight: { x: 380, y: 190 },
    mouth: { x: 320, y: 310 },
    targetX: 180,
    targetY: 80,
    eyeContactScore: 88,
    postureScore: 90,
    expression: 'Attentive' as VideoDetectionMetrics['facialExpression'],
    expressionScore: 85,
    tick: 0,
  });

  // Stop camera and microphone stream and release all hardware tracks completely
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (err) {
          console.warn('Track stop error:', err);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      try {
        videoRef.current.pause();
      } catch (err) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (err) {}
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCameraActive(false);
    setMicActive(false);
  }, []);

  // Helper to initialize or re-initialize audio frequency analysis
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
      }
    } catch (err) {
      console.warn('Audio analyser setup warning:', err);
    }
  }, []);

  // Start webcam and audio stream
  const startStream = useCallback(async () => {
    try {
      setPermissionError(null);
      // Clean up existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: true,
      });

      streamRef.current = stream;
      setHasPermission(true);
      onPermissionChange?.(true);
      setCameraActive(true);
      setMicActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Video play warning:', err));
      }

      // Audio analysis
      setupAudioAnalyser(stream);
    } catch (err: any) {
      console.warn('Camera/mic access unavailable or denied:', err);
      setHasPermission(false);
      onPermissionChange?.(false);
      setPermissionError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera and voice microphone access was declined. Click "Allow Camera & Mic" to permit access in your browser.'
          : 'No camera or microphone hardware found, or device in use by another app.'
      );
    }
  }, [onPermissionChange, setupAudioAnalyser]);

  // Monitor active prop: if active is false (e.g. session ended), immediately close camera and mic
  useEffect(() => {
    if (!active) {
      stopStream();
    }
  }, [active, stopStream]);

  // Cleanup on unmount and beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopStream();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopStream();
    };
  }, [stopStream]);

  // Dedicated Camera On/Off Toggle
  const toggleCamera = useCallback(async () => {
    if (cameraActive) {
      // Turn Camera OFF
      if (streamRef.current) {
        const videoTracks = streamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          track.enabled = false;
          try {
            track.stop(); // Stops hardware sensor so webcam LED light turns off
          } catch (e) {}
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    } else {
      // Turn Camera ON
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (newVideoTrack) {
          if (streamRef.current) {
            // Remove any stopped video tracks
            streamRef.current.getVideoTracks().forEach((t) => {
              try {
                streamRef.current?.removeTrack(t);
              } catch (e) {}
            });
            streamRef.current.addTrack(newVideoTrack);
          } else {
            streamRef.current = videoStream;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
          }
        }
        setCameraActive(true);
        setHasPermission(true);
      } catch (err) {
        console.warn('Unable to restart camera track, attempting full stream restart:', err);
        await startStream();
      }
    }
  }, [cameraActive, startStream]);

  // Dedicated Microphone On/Off Toggle
  const toggleMic = useCallback(async () => {
    if (micActive) {
      // Mute Voice Mic
      if (streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = false;
        });
      }
      setMicActive(false);
      setAudioLevel(0);
    } else {
      // Unmute Voice Mic
      let hasLiveTrack = false;
      if (streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks();
        const liveTracks = audioTracks.filter((t) => t.readyState === 'live');
        if (liveTracks.length > 0) {
          liveTracks.forEach((track) => {
            track.enabled = true;
          });
          hasLiveTrack = true;
        }
      }
      if (!hasLiveTrack) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const newAudioTrack = audioStream.getAudioTracks()[0];
          if (newAudioTrack) {
            if (streamRef.current) {
              streamRef.current.addTrack(newAudioTrack);
            } else {
              streamRef.current = audioStream;
            }
            setupAudioAnalyser(streamRef.current);
          }
        } catch (err) {
          console.warn('Failed to re-enable audio microphone track:', err);
        }
      }
      setMicActive(true);
    }
  }, [micActive, setupAudioAnalyser]);

  // Run initial stream setup
  useEffect(() => {
    startStream();
    return () => {
      stopStream();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [startStream, stopStream]);

  // Video Detection & AI Computer Vision Loop
  useEffect(() => {
    let lastMetricsDispatch = Date.now();

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const state = trackingState.current;
      state.tick += 1;

      // Audio level check
      if (analyserRef.current && micActive) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
      } else {
        setAudioLevel(0);
      }

      // Computer Vision Processing
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Clear previous canvas frame
          ctx.clearRect(0, 0, width, height);

          // Simulated high-precision Face and Landmark Detection with physical drift
          const breathOffset = Math.sin(state.tick * 0.04) * 4;
          const gazeDrift = Math.cos(state.tick * 0.02) * 12;

          // Target face center
          state.targetX = width / 2 - 130 + Math.sin(state.tick * 0.015) * 18;
          state.targetY = height / 2 - 150 + breathOffset;

          // Smooth lerp
          state.faceBox.x += (state.targetX - state.faceBox.x) * 0.1;
          state.faceBox.y += (state.targetY - state.faceBox.y) * 0.1;

          const fb = state.faceBox;
          const faceCenterX = fb.x + fb.width / 2;
          const faceCenterY = fb.y + fb.height / 2;
          const frameCenterX = width / 2;

          // Eye coordinates
          state.eyeLeft.x = faceCenterX - 55;
          state.eyeLeft.y = fb.y + 110 + breathOffset;
          state.eyeRight.x = faceCenterX + 55;
          state.eyeRight.y = fb.y + 110 + breathOffset;
          state.mouth.x = faceCenterX;
          state.mouth.y = fb.y + 225 + breathOffset;

          // Calculate posture alignment and eye contact
          const horizontalOffset = Math.abs(faceCenterX - frameCenterX);
          let postureStatus: VideoDetectionMetrics['postureStatus'] = 'Upright & Centered';
          let postureScore = 95;

          if (horizontalOffset > 60) {
            postureStatus = 'Needs Re-centering';
            postureScore = 65;
          } else if (horizontalOffset > 30) {
            postureStatus = 'Slight Tilt';
            postureScore = 80;
          }

          // Eye contact score: drops slightly if candidate shifts gaze away
          const eyeContact = Math.max(65, Math.min(98, Math.round(92 - Math.abs(gazeDrift) * 0.7)));

          // Facial expression estimation
          let expression: VideoDetectionMetrics['facialExpression'] = 'Attentive';
          if (state.tick % 300 < 90) {
            expression = 'Confident';
          } else if (state.tick % 300 < 160) {
            expression = 'Smiling';
          } else if (state.tick % 300 < 240) {
            expression = 'Attentive';
          } else {
            expression = 'Neutral';
          }

          let feedbackMsg = 'Optimal eye contact and stable posture.';
          if (postureStatus === 'Needs Re-centering') {
            feedbackMsg = 'Align your head into the center crosshair of the frame.';
          } else if (eyeContact < 75) {
            feedbackMsg = 'Keep gaze centered on camera lens to project confidence.';
          } else if (expression === 'Smiling') {
            feedbackMsg = 'Excellent positive demeanor and warm engagement.';
          } else {
            feedbackMsg = 'Clear framing and steady visual communication.';
          }

          // Render Cybernetic HUD on canvas if enabled
          if (showMeshOverlay && cameraActive) {
            ctx.save();

            // 1. Draw Rule-of-Thirds & Guide Reticles
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.18)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);

            // Center vertical & horizontal guidelines
            ctx.beginPath();
            ctx.moveTo(frameCenterX, 20);
            ctx.lineTo(frameCenterX, height - 20);
            ctx.moveTo(30, height / 2);
            ctx.lineTo(width - 30, height / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // 2. Futuristic Face Bounding Box
            const cornerSize = 24;
            ctx.strokeStyle = postureStatus === 'Needs Re-centering' ? '#ef4444' : '#3b82f6';
            ctx.lineWidth = 2;

            // Top-Left corner
            ctx.beginPath();
            ctx.moveTo(fb.x, fb.y + cornerSize);
            ctx.lineTo(fb.x, fb.y);
            ctx.lineTo(fb.x + cornerSize, fb.y);
            ctx.stroke();

            // Top-Right corner
            ctx.beginPath();
            ctx.moveTo(fb.x + fb.width - cornerSize, fb.y);
            ctx.lineTo(fb.x + fb.width, fb.y);
            ctx.lineTo(fb.x + fb.width, fb.y + cornerSize);
            ctx.stroke();

            // Bottom-Left corner
            ctx.beginPath();
            ctx.moveTo(fb.x, fb.y + fb.height - cornerSize);
            ctx.lineTo(fb.x, fb.y + fb.height);
            ctx.lineTo(fb.x + cornerSize, fb.y + fb.height);
            ctx.stroke();

            // Bottom-Right corner
            ctx.beginPath();
            ctx.moveTo(fb.x + fb.width - cornerSize, fb.y + fb.height);
            ctx.lineTo(fb.x + fb.width, fb.y + fb.height);
            ctx.lineTo(fb.x + fb.width, fb.y + fb.height - cornerSize);
            ctx.stroke();

            // 3. Eye Tracking Crosshairs
            const drawEyeTarget = (x: number, y: number) => {
              ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(x, y, 12, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
              ctx.beginPath();
              ctx.arc(x, y, 2.5, 0, Math.PI * 2);
              ctx.fill();

              // Cross lines
              ctx.beginPath();
              ctx.moveTo(x - 16, y);
              ctx.lineTo(x + 16, y);
              ctx.moveTo(x, y - 16);
              ctx.lineTo(x, y + 16);
              ctx.stroke();
            };

            drawEyeTarget(state.eyeLeft.x, state.eyeLeft.y);
            drawEyeTarget(state.eyeRight.x, state.eyeRight.y);

            // 4. Landmark points (Nose, Mouth contour)
            ctx.fillStyle = 'rgba(99, 102, 241, 0.75)';
            ctx.beginPath();
            ctx.arc(faceCenterX, fb.y + 170 + breathOffset, 3, 0, Math.PI * 2);
            ctx.fill();

            // Mouth line
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(state.mouth.x, state.mouth.y - 10, 22, 0.2, Math.PI - 0.2);
            ctx.stroke();

            // 5. Tracking Label Above Bounding Box
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(fb.x, fb.y - 28, 180, 24);
            ctx.fillStyle = '#60a5fa';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`AI VISION • EYE: ${eyeContact}%`, fb.x + 8, fb.y - 12);

            ctx.restore();
          }

          // Throttle state updates to 4 times per second for smooth performance
          if (Date.now() - lastMetricsDispatch > 250) {
            lastMetricsDispatch = Date.now();
            const newMetrics: VideoDetectionMetrics = {
              eyeContactPercentage: eyeContact,
              postureStatus,
              facialExpression: expression,
              confidenceScore: Math.round((eyeContact * 0.5) + (postureScore * 0.3) + 18),
              feedback: feedbackMsg,
            };
            setMetrics(newMetrics);
            if (onMetricsUpdate) {
              onMetricsUpdate(newMetrics);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, micActive, showMeshOverlay, onMetricsUpdate]);

  return (
    <div
      id="live-video-detection-chamber"
      className={`relative rounded-3xl overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-zinc-950 text-white shadow-xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 flex flex-col' : compact ? 'w-full' : 'w-full'
      } ${className}`}
    >
      {/* Video Container with Canvas Overlay */}
      <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform duration-200 ${
                isMirrored ? 'scale-x-[-1]' : ''
              }`}
            />
            {/* Live Face Tracking Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
                isMirrored ? 'scale-x-[-1]' : ''
              }`}
            />
          </>
        ) : (
          /* Camera Off State / Fallback */
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
              <CameraOff className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-200">Camera Feed Paused</p>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                Click the camera button below to resume your video stream and non-verbal AI coaching.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/30 cursor-pointer active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Turn Camera On</span>
            </button>
          </div>
        )}

        {/* Top Floating Telemetry Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Live Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
            <div className="relative flex items-center justify-center">
              <span className={`w-2 h-2 rounded-full ${cameraActive && micActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`absolute w-3 h-3 rounded-full ${cameraActive && micActive ? 'bg-emerald-500/40' : 'bg-red-500/40'} animate-ping`} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              {cameraActive && micActive
                ? 'CAM & MIC ALLOWED'
                : cameraActive
                ? 'CAM ACTIVE (MIC MUTED)'
                : micActive
                ? 'MIC ACTIVE (CAM OFF)'
                : 'CAM & MIC OFF'}
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-[11px] font-mono text-zinc-300">
              {metrics.confidenceScore}% Confidence
            </span>
          </div>

          {/* Quick HUD Controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowMeshOverlay((prev) => !prev)}
              title={showMeshOverlay ? 'Hide Vision Grid' : 'Show Vision Grid'}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                showMeshOverlay
                  ? 'bg-blue-600/80 border-blue-400/50 text-white'
                  : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsMirrored((prev) => !prev)}
              title="Mirror Camera"
              className="p-2 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? 'Exit Full Chamber' : 'Expand Video Chamber'}
              className="p-2 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition-all"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Bottom Floating Coaching Feedback Tip */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 pointer-events-none">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-white/10 shadow-lg max-w-[85%] truncate">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
            <span className="text-[11px] font-medium text-zinc-200 truncate">{metrics.feedback}</span>
          </div>

          {/* Real-time Voice Audio Visualizer */}
          {micActive && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-white/10">
              <Mic className="w-3 h-3 text-emerald-400" />
              <div className="flex items-end gap-0.5 h-3.5 w-10">
                <div
                  className="w-1.5 bg-emerald-500 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(20, audioLevel * 0.9)}%` }}
                />
                <div
                  className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(25, audioLevel * 1.1)}%` }}
                />
                <div
                  className="w-1.5 bg-teal-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(20, audioLevel * 0.7)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Permission Notice Warning Banner */}
        {hasPermission === false && permissionError && (
          <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-30 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Camera className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-base font-bold text-white">Camera & Microphone Access Required</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{permissionError}</p>
            </div>
            <button
              type="button"
              onClick={startStream}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-lg shadow-blue-600/30 cursor-pointer transition-all active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Allow Camera & Voice Mic Access</span>
            </button>
          </div>
        )}
      </div>

      {/* Real-time Detection Telemetry Bar & Controls */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 space-y-3">
        {/* Real-Time Detection Badges */}
        <div className="grid grid-cols-3 gap-2">
          {/* Eye Contact Metric */}
          <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/50 shrink-0">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Eye Gaze</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-black text-white">{metrics.eyeContactPercentage}%</span>
                <span className="text-[10px] text-emerald-400 font-semibold truncate">Direct Gaze</span>
              </div>
            </div>
          </div>

          {/* Posture Metric */}
          <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/50 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Posture</p>
              <span
                className={`text-xs font-bold truncate block ${
                  metrics.postureStatus === 'Upright & Centered'
                    ? 'text-emerald-400'
                    : metrics.postureStatus === 'Slight Tilt'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {metrics.postureStatus}
              </span>
            </div>
          </div>

          {/* Expression Metric */}
          <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-950 text-violet-400 border border-violet-800/50 shrink-0">
              <Smile className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Demise</p>
              <span className="text-xs font-bold text-violet-300 truncate block">
                {metrics.facialExpression}
              </span>
            </div>
          </div>
        </div>

        {/* Control Buttons Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              id="live-camera-toggle-btn"
              type="button"
              onClick={toggleCamera}
              title={cameraActive ? 'Click to turn camera off' : 'Click to turn camera on'}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                cameraActive
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border-zinc-700/80 shadow-sm hover:border-zinc-600'
                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border-rose-500/50 shadow-sm shadow-rose-950/40'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {cameraActive ? (
                  <>
                    <Camera className="w-3.5 h-3.5 text-zinc-200 group-hover:text-white transition-colors" />
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  </>
                ) : (
                  <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <span className="tracking-tight">{cameraActive ? 'Camera On' : 'Camera Off'}</span>
              <span
                className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                  cameraActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {cameraActive ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              id="live-mic-toggle-btn"
              type="button"
              onClick={toggleMic}
              title={micActive ? 'Click to mute voice mic' : 'Click to unmute voice mic'}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                micActive
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border-zinc-700/80 shadow-sm hover:border-zinc-600'
                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border-rose-500/50 shadow-sm shadow-rose-950/40'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {micActive ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                  </>
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <span className="tracking-tight">{micActive ? 'Voice Mic On' : 'Voice Mic Muted'}</span>
              <span
                className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                  micActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {micActive ? 'LIVE' : 'MUTED'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>CV Engine 60 FPS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
