import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';

interface EntryScreenProps {
  onEnter: (selectedGender: 'men' | 'women') => void;
}

export const EntryScreen: React.FC<EntryScreenProps> = ({ onEnter }) => {
  const { setGender, theme, toggleTheme } = useStore();
  const [selected, setSelected] = useState<'men' | 'women' | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [hovered, setHovered] = useState<'men' | 'women' | null>(null);

  const isAlabaster = theme === 'alabaster';

  const handleSelect = (genderChoice: 'men' | 'women') => {
    setSelected(genderChoice);
    setGender(genderChoice);
    setIsExiting(true);

    // Cinematic smooth transition sequence
    setTimeout(() => {
      onEnter(genderChoice);
    }, 600);
  };

  // Background editorial image adapts to hover or selection
  const getBackgroundImage = () => {
    if (selected === 'men' || hovered === 'men') {
      return 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=85&w=2000&auto=format&fit=crop';
    }
    if (selected === 'women' || hovered === 'women') {
      return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=2000&auto=format&fit=crop';
    }
    // Atmospheric dual/moody editorial
    return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=85&w=2000&auto=format&fit=crop';
  };

  return (
    <div
      id="entry-screen-dialog"
      className={`fixed inset-0 z-[999] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-label="Welcome and Collection Selection"
    >
      {/* Background Editorial Image with cinematic crossfade */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out transform scale-105"
        style={{
          backgroundImage: `url(${getBackgroundImage()})`,
          filter: isExiting
            ? isAlabaster
              ? 'blur(0px) brightness(0.95)'
              : 'blur(0px) brightness(0.65)'
            : isAlabaster
              ? 'blur(20px) brightness(0.85) saturate(1.1)'
              : 'blur(22px) brightness(0.45) saturate(0.85)',
          transform: isExiting ? 'scale(1)' : 'scale(1.06)',
        }}
      />

      {/* Cinematic Vignette & Ambient Light */}
      {isAlabaster ? (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, transparent 35%, rgba(28, 25, 23, 0.25) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-[#f8f7f2]/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/10 via-transparent to-stone-900/15 pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 vignette-radial pointer-events-none" />
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          <div className="absolute inset-0 film-grain pointer-events-none" />
        </>
      )}

      {/* Brand Top Bar on Entry */}
      <header className="absolute top-0 left-0 right-0 p-5 sm:p-8 flex items-center justify-between z-20 select-none">
        <div className="flex items-center space-x-2">
          <div
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] font-sans transition-all duration-300 ${
              isAlabaster
                ? 'bg-white/80 backdrop-blur-md text-stone-800 border border-stone-200/80 shadow-sm font-medium'
                : 'bg-black/40 backdrop-blur-md text-white/70 border border-white/10 shadow-sm'
            }`}
          >
            Maison de Haute Prêt-à-Porter
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div
            className={`hidden xs:block px-3.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase font-sans transition-all duration-300 ${
              isAlabaster
                ? 'bg-white/80 backdrop-blur-md text-stone-700 border border-stone-200/80 shadow-sm font-normal'
                : 'bg-black/40 backdrop-blur-md text-white/60 border border-white/10 shadow-sm'
            }`}
          >
            Collection N° 08 / 2026
          </div>

          {/* Theme Switcher in Entry Screen */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none flex items-center justify-center ${
              isAlabaster
                ? 'bg-white/85 hover:bg-white text-stone-800 hover:text-amber-600 border border-stone-200/80 shadow-sm'
                : 'bg-black/40 hover:bg-black/60 text-stone-300 hover:text-amber-300 border border-white/10 shadow-sm'
            }`}
            aria-label={isAlabaster ? 'Switch to Noir theme' : 'Switch to Alabaster theme'}
            title={isAlabaster ? 'Switch to Noir Midnight' : 'Switch to Alabaster Ivory'}
          >
            {isAlabaster ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Center Luxury Welcome Panel */}
      <div
        id="entry-screen-card"
        className={`relative z-20 w-full max-w-xl mx-4 sm:mx-6 p-8 sm:p-12 md:p-14 text-center rounded-[24px] transition-all duration-700 ease-out ${
          isExiting
            ? 'translate-y-12 opacity-0 scale-95 blur-sm'
            : 'translate-y-0 opacity-100 scale-100'
        }`}
        style={
          isAlabaster
            ? {
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 242, 0.92) 100%)',
                backdropFilter: 'blur(36px) saturate(190%)',
                WebkitBackdropFilter: 'blur(36px) saturate(190%)',
                border: '1px solid rgba(214, 211, 209, 0.85)',
                boxShadow: '0 35px 80px -15px rgba(28, 25, 23, 0.16), 0 10px 30px -5px rgba(0, 0, 0, 0.05), inset 0 1.5px 2px rgba(255, 255, 255, 1)',
              }
            : {
                background: 'rgba(15, 15, 15, 0.65)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(255, 255, 255, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
              }
        }
      >
        {/* Subtle Brand Watermark */}
        <div
          className={`flex items-center justify-center space-x-2.5 mb-5 sm:mb-6 ${
            isAlabaster ? 'text-stone-600' : 'text-white/60'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 animate-pulse ${isAlabaster ? 'text-amber-600' : 'text-amber-400'}`} />
          <span
            className={`entry-watermark text-[11px] uppercase tracking-[0.45em] font-sans font-semibold ${
              isAlabaster ? 'text-stone-700' : 'text-white/80'
            }`}
          >
            ZARB
          </span>
          <Sparkles className={`w-3.5 h-3.5 animate-pulse ${isAlabaster ? 'text-amber-600' : 'text-amber-400'}`} />
        </div>

        {/* Headline */}
        <h1
          className={`entry-title text-4xl sm:text-5xl md:text-6xl font-serif tracking-[0.05em] mb-4 leading-tight font-light ${
            isAlabaster ? 'text-stone-950 drop-shadow-sm' : 'text-white'
          }`}
          style={{ color: isAlabaster ? '#1c1917' : '#ffffff' }}
        >
          DEFINE YOUR STYLE
        </h1>

        {/* Small Supporting Text */}
        <p
          className={`entry-subtitle text-sm sm:text-base font-sans font-light tracking-[0.08em] max-w-md mx-auto mb-9 sm:mb-11 ${
            isAlabaster ? 'text-stone-600 font-normal' : 'text-stone-300/80'
          }`}
          style={{ color: isAlabaster ? '#57534e' : 'rgba(214, 211, 209, 0.8)' }}
        >
          Choose your collection to enter.
        </p>

        {/* Exactly TWO primary choices: [ MEN ] & [ WOMEN ] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-md mx-auto">
          {/* MEN BUTTON */}
          <button
            type="button"
            onClick={() => handleSelect('men')}
            onMouseEnter={() => setHovered('men')}
            onMouseLeave={() => setHovered(null)}
            className={`group entry-btn relative overflow-hidden px-8 py-5 rounded-xl border text-sm sm:text-base font-sans tracking-[0.25em] uppercase transition-all duration-400 ease-out flex items-center justify-center space-x-3 cursor-pointer ${
              isAlabaster
                ? selected === 'men'
                  ? 'entry-btn-selected bg-black text-white border-black shadow-[0_0_35px_rgba(0,0,0,0.35)] scale-[1.03] font-semibold'
                  : 'bg-stone-900 hover:bg-black text-white border-stone-800 hover:border-black hover:scale-[1.02] shadow-[0_8px_25px_rgba(0,0,0,0.16)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.26)] font-medium'
                : selected === 'men'
                  ? 'entry-btn-selected bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-102 font-semibold'
                  : 'bg-white/[0.06] hover:bg-white text-white hover:text-black border-white/20 hover:border-white hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] font-medium'
            }`}
            style={
              isAlabaster
                ? {
                    backgroundColor: selected === 'men' ? '#000000' : '#1c1917',
                    color: '#ffffff',
                    borderColor: selected === 'men' ? '#000000' : '#292524',
                  }
                : undefined
            }
            aria-label="Enter Men's Collection"
          >
            <span
              className="relative z-10 transition-colors duration-300 font-medium"
              style={{ color: isAlabaster ? '#ffffff' : undefined }}
            >
              MEN
            </span>
            <ArrowRight
              className={`w-4 h-4 transition-transform duration-300 ${
                selected === 'men' ? 'translate-x-1.5' : 'group-hover:translate-x-1.5'
              }`}
              style={{ color: isAlabaster ? '#ffffff' : undefined }}
            />
          </button>

          {/* WOMEN BUTTON */}
          <button
            type="button"
            onClick={() => handleSelect('women')}
            onMouseEnter={() => setHovered('women')}
            onMouseLeave={() => setHovered(null)}
            className={`group entry-btn relative overflow-hidden px-8 py-5 rounded-xl border text-sm sm:text-base font-sans tracking-[0.25em] uppercase transition-all duration-400 ease-out flex items-center justify-center space-x-3 cursor-pointer ${
              isAlabaster
                ? selected === 'women'
                  ? 'entry-btn-selected bg-black text-white border-black shadow-[0_0_35px_rgba(0,0,0,0.35)] scale-[1.03] font-semibold'
                  : 'bg-stone-900 hover:bg-black text-white border-stone-800 hover:border-black hover:scale-[1.02] shadow-[0_8px_25px_rgba(0,0,0,0.16)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.26)] font-medium'
                : selected === 'women'
                  ? 'entry-btn-selected bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-102 font-semibold'
                  : 'bg-white/[0.06] hover:bg-white text-white hover:text-black border-white/20 hover:border-white hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] font-medium'
            }`}
            style={
              isAlabaster
                ? {
                    backgroundColor: selected === 'women' ? '#000000' : '#1c1917',
                    color: '#ffffff',
                    borderColor: selected === 'women' ? '#000000' : '#292524',
                  }
                : undefined
            }
            aria-label="Enter Women's Collection"
          >
            <span
              className="relative z-10 transition-colors duration-300 font-medium"
              style={{ color: isAlabaster ? '#ffffff' : undefined }}
            >
              WOMEN
            </span>
            <ArrowRight
              className={`w-4 h-4 transition-transform duration-300 ${
                selected === 'women' ? 'translate-x-1.5' : 'group-hover:translate-x-1.5'
              }`}
              style={{ color: isAlabaster ? '#ffffff' : undefined }}
            />
          </button>
        </div>

        {/* Footnote hint */}
        <div
          className={`entry-footnote mt-8 sm:mt-10 text-[10px] sm:text-[11px] tracking-[0.22em] uppercase font-sans transition-colors duration-300 ${
            isAlabaster ? 'text-stone-500 font-medium' : 'text-white/40'
          }`}
          style={{ color: isAlabaster ? '#78716c' : undefined }}
        >
          Curated silhouettes &middot; Complimentary worldwide shipping
        </div>
      </div>

      {/* Subtle bottom credit */}
      <div id="entry-screen-footer" className="absolute bottom-6 text-center z-20 select-none">
        <div
          className={`inline-flex items-center px-6 py-2 rounded-full text-[10px] sm:text-xs tracking-[0.3em] uppercase transition-all duration-300 ${
            isAlabaster
              ? 'bg-white/80 backdrop-blur-md text-stone-700 border border-stone-200/80 shadow-sm font-medium'
              : 'bg-black/40 backdrop-blur-md text-white/50 border border-white/10 shadow-sm'
          }`}
        >
          Paris &middot; Milan &middot; Tokyo &middot; New York
        </div>
      </div>
    </div>
  );
};
