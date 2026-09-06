import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { CategoryItem } from '../data/categories';
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

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
  // Collect all available images for this category (fallback to single image if array empty)
  const images = useMemo(() => {
    if (cat.images && Array.isArray(cat.images) && cat.images.length > 0) {
      const valid = cat.images.filter((img) => !!img && typeof img === 'string' && img.trim().length > 0);
      if (valid.length > 0) return valid;
    }
    return cat.image ? [cat.image] : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop'];
  }, [cat.images, cat.image]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Jaw-dropping automatic crossfade slideshow when card has multiple photos
  useEffect(() => {
    if (images.length <= 1) return;

    // Cycle every 3.8s at rest, or 2.4s when actively hovered for dynamic luxury showcase
    const intervalTime = isHovered ? 2400 : 3800;
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
      className={`category-tile-card group relative overflow-hidden rounded-2xl cursor-pointer aspect-[3/4] transition-all duration-700 shadow-xl hover:shadow-2xl border ${
        isAlabaster
          ? 'bg-stone-100 border-stone-300/80 hover:border-stone-900 shadow-stone-300/50'
          : 'bg-[#121215] border-white/10 hover:border-amber-400/50 shadow-black/60'
      }`}
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
      {/* Stacked Images with Jaw-Dropping Liquid Crossfade and Ken Burns Zoom */}
      <div className="absolute inset-0 overflow-hidden">
        {images.map((imgUrl, idx) => {
          const isActive = activeIdx === idx;
          return (
            <div
              key={idx}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out will-change-transform ${
                isActive
                  ? 'opacity-100 scale-105 brightness-[0.72] contrast-[1.06] z-0'
                  : 'opacity-0 scale-100 brightness-[0.60] contrast-[1.02] -z-10'
              }`}
              style={{
                backgroundImage: `url(${imgUrl})`,
              }}
            />
          );
        })}
      </div>

      {/* Cinematic Gradient Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 group-hover:via-black/25 transition-colors duration-700 pointer-events-none" />

      {/* Top Header Row inside card */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-1.5">
          <span className="category-tile-badge text-[10px] font-sans tracking-[0.2em] uppercase text-stone-200 bg-black/65 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-md">
            {countBadge}
          </span>
          {images.length > 1 && (
            <span className="flex items-center space-x-1 text-[9px] font-mono tracking-wider text-amber-300 bg-amber-500/20 backdrop-blur-md px-2 py-1 rounded-full border border-amber-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{images.length} Visuals</span>
            </span>
          )}
        </div>

        {/* Action Arrow Monogram */}
        <div className="category-tile-arrow w-8 h-8 rounded-full bg-white/15 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg group-hover:rotate-45">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Manual Quick Slide Chevrons (Appear smoothly on hover if multiple photos) */}
      {images.length > 1 && (
        <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            onClick={handlePrev}
            className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-lg"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-lg"
            aria-label="Next image"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Content Row: Title, Tagline, & Slide Dots */}
      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 flex flex-col justify-end z-10">
        {/* Luxury Progress Indicators if multiple photos */}
        {images.length > 1 && (
          <div className="flex items-center space-x-1.5 mb-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${
                  activeIdx === idx
                    ? 'w-6 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <h3 className="category-tile-name text-lg sm:text-xl font-serif tracking-[0.03em] text-white group-hover:text-amber-200 transition-colors duration-300">
          {cat.name}
        </h3>
        <span className="category-tile-sub text-[10px] font-sans tracking-[0.25em] uppercase text-stone-300/90 block mt-1">
          {cat.shortName ? `Explore ${cat.shortName}` : 'Explore Silhouettes'}
        </span>
      </div>
    </div>
  );
};

export const CategorySection: React.FC = () => {
  const { gender, products, getCategories, theme } = useStore();
  const isAlabaster = theme === 'alabaster';
  const navigate = useNavigate();

  const categories = getCategories(gender === 'all' ? 'women' : gender);

  // Compute dynamic product count for each category
  const getProductCount = (slug: string) => {
    const count = products.filter(
      (p) => p.gender === gender && p.category.toLowerCase() === slug.toLowerCase()
    ).length;
    return `${count} ${count === 1 ? 'Style' : 'Styles'}`;
  };

  const handleCardClick = (slug: string) => {
    navigate(`/shop/${gender}/${slug}`);
  };

  const handleViewAllClick = () => {
    navigate(`/shop/${gender}`);
  };

  return (
    <section id="category-section" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-16 border-b pb-6 transition-colors duration-300 ${
        isAlabaster ? 'border-stone-300/80' : 'border-white/10'
      }`}>
        <div>
          <span className={`category-section-subtitle text-[11px] font-sans tracking-[0.3em] uppercase block mb-2 font-medium ${
            isAlabaster ? 'text-stone-600' : 'text-stone-400'
          }`}>
            Curated Categories &middot; {gender === 'men' ? "Men's Wardrobe" : "Women's Wardrobe"}
          </span>
          <h2 className={`category-section-title text-3xl sm:text-4xl md:text-5xl font-serif tracking-[0.03em] ${
            isAlabaster ? 'text-stone-950 font-normal' : 'text-white font-light'
          }`}>
            THE FOUNDATION OF MODERN WARDROBE
          </h2>
        </div>

        <button
          onClick={handleViewAllClick}
          className={`category-view-all mt-4 sm:mt-0 text-xs tracking-[0.2em] uppercase font-medium transition-colors cursor-pointer flex items-center space-x-2 group ${
            isAlabaster ? 'text-stone-800 hover:text-black font-semibold' : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>VIEW ALL PIECES</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
    </section>
  );
};
