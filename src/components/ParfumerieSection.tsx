import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/product';
import {
  Sparkles,
  Droplets,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Flame,
  Wind,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PerfumeProductCard } from './PerfumeProductCard';
import { Link } from 'react-router-dom';

interface ParfumerieSectionProps {
  onQuickView: (product: Product) => void;
}

export const ParfumerieSection: React.FC<ParfumerieSectionProps> = ({ onQuickView }) => {
  const { products, theme, perfumeCategories } = useStore();
  const isAlabaster = theme === 'alabaster';

  // Dynamic Olfactory Families list from StoreContext
  const olfactoryFamilies = useMemo(() => {
    const list = ['ALL CREATIONS'];
    if (perfumeCategories && perfumeCategories.length > 0) {
      perfumeCategories.forEach((cat) => {
        const title = (cat.shortName || cat.name).toUpperCase();
        if (!list.includes(title)) {
          list.push(title);
        }
      });
    } else {
      list.push('ROYAL OUD', 'FLORAL & TAIF ROSE', 'SMOKED AMBER & LEATHER', 'PURE WHITE MUSK', 'WOODY & SMOKY');
    }
    return list;
  }, [perfumeCategories]);

  // State
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL CREATIONS');
  const [isRitualOpen, setIsRitualOpen] = useState<boolean>(false);

  // All perfume creations (strictly perfumes only)
  const perfumes = useMemo(() => {
    return products.filter((p) => p.isPerfume || p.category === 'perfumes');
  }, [products]);

  // Filtered by olfactory family tab
  const filteredPerfumes = useMemo(() => {
    if (selectedFamily === 'ALL CREATIONS') return perfumes;
    const target = selectedFamily.toLowerCase();
    return perfumes.filter((p) => {
      const fam = (p.perfumeFamily || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();

      // Find if selectedFamily corresponds to a configured category
      const matchedCat = perfumeCategories?.find(
        (c) => (c.shortName || c.name).toLowerCase() === target || c.name.toLowerCase() === target
      );
      if (matchedCat) {
        if (fam === matchedCat.name.toLowerCase() || cat === matchedCat.slug.toLowerCase()) return true;
        const shortLower = matchedCat.shortName.toLowerCase();
        if (fam.includes(shortLower) || name.includes(shortLower)) return true;
      }

      if (target === 'royal oud') {
        return fam.includes('oud') || desc.includes('oud') || name.includes('oud');
      }
      if (target.includes('rose') || target.includes('floral')) {
        return fam.includes('rose') || fam.includes('floral') || desc.includes('rose');
      }
      if (target.includes('amber') || target.includes('leather')) {
        return fam.includes('amber') || fam.includes('leather') || desc.includes('amber');
      }
      if (target.includes('musk')) {
        return fam.includes('musk') || desc.includes('musk');
      }
      if (target.includes('wood') || target.includes('smok')) {
        return fam.includes('wood') || fam.includes('smok') || desc.includes('santal') || desc.includes('vetiver');
      }
      return fam.includes(target) || name.includes(target) || desc.includes(target);
    });
  }, [perfumes, selectedFamily, perfumeCategories]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activePerfumeIndex, setActivePerfumeIndex] = useState<number>(0);

  const handleContainerScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft } = scrollContainerRef.current;
      const cardWidth = 214; // mobile card width (200px) + gap (14px)
      const newIndex = Math.min(
        Math.max(0, Math.round(scrollLeft / cardWidth)),
        filteredPerfumes.length - 1
      );
      setActivePerfumeIndex(newIndex);
    }
  };

  const handleScrollPerfumes = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 214;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Reset scroll to first card when switching olfactory category
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setActivePerfumeIndex(0);
    }
  }, [selectedFamily]);

  if (perfumes.length === 0) return null;

  return (
    <section
      id="haute-parfumerie"
      data-testid="haute-parfumerie-section"
      className={`relative py-16 sm:py-24 transition-colors duration-500 overflow-hidden border-t ${
        isAlabaster
          ? 'bg-gradient-to-b from-[#f7f3ec] via-[#f2ece2] to-[#f6f1e8] text-[#161412] border-[#dfd5c5]'
          : 'bg-gradient-to-b from-[#09090b] via-[#0d0c10] to-[#09090b] text-white border-white/10'
      }`}
    >
      {/* Editorial Decorative Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[300px] bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Editorial Background Calligraphy Accent (Explicit Alabaster Contrast) */}
      <div
        className={`absolute top-12 left-6 sm:left-12 pointer-events-none select-none hidden lg:block ${
          isAlabaster ? 'text-[#8c7a65] opacity-35' : 'text-[#9c8972] opacity-20'
        }`}
      >
        <p className="font-serif italic text-4xl sm:text-5xl tracking-wide leading-tight">
          More than a<br />
          <span className="font-serif font-light tracking-widest pl-6">Fragrance</span>
        </p>
      </div>

      <div
        className={`absolute top-12 right-6 sm:right-12 pointer-events-none select-none hidden lg:flex items-center space-x-3 ${
          isAlabaster ? 'text-[#6b5a47] opacity-85' : 'text-[#736352] opacity-40'
        }`}
      >
        <div className={`w-12 h-[1px] ${isAlabaster ? 'bg-[#a89680]/60' : 'bg-white/20'}`} />
        <p className="text-[10.5px] font-mono tracking-[0.3em] uppercase text-right leading-tight">
          A SCENT<br />A STORY
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ========================================================================= */}
        {/* SECTION HEADER (EXACT REFERENCE MOCKUP REPLICATION)                       */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.35em] text-[#b07d2b] font-semibold mb-3">
            — OUR CREATIONS —
          </p>

          <h2
            className={`text-3xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-[0.01em] leading-tight mb-3 sm:mb-4 ${
              isAlabaster ? 'text-[#161412]' : 'text-[#f5f5f3]'
            }`}
          >
            Fragrances for Every Mood
          </h2>

          <p
            className={`text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-sans font-light ${
              isAlabaster ? 'text-[#52493d]' : 'text-stone-400'
            }`}
          >
            Timeless scents. Modern souls. Discover a fragrance that feels like you.
          </p>

          {/* Collapsible Application Ritual Guide Trigger */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <button
              type="button"
              onClick={() => setIsRitualOpen(!isRitualOpen)}
              className={`inline-flex items-center space-x-1.5 text-[11px] font-mono tracking-wider uppercase underline underline-offset-4 cursor-pointer transition-colors ${
                isAlabaster ? 'text-[#8a5d14] hover:text-[#634107]' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{isRitualOpen ? 'Hide Application Guide' : 'The Sacred Attar Application Ritual'}</span>
              {isRitualOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <span className={isAlabaster ? 'text-stone-400' : 'text-stone-500'}>·</span>

            <Link
              to="/perfume-card"
              className={`inline-flex items-center space-x-1 text-[11px] font-mono tracking-wider uppercase underline underline-offset-4 cursor-pointer transition-colors ${
                isAlabaster ? 'text-[#8a5d14] hover:text-[#634107]' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>View Standalone Card</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLLAPSIBLE RITUAL GUIDE (CLEAN & MINIMALIST)                             */}
        {/* ========================================================================= */}
        {isRitualOpen && (
          <div
            className={`mb-12 p-5 sm:p-7 rounded-3xl border transition-all duration-300 animate-fade-in ${
              isAlabaster
                ? 'bg-white/90 border-[#dfd5c5] shadow-lg text-stone-800'
                : 'bg-white/[0.03] border-white/10 backdrop-blur-md text-stone-200 shadow-2xl'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-[#b07d2b] font-semibold text-sm font-serif">
                  <Flame className="w-4 h-4" />
                  <span>1. Body Heat &amp; Pulse Points</span>
                </div>
                <p className={`leading-relaxed ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
                  Pure oil attars respond to blood circulation. Touch lightly to the inner wrists, base of the neck, and behind the ears.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-[#b07d2b] font-semibold text-sm font-serif">
                  <Droplets className="w-4 h-4" />
                  <span>2. Crystal Wand Touch</span>
                </div>
                <p className={`leading-relaxed ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
                  Use the flacon wand to apply a single drop. <strong>Do not crush</strong> your wrists together, as friction breaks delicate top notes.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-[#b07d2b] font-semibold text-sm font-serif">
                  <Wind className="w-4 h-4" />
                  <span>3. Royal Layering</span>
                </div>
                <p className={`leading-relaxed ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
                  Anchor pulse points with aged Dehn Al Oud or Amber attar, then mist an extrait flacon over your garments for majestic sillage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OLFACTORY FAMILY FILTER TABS (EXACT REFERENCE PILLS)                      */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-4 mb-8 sm:mb-12 scrollbar-none gap-2.5 px-1">
          {olfactoryFamilies.map((family) => {
            const isActive = selectedFamily === family;
            return (
              <button
                key={family}
                type="button"
                onClick={() => setSelectedFamily(family)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-sans tracking-wider uppercase transition-all duration-300 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#141210] text-white font-medium shadow-md border border-[#141210]'
                    : isAlabaster
                    ? 'bg-white text-[#2b251e] font-medium hover:text-[#141210] hover:bg-[#faf7f2] border border-[#d8cfbf] shadow-xs'
                    : 'bg-white/[0.05] text-stone-300 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {family}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* LUXURY PERFUME LIQUID GLASS CARDS GALLERY                                */}
        {/* ========================================================================= */}
        {/* Mobile Swipe Hint & Count Indicator */}
        <div className="flex sm:hidden items-center justify-between px-1 mb-2.5 text-[10px] font-mono tracking-widest uppercase text-stone-400">
          <span className="flex items-center space-x-1.5 text-[#b07d2b]">
            <span className="inline-block animate-pulse">&larr;</span>
            <span>Side Scroll Flacons</span>
            <span className="inline-block animate-pulse">&rarr;</span>
          </span>
          <span className={isAlabaster ? 'text-stone-500' : 'text-stone-400'}>
            {filteredPerfumes.length} {filteredPerfumes.length === 1 ? 'Creation' : 'Creations'}
          </span>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 lg:gap-5 items-stretch overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {filteredPerfumes.map((perfume) => (
            <div
              key={perfume.id}
              className="w-[200px] xs:w-[220px] sm:w-auto shrink-0 snap-start sm:snap-none flex flex-col"
            >
              <PerfumeProductCard
                product={perfume}
                onQuickView={onQuickView}
              />
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM PAGINATION & EXPLORE ALL BAR (MATCHING REFERENCE IMAGE)            */}
        {/* ========================================================================= */}
        <div
          className={`mt-10 sm:mt-14 flex items-center justify-between text-xs font-mono border-t pt-6 ${
            isAlabaster ? 'border-[#dfd5c5] text-[#4a4034]' : 'border-white/10 text-stone-400'
          }`}
        >
          {/* Left pagination indicator: 01 / 12 and arrow controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="tracking-widest">
              {String(activePerfumeIndex + 1).padStart(2, '0')} / {String(filteredPerfumes.length).padStart(2, '0')}
            </span>
            <div className={`w-12 sm:w-24 h-[1px] ${isAlabaster ? 'bg-[#a39480]' : 'bg-stone-400/50'}`} />
            <div className="flex items-center space-x-1">
              <button
                type="button"
                aria-label="Previous fragrance page"
                onClick={() => handleScrollPerfumes('left')}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer active:scale-90 ${
                  isAlabaster
                    ? 'border-[#cfc2af] text-[#241f19] hover:bg-[#eae2d3]'
                    : 'border-white/15 text-stone-300 hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Next fragrance page"
                onClick={() => handleScrollPerfumes('right')}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer active:scale-90 ${
                  isAlabaster
                    ? 'border-[#cfc2af] text-[#241f19] hover:bg-[#eae2d3]'
                    : 'border-white/15 text-stone-300 hover:bg-white/10'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Explore All Action */}
          <Link
            to="/perfumes"
            className={`group inline-flex items-center space-x-2 font-serif text-sm sm:text-base transition-colors ${
              isAlabaster ? 'text-[#161412] hover:text-[#b8853f]' : 'text-stone-200 hover:text-[#c59450]'
            }`}
          >
            <span>Explore All Fragrances</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Bottom Purity Assurance Bar */}
        <div
          className={`mt-10 pt-6 border-t flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-[11px] font-mono uppercase tracking-wider ${
            isAlabaster ? 'border-[#dfd5c5] text-[#52483a]' : 'border-white/10 text-stone-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span>100% Pure Alcohol-Free Attar</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#b07d2b]" />
            <span>Triple-Distilled Aged Ouds</span>
          </div>
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-[#b07d2b]" />
            <span>Hand-Cut Crystal Flacons</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParfumerieSection;
