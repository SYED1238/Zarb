import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/product';
import { Search, X, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';

interface SearchOverlayProps {
  onSelectProduct: (p: Product) => void;
  onSelectCategory: (cat: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  onSelectProduct,
  onSelectCategory,
}) => {
  const { isSearchOpen, setIsSearchOpen, products } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const trendingTags = [
    'Cashmere Overcoat',
    'Silk Gown',
    'Tailored Blazer',
    'Wide-Leg Trousers',
    'Selvedge Denim',
    'Calfskin Boots',
    'Saddle Bag',
  ];

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  // Filter products by search query
  const matchedProducts = query.trim() === ''
    ? []
    : products.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.gender.toLowerCase().includes(q) ||
          (p.materials && p.materials.toLowerCase().includes(q))
        );
      });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Header bar */}
      <div className="max-w-5xl mx-auto w-full px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-stone-400" />
          <span className="text-xs font-sans tracking-[0.25em] uppercase text-stone-300">
            Atelier Curated Search
          </span>
        </div>

        <button
          onClick={() => setIsSearchOpen(false)}
          className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Big Search Input Field */}
      <div className="max-w-5xl mx-auto w-full px-6 py-6">
        <div className="relative flex items-center">
          <Search className="w-6 h-6 sm:w-8 sm:h-8 text-stone-400 mr-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search silhouettes, materials, jackets, silk..."
            className="w-full bg-transparent text-xl sm:text-3xl md:text-4xl font-serif text-white placeholder-stone-600 focus:outline-none tracking-[0.02em]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-stone-500 hover:text-white p-2"
              aria-label="Clear text"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Results / Suggestions Area */}
      <div className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full px-6 pb-12">
        {query.trim() === '' ? (
          <div className="pt-6 space-y-8">
            {/* Trending Searches */}
            <div>
              <div className="flex items-center space-x-2 text-xs tracking-[0.2em] uppercase text-stone-400 mb-4">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trending Searches in Haute Prêt-à-Porter</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs tracking-[0.1em] text-stone-200 hover:text-white transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Collections */}
            <div>
              <span className="text-xs tracking-[0.2em] uppercase text-stone-400 block mb-4">
                Explore Core Divisions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Jackets', 'Dresses', 'Trousers', 'Bags'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onSelectCategory(cat);
                      setIsSearchOpen(false);
                    }}
                    className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group"
                  >
                    <span className="text-sm font-serif text-white block mb-1">
                      {cat}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 group-hover:text-stone-300 flex items-center space-x-1">
                      <span>View Division</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-6 flex items-center justify-between border-b border-white/10 pb-3">
              <span>Results for "{query}"</span>
              <span className="font-mono">{matchedProducts.length} items found</span>
            </div>

            {matchedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {matchedProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      setIsSearchOpen(false);
                    }}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#16161b] mb-2.5 border border-white/10">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block">
                      {product.gender} &middot; {product.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-sans text-stone-100 group-hover:text-white line-clamp-1 transition-colors">
                      {product.name}
                    </h4>
                    <span className="text-xs font-medium text-white">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-stone-400 space-y-3">
                <p className="text-base font-serif text-stone-300">
                  No matching silhouettes found for "{query}".
                </p>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Try searching for cashmere, blazer, dress, trousers, or denim.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
