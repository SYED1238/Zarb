import React, { useState, useMemo } from 'react';
import type { Product } from '../types/product';
import { ProductCard } from './ProductCard';
import { useStore } from '../context/StoreContext';
import { ArrowUpDown, Check } from 'lucide-react';

interface ProductGridProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  activeFilter: string | null;
  onQuickView: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  selectedCategory,
  onSelectCategory,
  activeFilter,
  onQuickView,
}) => {
  const { gender, setGender, products, getCategories, theme } = useStore();
  const isAlabaster = theme === 'alabaster';
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const currentCategoryList = getCategories(gender === 'all' ? 'women' : gender);
  const categories = [
    { id: 'all', name: 'All Pieces' },
    ...currentCategoryList.map((c) => ({ id: c.slug, name: c.name })),
  ];

  // Filter products by current active gender, category, and quick filter flags
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Gender filter
      if (gender !== 'all' && p.gender !== gender) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Special filter tabs (new arrival / best seller)
      if (activeFilter === 'newArrival' && !p.newArrival) {
        return false;
      }
      if (activeFilter === 'bestSeller' && !p.bestSeller) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0);
      return 0; // default featured
    });
  }, [products, gender, selectedCategory, activeFilter, sortBy]);

  const sortLabels = {
    featured: 'Featured Editorial',
    newest: 'New Arrivals',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    rating: 'Highest Rated',
  };

  return (
    <section id="catalog-section" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with Title & Controls */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b transition-colors duration-300 ${
        isAlabaster ? 'border-stone-300/80' : 'border-white/10'
      }`}>
        <div>
          <span className={`text-[11px] font-sans tracking-[0.3em] uppercase block mb-2 font-medium ${
            isAlabaster ? 'text-stone-600' : 'text-stone-400'
          }`}>
            Collection N° 08 &middot; {gender === 'men' ? "Men's Wardrobe" : "Women's Wardrobe"}
          </span>
          <h2 className={`text-3xl sm:text-4xl font-serif tracking-[0.02em] ${
            isAlabaster ? 'text-stone-950 font-normal' : 'text-white'
          }`}>
            THE CURATED COLLECTION
          </h2>
        </div>

        {/* Action controls: Sort & Gender Switch */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Gender Filter Pills */}
          <div className={`gender-pills-container flex items-center p-1 rounded-xl border transition-colors duration-300 ${
            isAlabaster
              ? 'bg-stone-200/80 border-stone-300/80 shadow-xs'
              : 'bg-white/[0.05] border-white/10'
          }`}>
            <button
              onClick={() => setGender('all')}
              className={`gender-filter-btn px-3 py-1.5 rounded-lg text-xs tracking-[0.15em] uppercase transition-all cursor-pointer ${
                gender === 'all'
                  ? (isAlabaster ? 'gender-btn-active bg-stone-950 text-white font-semibold shadow-xs' : 'gender-btn-active bg-white text-black font-medium')
                  : (isAlabaster ? 'gender-btn-inactive text-stone-600 hover:text-black' : 'gender-btn-inactive text-stone-400 hover:text-white')
              }`}
            >
              All
            </button>
            <button
              onClick={() => setGender('men')}
              className={`gender-filter-btn px-3 py-1.5 rounded-lg text-xs tracking-[0.15em] uppercase transition-all cursor-pointer ${
                gender === 'men'
                  ? (isAlabaster ? 'gender-btn-active bg-stone-950 text-white font-semibold shadow-xs' : 'gender-btn-active bg-white text-black font-medium')
                  : (isAlabaster ? 'gender-btn-inactive text-stone-600 hover:text-black' : 'gender-btn-inactive text-stone-400 hover:text-white')
              }`}
            >
              Men
            </button>
            <button
              onClick={() => setGender('women')}
              className={`gender-filter-btn px-3 py-1.5 rounded-lg text-xs tracking-[0.15em] uppercase transition-all cursor-pointer ${
                gender === 'women'
                  ? (isAlabaster ? 'gender-btn-active bg-stone-950 text-white font-semibold shadow-xs' : 'gender-btn-active bg-white text-black font-medium')
                  : (isAlabaster ? 'gender-btn-inactive text-stone-600 hover:text-black' : 'gender-btn-inactive text-stone-400 hover:text-white')
              }`}
            >
              Women
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className={`catalog-sort-btn flex items-center space-x-2 py-2 px-3.5 rounded-xl text-xs tracking-[0.15em] uppercase transition-all cursor-pointer ${
                isAlabaster
                  ? 'bg-white border border-stone-300 text-stone-900 hover:border-stone-400 shadow-xs'
                  : 'bg-white/[0.05] hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortLabels[sortBy]}</span>
            </button>

            {isSortDropdownOpen && (
              <div className={`absolute right-0 mt-2 w-52 py-2 rounded-xl z-20 animate-fade-in border shadow-2xl ${
                isAlabaster
                  ? 'bg-white border-stone-200 text-stone-900'
                  : 'glass-dropdown border-white/10 text-stone-300'
              }`}>
                {(Object.keys(sortLabels) as (keyof typeof sortLabels)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortBy(key);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs tracking-[0.1em] uppercase flex items-center justify-between transition-colors cursor-pointer ${
                      isAlabaster
                        ? 'text-stone-700 hover:text-black hover:bg-stone-100'
                        : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{sortLabels[key]}</span>
                    {sortBy === key && <Check className={`w-3.5 h-3.5 ${isAlabaster ? 'text-stone-950' : 'text-white'}`} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-6 scrollbar-none mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`category-filter-pill whitespace-nowrap px-4 py-2 rounded-full text-xs tracking-[0.15em] uppercase transition-all duration-300 cursor-pointer ${
              selectedCategory === cat.id
                ? (isAlabaster ? 'cat-pill-active bg-stone-950 text-white font-medium shadow-sm' : 'cat-pill-active bg-white text-black font-medium shadow-md')
                : (isAlabaster ? 'cat-pill-inactive bg-white text-stone-700 hover:text-black hover:bg-stone-100 border border-stone-300/80 shadow-xs' : 'cat-pill-inactive bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/10 border border-white/10')
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid: 2 columns mobile, 3 tablet, 4 desktop */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl p-8">
          <p className="text-stone-400 text-sm tracking-[0.1em] uppercase mb-4">
            No atelier garments found for this specific filter.
          </p>
          <button
            onClick={() => onSelectCategory('all')}
            className="px-6 py-2.5 rounded-full bg-white text-black text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-200 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </section>
  );
};
