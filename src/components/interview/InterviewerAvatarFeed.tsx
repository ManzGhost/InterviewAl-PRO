import React from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Radio,
  Building2,
  Shield,
} from 'lucide-react';

interface InterviewerAvatarFeedProps {
  jobRole?: string;
  companyName?: string;
  isSpeaking: boolean;
  onToggleSpeech?: () => void;
  category?: string;
  difficulty?: string;
  interviewerName?: string;
  questionCategory?: string;
}

export const InterviewerAvatarFeed: React.FC<InterviewerAvatarFeedProps> = ({
  jobRole = 'Software Engineer',
  companyName = 'Google',
  isSpeaking,
  onToggleSpeech = () => {},
  category = 'Engineering',
  difficulty = 'Intermediate',
  interviewerName,
  questionCategory,
}) => {
  const waveHeights = [40, 70, 90, 60, 100, 80, 50, 85, 65, 35];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-zinc-950 text-white shadow-xl flex flex-col justify-between aspect-video w-full select-none">
      {/* Background Visual Pattern */}
      <div className="absolute inset-0 bg-radial from-blue-900/30 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Bar with Status and Voice Toggle */}
      <div className="relative z-10 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-sm">
          <Radio className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-blue-400'}`} />
          <span className="text-[11px] font-black uppercase tracking-wider text-white">
            AI INTERVIEWER STREAM
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-[11px] font-medium text-zinc-300">
            {interviewerName || `${companyName} Bar Raiser`}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleSpeech}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
            isSpeaking
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/25 animate-pulse'
              : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300'
          }`}
          title={isSpeaking ? 'Mute AI Voice' : 'Play Question Voice'}
        >
          {isSpeaking ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-400" />}
          <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
        </button>
      </div>

      {/* Center Persona Avatar & Animated Audio Waveform */}
      <div className="relative z-10 flex flex-col items-center justify-center p-6 space-y-4">
        {/* Animated Rings around Persona */}
        <div className="relative flex items-center justify-center">
          {isSpeaking && (
            <>
              <div className="absolute w-32 h-32 rounded-full bg-blue-500/20 animate-ping" />
              <div className="absolute w-28 h-28 rounded-full border border-blue-400/40 animate-pulse" />
            </>
          )}

          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-2xl shadow-blue-600/40 flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-zinc-950 flex items-center justify-center text-white">
              <Bot className={`w-10 h-10 transition-transform duration-300 ${isSpeaking ? 'scale-110 text-blue-400' : 'text-zinc-300'}`} />
            </div>
          </div>
        </div>

        {/* Interviewer Details & Status */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400">
            <Sparkles className="w-3 h-3" />
            <span>AI Assessment Director</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Target: {jobRole}
          </h3>
          <p className="text-[11px] text-zinc-400">
            Assessing: {questionCategory || category} • Level: {difficulty}
          </p>
        </div>

        {/* Audio Visualizer Wave */}
        <div className="flex items-center gap-1 h-5 pt-1">
          {waveHeights.map((h, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                isSpeaking
                  ? 'bg-blue-400 animate-pulse'
                  : 'bg-zinc-700'
              }`}
              style={{
                height: isSpeaking ? `${h}%` : '20%',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom Subtitle / Info Strip */}
      <div className="relative z-10 p-3 bg-zinc-950/90 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-zinc-300">{companyName} Culture Assessment</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Real-Time Evaluation</span>
        </div>
      </div>
    </div>
  );
};