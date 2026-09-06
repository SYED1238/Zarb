import React, { useState, useEffect, useMemo } from 'react';
import type { Product } from '../types/product';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import {
  X,
  Star,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Ruler,
  Plus,
  Minus,
  CheckCircle2,
  MessageSquarePlus,
  Sparkles,
  Maximize2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSelectProduct,
}) => {
  const {
    products,
    addToCart,
    wishlist,
    toggleWishlist,
    setIsSizeGuideOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    getProductReviews,
    addReview,
    showToast,
    theme,
  } = useStore();

  const { user } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<'materials' | 'fit' | 'shipping' | 'reviews' | null>('materials');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Dedicated gallery photos for currently selected color, smoothly falling back to product.images
  const activeGalleryImages = useMemo(() => {
    if (!product) return [];
    const colorObj = product.colors?.find(c => c.name === selectedColor);
    if (colorObj?.images && colorObj.images.length > 0) {
      return colorObj.images;
    }
    if (colorObj?.image) {
      return [colorObj.image, ...product.images.filter(img => img !== colorObj.image)];
    }
    return product.images && product.images.length > 0 ? product.images : [];
  }, [product, selectedColor]);

  // Keyboard navigation for fullscreen lightbox
  useEffect(() => {
    if (!isFullscreenOpen) return;
    const totalCount = activeGalleryImages.length || 1;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenOpen(false);
        setIsZoomed(false);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => (prev + 1) % totalCount);
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => (prev - 1 + totalCount) % totalCount);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen, activeGalleryImages]);

  // Real Reviews Form State
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewLocation, setReviewLocation] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  // Prefill author from logged-in user
  useEffect(() => {
    if (user?.fullName) {
      setReviewAuthor(user.fullName);
    }
  }, [user]);

  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedSize(product.sizes[0] || '');
      setSelectedColor(product.colors[0]?.name || '');
      setQuantity(1);
      // Lock background scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [product]);

  // Step-back history integration for product modal and fullscreen lightbox
  useModalBackHandler(!!product, onClose, `product-detail-${product?.id || 'active'}`);
  useModalBackHandler(
    isFullscreenOpen,
    () => {
      setIsFullscreenOpen(false);
      setIsZoomed(false);
    },
    'product-fullscreen-lightbox'
  );

  if (!product) return null;

  const isAlabaster = theme === 'alabaster';
  const isSaved = wishlist.includes(product.id);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedComparePrice = product.compareAtPrice
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(product.compareAtPrice)
    : null;

  const productReviews = getProductReviews(product.id, product.name);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast('Please provide your review feedback');
      return;
    }

    addReview({
      productId: product.id,
      userId: user?.id,
      authorName: reviewAuthor.trim() || 'Verified Client',
      authorLocation: reviewLocation.trim() || 'India',
      rating: reviewRating,
      title: reviewTitle.trim() || undefined,
      comment: reviewComment.trim(),
      verifiedPurchase: true,
    });

    setIsWritingReview(false);
    setReviewComment('');
    setReviewTitle('');
    setReviewRating(5);
  };

  const handleAddToBag = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    onClose();
  };

  const relatedProducts = products.filter(
    (p) => p.gender === product.gender && p.id !== product.id
  ).slice(0, 4);

  const toggleAccordion = (key: 'materials' | 'fit' | 'shipping' | 'reviews') => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div id="pdp-modal-card" className="relative w-full max-w-6xl bg-[#0e0e11] border border-white/10 rounded-none sm:rounded-2xl z-10 my-auto shadow-2xl overflow-hidden animate-fade-in text-stone-200 min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col">
        {/* Close Button Header */}
        <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30">
          <button
            onClick={onClose}
            className="pdp-close-btn p-2.5 rounded-full bg-black/70 text-stone-300 hover:text-white hover:bg-black border border-white/15 backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-xl"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-8 md:p-10 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left: Product Image Gallery (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
              {/* Thumbnails */}
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 md:w-24 shrink-0">
                {activeGalleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-[3/4] w-18 md:w-full rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-white ring-1 ring-white'
                        : 'border-white/10 hover:border-white/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${selectedColor} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image Stage */}
              <div className={`relative aspect-[3/4] flex-1 rounded-xl overflow-hidden border transition-colors group/stage ${
                isAlabaster ? 'bg-stone-100 border-stone-200' : 'bg-[#16161b] border-white/10'
              }`}>
                <img
                  key={`${selectedColor}-${activeImageIndex}`}
                  src={activeGalleryImages[activeImageIndex] || activeGalleryImages[0] || product.images[0]}
                  alt={`${product.name} - ${selectedColor}`}
                  onClick={() => setIsFullscreenOpen(true)}
                  className="w-full h-full object-cover transition-all duration-700 ease-out cursor-zoom-in animate-fade-in"
                />

                {/* Season Watermark at bottom-left */}
                <div className={`absolute bottom-3.5 left-3.5 backdrop-blur-md px-3 py-1 rounded-full border text-[10px] tracking-[0.25em] uppercase pointer-events-none ${
                  isAlabaster
                    ? 'bg-white/80 border-stone-300 text-stone-700'
                    : 'bg-black/50 border-white/10 text-stone-300'
                }`}>
                  {product.season || 'AW26 ATELIER'}
                </div>

                {/* Full View Button positioned cleanly at bottom-right, perfectly clear of the modal close button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreenOpen(true);
                  }}
                  className={`absolute bottom-3.5 right-3.5 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer z-10 ${
                    isAlabaster
                      ? 'bg-white/90 hover:bg-white text-stone-900 border-stone-300/80 shadow-black/10'
                      : 'bg-black/75 hover:bg-black/90 text-white border-white/20 shadow-black/50'
                  }`}
                  aria-label="View image in full size"
                  title="Expand to Fullscreen View"
                >
                  <Maximize2 className={`w-3.5 h-3.5 ${isAlabaster ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">Full View</span>
                </button>
              </div>
            </div>

            {/* Right: Product Details & Purchase Actions (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                {/* Category & SKU */}
                <div className="pdp-meta-row flex items-center justify-between text-xs tracking-[0.2em] uppercase text-stone-400 mb-2">
                  <span>
                    {product.gender === 'men' ? "Men's Collection" : "Women's Collection"} &middot; {product.category}
                  </span>
                  <span className="font-mono text-[10px] text-stone-500">{product.sku}</span>
                </div>

                {/* Title */}
                <h1 className="pdp-title text-2xl sm:text-3xl font-serif tracking-[0.02em] text-white leading-snug mb-3">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="pdp-rating-row flex items-center space-x-2 text-xs text-stone-300 mb-5">
                  <div className="flex items-center space-x-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-600'}`} />
                    ))}
                  </div>
                  <span className="pdp-rating-num font-medium text-stone-200">{product.rating.toFixed(1)}</span>
                  <span className="text-stone-500">&middot;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenAccordion('reviews');
                      const el = document.getElementById('pdp-reviews-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="pdp-reviews-count text-stone-400 hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
                  >
                    ({productReviews.length} Verified Reviews)
                  </button>
                </div>

                {/* Price Display */}
                <div className="pdp-price-row flex items-baseline space-x-3 mb-6 pb-6 border-b border-white/10">
                  <span className="pdp-price text-2xl sm:text-3xl font-medium tracking-[0.05em] text-white">
                    {formattedPrice}
                  </span>
                  {formattedComparePrice && (
                    <span className="pdp-compare-price text-base text-stone-500 line-through tracking-[0.05em]">
                      {formattedComparePrice}
                    </span>
                  )}
                  <span className="pdp-taxes text-[11px] uppercase tracking-[0.15em] text-emerald-400/90 pl-2">
                    Taxes Included
                  </span>
                </div>

                {/* Short Description */}
                <p className="pdp-description text-stone-300 text-sm font-light leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Color Selector */}
                <div className="mb-6">
                  <div className="pdp-color-label flex items-center justify-between text-xs tracking-[0.15em] uppercase text-stone-300 mb-2.5">
                    <span>
                      Color: <strong className="pdp-color-name text-white font-normal">{selectedColor}</strong>
                    </span>
                    {(() => {
                      const activeCol = product.colors.find(c => c.name === selectedColor);
                      const dedicatedCount = activeCol?.images?.length || 0;
                      return dedicatedCount > 0 ? (
                        <span className="text-[10px] font-mono text-amber-400 font-normal">
                          {dedicatedCount} shade {dedicatedCount === 1 ? 'photo' : 'photos'}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex items-center space-x-3">
                    {product.colors.map((color) => {
                      const hasDedicated = Boolean(color.images && color.images.length > 0);
                      const isSelected = selectedColor === color.name;
                      return (
                        <button
                          key={color.name}
                          onClick={() => {
                            setSelectedColor(color.name);
                            setActiveImageIndex(0);
                          }}
                          className={`group relative p-1 rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-white ring-2 ring-white/60 scale-110'
                              : 'border-white/20 hover:border-white/60'
                          }`}
                          title={`${color.name}${hasDedicated ? ` (${color.images!.length} photos)` : ''}`}
                          aria-label={`Select color ${color.name}`}
                        >
                          <span
                            className="block w-5 h-5 rounded-full border border-black/20"
                            style={{ backgroundColor: color.hex }}
                          />
                          {hasDedicated && (
                            <span
                              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-black"
                              title="Dedicated photos available"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector & Size Guide Link */}
                <div className="mb-8">
                  <div className="pdp-size-header flex items-center justify-between text-xs tracking-[0.15em] uppercase text-stone-300 mb-2.5">
                    <span>Size</span>
                    <button
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="pdp-size-guide-btn text-stone-400 hover:text-white flex items-center space-x-1 underline underline-offset-4 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Size Guide</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`pdp-size-btn py-3 px-2 rounded-lg text-xs tracking-[0.1em] font-sans font-medium uppercase border transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'pdp-size-active'
                            : 'pdp-size-inactive'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-4">
                    {/* Quantity Stepper */}
                    <div className="pdp-quantity-stepper flex items-center bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-1 text-stone-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="pdp-quantity-num w-8 text-center text-sm font-mono text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-1 text-stone-400 hover:text-white cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Add to Bag Button */}
                    <button
                      onClick={handleAddToBag}
                      className="pdp-add-to-bag flex-1 py-3.5 px-6 rounded-xl font-sans font-medium text-xs sm:text-sm tracking-[0.2em] uppercase flex items-center justify-center space-x-2 transition-all duration-300 shadow-xl cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 pdp-bag-icon" />
                      <span className="pdp-bag-text">ADD TO BAG</span>
                    </button>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className={`pdp-wishlist-btn p-3.5 rounded-xl border transition-colors cursor-pointer ${
                        isSaved
                          ? 'bg-white/15 text-red-500 border-red-500/40'
                          : 'bg-white/[0.05] text-stone-300 hover:text-white border-white/10 hover:border-white/30'
                      }`}
                      aria-label="Save to Wishlist"
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* BUY NOW Button */}
                  <button
                    onClick={handleBuyNow}
                    className="pdp-buy-now w-full py-3 px-6 rounded-xl font-sans font-medium text-xs tracking-[0.2em] uppercase border transition-all cursor-pointer"
                  >
                    <span>BUY NOW &middot; INSTANT CHECKOUT</span>
                  </button>
                </div>

                {/* Value Props Bar */}
                <div className="pdp-value-props grid grid-cols-3 gap-2 py-4 border-y border-white/10 text-stone-400 text-[11px] text-center">
                  <div className="flex flex-col items-center">
                    <Truck className="w-4 h-4 mb-1 text-stone-300" />
                    <span>Free Shipping &gt; ₹10k</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-white/10 px-2">
                    <RotateCcw className="w-4 h-4 mb-1 text-stone-300" />
                    <span>30-Day Returns</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="w-4 h-4 mb-1 text-stone-300" />
                    <span>Atelier Authenticity</span>
                  </div>
                </div>

                {/* Accordions */}
                <div className="pdp-accordions divide-y divide-white/10 mt-6">
                  {/* Materials & Care */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('materials')}
                      className="pdp-accordion-trigger w-full py-4 flex items-center justify-between text-xs tracking-[0.15em] uppercase text-stone-200 hover:text-white text-left font-medium cursor-pointer"
                    >
                      <span>Materials & Atelier Craft</span>
                      {openAccordion === 'materials' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {openAccordion === 'materials' && (
                      <div className="pdp-accordion-content pb-4 text-xs text-stone-400 leading-relaxed space-y-2 animate-fade-in">
                        <p>{product.materials}</p>
                        {product.details && (
                          <ul className="list-disc list-inside space-y-1 pt-1 text-stone-300">
                            {product.details.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Silhouette & Fit */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('fit')}
                      className="pdp-accordion-trigger w-full py-4 flex items-center justify-between text-xs tracking-[0.15em] uppercase text-stone-200 hover:text-white text-left font-medium cursor-pointer"
                    >
                      <span>Silhouette & Fit</span>
                      {openAccordion === 'fit' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {openAccordion === 'fit' && (
                      <div className="pdp-accordion-content pb-4 text-xs text-stone-400 leading-relaxed animate-fade-in">
                        <p>{product.fit}</p>
                        <p className="mt-2 text-stone-300">
                          Model is 185cm / 6'1" wearing size 48 (Men) / 178cm / 5'10" wearing size 36 (Women).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Shipping & Returns */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('shipping')}
                      className="pdp-accordion-trigger w-full py-4 flex items-center justify-between text-xs tracking-[0.15em] uppercase text-stone-200 hover:text-white text-left font-medium cursor-pointer"
                    >
                      <span>Complimentary Shipping & Returns</span>
                      {openAccordion === 'shipping' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {openAccordion === 'shipping' && (
                      <div className="pdp-accordion-content pb-4 text-xs text-stone-400 leading-relaxed space-y-1.5 animate-fade-in">
                        <p>Complimentary express courier shipping on orders over ₹10,000.</p>
                        <p>Standard delivery: 2–4 business days within India in luxury gift packaging.</p>
                        <p>Prepaid complimentary returns and exchanges within 30 calendar days of delivery.</p>
                      </div>
                    )}
                  </div>

                  {/* Customer Reviews */}
                  <div id="pdp-reviews-section">
                    <button
                      onClick={() => toggleAccordion('reviews')}
                      className="pdp-accordion-trigger w-full py-4 flex items-center justify-between text-xs tracking-[0.15em] uppercase text-stone-200 hover:text-white text-left font-medium cursor-pointer"
                    >
                      <span>Verified Client Reviews ({productReviews.length})</span>
                      {openAccordion === 'reviews' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {openAccordion === 'reviews' && (
                      <div className="pdp-accordion-content pb-4 text-xs space-y-4 animate-fade-in">
                        {/* Rating Overview Card */}
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
                        }`}>
                          <div className="flex items-center space-x-3.5">
                            <div className={`text-3xl font-serif font-bold ${
                              theme === 'alabaster' ? 'text-stone-900' : 'text-white'
                            }`}>
                              {product.rating.toFixed(1)}
                            </div>
                            <div>
                              <div className="flex text-amber-400 text-sm">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < Math.round(product.rating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-stone-500'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] text-stone-400 block mt-0.5">
                                Based on {productReviews.length} verified provenance appraisals
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsWritingReview(!isWritingReview)}
                            className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-medium text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer shrink-0 ${
                              theme === 'alabaster'
                                ? 'bg-black text-white hover:bg-stone-800'
                                : 'bg-white text-black hover:bg-stone-200'
                            }`}
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5" />
                            <span>{isWritingReview ? 'Close Form' : 'Write a Review'}</span>
                          </button>
                        </div>

                        {/* Interactive Review Submission Form */}
                        {isWritingReview && (
                          <form
                            onSubmit={handleSubmitReview}
                            className={`p-5 rounded-2xl border space-y-4 animate-fade-in shadow-xl ${
                              theme === 'alabaster'
                                ? 'bg-white border-amber-500/40'
                                : 'bg-white/[0.04] border-amber-500/30'
                            }`}
                          >
                            <div className={`flex items-center justify-between border-b pb-3 ${
                              theme === 'alabaster' ? 'border-stone-200' : 'border-white/10'
                            }`}>
                              <span className="text-xs uppercase tracking-[0.2em] font-serif text-amber-500 font-semibold flex items-center space-x-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Write Verified Review</span>
                              </span>
                              <span className="text-[10px] text-stone-400">Authentic Client Feedback</span>
                            </div>

                            {/* Clickable Star Rating Picker */}
                            <div>
                              <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5 font-medium">
                                Rating *
                              </label>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setReviewRating(star)}
                                    className="p-1 text-2xl transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                                    aria-label={`${star} star`}
                                  >
                                    <span
                                      className={
                                        (hoverRating || reviewRating) >= star
                                          ? 'text-amber-400'
                                          : 'text-stone-600'
                                      }
                                    >
                                      ★
                                    </span>
                                  </button>
                                ))}
                                <span className="text-xs font-mono text-stone-400 ml-2">
                                  {reviewRating === 5 && '★★★★★ Exceptional'}
                                  {reviewRating === 4 && '★★★★ Very Good'}
                                  {reviewRating === 3 && '★★★ Average'}
                                  {reviewRating === 2 && '★★ Fair'}
                                  {reviewRating === 1 && '★ Needs Improvement'}
                                </span>
                              </div>
                            </div>

                            {/* Reviewer Name & Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                                  Your Name *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={reviewAuthor}
                                  onChange={(e) => setReviewAuthor(e.target.value)}
                                  placeholder="e.g. Priya Sharma / Zarb Client"
                                  className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none ${
                                    theme === 'alabaster'
                                      ? 'bg-stone-50 border-stone-300 text-black'
                                      : 'bg-white/[0.05] border-white/10 text-white'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                                  Location / City
                                </label>
                                <input
                                  type="text"
                                  value={reviewLocation}
                                  onChange={(e) => setReviewLocation(e.target.value)}
                                  placeholder="e.g. Mumbai, India"
                                  className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none ${
                                    theme === 'alabaster'
                                      ? 'bg-stone-50 border-stone-300 text-black'
                                      : 'bg-white/[0.05] border-white/10 text-white'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Headline */}
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                                Review Headline
                              </label>
                              <input
                                type="text"
                                value={reviewTitle}
                                onChange={(e) => setReviewTitle(e.target.value)}
                                placeholder="e.g. Flawless fabric texture & exquisite silhouette"
                                className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-none ${
                                  theme === 'alabaster'
                                    ? 'bg-stone-50 border-stone-300 text-black'
                                    : 'bg-white/[0.05] border-white/10 text-white'
                                }`}
                              />
                            </div>

                            {/* Detailed Comment */}
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                                Detailed Experience *
                              </label>
                              <textarea
                                required
                                rows={3}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Describe the tailoring, drape, comfort, packaging, and how it wears..."
                                className={`w-full rounded-xl p-3 text-xs border focus:outline-none leading-relaxed ${
                                  theme === 'alabaster'
                                    ? 'bg-stone-50 border-stone-300 text-black'
                                    : 'bg-white/[0.05] border-white/10 text-white'
                                }`}
                              />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setIsWritingReview(false)}
                                className="px-4 py-2 rounded-xl border border-white/15 text-stone-400 hover:text-white text-xs uppercase tracking-wider cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-colors"
                              >
                                Publish Review
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Verified Reviews Stream */}
                        <div className="space-y-3 pt-1">
                          {productReviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="pdp-review-card bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-2 hover:border-white/10 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="pdp-reviewer-name font-medium text-stone-200">
                                      {rev.authorName}
                                    </span>
                                    {rev.authorLocation && (
                                      <span className="text-[11px] text-stone-500">
                                        &middot; {rev.authorLocation}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-0.5 text-amber-400 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={i < rev.rating ? 'text-amber-400' : 'text-stone-700'}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {rev.verifiedPurchase && (
                                  <span className="flex items-center space-x-1 text-[10px] font-mono tracking-wider uppercase text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Verified Client</span>
                                  </span>
                                )}
                              </div>

                              {rev.title && (
                                <h4 className={`text-xs font-serif font-semibold tracking-wide ${
                                  theme === 'alabaster' ? 'text-stone-900' : 'text-white'
                                }`}>
                                  "{rev.title}"
                                </h4>
                              )}

                              <p className="pdp-review-text text-stone-300 font-light leading-relaxed">
                                {rev.comment}
                              </p>

                              <div className="flex items-center justify-between pt-1 text-[10px] text-stone-500">
                                <span>
                                  {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                <span className="text-[10px] text-stone-500">
                                  Provenance Confirmed
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related / Recommended Atelier Pieces */}
          <div className="pdp-related-section mt-16 pt-12 border-t border-white/10">
            <h3 className="pdp-related-heading text-xl sm:text-2xl font-serif text-white mb-6 tracking-[0.03em]">
              COMPLETE THE SILHOUETTE
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectProduct(rel)}
                  className="pdp-related-card group cursor-pointer"
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#16161b] mb-2 border border-white/10">
                    <img
                      src={rel.images[0]}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="pdp-related-title text-xs font-sans text-stone-200 line-clamp-1 group-hover:text-white">
                    {rel.name}
                  </h4>
                  <span className="pdp-related-price text-xs font-medium text-stone-400">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(rel.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Res Image Lightbox Modal for Mobile & Desktop */}
      {isFullscreenOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 animate-fade-in select-none"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} Fullscreen View`}
        >
          {/* Top Bar */}
          <div className="relative z-20 flex items-center justify-between w-full max-w-6xl mx-auto pt-1 sm:pt-2 pb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-400">
                Atelier High-Res View
              </span>
              <h3 className="text-sm sm:text-base font-serif text-white tracking-wide truncate max-w-[200px] sm:max-w-md">
                {product.name}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-mono text-[11px] text-stone-400 px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                {activeImageIndex + 1} / {activeGalleryImages.length || 1}
              </span>

              {/* Zoom toggle button */}
              <button
                type="button"
                onClick={() => setIsZoomed(prev => !prev)}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white border border-white/15 backdrop-blur-md transition-colors cursor-pointer"
                title={isZoomed ? "Reset zoom" : "Zoom in"}
                aria-label={isZoomed ? "Reset zoom" : "Zoom in"}
              >
                <ZoomIn className={`w-4 h-4 transition-transform ${isZoomed ? 'scale-125 text-amber-400' : ''}`} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsFullscreenOpen(false);
                  setIsZoomed(false);
                }}
                className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white border border-white/25 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                aria-label="Close Fullscreen View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Fullscreen Image Area with mobile swipe gesture support */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden my-auto w-full max-w-6xl mx-auto"
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const touchEndX = e.changedTouches[0].clientX;
              const diff = touchStartX - touchEndX;
              const totalImgs = activeGalleryImages.length || 1;
              if (Math.abs(diff) > 40) {
                if (diff > 0) {
                  // Swipe Left -> Next Image
                  setActiveImageIndex(prev => (prev + 1) % totalImgs);
                } else {
                  // Swipe Right -> Previous Image
                  setActiveImageIndex(prev => (prev - 1 + totalImgs) % totalImgs);
                }
                setIsZoomed(false);
              }
              setTouchStartX(null);
            }}
          >
            {/* Previous Button */}
            {activeGalleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setActiveImageIndex(prev => (prev - 1 + activeGalleryImages.length) % activeGalleryImages.length);
                  setIsZoomed(false);
                }}
                className="absolute left-1 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xl"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* The Fullscreen Image */}
            <div
              className={`w-full h-full flex items-center justify-center overflow-auto p-1 transition-all duration-300 ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(prev => !prev)}
            >
              <img
                key={`lightbox-${selectedColor}-${activeImageIndex}`}
                src={activeGalleryImages[activeImageIndex] || activeGalleryImages[0] || product.images[0]}
                alt={`${product.name} - ${selectedColor}`}
                className={`max-h-[76vh] sm:max-h-[82vh] max-w-[94vw] object-contain rounded-lg sm:rounded-xl shadow-2xl transition-transform duration-300 ${
                  isZoomed ? 'scale-135 sm:scale-160' : 'scale-100'
                }`}
              />
            </div>

            {/* Next Button */}
            {activeGalleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setActiveImageIndex(prev => (prev + 1) % activeGalleryImages.length);
                  setIsZoomed(false);
                }}
                className="absolute right-1 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xl"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip (Mobile & Desktop) */}
          {activeGalleryImages.length > 1 && (
            <div className="relative z-20 flex items-center justify-center space-x-2 py-1 overflow-x-auto max-w-md mx-auto scrollbar-none">
              {activeGalleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={`relative w-10 h-14 sm:w-12 sm:h-16 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 opacity-100 shadow-lg'
                      : 'border-white/20 opacity-50 hover:opacity-90'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
