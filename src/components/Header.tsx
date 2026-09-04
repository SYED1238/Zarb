import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Heart,
  ShoppingBag,
  Sparkles,
  Layers,
  Compass,
  Gem,
  Sun,
  Moon,
  User,
} from 'lucide-react';

interface HeaderProps {
  onSelectCategory?: (cat: string) => void;
  onSelectFilter?: (filterKey: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSelectFilter }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setIsAccountDrawerOpen } = useAuth();
  const {
    gender,
    setGender,
    cartCount,
    wishlist,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsSearchOpen,
    theme,
    toggleTheme,
  } = useStore();

  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position: on home page keep words white until user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [lightX, setLightX] = useState<number>(50); // percentage 0-100
  const [isBarHovered, setIsBarHovered] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Mouse move handler for interactive dynamic downlight beam
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
    // Constrain within 15% - 85% for realistic spotlight bounds
    const clampedX = Math.max(15, Math.min(85, relativeX));
    setLightX(clampedX);
    setIsBarHovered(true);
  };

  const handleMouseLeave = () => {
    setIsBarHovered(false);
    setLightX(50); // reset smoothly to center
  };

  // Keyboard shortcut Ctrl+K or Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  const navItems = [
    {
      id: 'new',
      label: 'New Arrivals',
      icon: Sparkles,
      action: () => {
        if (onSelectFilter) onSelectFilter('newArrival');
        navigate(`/shop/${gender}`);
      },
    },
    {
      id: 'clothing',
      label: 'Collections',
      icon: Layers,
      action: () => navigate(`/shop/${gender}`),
    },
    {
      id: 'lookbook',
      label: 'Lookbook',
      icon: Compass,
      action: () => {
        if (window.location.pathname !== '/') {
          navigate('/');
          setTimeout(() => {
            document.getElementById('editorial-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          document.getElementById('editorial-section')?.scrollIntoView({ behavior: 'smooth' });
        }
      },
    },
    {
      id: 'atelier',
      label: 'The Atelier',
      icon: Gem,
      action: () => {
        if (window.location.pathname !== '/') {
          navigate('/');
          setTimeout(() => {
            document.getElementById('brand-story')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          document.getElementById('brand-story')?.scrollIntoView({ behavior: 'smooth' });
        }
      },
    },
  ];

  const isAlabaster = theme === 'alabaster';
  const isHomePage = location.pathname === '/';
  // Desktop white theme: on home page keep words white at top, turn black as soon as scrolled down. On other pages make words black.
  const isDarkText = isAlabaster && (!isHomePage || isScrolled);

  return (
    <>
      {/* Mobile Top Minimalist Brand Signature (Pure typography, scrolls naturally with hero) */}
      <div className="md:hidden absolute top-0 inset-x-0 z-30 flex items-center justify-center pt-5 pb-3 pointer-events-none select-none">
        <button
          onClick={() => {
            navigate('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="pointer-events-auto cursor-pointer focus:outline-none"
          aria-label="Zarb Home"
        >
          <span className="font-brand tracking-[0.35em] text-xs font-semibold text-white/95 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            ZARB
          </span>
        </button>
      </div>

      {/* Desktop Floating Liquid Glass Bar */}
      <div className="hidden md:block fixed top-6 inset-x-0 z-40 mx-auto w-[94%] max-w-6xl pointer-events-none select-none">
        {/* Relative Positioning Anchor */}
        <div className="relative w-full">
          {/* ======================================================== */}
          {/* THE DOWNWARD LIGHT BEAM EFFECT ("LIGHT ON PAGE")          */}
          {/* ======================================================== */}
          <div className="absolute -bottom-28 sm:-bottom-36 left-0 right-0 h-36 sm:h-48 pointer-events-none overflow-visible -z-10">
            {/* Primary Dynamic Spotlight Core (Follows mouse or stays centered) */}
            <div
              className="absolute top-0 -translate-x-1/2 w-80 sm:w-[480px] h-36 sm:h-44 transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: `${lightX}%`,
                background:
                  'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.2) 28%, rgba(255, 255, 255, 0.05) 55%, transparent 80%)',
                filter: 'blur(18px)',
                opacity: isBarHovered ? 0.95 : 0.75,
              }}
            />

            {/* Intense Razor-Thin Specular Emittance Seam under the bar */}
            <div
              className="absolute top-0 -translate-x-1/2 w-64 sm:w-96 h-[2px] transition-all duration-200 ease-out pointer-events-none"
              style={{
                left: `${lightX}%`,
                background:
                  'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                filter: 'blur(1px)',
              }}
            />

            {/* Wide Diffuse Ambient Floor Glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] sm:w-[96%] h-32 sm:h-44 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 75% 100% at 50% 0%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.07) 45%, transparent 75%)',
                filter: 'blur(30px)',
              }}
            />
          </div>

          {/* ======================================================== */}
          {/* THE LIQUID GLASS BAR (IDENTICAL TRANSPARENCY & LETTERS)   */}
          {/* ======================================================== */}
          <header
            ref={navRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="pointer-events-auto relative w-full rounded-2xl sm:rounded-[22px] px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-500 flex items-center justify-between liquid-glass-bar"
          >
            {/* Liquid Glass Internal Specular Refraction Sheen */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-[22px] pointer-events-none overflow-hidden -z-0">
              <div
                className="absolute -top-12 -left-12 w-64 h-28 bg-gradient-to-br from-white/25 via-white/5 to-transparent blur-md transform -rotate-12 pointer-events-none transition-all duration-300"
                style={{
                  left: `${lightX - 25}%`,
                }}
              />
            </div>

            {/* Left: Brand Monogram / Wordmark */}
            <button
              onClick={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative z-10 group flex items-center space-x-2.5 text-left cursor-pointer focus:outline-none"
              aria-label="Zarb Home"
            >
              <span className={`font-brand tracking-[0.25em] text-sm sm:text-base font-semibold transition-colors ${isDarkText
                  ? 'text-black group-hover:text-stone-700 drop-shadow-none'
                  : 'text-white group-hover:text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
                }`}>
                ZARB
              </span>
            </button>

            {/* Center: Minimalist Icon + Label Items (Black letters when isDarkText) */}
            <nav className="relative z-10 hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-sans tracking-[0.06em]">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`liquid-droplet group flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${isDarkText
                        ? 'text-stone-900 hover:text-black hover:bg-black/5'
                        : 'text-stone-200 hover:text-white'
                      }`}
                  >
                    <IconComponent className={`w-4 h-4 transition-colors ${isDarkText
                        ? 'text-stone-800 group-hover:text-black'
                        : 'text-stone-300 group-hover:text-white'
                      }`} />
                    <span className={`font-medium ${isDarkText
                        ? 'text-black font-semibold drop-shadow-none'
                        : 'text-stone-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]'
                      }`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Gender Switcher, Theme Switcher & Actions */}
            <div className="relative z-10 flex items-center space-x-2 sm:space-x-3">
              {/* Liquid Droplet Gender Switcher Pill */}
              <div className={`hidden sm:flex items-center p-0.5 rounded-lg backdrop-blur-md border text-[11px] font-sans tracking-[0.1em] uppercase ${isDarkText
                  ? 'bg-stone-200/90 border-stone-300/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]'
                  : 'bg-black/40 border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                }`}>
                <button
                  type="button"
                  onClick={() => setGender('men')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${gender === 'men'
                      ? (isDarkText ? 'bg-black text-white font-semibold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                      : (isDarkText ? 'text-stone-700 hover:text-black' : 'text-stone-300 hover:text-white')
                    }`}
                >
                  Men
                </button>
                <button
                  type="button"
                  onClick={() => setGender('women')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${gender === 'women'
                      ? (isDarkText ? 'bg-black text-white font-semibold shadow-sm' : 'bg-white text-black font-semibold shadow-md')
                      : (isDarkText ? 'text-stone-700 hover:text-black' : 'text-stone-300 hover:text-white')
                    }`}
                >
                  Women
                </button>
              </div>

              {/* Theme Switcher Button (Noir vs Alabaster) */}
              <button
                onClick={toggleTheme}
                className={`liquid-droplet p-2 rounded-xl transition-all cursor-pointer focus:outline-none ${isDarkText
                    ? 'text-stone-900 hover:text-amber-600 hover:bg-black/5'
                    : 'text-stone-300 hover:text-amber-300'
                  }`}
                aria-label="Toggle Haute Theme"
                title={isAlabaster ? 'Switch to Noir Obsidian Theme' : 'Switch to Alabaster Ivory Theme'}
              >
                {isAlabaster ? (
                  <Moon className={`w-4 h-4 stroke-[2] ${isDarkText ? 'text-stone-900 hover:text-amber-600' : 'text-amber-300'}`} />
                ) : (
                  <Sun className="w-4 h-4 stroke-[1.75]" />
                )}
              </button>

              {/* Search Icon (Desktop only - mobile has it in the bottom liquid bar) */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`hidden md:flex liquid-droplet p-2 rounded-xl transition-all cursor-pointer focus:outline-none ${isDarkText
                    ? 'text-stone-900 hover:text-black hover:bg-black/5'
                    : 'text-stone-300 hover:text-white'
                  }`}
                aria-label="Search"
                title="Search (⌘K)"
              >
                <Search className={`w-4 h-4 ${isDarkText ? 'stroke-[2]' : 'stroke-[1.75]'}`} />
              </button>

              {/* Wishlist Icon */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className={`liquid-droplet relative p-2 rounded-xl transition-all cursor-pointer focus:outline-none ${isDarkText
                    ? 'text-stone-900 hover:text-black hover:bg-black/5'
                    : 'text-stone-300 hover:text-white'
                  }`}
                aria-label="Wishlist"
                title="Saved Items"
              >
                <Heart className={`w-4 h-4 ${isDarkText ? 'stroke-[2]' : 'stroke-[1.75]'}`} />
                {wishlist.length > 0 && (
                  <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isDarkText ? 'bg-black' : 'bg-white animate-pulse'
                    }`} />
                )}
              </button>

              {/* User Account & Orders Button */}
              <button
                onClick={() => setIsAccountDrawerOpen(true)}
                className={`liquid-droplet relative p-2 rounded-xl transition-all cursor-pointer focus:outline-none flex items-center justify-center ${isDarkText
                    ? 'text-stone-900 hover:text-black hover:bg-black/5'
                    : 'text-stone-300 hover:text-white'
                  }`}
                aria-label="Account & Orders"
                title={user ? `${user.fullName} (Orders & Account)` : 'Client Sign In (Google Auth)'}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className={`w-4 h-4 rounded-full object-cover ${isDarkText ? 'border border-stone-800' : 'border border-amber-400/80'}`}
                  />
                ) : (
                  <User className={`w-4 h-4 ${isDarkText ? 'stroke-[2]' : 'stroke-[1.75]'}`} />
                )}
                {user && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Shopping Bag Button (Desktop only - mobile has it in the bottom liquid bar) */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`hidden md:flex liquid-droplet items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none group shadow-md ${isDarkText
                    ? 'bg-black text-white hover:bg-stone-800 border-black shadow-sm'
                    : 'bg-white/[0.12] hover:bg-white text-white hover:text-black border-white/25 hover:border-white'
                  }`}
                aria-label="Shopping Bag"
                title="Shopping Bag"
              >
                <ShoppingBag className={`w-3.5 h-3.5 ${isDarkText ? 'stroke-[2]' : 'stroke-[1.75]'}`} />
                <span className={`text-xs font-mono ${isDarkText ? 'font-bold text-white' : 'font-medium'}`}>
                  {cartCount}
                </span>
              </button>
            </div>
          </header>
        </div>
      </div>
    </>
  );
};
