import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import {
  MessageSquare,
  X,
  Send,
  Maximize2,
  Bot,
  User,
  Sparkles,
  Zap,
  Trash2,
} from 'lucide-react';
import { CHAT_ROLES } from '../../data/chatRoles';
import { ChatMessage, GeminiModelId } from '../../types';
import { aiService } from '../../services/api';

const STORAGE_KEY = 'interviewai_chat_history_v1';
const ROLE_STORAGE_KEY = 'interviewai_chat_active_role';
const MODEL_STORAGE_KEY = 'interviewai_chat_active_model';

export const FloatingChatWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRole = (() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return CHAT_ROLES.find((r) => r.id === saved) || CHAT_ROLES[0];
  })();

  const activeModel = (() => {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY) as GeminiModelId | null;
    return saved || activeRole.defaultModel;
  })();

  // Hide the floating widget if user is already on the dedicated /chat page
  if (location.pathname === '/chat' || location.pathname.startsWith('/interview/room')) {
    return null;
  }

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `float_user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat({
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        systemInstruction: activeRole.systemInstruction,
        model: activeModel,
      });

      if (res.success && res.reply) {
        const botMsg: ChatMessage = {
          id: `float_bot_${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: res.modelUsed || activeModel,
        };
        const updated = [...nextMessages, botMsg];
        setMessages(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `float_err_${Date.now()}`,
        role: 'assistant',
        content: `Could not send message. Please retry in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: activeModel,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Expanded Floating Chat Panel */}
      {isOpen && (
        <div className="mb-3 w-96 max-w-[calc(100vw-2.5rem)] h-[480px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">{activeRole.name}</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-blue-100 font-mono">
                  <span>{activeModel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/chat"
                onClick={() => setIsOpen(false)}
                title="Expand to Full Chat View"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-400">
                <Sparkles className="w-8 h-8 text-blue-500 mb-2" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Gemini Interview Coach</p>
                <p className="text-[11px] text-zinc-500 mt-1">Ask questions, request system design advice, or practice STAR answers.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex gap-2 ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] px-3 py-2 rounded-2xl ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/60 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <div className="prose prose-xs dark:prose-invert max-w-none">
                          <Markdown>{m.content}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 italic">
                <Bot className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Input Bar */}
          <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-2 py-1"
            >
              <input
                id="floating-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Gemini anything..."
                className="flex-1 bg-transparent border-0 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none px-1 py-1"
              />
              <button
                id="floating-chat-send-btn"
                type="submit"
                disabled={!input.trim() || loading}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Launcher Button with 3D physical tactile push-button styling */}
      <button
        id="floating-chat-launcher-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer select-none transition-all duration-150 ${
          isOpen
            ? 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 text-white border-t border-l border-white/40 border-b-[5px] border-r-2 border-rose-950 shadow-[0_6px_0_0_#4c0519,0_12px_24px_rgba(76,5,25,0.45),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:shadow-[0_8px_0_0_#4c0519,0_16px_28px_rgba(76,5,25,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#4c0519,0_4px_10px_rgba(76,5,25,0.3),inset_0_2px_4px_rgba(0,0,0,0.25)]'
            : 'bg-gradient-to-b from-blue-500 via-indigo-600 to-indigo-700 text-white border-t border-l border-white/40 border-b-[5px] border-r-2 border-indigo-950 shadow-[0_6px_0_0_#1e1b4b,0_14px_24px_rgba(30,27,75,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:shadow-[0_8px_0_0_#1e1b4b,0_18px_28px_rgba(30,27,75,0.6),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#1e1b4b,0_4px_10px_rgba(30,27,75,0.3),inset_0_2px_4px_rgba(0,0,0,0.25)]'
        }`}
        title="Open Gemini AI Chatbot"
        aria-label="Toggle Gemini AI Chatbot"
      >
        {/* Curved 3D top specular highlight */}
        <span className="pointer-events-none absolute inset-x-2 top-1 h-4 rounded-t-xl bg-gradient-to-b from-white/35 to-transparent" />

        {/* 3D Icon with depth drop-shadow */}
        <span className="relative z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)] transition-transform duration-200 group-hover:scale-105">
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </span>

        {/* 3D Badge indicating AI assistant */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-[0_2px_0_0_#78350f,0_4px_8px_rgba(0,0,0,0.25)] border border-amber-200 text-[9px] font-black pointer-events-none">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
          </span>
        )}
      </button>
    </div>
  );
};
