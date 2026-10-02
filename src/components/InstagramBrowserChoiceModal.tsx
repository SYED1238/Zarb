import React, { useState, useEffect } from 'react';
import { Compass, ExternalLink, Copy, Check, Sparkles, MoreHorizontal } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  shouldShowInstagramChoice,
  openInExternalBrowser,
  isIosDevice,
} from '../utils/browserDetection';

export const InstagramBrowserChoiceModal: React.FC = () => {
  const { theme, showToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAttemptedHandoff, setHasAttemptedHandoff] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Detect whether to display the modal on initial mount
  useEffect(() => {
    if (shouldShowInstagramChoice()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-trigger browser handoff when modal opens
  useEffect(() => {
    if (isOpen && !hasAttemptedHandoff) {
      // Small delay so the user sees the modal before the handoff attempt
      const timer = setTimeout(() => {
        setHasAttemptedHandoff(true);
        openInExternalBrowser();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasAttemptedHandoff]);

  // Manual retry: hand off to external / default browser
  const handleOpenInBrowser = () => {
    setHasAttemptedHandoff(true);
    openInExternalBrowser();
  };

  // Quick fallback helper: Copy current link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast('ZARB link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('Link copied');
    }
  };

  if (!isOpen) return null;

  const isAlabaster = theme === 'alabaster';
  const isIos = isIosDevice();

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instagram-choice-title"
    >
      {/* Dimmed backdrop — NOT dismissable, user must open in browser */}
      <div
        className={`fixed inset-0 transition-opacity duration-300 ${
          isAlabaster ? 'bg-stone-900/40 backdrop-blur-md' : 'bg-black/80 backdrop-blur-md'
        }`}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border z-10 shadow-2xl overflow-hidden animate-fade-in transition-all duration-300 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-7 ${
          isAlabaster
            ? 'bg-[#faf9f5]/95 backdrop-blur-2xl border-stone-300/80 text-stone-900 shadow-[0_25px_60px_rgba(30,25,20,0.18)]'
            : 'bg-[#0d0d10]/95 backdrop-blur-2xl border-white/15 text-stone-100 shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Mobile Sheet Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className={`w-12 h-1 rounded-full ${isAlabaster ? 'bg-stone-300' : 'bg-white/20'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center px-6 pt-3 sm:pt-6 pb-2">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-500 font-semibold">
              WELCOME TO ZARB
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="px-6 pt-2 pb-5 space-y-1 text-left">
          <h2
            id="instagram-choice-title"
            className={`font-serif text-2xl sm:text-3xl tracking-[0.02em] font-normal leading-snug ${
              isAlabaster ? 'text-stone-950' : 'text-white'
            }`}
          >
            Opening in your browser
          </h2>
          <p className={`text-xs sm:text-sm font-sans ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
            For the best shopping, checkout & payment experience.
          </p>
        </div>

        {/* Open in Browser Button */}
        <div className="px-6 space-y-3.5">
          <button
            type="button"
            onClick={handleOpenInBrowser}
            className={`w-full group flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 active:scale-[0.98] cursor-pointer text-left ${
              isAlabaster
                ? 'bg-gradient-to-r from-stone-900/[0.10] to-stone-900/[0.04] hover:from-stone-900/[0.15] hover:to-stone-900/[0.08] text-stone-950 border border-stone-900/20 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-stone-900/10'
                : 'bg-gradient-to-r from-white/[0.15] to-white/[0.08] hover:from-white/[0.22] hover:to-white/[0.12] text-white border border-white/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(255,255,255,0.06),0_2px_12px_rgba(0,0,0,0.4)] ring-1 ring-white/15'
            }`}
          >
            <div className="flex items-center space-x-3.5 min-w-0 flex-1 mr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isAlabaster
                    ? 'bg-stone-900/10 border-stone-900/20 text-stone-900'
                    : 'bg-white/10 border-white/20 text-white shadow-inner'
                }`}
              >
                <Compass className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
                <span className="text-sm sm:text-base font-medium tracking-wide shrink-0">
                  Open in {isIos ? 'Safari' : 'Browser'}
                </span>
                {hasAttemptedHandoff && (
                  <span
                    className={`inline-flex items-center text-[9px] sm:text-[9.5px] font-mono tracking-[0.18em] uppercase font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                      isAlabaster
                        ? 'text-amber-700 bg-amber-500/10 border-amber-500/25'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                    }`}
                  >
                    TAP TO RETRY
                  </span>
                )}
              </div>
            </div>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                isAlabaster
                  ? 'bg-stone-900/5 border-stone-900/15 text-stone-800 group-hover:translate-x-0.5'
                  : 'bg-white/10 border-white/20 text-white group-hover:translate-x-0.5'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Fallback Guidance — shown after handoff attempt */}
        {hasAttemptedHandoff && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl border animate-fade-in text-xs space-y-2 ${
              isAlabaster
                ? 'bg-amber-500/10 border-amber-500/25 text-stone-800'
                : 'bg-amber-500/[0.08] border-amber-500/20 text-stone-200'
            }`}
          >
            <div className="flex items-start space-x-2">
              <MoreHorizontal className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-500">
                  Didn&apos;t open automatically?
                </p>
                <p className={`text-[11px] leading-relaxed ${isAlabaster ? 'text-stone-700' : 'text-stone-300'}`}>
                  Tap the three dots (<strong>&bull;&bull;&bull;</strong>) in Instagram&apos;s top-right corner and select{' '}
                  <strong>&ldquo;Open in {isIos ? 'Safari' : 'external browser'}&rdquo;</strong>.
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-amber-500/20">
              <span className="text-[10px] font-mono text-stone-400">Or copy link to paste in your browser:</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-500 text-white'
                    : isAlabaster
                    ? 'bg-stone-900/10 hover:bg-stone-900/15 text-stone-900 border border-stone-900/15'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
