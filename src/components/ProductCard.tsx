import React, { useState, useMemo } from 'react';
import type { Product } from '../types/product';
import { useStore } from '../context/StoreContext';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';
import { getMediaUrl } from '../utils/media';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { wishlist, toggleWishlist, addToCart, theme } = useStore();
  const isAlabaster = theme === 'alabaster';
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const isSaved = wishlist.includes(product.id);

  // Dedicated photos for selected color, falling back to product.images
  const selectedColor = product.colors?.[selectedColorIndex];
  const colorImages = useMemo(() => {
    if (selectedColor?.images && selectedColor.images.length > 0) {
      return selectedColor.images;
    }
    if (selectedColor?.image) {
      return [selectedColor.image, ...product.images.filter(img => img !== selectedColor.image)];
    }
    return product.images && product.images.length > 0 ? product.images : [];
  }, [product.images, selectedColor]);

  const primaryImage = colorImages[0] || product.images[0];
  const secondaryImage = colorImages[1] || product.images[1] || primaryImage;
  const activeImage = isHovered ? secondaryImage : primaryImage;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[selectedColorIndex]?.name || 'Standard';
    addToCart(product, defaultSize, defaultColor, 1);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  // Format currency in Indian Rupees
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

  return (
    <div
      onClick={() => onQuickView(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer flex flex-col justify-between"
      role="article"
      aria-label={product.name}
    >
      {/* Image Container with editorial 3:4 ratio */}
      <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl mb-4 border transition-colors duration-300 ${
        isAlabaster ? 'bg-stone-200 border-stone-200/80' : 'bg-[#141418] border-transparent'
      }`}>
        {/* Primary Image with Crossfade */}
        <img
          key={`${product.id}-${selectedColorIndex}-${isHovered}`}
          src={getMediaUrl(activeImage)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 animate-fade-in"
        />

        {/* Subtle dark gradient at bottom for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />

        {/* Badges: New Season / Best Seller */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.newArrival && (
            <span className="product-badge-new text-[9px] font-sans font-medium uppercase tracking-[0.25em] bg-white text-black px-2 py-0.5 rounded-sm shadow-md">
              NEW
            </span>
          )}
          {product.bestSeller && (
            <span className="product-badge-edition text-[9px] font-sans font-medium uppercase tracking-[0.25em] bg-black/80 backdrop-blur-md text-stone-200 border border-white/20 px-2 py-0.5 rounded-sm">
              EDITION
            </span>
          )}
        </div>

        {/* Floating Wishlist Heart */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 z-10 cursor-pointer ${
            isSaved
              ? 'bg-white text-red-600 scale-110 shadow-lg'
              : 'bg-black/40 text-stone-300 hover:text-white hover:bg-black/70 opacity-90 sm:opacity-0 group-hover:opacity-100'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-600' : ''}`} />
        </button>

        {/* Quick Actions overlay on desktop hover */}
        <div className="absolute bottom-3 inset-x-3 hidden sm:flex items-center space-x-2 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleQuickAdd}
            className={`product-quick-add flex-1 py-2.5 px-3 rounded-lg text-[11px] font-sans font-medium uppercase tracking-[0.2em] flex items-center justify-center space-x-1.5 shadow-xl transition-all cursor-pointer ${
              isAlabaster
                ? 'bg-stone-950 hover:bg-black text-white'
                : 'bg-white hover:bg-stone-200 text-black'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>QUICK ADD</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="product-quick-eye bg-black/80 hover:bg-black text-white p-2.5 rounded-lg border border-white/20 backdrop-blur-md transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Quick View button on card image */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className={`sm:hidden absolute bottom-2.5 right-2.5 p-2 rounded-full backdrop-blur-md shadow-md z-10 transition-all active:scale-95 cursor-pointer ${
            isAlabaster
              ? 'bg-white/90 text-stone-900 border border-stone-300/80 shadow-black/10'
              : 'bg-black/65 text-stone-200 border border-white/20'
          }`}
          aria-label="View piece in detail"
          title="View Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product Information */}
      <div className="space-y-1.5">
        {/* Category & Rating */}
        <div className={`flex items-center justify-between text-[11px] uppercase tracking-[0.2em] ${
          isAlabaster ? 'text-stone-500' : 'text-stone-400'
        }`}>
          <span>{product.category}</span>
          <div className={`flex items-center space-x-1 ${isAlabaster ? 'text-stone-700' : 'text-stone-300'}`}>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Product Title */}
        <h3 className={`text-sm font-sans tracking-[0.04em] line-clamp-1 transition-colors ${
          isAlabaster
            ? 'text-stone-900 group-hover:text-black font-medium'
            : 'text-stone-100 group-hover:text-white font-normal'
        }`}>
          {product.name}
        </h3>

        {/* Price & Compare */}
        <div className="flex items-center space-x-2.5 pt-0.5">
          <span className={`text-sm tracking-[0.06em] ${
            isAlabaster ? 'text-stone-950 font-semibold' : 'text-stone-100 font-medium'
          }`}>
            {formattedPrice}
          </span>
          {formattedComparePrice && (
            <span className={`text-xs line-through tracking-[0.04em] ${
              isAlabaster ? 'text-stone-400' : 'text-stone-500'
            }`}>
              {formattedComparePrice}
            </span>
          )}
        </div>

        {/* Color swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center space-x-1.5 pt-1">
            {product.colors.map((col, idx) => (
              <button
                key={col.name}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedColorIndex(idx);
                }}
                onMouseEnter={() => setSelectedColorIndex(idx)}
                className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                  selectedColorIndex === idx
                    ? (isAlabaster
                        ? 'ring-1 ring-stone-900 ring-offset-2 ring-offset-[#f6f5f0] border-stone-900 scale-110'
                        : 'ring-1 ring-white ring-offset-2 ring-offset-[#09090b] border-white scale-110')
                    : (isAlabaster ? 'border-stone-300 hover:border-stone-600' : 'border-white/20 hover:border-white/60')
                }`}
                style={{ backgroundColor: col.hex }}
                title={col.name}
                aria-label={`Select color ${col.name}`}
              />
            ))}
            {product.colors.length > 1 && (
              <span className={`text-[10px] font-sans tracking-[0.1em] pl-1 ${
                isAlabaster ? 'text-stone-500' : 'text-stone-400'
              }`}>
                {product.colors.length} shades
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
