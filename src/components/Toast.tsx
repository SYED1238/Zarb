import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in pointer-events-none">
      <div className="bg-[#121215]/95 border border-white/20 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-3 text-xs tracking-[0.1em]">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-light">{toastMessage}</span>
      </div>
    </div>
  );
};
