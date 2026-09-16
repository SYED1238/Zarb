import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, theme } = useStore();
  const isAlabaster = theme === 'alabaster';

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in pointer-events-none">
      <div
        className={`px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-3 text-xs tracking-[0.1em] border transition-all duration-300 ${
          isAlabaster
            ? 'bg-white/95 border-stone-300/90 text-stone-900 shadow-stone-300/30'
            : 'bg-[#121215]/95 border-white/20 text-white shadow-black/60'
        }`}
      >
        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="font-medium">{toastMessage}</span>
      </div>
    </div>
  );
};
