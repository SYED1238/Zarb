import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const { theme } = useStore();
  const isAlabaster = theme === 'alabaster';
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
    }
  };

  return (
    <section
      id="newsletter-section"
      className={`py-20 sm:py-28 relative overflow-hidden transition-colors duration-500 ${
        isAlabaster
          ? 'bg-[#f6f5f0] border-t border-stone-200/80 text-stone-900'
          : 'bg-[#09090b] border-t border-white/10 text-white'
      }`}
    >
      <div className="absolute inset-0 film-grain pointer-events-none opacity-20" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Atelier Badge */}
        <div
          className={`inline-flex items-center space-x-2 mb-4 px-4 py-1.5 rounded-full transition-colors duration-300 ${
            isAlabaster
              ? 'bg-stone-200/70 text-stone-700 border border-stone-300/80 shadow-xs'
              : 'text-stone-400 bg-white/[0.04] border border-white/10'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAlabaster ? 'text-amber-700' : 'text-amber-400'}`} />
          <span className="text-[11px] font-sans tracking-[0.3em] uppercase font-medium">
            Private Atelier Roster
          </span>
        </div>

        {/* Main Heading: ENTER THE INNER SANCTUM */}
        <h2
          className={`text-3xl sm:text-4xl md:text-5xl font-serif tracking-[0.04em] mb-4 font-normal transition-colors duration-300 ${
            isAlabaster ? 'text-stone-950' : 'text-white'
          }`}
          style={{
            color: isAlabaster ? '#141416' : '#ffffff',
            WebkitTextFillColor: isAlabaster ? '#141416' : '#ffffff',
          }}
        >
          ENTER THE INNER SANCTUM
        </h2>

        {/* Subtitle */}
        <p
          className={`text-xs sm:text-sm max-w-lg mx-auto mb-10 leading-relaxed font-light transition-colors duration-300 ${
            isAlabaster ? 'text-stone-600 font-normal' : 'text-stone-400'
          }`}
          style={{ color: isAlabaster ? '#57534e' : undefined }}
        >
          Receive confidential invitations to seasonal runway debuts, private salon sales, and limited numbered garment allocations.
        </p>

        {subscribed ? (
          <div
            className={`p-6 rounded-2xl max-w-md mx-auto animate-fade-in flex items-center justify-center space-x-3 transition-colors duration-300 ${
              isAlabaster
                ? 'bg-white border border-emerald-300/80 text-emerald-800 shadow-sm'
                : 'bg-white/[0.04] border border-white/20 text-emerald-400'
            }`}
          >
            <Check className="w-5 h-5" />
            <span className="text-xs tracking-[0.15em] uppercase font-medium">
              Welcome to the Atelier. Check your private inbox.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className={`flex-1 rounded-xl px-5 py-4 text-xs tracking-[0.1em] transition-all duration-300 focus:outline-none ${
                isAlabaster
                  ? 'bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-900 shadow-xs'
                  : 'bg-white/[0.04] border border-white/15 text-white placeholder-stone-500 focus:border-white focus:bg-white/[0.07]'
              }`}
              style={{
                backgroundColor: isAlabaster ? '#ffffff' : undefined,
                color: isAlabaster ? '#141416' : undefined,
              }}
            />
            <button
              type="submit"
              className={`px-7 py-4 rounded-xl text-xs tracking-[0.2em] uppercase font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                isAlabaster
                  ? 'bg-stone-950 hover:bg-black text-white hover:shadow-lg'
                  : 'bg-white hover:bg-stone-200 text-black shadow-lg'
              }`}
            >
              <span>JOIN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Value Proposition Pills */}
        <div
          className={`mt-9 flex flex-wrap items-center justify-center gap-6 text-[10px] tracking-[0.22em] uppercase transition-colors duration-300 ${
            isAlabaster ? 'text-stone-600 font-medium' : 'text-stone-500'
          }`}
          style={{ color: isAlabaster ? '#6b665f' : undefined }}
        >
          <span>Private Pre-Access</span>
          <span className={isAlabaster ? 'text-stone-400' : 'text-stone-600'}>&middot;</span>
          <span>Complimentary Garment Care</span>
          <span className={isAlabaster ? 'text-stone-400' : 'text-stone-600'}>&middot;</span>
          <span>Bespoke Monogramming</span>
        </div>
      </div>
    </section>
  );
};
