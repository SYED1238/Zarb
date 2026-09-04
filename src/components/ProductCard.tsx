import React, { useState } from 'react';
import type { Product } from '../types/product';
import { useStore } from '../context/StoreContext';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const isSaved = wishlist.includes(product.id);
  const secondaryImage = product.images[1] || product.images[0];
  const activeImage = isHovered ? secondaryImage : product.images[0];

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
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#141418] mb-4">
        {/* Primary Image with Crossfade */}
        <img
          src={activeImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
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
            className="product-quick-add flex-1 bg-white hover:bg-stone-200 text-black py-2.5 px-3 rounded-lg text-[11px] font-sans font-medium uppercase tracking-[0.2em] flex items-center justify-center space-x-1.5 shadow-xl transition-colors cursor-pointer"
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
      </div>

      {/* Product Information */}
      <div className="space-y-1.5">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-stone-400">
          <span>{product.category}</span>
          <div className="flex items-center space-x-1 text-stone-300">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Product Title */}
        <h3 className="text-sm font-sans font-normal tracking-[0.04em] text-stone-100 group-hover:text-white line-clamp-1 transition-colors">
          {product.name}
        </h3>

        {/* Price & Compare */}
        <div className="flex items-center space-x-2.5 pt-0.5">
          <span className="text-sm font-medium tracking-[0.06em] text-stone-100">
            {formattedPrice}
          </span>
          {formattedComparePrice && (
            <span className="text-xs text-stone-500 line-through tracking-[0.04em]">
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
                className={`w-3 h-3 rounded-full border transition-all ${
                  selectedColorIndex === idx
                    ? 'ring-1 ring-white ring-offset-2 ring-offset-[#09090b] border-white scale-110'
                    : 'border-white/20 hover:border-white/60'
                }`}
                style={{ backgroundColor: col.hex }}
                title={col.name}
                aria-label={`Select color ${col.name}`}
              />
            ))}
            {product.colors.length > 1 && (
              <span className="text-[10px] text-stone-400 font-sans tracking-[0.1em] pl-1">
                {product.colors.length} shades
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
