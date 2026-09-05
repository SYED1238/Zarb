import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GenderType } from '../types/product';

interface HeroProps {
  onShopClick: (gender: GenderType) => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopClick }) => {
  const { gender, theme } = useStore();
  const isAlabaster = theme === 'alabaster';
  const [activeSlide, setActiveSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [desktopSlides, setDesktopSlides] = useState<string[]>([
    '/images/hero/women/desktop-1.jpg',
    '/images/hero/women/desktop-2.jpg',
    '/images/hero/women/desktop-3.jpg',
  ]);
  const [mobileSlides, setMobileSlides] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fallback high-fashion editorial images
  const fallbackWomen = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=2200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=2200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=85&w=2200&auto=format&fit=crop',
  ];

  // Clean up transition timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Preload all slideshow images in advance to prevent any decode lag or blank flashes
  useEffect(() => {
    const all = [...desktopSlides, ...mobileSlides, ...fallbackWomen, menImage, allImage];
    all.forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [desktopSlides, mobileSlides]);

  // Dynamically discover all available hero images
  useEffect(() => {
    let isMounted = true;

    const discoverImages = async () => {
      try {
        // Try Vite live server endpoint first
        const res = await fetch('/api/hero-images');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (Array.isArray(data.desktop) && data.desktop.length > 0) {
              setDesktopSlides(data.desktop);
            }
            if (Array.isArray(data.mobile) && data.mobile.length > 0) {
              setMobileSlides(data.mobile);
            }
            return;
          }
        }
      } catch {
        // Fallback for static production build: dynamically probe sequential images
      }

      // Client-side sequential probe fallback
      const probeList = async (prefix: 'desktop' | 'mobile', max = 25) => {
        const found: string[] = [];
        const testImage = (url: string): Promise<boolean> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
          });
        };

        for (let i = 1; i <= max; i++) {
          let exists = false;
          for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
            const path = `/images/hero/women/${prefix}-${i}.${ext}`;
            if (await testImage(path)) {
              found.push(path);
              exists = true;
              break;
            }
          }
          // If 2 consecutive numbers are missing after index 3, stop probing
          if (!exists && i > 3) break;
        }
        return found;
      };

      const [probedDesktop, probedMobile] = await Promise.all([
        probeList('desktop'),
        probeList('mobile'),
      ]);

      if (isMounted) {
        if (probedDesktop.length > 0) setDesktopSlides(probedDesktop);
        if (probedMobile.length > 0) setMobileSlides(probedMobile);
      }
    };

    discoverImages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active slides array: use mobileSlides on mobile if available, otherwise desktopSlides
  const activeSlidesList = isMobile && mobileSlides.length > 0 ? mobileSlides : desktopSlides;
  const totalSlides = activeSlidesList.length > 0 ? activeSlidesList.length : fallbackWomen.length;

  // Haute couture slide transition handler: tracks previous slide & triggers luxury shutter flash
  const goToSlide = (nextIndex: number) => {
    if (nextIndex === activeSlide) return;
    setPrevSlide(activeSlide);
    setActiveSlide(nextIndex);
    setIsTransitioning(true);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 950);
  };

  // 5.5-second automatic transition for women's hero with continuous Ken Burns motion
  useEffect(() => {
    if (gender === 'women' && totalSlides > 1 && !isHovered) {
      const timer = setInterval(() => {
        goToSlide((activeSlide + 1) % totalSlides);
      }, 5500);

      return () => clearInterval(timer);
    }
  }, [gender, totalSlides, isHovered, activeSlide]);

  // Ensure activeSlide doesn't exceed totalSlides
  useEffect(() => {
    if (activeSlide >= totalSlides) {
      setActiveSlide(0);
    }
  }, [totalSlides, activeSlide]);

  const menImage = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=85&w=2200&auto=format&fit=crop';
  const allImage = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=85&w=2200&auto=format&fit=crop';

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToSlide(activeSlide === 0 ? totalSlides - 1 : activeSlide - 1);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToSlide((activeSlide + 1) % totalSlides);
  };

  return (
    <section
      id="hero-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full min-h-[92vh] sm:min-h-screen flex items-end pb-16 sm:pb-24 overflow-hidden pt-28 sm:pt-36 select-none"
    >
      {/* Background Editorial Image Slides Layer (Layered Zero-Blink Cinematic Ken Burns) */}
      {gender === 'women' ? (
        <div className="absolute inset-0 overflow-hidden bg-[#09090b]">
          {(activeSlidesList.length > 0 ? activeSlidesList : fallbackWomen).map((imgUrl, idx) => {
            const isCurrent = activeSlide === idx;
            const isPrev = prevSlide === idx;

            // Only keep current and previous in DOM for silky 60fps performance
            if (!isCurrent && !isPrev) {
              return null;
            }

            const zIndex = isCurrent ? 2 : 1;

            return (
              <div
                key={imgUrl + idx}
                className={`absolute inset-0 bg-cover bg-center transition-all duration-[1400ms] ease-out pointer-events-none ${
                  isCurrent
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-[1.07]'
                }`}
                style={{
                  backgroundImage: `url(${imgUrl})`,
                  zIndex,
                  filter: 'brightness(0.64) contrast(1.05) saturate(0.96)',
                  willChange: 'opacity, transform',
                }}
              >
                {/* Slow ambient Ken Burns drift on the active image */}
                <div
                  className={`absolute inset-0 bg-cover bg-center ${isCurrent ? 'animate-ken-burns' : ''}`}
                  style={{
                    backgroundImage: `url(${imgUrl})`,
                    filter: 'inherit',
                  }}
                />
              </div>
            );
          })}

          {/* Haute Couture Editorial Shutter Flash & Prism Beam on Transition */}
          {isTransitioning && (
            <div
              key={`shutter-flash-${activeSlide}`}
              className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
            >
              <div className="absolute inset-y-0 -left-1/2 w-full bg-gradient-to-r from-transparent via-white/25 to-transparent transform -skew-x-12 animate-shutter-flash pointer-events-none" />
            </div>
          )}
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-out"
          style={{
            backgroundImage: `url(${gender === 'men' ? menImage : allImage})`,
            filter: 'brightness(0.6) contrast(1.05) saturate(0.9)',
          }}
        />
      )}

      {/* Cinematic Overlays */}
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-700 ${
          isAlabaster
            ? 'bg-gradient-to-t from-[#f6f5f0] via-black/40 to-black/65'
            : 'bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-[#09090b]/60'
        }`}
      />
      <div className="absolute inset-0 vignette-radial pointer-events-none opacity-80" />
      <div className="absolute inset-0 film-grain pointer-events-none opacity-30" />

      {/* Slide Navigation Controls & Indicators (Desktop only - hidden on mobile interface) */}
      {gender === 'women' && totalSlides > 1 && (
        <div className="hidden md:flex absolute top-28 sm:top-32 right-4 sm:right-10 z-20 items-center space-x-3 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10">
          {/* Previous Arrow */}
          <button
            onClick={handlePrevSlide}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dynamic Slide Indicators with Live Progress Filling */}
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="group relative flex flex-col items-center py-1 cursor-pointer"
                aria-label={`Jump to slide ${idx + 1}`}
              >
                <div
                  className={`h-1 rounded-full overflow-hidden transition-all duration-500 relative ${
                    activeSlide === idx
                      ? 'w-8 bg-white/30 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                      : 'w-2 sm:w-2.5 bg-white/20 group-hover:bg-white/60'
                  }`}
                >
                  {activeSlide === idx && (
                    <div
                      key={`progress-${activeSlide}`}
                      className="h-full bg-white rounded-full animate-slide-progress"
                    />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Next Arrow */}
          <button
            onClick={handleNextSlide}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Current / Total Counter */}
          <div className="text-[10px] tracking-widest text-stone-300 font-mono pl-1 border-l border-white/15">
            0{activeSlide + 1} / 0{totalSlides}
          </div>
        </div>
      )}

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          {/* Badge / Label */}
          <div className="inline-flex items-center space-x-2.5 sm:space-x-3 mb-4 sm:mb-6 bg-white/[0.08] backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-white/10 max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
            <span className="sm:hidden text-[10px] font-sans tracking-[0.22em] uppercase text-stone-200">
              NEW SEASON 2026 &middot; N° 08
            </span>
            <span className="hidden sm:inline text-xs font-sans tracking-[0.3em] uppercase text-stone-200 truncate">
              NEW SEASON 2026 &middot;{' '}
              {gender === 'women'
                ? `COLLECTION NO. 08 — WOMEN (SERIES 0${activeSlide + 1})`
                : gender === 'men'
                ? 'COLLECTION NO. 08 — MEN'
                : 'COMPLETE ATELIER COLLECTION'}
            </span>
          </div>

          {/* Large Headline */}
          <h1 className="text-[32px] sm:text-6xl md:text-7xl lg:text-8xl font-serif tracking-[0.02em] sm:tracking-[0.03em] text-white leading-[1.12] sm:leading-[1.05] uppercase mb-4 sm:mb-6 font-light">
            BUILT FOR YOUR <br />
            <span className="italic font-normal font-serif">NEXT CHAPTER</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-xs sm:text-lg text-stone-300 font-sans font-light tracking-[0.04em] sm:tracking-[0.06em] max-w-xl mb-6 sm:mb-10 leading-relaxed">
            {gender === 'women'
              ? 'Fluid silk charmeuse. Structured wool gabardine. Contemporary silhouettes for everyday poise.'
              : gender === 'men'
              ? 'Sculpted shoulders. Italian double-faced cashmere. Architectural tailoring for modern distinction.'
              : 'Unifying precision tailoring with quiet luxury. Created in limited atelier batches.'}
          </p>

          {/* Buttons: SHOP MEN & SHOP WOMEN (Desktop only - removed from mobile interface) */}
          <div className="hidden sm:flex flex-row items-center space-x-5 max-w-md">
            <button
              onClick={() => onShopClick('men')}
              className={`hero-btn group flex items-center justify-center space-x-3 px-8 py-4 rounded-xl text-xs sm:text-sm tracking-[0.25em] uppercase font-medium transition-all duration-300 cursor-pointer ${
                gender === 'men'
                  ? 'hero-btn-active bg-white text-black hover:bg-stone-200 shadow-xl'
                  : 'hero-btn-inactive bg-white/10 hover:bg-white text-white hover:text-black border border-white/20'
              }`}
            >
              <span className="hero-btn-text">SHOP MEN</span>
              <ArrowUpRight className="hero-btn-icon w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onShopClick('women')}
              className={`hero-btn group flex items-center justify-center space-x-3 px-8 py-4 rounded-xl text-xs sm:text-sm tracking-[0.25em] uppercase font-medium transition-all duration-300 cursor-pointer ${
                gender === 'women'
                  ? 'hero-btn-active bg-white text-black hover:bg-stone-200 shadow-xl'
                  : 'hero-btn-inactive bg-white/10 hover:bg-white text-white hover:text-black border border-white/20'
              }`}
            >
              <span className="hero-btn-text">SHOP WOMEN</span>
              <ArrowUpRight className="hero-btn-icon w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Banner Row: Scroll Hint & Atelier Details */}
        <div
          className={`mt-8 sm:mt-24 pt-6 pb-20 sm:pb-0 border-t flex items-center justify-between text-xs tracking-[0.2em] uppercase transition-colors duration-300 ${
            isAlabaster ? 'border-stone-400/40 text-stone-700' : 'border-white/10 text-stone-400'
          }`}
        >
          <div className="hidden sm:flex items-center space-x-6">
            <span>Biella Mills, Italy</span>
            <span>&middot;</span>
            <span>Kurabo Mills, Japan</span>
            <span>&middot;</span>
            <span>Grade-A Mongolian Cashmere</span>
          </div>

          <button
            onClick={scrollToCatalog}
            className={`flex items-center space-x-2 transition-colors cursor-pointer group mx-auto sm:mx-0 sm:ml-auto ${
              isAlabaster ? 'text-stone-800 hover:text-black' : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>DISCOVER THE PIECES</span>
            <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
