import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/product';
import { Eye, ShoppingBag, Heart, Check } from 'lucide-react';
import { getMediaUrl } from '../utils/media';

interface PerfumeProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  isStandalone?: boolean;
}

export const PerfumeProductCard: React.FC<PerfumeProductCardProps> = ({
  product,
  onQuickView,
  isStandalone = false,
}) => {
  const { addToCart, wishlist, toggleWishlist, showToast, theme } = useStore();
  const isAlabaster = theme === 'alabaster';
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check wishlist state
  const isWishlisted = wishlist.includes(product.id);

  // Bespoke aesthetic styling tailored for each fragrance creation from reference image
  const perfumeTheme = React.useMemo(() => {
    const id = product.id;
    const fam = (product.perfumeFamily || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    // Rose Taif & Damascena: Luminous Frosted Rose Blush Glass
    if (id === 'perfume-02' || fam.includes('taif') || fam.includes('rose') || name.includes('rose')) {
      return {
        cardBorder: isAlabaster ? 'border-[#d49696]/60 hover:border-[#b86d6d]' : 'border-[#d49999]/40 hover:border-[#e8aaaa]/90',
        cardBg: 'bg-[#2b171a]',
        cardShadowAlabaster: '0 24px 48px -12px rgba(185, 95, 105, 0.28), 0 8px 24px -4px rgba(225, 150, 160, 0.18)',
        panelBg: 'bg-gradient-to-b from-[#bd8e88]/92 via-[#a8746d]/96 to-[#925c55]/98',
        panelBorder: 'border-rose-200/25',
        categoryText: 'text-[#fef08a]',
        titleText: 'text-white',
        notesText: 'text-rose-100/90',
        priceText: 'text-[#fef08a]',
        glowColor: 'rgba(244, 114, 182, 0.25)',
      };
    }

    // Bleu: Deep Midnight Sapphire Glass
    if (id === 'perfume-03' || fam.includes('smoked') || fam.includes('leather') || name.includes('bleu') || name.includes('ambergris')) {
      return {
        cardBorder: isAlabaster ? 'border-[#304d73]/50 hover:border-[#426a9e]' : 'border-[#3b5982]/40 hover:border-[#527eaf]/80',
        cardBg: 'bg-[#080f1a]',
        cardShadowAlabaster: '0 24px 48px -12px rgba(25, 45, 80, 0.32), 0 8px 24px -4px rgba(70, 120, 190, 0.16)',
        panelBg: 'bg-gradient-to-b from-[#0f1b2e]/94 via-[#091220]/96 to-[#050b14]/98',
        panelBorder: 'border-blue-200/15',
        categoryText: 'text-[#dfb56c]',
        titleText: 'text-[#faf8f5]',
        notesText: 'text-[#94a3b8]',
        priceText: 'text-[#dfb56c]',
        glowColor: 'rgba(56, 189, 248, 0.2)',
      };
    }

    // White Musk: Warm Golden Champagne / Satin Silk Glass
    if (id === 'perfume-04' || fam.includes('musk') || name.includes('white musk') || name.includes('ghazal')) {
      return {
        cardBorder: isAlabaster ? 'border-[#bca375]/60 hover:border-[#967946]' : 'border-[#c9b38c]/45 hover:border-[#dfcaa4]/90',
        cardBg: 'bg-[#251e14]',
        cardShadowAlabaster: '0 24px 48px -12px rgba(150, 120, 70, 0.28), 0 8px 24px -4px rgba(220, 190, 130, 0.2)',
        panelBg: 'bg-gradient-to-b from-[#ad9372]/92 via-[#967b59]/96 to-[#7f6341]/98',
        panelBorder: 'border-amber-100/25',
        categoryText: 'text-[#fef08a]',
        titleText: 'text-white',
        notesText: 'text-[#faebd7]',
        priceText: 'text-[#fef08a]',
        glowColor: 'rgba(251, 191, 36, 0.22)',
      };
    }

    // Santal: Smoky Dark Walnut & Amber Glass
    if (id === 'perfume-05' || fam.includes('woody') || fam.includes('smoky') || name.includes('santal')) {
      return {
        cardBorder: isAlabaster ? 'border-[#8e5c2a]/50 hover:border-[#ad7134]' : 'border-[#9c6a38]/40 hover:border-[#bf874d]/80',
        cardBg: 'bg-[#150d07]',
        cardShadowAlabaster: '0 24px 48px -12px rgba(80, 50, 20, 0.32), 0 8px 24px -4px rgba(180, 120, 60, 0.16)',
        panelBg: 'bg-gradient-to-b from-[#1b1209]/94 via-[#120b05]/96 to-[#0a0603]/98',
        panelBorder: 'border-amber-200/15',
        categoryText: 'text-[#dfb56c]',
        titleText: 'text-[#faf8f5]',
        notesText: 'text-[#b8ad9e]',
        priceText: 'text-[#dfb56c]',
        glowColor: 'rgba(217, 119, 6, 0.2)',
      };
    }

    // Royal Oud: Deep Amber Obsidian Glass
    return {
      cardBorder: isAlabaster ? 'border-[#946e31]/40 hover:border-[#b8853f]' : 'border-[#c59450]/35 hover:border-[#dfb56c]/80',
      cardBg: 'bg-[#120d08]',
      cardShadowAlabaster: '0 24px 48px -12px rgba(90, 60, 25, 0.32), 0 8px 24px -4px rgba(197, 148, 80, 0.15)',
      panelBg: 'bg-gradient-to-b from-[#181109]/94 via-[#110c06]/96 to-[#0b0804]/98',
      panelBorder: 'border-amber-400/15',
      categoryText: 'text-[#d4af37]',
      titleText: 'text-[#fdfcfb]',
      notesText: 'text-[#bfb5a6]',
      priceText: 'text-[#dfb56c]',
      glowColor: 'rgba(212, 175, 55, 0.2)',
    };
  }, [product.id, product.perfumeFamily, product.name, isAlabaster]);

  // Determine concentration badge
  const concentrationBadge = React.useMemo(() => {
    const raw = (product.concentration || '').toLowerCase();
    if (raw.includes('attar')) return 'PURE ATTAR';
    if (raw.includes('extrait')) return 'EXTRAIT';
    return 'EAU DE PARFUM';
  }, [product.concentration]);

  // Determine volume tag
  const volumeTag = React.useMemo(() => {
    if (product.volumeMl && product.volumeMl.length > 0) {
      return `From ${product.volumeMl[0]}`;
    }
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      const match = product.sizes[0].match(/\d+ml/i);
      if (match) return `From ${match[0]}`;
    }
    return 'From 6ml';
  }, [product.volumeMl, product.sizes]);

  // Notes line
  const notesText = React.useMemo(() => {
    const top = product.perfumeNotes?.top || [];
    const heart = product.perfumeNotes?.heart || [];
    const base = product.perfumeNotes?.base || [];
    const combined = [...top, ...base, ...heart];
    if (combined.length > 0) {
      return combined.slice(0, 3).join(' · ');
    }
    return 'Wild Bergamot · Kashmiri Saffron · Oud';
  }, [product.perfumeNotes]);

  // Pricing
  const basePrice = product.volumeOptions?.[0]?.price || product.price;

  // Format INR price with gold serif formatting
  const formattedPrice = React.useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(basePrice);
  }, [basePrice]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultVolume = product.volumeMl?.[0] || '6ml';
    const defaultPrice = product.volumeOptions?.[0]?.price || product.price;
    const defaultColor = product.colors?.[0]?.name || 'Crystal Flacon';

    addToCart(product, defaultVolume, defaultColor, 1, defaultPrice);
    setIsAdded(true);
    if (showToast) {
      showToast(`Added ${product.name} (${defaultVolume}) to your bag`);
    }
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
    if (showToast) {
      showToast(isWishlisted ? `Removed from wishlist` : `Added ${product.name} to wishlist`);
    }
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  // Image source resolution
  const heroImageSrc = getMediaUrl(product.images?.[0] || '/images/perfumes/royal_oud_flacon.jpg');
  const hasFlaconArtwork = heroImageSrc.includes('flacon');

  return (
    <article
      id={`perfume-card-${product.id}`}
      data-testid="perfume-product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleInspect}
      className={`group relative flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-all duration-700 ease-out ${
        isStandalone
          ? 'w-full max-w-[360px] mx-auto rounded-[32px]'
          : 'w-full rounded-[20px] sm:rounded-[28px]'
      } backdrop-blur-2xl ${perfumeTheme.cardBg} border ${perfumeTheme.cardBorder} hover:-translate-y-2`}
      style={{
        boxShadow: isAlabaster
          ? isHovered
            ? `${perfumeTheme.cardShadowAlabaster}, 0 32px 60px -15px rgba(0, 0, 0, 0.35), inset 0 1.5px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 3px rgba(0, 0, 0, 0.25)`
            : `${perfumeTheme.cardShadowAlabaster}, inset 0 1px 1.5px rgba(255, 255, 255, 0.45), inset 0 -1.5px 2px rgba(0, 0, 0, 0.18)`
          : isHovered
          ? `0 32px 64px -15px rgba(0, 0, 0, 0.8), 0 0 32px ${perfumeTheme.glowColor}, inset 0 2px 3px rgba(255, 255, 255, 0.45), inset 0 -2px 3px rgba(0, 0, 0, 0.6)`
          : `0 24px 48px -12px rgba(0, 0, 0, 0.6), 0 0 22px ${perfumeTheme.glowColor}, inset 0 1.5px 2px rgba(255, 255, 255, 0.3), inset 0 -1.5px 2px rgba(0, 0, 0, 0.45)`,
      }}
    >
      {/* =================================================================== */}
      {/* LIQUID GLASS SPECULAR OVERLAYS                                      */}
      {/* =================================================================== */}
      {/* Diagonal Glass Glare */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.14] pointer-events-none z-20 opacity-80 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Sweeping Glass Reflection Beam on Hover */}
      <div className="absolute -inset-full top-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/12 to-transparent -skew-x-20 pointer-events-none group-hover:translate-x-[160%] transition-transform duration-1000 ease-out z-20" />

      {/* =================================================================== */}
      {/* 1. UPPER HERO PHOTOGRAPHY AREA                                      */}
      {/* =================================================================== */}
      <div className="relative w-full aspect-[4/4.3] sm:aspect-[4/4.5] overflow-hidden bg-transparent">
        {/* Editorial Fragrance Photo */}
        <img
          src={heroImageSrc}
          alt={`${product.name} — Luxury Niche Perfume Flacon`}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
        />

        {/* Ambient Photographic Lighting Overlays */}
        {!hasFlaconArtwork && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />
        )}

        {/* Subtle Warm Amber Volumetric Sheen on Hover */}
        <div
          className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,170,91,0.15),transparent_70%)] pointer-events-none transition-opacity duration-700 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* ---------------- TOP UI: Glass Badges & Wishlist ---------------- */}
        {hasFlaconArtwork ? (
          /* Flacon Artwork Overlay: Wishlist Button precisely over the artwork heart */
          <div className="absolute top-[20px] sm:top-[33px] right-[10px] sm:right-[17px] z-30">
            <button
              type="button"
              id={`wishlist-btn-${product.id}`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              onClick={handleWishlistToggle}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${
                isWishlisted
                  ? 'bg-black/40 border border-amber-400/60 text-amber-400 shadow-md shadow-amber-500/30 backdrop-blur-xs'
                  : 'bg-transparent border border-transparent text-transparent hover:bg-white/10'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${
                  isWishlisted ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'stroke-[1.6]'
                }`}
              />
            </button>
          </div>
        ) : (
          /* Standard Artwork: Full Glass Badges + Wishlist Button */
          <div className="absolute top-2 sm:top-4 inset-x-2 sm:inset-x-4 flex items-center justify-between z-30 pointer-events-none">
            <div className="pointer-events-auto">
              <span
                id={`badge-concentration-${product.id}`}
                className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-sans font-semibold tracking-[0.12em] sm:tracking-[0.18em] uppercase backdrop-blur-xl bg-black/55 text-[#e5be75] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
              >
                {concentrationBadge}
              </span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 pointer-events-auto">
              <span
                id={`badge-volume-${product.id}`}
                className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-mono tracking-wider backdrop-blur-xl bg-black/45 text-stone-200 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              >
                {volumeTag}
              </span>

              <button
                type="button"
                id={`wishlist-btn-${product.id}`}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                onClick={handleWishlistToggle}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-300 active:scale-90 cursor-pointer ${
                  isWishlisted
                    ? 'bg-amber-500/25 border-amber-400 text-amber-400 shadow-md shadow-amber-500/30'
                    : 'bg-black/40 hover:bg-black/70 border-white/25 hover:border-amber-400/60 text-white/90 hover:text-amber-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
                }`}
              >
                <Heart
                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${
                    isWishlisted ? 'fill-amber-400 text-amber-400 scale-110' : 'stroke-[1.6]'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. LOWER FROSTED GLASS INFORMATION & ACTION PANEL                   */}
      {/* =================================================================== */}
      <div className={`relative w-full p-2.5 sm:p-5 pt-2 flex flex-col justify-between shrink-0 backdrop-blur-2xl border-t shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18)] z-10 ${perfumeTheme.panelBg} ${perfumeTheme.panelBorder}`}>
        {/* Fragrance Metadata */}
        <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3">
          {/* Category Tag: Small Uppercase Gold Typography */}
          <p
            id={`category-label-${product.id}`}
            className={`text-[8px] sm:text-[10.5px] font-sans uppercase tracking-[0.16em] sm:tracking-[0.22em] font-semibold truncate ${perfumeTheme.categoryText}`}
          >
            {product.perfumeFamily || 'ROYAL OUD & ORIENTAL'}
          </p>

          {/* Product Name: Large Elegant High-Contrast Serif */}
          <h3
            id={`title-${product.id}`}
            className={`text-[13.5px] xs:text-[14.5px] sm:text-[18px] lg:text-[19px] font-serif font-normal tracking-[0.01em] leading-tight sm:leading-snug line-clamp-1 group-hover:text-[#fde68a] transition-colors duration-300 ${perfumeTheme.titleText}`}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Secondary Fragrance Notes: Harmonious Typography */}
          <p
            id={`notes-${product.id}`}
            className={`text-[9.5px] sm:text-[12px] font-sans font-light tracking-wide line-clamp-1 ${perfumeTheme.notesText}`}
            title={notesText}
          >
            {notesText}
          </p>
        </div>

        {/* ---------------- BOTTOM ACTION ROW: Price, Glass Eye, Amber Pill ---------------- */}
        <div className="pt-2 sm:pt-2.5 border-t border-white/[0.12] flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Price: Left - Elegant Luxury Serif with Gold Accent */}
          <div className="flex flex-col">
            <span
              id={`price-${product.id}`}
              className={`text-[13px] sm:text-[18px] font-serif font-medium sm:font-normal tracking-tight whitespace-nowrap drop-shadow-xs ${perfumeTheme.priceText}`}
            >
              {formattedPrice}
            </span>
          </div>

          {/* Right Action Group */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Minimal Frosted Glass Preview Button with Eye Icon */}
            <button
              type="button"
              id={`quick-view-btn-${product.id}`}
              aria-label={`Inspect ${product.name} formulation dossier`}
              onClick={handleInspect}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-xl bg-white/[0.12] hover:bg-white/[0.28] border border-white/30 hover:border-amber-300/80 text-white transition-all duration-300 active:scale-95 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]"
              title="Inspect formulation dossier & sizing"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 stroke-[1.8]" />
            </button>

            {/* ADD TO CART: Glass Amber Pill Button */}
            <button
              type="button"
              id={`add-cart-btn-${product.id}`}
              aria-label={`Add ${product.name} to shopping bag`}
              onClick={handleAddToCart}
              className={`rounded-full px-2.5 sm:px-4 py-1 sm:py-2 text-[8.5px] sm:text-[11px] font-sans font-semibold tracking-wider uppercase flex items-center space-x-1 sm:space-x-1.5 transition-all duration-300 shadow-md active:scale-95 cursor-pointer ${
                isAdded
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-[#d9aa5b] via-[#cf9e4f] to-[#be8c3e] hover:from-[#e2b66a] hover:to-[#cb9a4a] text-[#14120e] shadow-[0_4px_14px_rgba(197,148,80,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_6px_20px_rgba(197,148,80,0.5),inset_0_1px_2px_rgba(255,255,255,0.6)]'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                  <span className="font-bold">ADDED</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                  <span>ADD</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PerfumeProductCard;
