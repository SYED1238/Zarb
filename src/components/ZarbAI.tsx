import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export const ZarbAI: React.FC = () => {
  const { theme } = useStore();
  const isAlabaster = theme === 'alabaster';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setShowPulse(false);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const trimmed = (overrideText || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: trimmed, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for context (exclude current message)
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const { data, error } = await supabase.functions.invoke('zarb-ai', {
        body: { message: trimmed, history },
      });

      if (error) throw error;

      const reply = data?.reply || "I'd love to help — could you rephrase that?";
      setMessages(prev => [...prev, { role: 'assistant', text: reply, timestamp: Date.now() }]);
    } catch (err) {
      console.error('[ZARB AI] Error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I'm having a brief moment — please try again shortly.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "What's trending this season?",
    "Help me pick an outfit",
    "Size guide for blazers",
    "Gift ideas under ₹10,000",
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[70] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group ${
            isAlabaster
              ? 'bg-stone-900 text-white hover:bg-stone-800'
              : 'bg-white text-stone-900 hover:bg-stone-100'
          }`}
          aria-label="Open ZARB AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
          {showPulse && (
            <span className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
              isAlabaster ? 'bg-stone-900' : 'bg-white'
            }`} />
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-[80] transition-all duration-300 animate-fade-in ${
            // Full screen on mobile, floating panel on desktop
            'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-full sm:w-[400px] sm:h-[560px] sm:rounded-2xl'
          } flex flex-col overflow-hidden border shadow-2xl ${
            isAlabaster
              ? 'bg-[#faf9f5] border-stone-300/80 shadow-[0_25px_60px_rgba(30,25,20,0.2)]'
              : 'bg-[#0d0d10] border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.6)]'
          }`}
          role="dialog"
          aria-label="ZARB AI Fashion Assistant"
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isAlabaster
              ? 'bg-[#f4f2ec] border-stone-300/60'
              : 'bg-[#111114] border-white/10'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isAlabaster
                  ? 'bg-stone-900 text-white'
                  : 'bg-white/10 text-white border border-white/20'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold tracking-wide ${
                  isAlabaster ? 'text-stone-900' : 'text-white'
                }`}>
                  ZARB AI
                </h3>
                <p className={`text-[10px] tracking-[0.15em] uppercase ${
                  isAlabaster ? 'text-stone-500' : 'text-stone-400'
                }`}>
                  {isLoading ? 'Thinking...' : 'Fashion Concierge'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isAlabaster
                  ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
                  : 'text-stone-400 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-5 py-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isAlabaster
                    ? 'bg-stone-900/10 text-stone-700'
                    : 'bg-white/[0.06] text-stone-300 border border-white/10'
                }`}>
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="text-center space-y-1.5">
                  <h4 className={`font-serif text-xl tracking-wide ${
                    isAlabaster ? 'text-stone-900' : 'text-white'
                  }`}>
                    Welcome to ZARB AI
                  </h4>
                  <p className={`text-xs font-sans max-w-[260px] mx-auto leading-relaxed ${
                    isAlabaster ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                    Your personal fashion concierge. Ask me anything about style, sizing, or our collections.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap justify-center gap-2 max-w-[320px]">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className={`text-[11px] px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        isAlabaster
                          ? 'bg-stone-900/[0.04] hover:bg-stone-900/[0.08] text-stone-700 border-stone-300/60'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 border-white/10'
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2.5 ${
                  msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user'
                    ? isAlabaster ? 'bg-stone-900 text-white' : 'bg-white/15 text-white'
                    : isAlabaster ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? isAlabaster
                      ? 'bg-stone-900 text-white rounded-tr-sm'
                      : 'bg-white/15 text-white rounded-tr-sm'
                    : isAlabaster
                      ? 'bg-stone-200/60 text-stone-800 rounded-tl-sm'
                      : 'bg-white/[0.06] text-stone-200 rounded-tl-sm border border-white/[0.06]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start space-x-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isAlabaster ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${
                  isAlabaster ? 'bg-stone-200/60' : 'bg-white/[0.06] border border-white/[0.06]'
                }`}>
                  <div className="flex space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isAlabaster ? 'bg-stone-500' : 'bg-stone-400'}`} style={{ animationDelay: '0ms' }} />
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isAlabaster ? 'bg-stone-500' : 'bg-stone-400'}`} style={{ animationDelay: '150ms' }} />
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isAlabaster ? 'bg-stone-500' : 'bg-stone-400'}`} style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`px-4 py-3 border-t shrink-0 ${
            isAlabaster ? 'bg-[#f4f2ec] border-stone-300/60' : 'bg-[#111114] border-white/10'
          }`}>
            <div className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 border transition-all ${
              isAlabaster
                ? 'bg-white border-stone-300/80 focus-within:border-stone-500'
                : 'bg-white/[0.05] border-white/10 focus-within:border-white/25'
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ZARB AI anything..."
                maxLength={1000}
                disabled={isLoading}
                className={`flex-1 text-sm bg-transparent outline-none placeholder:tracking-wide ${
                  isAlabaster
                    ? 'text-stone-900 placeholder:text-stone-400'
                    : 'text-white placeholder:text-stone-500'
                }`}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isAlabaster
                    ? 'text-stone-900 hover:bg-stone-200/60'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className={`text-[9px] text-center mt-1.5 tracking-wider uppercase ${
              isAlabaster ? 'text-stone-400' : 'text-stone-600'
            }`}>
              ZARB AI · Fashion Concierge
            </p>
          </div>
        </div>
      )}
    </>
  );
};
