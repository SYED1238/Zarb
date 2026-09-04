import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import type { Product } from '../types/product';
import { 
  ArrowUpDown, 
  Check, 
  ChevronRight, 
  SlidersHorizontal, 
  X, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface CategoryPageProps {
  onQuickView: (product: Product) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ onQuickView }) => {
  const { gender: paramGender, categorySlug } = useParams<{ gender?: string; categorySlug?: string }>();
  const navigate = useNavigate();
  const { gender: storeGender, setGender, products, getCategories, getCategoryBySlug } = useStore();

  // Normalize gender from URL (default to storeGender or 'women')
  const gender: 'men' | 'women' = (paramGender === 'men' || paramGender === 'women') 
    ? paramGender 
    : (storeGender === 'men' ? 'men' : 'women');

  // Synchronize store gender with URL param
  useEffect(() => {
    if (gender !== storeGender) {
      setGender(gender);
    }
  }, [gender, storeGender, setGender]);

  // Current category item from dynamic store
  const currentCategory = useMemo(() => {
    if (!categorySlug || categorySlug === 'all') return null;
    return getCategoryBySlug(gender, categorySlug);
  }, [gender, categorySlug, getCategoryBySlug]);

  const categoriesList = useMemo(() => getCategories(gender), [gender, getCategories]);

  // SEO: Update Title and Meta tags dynamically
  useEffect(() => {
    const pageTitle = currentCategory 
      ? `${currentCategory.name} — Zarb`
      : `${gender === 'women' ? "Women's Collection" : "Men's Collection"} — Zarb`;
    document.title = pageTitle;

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      currentCategory?.metaDescription || `Explore modern luxury ${gender} fashion from Zarb.`
    );
  }, [currentCategory, gender]);

  // Filter States
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'under15k' | '15k-30k' | 'over30k'>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Available Sizes for this gender
  const availableSizes = useMemo(() => {
    return gender === 'women' 
      ? ['34 (XS)', '36 (S)', '38 (M)', '40 (L)', '25', '26', '27', '28', '29', '30'] 
      : ['46 (S)', '48 (M)', '50 (L)', '52 (XL)', '30', '32', '34', '36'];
  }, [gender]);

  // Filter & Sort Products (Strict category filtering: ONLY products belonging to category)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Must match active gender
      if (p.gender !== gender) return false;

      // Must match specific category if not on 'all'
      if (currentCategory && p.category.toLowerCase() !== currentCategory.slug.toLowerCase()) {
        return false;
      }

      // Size filter
      if (selectedSize !== 'all' && !p.sizes.some((s) => s.includes(selectedSize) || selectedSize.includes(s))) {
        return false;
      }

      // Color filter
      if (selectedColor !== 'all' && !p.colors.some((c) => c.name.toLowerCase().includes(selectedColor.toLowerCase()))) {
        return false;
      }

      // Price filter
      if (priceRange === 'under15k' && p.price >= 15000) return false;
      if (priceRange === '15k-30k' && (p.price < 15000 || p.price > 30000)) return false;
      if (priceRange === 'over30k' && p.price <= 30000) return false;

      // In Stock filter
      if (inStockOnly && p.stock <= 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0);
      return 0; // featured default
    });
  }, [products, gender, currentCategory, selectedSize, selectedColor, priceRange, inStockOnly, sortBy]);

  // Total products in this category before secondary filter
  const totalCategoryPieces = useMemo(() => {
    return products.filter((p) => {
      if (p.gender !== gender) return false;
      if (currentCategory && p.category.toLowerCase() !== currentCategory.slug.toLowerCase()) return false;
      return true;
    }).length;
  }, [products, gender, currentCategory]);

  const hasActiveFilters = selectedSize !== 'all' || selectedColor !== 'all' || priceRange !== 'all' || inStockOnly;

  const handleResetFilters = () => {
    setSelectedSize('all');
    setSelectedColor('all');
    setPriceRange('all');
    setInStockOnly(false);
  };

  const sortLabels = {
    featured: 'Featured Editorial',
    newest: 'Newest Arrivals',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    rating: 'Highest Rated',
  };

  return (
    <div id="category-page-container" className="min-h-screen pt-24 sm:pt-28 pb-20">
      {/* Category Header Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
        {/* Breadcrumb Navigation */}
        <nav className="category-breadcrumbs flex items-center space-x-2 text-xs tracking-[0.15em] uppercase text-stone-400 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="category-breadcrumb-link hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="category-breadcrumb-sep w-3 h-3 text-stone-600" />
          <Link to={`/shop/${gender}`} className="category-breadcrumb-link hover:text-white transition-colors">
            {gender === 'women' ? "Women's Wardrobe" : "Men's Wardrobe"}
          </Link>
          {currentCategory && (
            <>
              <ChevronRight className="category-breadcrumb-sep w-3 h-3 text-stone-600" />
              <span className="category-breadcrumb-active text-stone-200 font-medium">
                {currentCategory.shortName}
              </span>
            </>
          )}
        </nav>

        {/* Editorial Eyebrow & Title */}
        <div className="category-header-divider border-b border-white/10 pb-8 sm:pb-12">
          <span className="category-page-eyebrow text-xs sm:text-sm font-sans tracking-[0.3em] uppercase text-stone-400 block mb-3">
            {currentCategory ? currentCategory.eyebrow : `${gender.toUpperCase()}'S WARDROBE · FULL COLLECTION`}
          </span>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="category-page-title text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-[0.02em] font-light leading-tight">
                {currentCategory ? currentCategory.name : (gender === 'women' ? "Women's Collection" : "Men's Collection")}
              </h1>

              <p className="category-page-desc mt-3 text-sm sm:text-base text-stone-300 font-light max-w-2xl leading-relaxed">
                {currentCategory
                  ? currentCategory.description
                  : "Discover our comprehensive autumn/winter collection crafted with architectural precision and unyielding restraint."}
              </p>
            </div>

            {/* Dynamic Pieces Count */}
            <div className="shrink-0">
              <span className="category-page-count inline-flex items-center space-x-2 bg-white/[0.06] border border-white/10 px-4 py-2 rounded-full text-xs font-sans tracking-[0.2em] uppercase text-stone-200">
                <Sparkles className="category-count-icon w-3.5 h-3.5 text-stone-400" />
                <span className="category-count-text">
                  {currentCategory ? currentCategory.shortName : 'Collection'} &middot; {totalCategoryPieces} {totalCategoryPieces === 1 ? 'Piece' : 'Pieces'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Category Navigation Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="category-nav-bar flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-none">
          {/* All Pieces Pill */}
          <button
            onClick={() => navigate(`/shop/${gender}`)}
            className={`category-nav-pill whitespace-nowrap px-5 py-2.5 rounded-full text-xs tracking-[0.18em] uppercase transition-all duration-300 cursor-pointer ${
              !currentCategory
                ? 'category-nav-active bg-white text-black font-medium shadow-lg'
                : 'category-nav-inactive bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            All Pieces
          </button>

          {/* Each Category Pill */}
          {categoriesList.map((cat) => {
            const isActive = currentCategory?.slug === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => navigate(`/shop/${gender}/${cat.slug}`)}
                className={`category-nav-pill whitespace-nowrap px-5 py-2.5 rounded-full text-xs tracking-[0.18em] uppercase transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'category-nav-active bg-white text-black font-medium shadow-lg'
                    : 'category-nav-inactive bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat.shortName}
              </button>
            );
          })}
        </div>
      </section>

      {/* Controls Bar: Filter Toggles & Sorting */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="category-controls-bar flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          {/* Left: Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile Filter Drawer Button */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="sm:hidden flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs tracking-[0.15em] uppercase text-stone-200"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center space-x-3">
              {/* Size Select */}
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="category-filter-select bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-stone-200 tracking-[0.1em] uppercase focus:outline-none cursor-pointer"
                aria-label="Filter by size"
              >
                <option value="all" className="bg-[#121215] text-white">Size: All</option>
                {availableSizes.map((s) => (
                  <option key={s} value={s} className="bg-[#121215] text-white">Size: {s}</option>
                ))}
              </select>

              {/* Price Filter */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as any)}
                className="category-filter-select bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-stone-200 tracking-[0.1em] uppercase focus:outline-none cursor-pointer"
                aria-label="Filter by price"
              >
                <option value="all" className="bg-[#121215] text-white">Price: All</option>
                <option value="under15k" className="bg-[#121215] text-white">Under ₹15,000</option>
                <option value="15k-30k" className="bg-[#121215] text-white">₹15,000 – ₹30,000</option>
                <option value="over30k" className="bg-[#121215] text-white">Above ₹30,000</option>
              </select>

              {/* In Stock Only Checkbox */}
              <label className="category-stock-label flex items-center space-x-2 text-xs tracking-[0.1em] uppercase text-stone-300 cursor-pointer pl-1">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-stone-200 focus:ring-0 cursor-pointer"
                />
                <span className="category-stock-text">In Stock Only</span>
              </label>

              {/* Reset filters button if any active */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="category-sort-trigger flex items-center space-x-2 py-2 px-4 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs tracking-[0.15em] uppercase text-stone-200 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortLabels[sortBy]}</span>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-52 py-2 glass-dropdown rounded-xl z-30 animate-fade-in border border-white/10 shadow-2xl">
                {(Object.keys(sortLabels) as (keyof typeof sortLabels)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortBy(key);
                      setIsSortOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs tracking-[0.1em] uppercase text-stone-300 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{sortLabels[key]}</span>
                    {sortBy === key && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          /* Luxury Empty State */
          <div className="text-center py-24 sm:py-32 border border-dashed border-white/10 rounded-3xl p-8 max-w-2xl mx-auto">
            <span className="text-[11px] font-sans tracking-[0.3em] uppercase text-stone-400 block mb-2">
              Atelier Archive
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif text-white tracking-[0.03em] mb-4">
              {totalCategoryPieces === 0 ? "COMING SOON" : "No Pieces Match Selected Filters"}
            </h3>
            <p className="text-sm text-stone-400 font-light leading-relaxed mb-8 max-w-md mx-auto">
              {totalCategoryPieces === 0
                ? `The ${currentCategory?.name || 'collection'} is currently being handcrafted for the upcoming runway drop. Explore our complementary atelier pieces.`
                : "Try expanding your filter criteria or view the entire collection to find your desired silhouette."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {hasActiveFilters ? (
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 rounded-xl bg-white text-black text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/shop/${gender}`)}
                  className="px-6 py-3 rounded-xl bg-white text-black text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Explore All {gender === 'women' ? "Women's" : "Men's"} Pieces
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Mobile Filter Drawer Modal */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:hidden bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full bg-[#0e0e11] border-t border-white/15 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-sm font-serif text-white tracking-wider uppercase">Filter Collection</span>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-2 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Size Options */}
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-400 block mb-3">Size</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSize('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs tracking-wider border ${
                    selectedSize === 'all' ? 'bg-white text-black border-white' : 'bg-white/5 text-stone-300 border-white/10'
                  }`}
                >
                  All
                </button>
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs tracking-wider border ${
                      selectedSize === s ? 'bg-white text-black border-white' : 'bg-white/5 text-stone-300 border-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Options */}
            <div>
              <span className="text-xs uppercase tracking-wider text-stone-400 block mb-3">Price Range</span>
              <div className="space-y-2 text-xs">
                {[
                  { key: 'all', label: 'All Prices' },
                  { key: 'under15k', label: 'Under ₹15,000' },
                  { key: '15k-30k', label: '₹15,000 – ₹30,000' },
                  { key: 'over30k', label: 'Above ₹30,000' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPriceRange(opt.key as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg border ${
                      priceRange === opt.key ? 'bg-white text-black border-white' : 'bg-white/5 text-stone-300 border-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-white/10">
              <span className="text-xs uppercase tracking-wider text-stone-300">In Stock Only</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-0"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-xl border border-white/20 text-xs tracking-wider uppercase text-stone-300"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white text-black font-medium text-xs tracking-wider uppercase"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
