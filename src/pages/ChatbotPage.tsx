import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Cpu,
  Code2,
  Trash2,
  Download,
  HelpCircle,
  Maximize2,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { CHAT_ROLES } from '../data/chatRoles';
import { ChatMessage, ChatRolePreset, GeminiModelId } from '../types';
import { aiService } from '../services/api';

const STORAGE_KEY = 'interviewai_chat_history_v1';
const ROLE_STORAGE_KEY = 'interviewai_chat_active_role';
const MODEL_STORAGE_KEY = 'interviewai_chat_active_model';

export const ChatbotPage: React.FC = () => {
  // Active Role & Model state
  const [activeRole, setActiveRole] = useState<ChatRolePreset>(() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return CHAT_ROLES.find((r) => r.id === saved) || CHAT_ROLES[0];
  });

  const [activeModel, setActiveModel] = useState<GeminiModelId>(() => {
    const saved = localStorage.getItem(MODEL_STORAGE_KEY) as GeminiModelId | null;
    return saved || activeRole.defaultModel;
  });

  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>(activeRole.systemInstruction);
  const [showSystemPromptModal, setShowSystemPromptModal] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);

  // Multi-turn conversation history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage', e);
    }
    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `👋 Hello! I am your **${activeRole.name}** powered by Gemini.

${activeRole.tagline}.

You can ask me technical questions, review behavioral STAR answers, practice system design architectures, or drill flashcard topics. How would you like to prepare today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: activeModel,
      },
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer cleanup
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist chat messages', e);
    }
  }, [messages]);

  // Save selected role and default model
  const handleSelectRole = (role: ChatRolePreset) => {
    setActiveRole(role);
    setActiveModel(role.defaultModel);
    setCustomSystemInstruction(role.systemInstruction);
    localStorage.setItem(ROLE_STORAGE_KEY, role.id);
    localStorage.setItem(MODEL_STORAGE_KEY, role.defaultModel);
    setShowRoleMenu(false);

    // Optional: add system transition note
    const welcomeMsg: ChatMessage = {
      id: `role_switch_${Date.now()}`,
      role: 'assistant',
      content: `Switched mode to **${role.name}** (*${role.defaultModel}*).\n\n${role.tagline}. What challenge should we tackle?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: role.defaultModel,
    };
    setMessages((prev) => [...prev, welcomeMsg]);
  };

  const handleSelectModel = (model: GeminiModelId) => {
    setActiveModel(model);
    localStorage.setItem(MODEL_STORAGE_KEY, model);
    setShowModelMenu(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setLoading(true);

    try {
      // Format history for multi-turn Gemini API
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiService.chat({
        messages: apiMessages,
        systemInstruction: customSystemInstruction,
        model: activeModel,
      });

      if (res.success && res.reply) {
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: res.modelUsed || activeModel,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('No reply returned by AI service');
      }
    } catch (err: any) {
      console.error('Chat failed:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Note**: Could not complete request (${err?.message || 'Server error'}). Please ensure your network connection is active or try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: activeModel,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        setConfirmingClear(false);
      }, 4000);
      return;
    }

    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    const resetMsg: ChatMessage = {
      id: `reset_${Date.now()}`,
      role: 'assistant',
      content: `Conversation cleared. I am ready as **${activeRole.name}** (*${activeModel}*). How can I assist you?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: activeModel,
    };
    setMessages([resetMsg]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
    setConfirmingClear(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'Candidate' : `AI Assistant (${m.modelUsed || 'Gemini'})`}:\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper icon for roles
  const renderRoleIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Code2':
        return <Code2 className={className} />;
      case 'Sparkles':
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-4 pb-2">
      {/* Top Header Card with Multi-turn Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            {renderRoleIcon(activeRole.avatarIcon, 'w-5 h-5')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>{activeRole.name}</span>
              </h1>
              {/* Role badge */}
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                Multi-Turn Chat
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{activeRole.tagline}</p>
          </div>
        </div>

        {/* Action Controls: Role Selector, Model Badge & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Preset Selector */}
          <div className="relative">
            <button
              id="chat-role-selector-btn"
              type="button"
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowModelMenu(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Change Role</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                  Select Assistant Role
                </div>
                {CHAT_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                      activeRole.id === role.id
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="mt-0.5 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                      {renderRoleIcon(role.avatarIcon, 'w-3.5 h-3.5')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{role.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                            role.taskComplexity === 'complex'
                              ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                              : role.taskComplexity === 'fast'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {role.taskComplexity}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">{role.tagline}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Switcher Badge */}
          <div className="relative">
            <button
              id="chat-model-selector-btn"
              type="button"
              onClick={() => {
                setShowModelMenu(!showModelMenu);
                setShowRoleMenu(false);
              }}
              title="Select Gemini Model"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              <span>{activeModel}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showModelMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                  Target Gemini Model
                </div>
                <button
                  onClick={() => handleSelectModel('gemini-3.8-flash')}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer ${
                    activeModel === 'gemini-3.8-flash'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono">gemini-3.8-flash</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-sans font-bold">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Fast, highly capable for general career questions, architecture & mock coaching.
                  </p>
                </button>

                <button
                  onClick={() => handleSelectModel('gemini-3.1-pro-preview')}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer ${
                    activeModel === 'gemini-3.1-pro-preview'
                      ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono">gemini-3.1-pro-preview</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-sans font-bold">
                      Complex
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Deep reasoning & advanced algorithms (requires billing-enabled key; auto-falls back to Flash on free tier).
                  </p>
                </button>

                <button
                  onClick={() => handleSelectModel('gemini-3.1-flash-lite')}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer ${
                    activeModel === 'gemini-3.1-flash-lite'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono">gemini-3.1-flash-lite</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-sans font-bold">
                      Fast
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Ultra low-latency for rapid drills, syntax lookups & instant cheat-sheets.
                  </p>
                </button>
              </div>
            )}
          </div>

          {/* System Instruction Inspector Button */}
          <button
            id="chat-system-prompt-btn"
            type="button"
            onClick={() => setShowSystemPromptModal(true)}
            title="Inspect System Instruction"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Export Transcript */}
          <button
            id="chat-export-btn"
            type="button"
            onClick={handleExportTranscript}
            title="Export chat transcript as Markdown"
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear Thread Button */}
          <button
            id="chat-clear-thread-btn"
            type="button"
            onClick={handleClearHistory}
            title={confirmingClear ? 'Click again to confirm clearing conversation' : 'Clear conversation history'}
            className={`transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold select-none ${
              confirmingClear
                ? 'px-3 py-1.5 text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30 ring-2 ring-rose-500/40 animate-pulse'
                : 'p-2 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/70 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-800 shadow-xs'
            }`}
          >
            <Trash2 className={`w-4 h-4 ${confirmingClear ? 'animate-bounce' : ''}`} />
            {confirmingClear && <span className="text-[11px] whitespace-nowrap">Confirm Clear?</span>}
          </button>
        </div>
      </div>

      {/* Main Conversation Scrollable Thread */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Scrollable messages container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-xs mt-0.5 ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`space-y-1.5 max-w-[85%] sm:max-w-[78%]`}>
                  <div className={`flex items-center gap-2 text-[11px] text-zinc-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                      {isUser ? 'You' : activeRole.name}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {!isUser && msg.modelUsed && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-pre:my-2 prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:rounded-xl prose-pre:p-3 prose-code:font-mono prose-code:text-xs">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>

                  {/* Message Action Utilities */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-blue-600 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-zinc-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-zinc-400 font-mono">Generating with {activeModel}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Starter Prompts */}
        {messages.length <= 2 && (
          <div className="px-4 sm:px-6 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggested Prompts for {activeRole.name}:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {activeRole.suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 text-left text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Interactive Input Form */}
        <div className="p-3 sm:p-4 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-2 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all"
          >
            <textarea
              id="chat-input-textarea"
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${activeRole.name} anything... (Shift+Enter for newline)`}
              className="flex-1 bg-transparent border-0 resize-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-0 max-h-32 px-2 py-1 leading-relaxed"
            />

            <button
              id="chat-send-btn"
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 px-1">
            <span>
              Configured role: <strong className="text-zinc-600 dark:text-zinc-300">{activeRole.name}</strong>
            </span>
            <span>
              Target model: <code className="font-mono font-semibold text-blue-600 dark:text-blue-400">{activeModel}</code>
            </span>
          </div>
        </div>
      </div>

      {/* System Instruction Inspector / Customizer Modal */}
      {showSystemPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Active System Instruction</h3>
              </div>
              <button
                onClick={() => setShowSystemPromptModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The system instruction directs Gemini on its persona, evaluation criteria, and conversational tone for the <strong>{activeRole.name}</strong> role.
            </p>

            <textarea
              rows={8}
              value={customSystemInstruction}
              onChange={(e) => setCustomSystemInstruction(e.target.value)}
              className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCustomSystemInstruction(activeRole.systemInstruction)}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline"
              >
                Reset to Role Default
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSystemPromptModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatbotPage;
