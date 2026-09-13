import React from 'react';
import { Shield, Maximize2 } from 'lucide-react';

interface SecureModeNoticeProps {
  remainingSeconds?: number;
  onEnterFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const SecureModeNotice: React.FC<SecureModeNoticeProps> = ({
  remainingSeconds,
  onEnterFullscreen,
  isFullscreen = false,
}) => {
  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, secs);
    const m = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = typeof remainingSeconds === 'number' && remainingSeconds <= 300;

  return (
    <div
      id="secure-mode-notice-banner"
      className="bg-red-50/95 dark:bg-red-950/75 border-b border-red-200 dark:border-red-900/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm sticky top-0 z-50 backdrop-blur-sm transition-colors"
    >
      {/* Left: Security Status Badge & Policy Notice */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
        </span>
        <div className="flex items-center gap-1.5 font-bold text-red-900 dark:text-red-300">
          <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>Secure Mode Active (Zero-Tolerance)</span>
        </div>
        <span className="hidden md:inline text-red-700/80 dark:text-red-400/80">
          • Tab switch, window focus loss, ya fullscreen exit par immediate termination hoga
        </span>
      </div>

      {/* Right: Actions & Countdown */}
      <div className="flex items-center gap-3">
        {/* Fullscreen Button: Candidate ke physical click se browser fullscreen allow karega */}
        {!isFullscreen && onEnterFullscreen && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onEnterFullscreen();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Enable Fullscreen</span>
          </button>
        )}

        {/* Countdown Timer */}
        {typeof remainingSeconds === 'number' && (
          <div
            className={`font-mono font-bold px-2.5 py-0.5 rounded border transition-colors ${
              isLowTime
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-white dark:bg-zinc-900 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}
          >
            {formatTime(remainingSeconds)}
          </div>
        )}
      </div>
    </div>
  );
};