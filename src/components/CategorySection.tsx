import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { CategoryItem } from '../data/categories';
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getMediaUrl } from '../utils/media';

interface CategoryTileCardProps {
  cat: CategoryItem;
  countBadge: string;
  onCardClick: (slug: string) => void;
  isAlabaster: boolean;
}

const CategoryTileCard: React.FC<CategoryTileCardProps> = ({
  cat,
  countBadge,
  onCardClick,
  isAlabaster,
}) => {
  // Collect all available images for this category (uploaded from admin page or local catalog)
  const images = useMemo(() => {
    const list: string[] = [];
    if (cat.images && Array.isArray(cat.images)) {
      for (const img of cat.images) {
        if (img && typeof img === 'string' && img.trim().length > 0 && !img.includes('images.unsplash.com')) {
          list.push(img.trim());
        }
      }
    }
    if (cat.image && typeof cat.image === 'string' && cat.image.trim().length > 0 && !cat.image.includes('images.unsplash.com')) {
      if (!list.includes(cat.image.trim())) {
        list.unshift(cat.image.trim());
      }
    }
    return list;
  }, [cat.images, cat.image]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Automatic gentle crossfade slideshow
  useEffect(() => {
    if (images.length <= 1) return;
    const intervalTime = isHovered ? 2600 : 4200;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [images.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      onClick={() => onCardClick(cat.slug)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative select-none cursor-pointer shrink-0 snap-center sm:snap-start transition-all duration-700 ease-out hover:-translate-y-3 w-[290px] sm:w-[330px] md:w-[350px] h-[490px] sm:h-[540px] md:h-[570px]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(cat.slug);
        }
      }}
      aria-label={`Explore ${cat.name} collection`}
    >
      {/* ========================================================================= */}
      {/* 1. THICK 3D FROSTED GLASS AIRPLANE WINDOW BEZEL (VISIONOS CAPSULE PORTAL) */}
      {/* ========================================================================= */}
      <div
        className={`relative w-full h-full p-3.5 sm:p-4 rounded-[86px] sm:rounded-[100px] md:rounded-[110px] transition-all duration-700 ${
          isAlabaster
            ? 'bg-gradient-to-b from-white via-[#f5f2eb] to-[#e8e4db] border-[3.5px] border-white shadow-[0_26px_55px_-12px_rgba(40,30,20,0.20),inset_0_2px_5px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(0,0,0,0.07)] group-hover:shadow-[0_34px_65px_-10px_rgba(40,30,20,0.28)]'
            : 'bg-gradient-to-b from-white/[0.24] via-[#1c1e22]/90 to-white/[0.18] backdrop-blur-2xl border-[3.5px] border-white/35 shadow-[0_32px_70px_-15px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.45),inset_0_-4px_8px_rgba(0,0,0,0.75)] group-hover:border-amber-400/50 group-hover:shadow-[0_36px_75px_-15px_rgba(251,191,36,0.25)]'
        }`}
      >
        {/* Outer Specular Rim Highlight */}
        <div className="absolute inset-0 rounded-[86px] sm:rounded-[100px] md:rounded-[110px] pointer-events-none ring-1 ring-white/25" />

        {/* ========================================================================= */}
        {/* 2. INNER VIEWPORT WINDOW PANE (CLIPPED CAPSULE PORTAL)                    */}
        {/* ========================================================================= */}
        <div className={`relative w-full h-full rounded-[70px] sm:rounded-[82px] md:rounded-[92px] overflow-hidden shadow-inner ${
          images.length > 0
            ? 'bg-black/40'
            : isAlabaster
              ? 'bg-gradient-to-b from-[#f2ece2] via-[#e8e1d5] to-[#dbd4c7]'
              : 'bg-gradient-to-b from-[#16181d] via-[#0f1013] to-[#070709]'
        }`}>
          {/* A. If images exist: render visual (supports photos & cutout PNGs with studio backdrop) */}
          {images.length > 0 ? (
            <div className="absolute inset-0 overflow-hidden">
              {/* Subtle textured canvas backing for depth */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: "url('/images/textures/studio-texture.jpg')" }}
              />
              {images.map((imgUrl, idx) => {
                const isActive = activeIdx === idx;
                const isPng = imgUrl.toLowerCase().includes('.png');
                return (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-all duration-1000 ease-out will-change-transform ${
                      isPng ? 'bg-contain bg-center bg-no-repeat' : 'bg-cover bg-center'
                    } ${
                      isActive
                        ? 'opacity-100 scale-100 group-hover:scale-105 brightness-[0.88] contrast-[1.06]'
                        : 'opacity-0 scale-95 brightness-[0.6] contrast-[1.0]'
                    }`}
                    style={{ backgroundImage: `url(${getMediaUrl(imgUrl)})` }}
                  />
                );
              })}
            </div>
          ) : (
            /* B. If no images uploaded yet: Luxury Haute Couture Portal Chamber */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
              {/* Subtle ambient light pool */}
              <div className="absolute w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none group-hover:bg-amber-500/18 transition-all duration-700" />

              {/* Architectural Portal Aperture */}
              <div className="relative z-10 flex flex-col items-center space-y-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-700 group-hover:scale-110 ${
                  isAlabaster
                    ? 'bg-white/10 border border-white/20 shadow-xl text-amber-300'
                    : 'bg-white/[0.04] border border-white/20 shadow-2xl text-amber-400 group-hover:border-amber-400/60'
                }`}>
                  <Sparkles className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono tracking-[0.25em] uppercase block font-semibold text-stone-200">
                    Atelier Capsule
                  </span>
                  <span className="text-[9px] font-sans tracking-[0.2em] uppercase block text-stone-400 font-medium">
                    Awaiting Visual
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Curved Glass Specular Highlight Sheen (Airplane Window Reflection) */}
          <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/[0.11] to-transparent pointer-events-none transform -rotate-12 transition-transform duration-1000 group-hover:translate-x-16" />

          {/* Cinematic Vignette Overlay for image cards */}
          {images.length > 0 && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 via-40% to-transparent group-hover:via-black/35 transition-colors duration-500 pointer-events-none" />
          )}

          {/* ========================================================================= */}
          {/* 3. TOP FLOATING BADGE (INSIDE CAPSULE)                                    */}
          {/* ========================================================================= */}
          <div className="absolute top-0 inset-x-0 p-5 sm:p-6 flex flex-col items-center text-center z-10 pointer-events-none">
            {/* Pill Header Badge */}
            <div className="flex items-center space-x-1.5 backdrop-blur-xl px-3.5 py-1.5 rounded-full border shadow-lg bg-black/75 border-white/25 text-stone-200">
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase font-semibold">
                {countBadge}
              </span>
              {images.length > 0 && (
                <>
                  <span className="text-stone-400 text-[9px]">&middot;</span>
                  <span className="flex items-center space-x-1 text-[9px] font-mono text-amber-300 font-bold">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{images.length} {images.length === 1 ? 'Visual' : 'Visuals'}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Manual Chevrons on Hover */}
          {images.length > 1 && (
            <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                type="button"
                onClick={handlePrev}
                className="pointer-events-auto p-2 rounded-full bg-black/65 hover:bg-black text-white border border-white/20 backdrop-blur-xl transition-all active:scale-90 cursor-pointer shadow-xl"
                aria-label="Previous visual"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="pointer-events-auto p-2 rounded-full bg-black/65 hover:bg-black text-white border border-white/20 backdrop-blur-xl transition-all active:scale-90 cursor-pointer shadow-xl"
                aria-label="Next visual"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Slide indicator dots */}
          {images.length > 1 && (
            <div className="absolute bottom-[136px] sm:bottom-[144px] inset-x-0 flex items-center justify-center space-x-1.5 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    activeIdx === idx
                      ? 'w-5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. BOTTOM FLOATING CONTENT: TITLE, SUBTITLE & CENTERED EXPLORE BUTTON     */}
          {/* ========================================================================= */}
          <div className="absolute bottom-5 sm:bottom-6 inset-x-3 sm:inset-x-4 flex flex-col items-center text-center z-10 space-y-2.5 sm:space-y-3 pointer-events-none">
            {/* High-Fashion Category Title & Subtitle (Crisp, high-density drop shadows for perfect visibility against any backdrop) */}
            <div className="space-y-1 pointer-events-none px-2 py-0.5">
              <h3 
                className="text-xl sm:text-2xl font-serif tracking-[0.04em] leading-tight text-white group-hover:text-amber-200 transition-colors duration-300 font-normal"
                style={{
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 20px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 1)'
                }}
              >
                {cat.name}
              </h3>
              <span 
                className="text-[10px] sm:text-[11px] font-sans tracking-[0.28em] uppercase block text-stone-200 font-medium"
                style={{
                  textShadow: '0 1px 8px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8)'
                }}
              >
                {cat.shortName ? `Atelier ${cat.shortName}` : 'Bespoke Silhouettes'}
              </span>
            </div>

            {/* Centered Action Explore Button - Pristine Luminous Luxury Pill */}
            <div className="pointer-events-auto flex items-center space-x-2 px-6 py-2 rounded-full bg-white hover:bg-amber-300 text-stone-950 font-sans font-bold text-[10px] sm:text-[11px] tracking-[0.2em] uppercase shadow-[0_4px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_4px_28px_rgba(251,191,36,0.5)] border border-white/80 transition-all duration-300 group-hover:scale-105 active:scale-95 cursor-pointer">
              <span>EXPLORE</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CategorySection: React.FC = () => {
  const { gender, products, getCategories, theme } = useStore();
  const isAlabaster = theme === 'alabaster';
  const navigate = useNavigate();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeScrollIndex, setActiveScrollIndex] = useState(0);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const [hasMoved, setHasMoved] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftPosRef = useRef(0);

  const categories = getCategories(gender === 'all' ? 'women' : gender);

  const getProductCount = (slug: string) => {
    const count = products.filter(
      (p) => p.gender === gender && p.category.toLowerCase() === slug.toLowerCase()
    ).length;
    return `${count} ${count === 1 ? 'Style' : 'Styles'}`;
  };

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);

    // Calculate approximate active card index
    const cardWidth = 350 + 24; // approximate card width + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveScrollIndex(Math.min(Math.max(0, index), categories.length - 1));
  }, [categories.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, categories]);

  const handleScroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = 360;
    const amount = dir === 'left' ? -cardWidth * 1.5 : cardWidth * 1.5;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const scrollToCategoryIndex = (idx: number) => {
    if (!scrollRef.current) return;
    const cardWidth = 360;
    scrollRef.current.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    setHasMoved(false);
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftPosRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 6) {
      setHasMoved(true);
      scrollRef.current.scrollLeft = scrollLeftPosRef.current - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      setHasMoved(false);
    }, 80);
  };

  const handleCardClick = (slug: string) => {
    if (!hasMoved) {
      navigate(`/shop/${gender}/${slug}`);
    }
  };

  const handleViewAllClick = () => {
    navigate(`/shop/${gender}`);
  };

  return (
    <section id="category-section" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Section Header */}
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 border-b pb-6 transition-colors duration-300 ${
        isAlabaster ? 'border-stone-300/80' : 'border-white/10'
      }`}>
        <div>
          <span className={`category-section-subtitle text-[11px] font-sans tracking-[0.3em] uppercase block mb-2 font-medium ${
            isAlabaster ? 'text-stone-600' : 'text-stone-400'
          }`}>
            Curated Portals &middot; {gender === 'men' ? "Men's Wardrobe" : "Women's Wardrobe"}
          </span>
          <h2 className={`category-section-title text-3xl sm:text-4xl md:text-5xl font-serif tracking-[0.03em] ${
            isAlabaster ? 'text-stone-950 font-normal' : 'text-white font-light'
          }`}>
            THE FOUNDATION OF MODERN WARDROBE
          </h2>
        </div>

        {/* Actions & Side-Scroll Chevrons */}
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <button
            onClick={handleViewAllClick}
            className={`category-view-all text-xs tracking-[0.2em] uppercase font-medium transition-colors cursor-pointer flex items-center space-x-2 group ${
              isAlabaster ? 'text-stone-800 hover:text-black font-semibold' : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>VIEW ALL PIECES</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          {/* Carousel Left / Right Buttons */}
          <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                canScrollLeft
                  ? isAlabaster
                    ? 'bg-white hover:bg-stone-100 text-stone-900 border-stone-300 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shadow-lg active:scale-95'
                  : 'opacity-30 cursor-not-allowed bg-transparent text-stone-500 border-white/5'
              }`}
              aria-label="Scroll carousel left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                canScrollRight
                  ? isAlabaster
                    ? 'bg-white hover:bg-stone-100 text-stone-900 border-stone-300 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shadow-lg active:scale-95'
                  : 'opacity-30 cursor-not-allowed bg-transparent text-stone-500 border-white/5'
              }`}
              aria-label="Scroll carousel right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HORIZONTAL SIDE-SCROLLING VISIONOS AIRPLANE WINDOWS TRACK                */}
      {/* ========================================================================= */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex items-center gap-6 sm:gap-8 overflow-x-auto py-6 px-1 sm:px-2 scrollbar-none snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => (
          <CategoryTileCard
            key={cat.id || cat.slug}
            cat={cat}
            countBadge={getProductCount(cat.slug)}
            onCardClick={handleCardClick}
            isAlabaster={isAlabaster}
          />
        ))}
      </div>

      {/* Bottom Horizontal Scrubber / Pill Navigation Dots */}
      <div className="flex items-center justify-center space-x-2 pt-6">
        {categories.map((cat, idx) => (
          <button
            key={cat.id || cat.slug}
            onClick={() => scrollToCategoryIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
              activeScrollIndex === idx
                ? 'w-8 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                : isAlabaster
                  ? 'w-2 bg-stone-400 hover:bg-stone-600'
                  : 'w-2 bg-white/20 hover:bg-white/50'
            }`}
            aria-label={`Scroll to ${cat.name}`}
          />
        ))}
      </div>
    </section>
  );
};
