import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ArrowUpRight } from 'lucide-react';

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
        {categories.map((cat) => {
          const countBadge = getProductCount(cat.slug);

          return (
            <div
              key={cat.id}
              onClick={() => handleCardClick(cat.slug)}
              className="category-tile-card group relative overflow-hidden rounded-2xl cursor-pointer aspect-[3/4] bg-[#121215] border border-white/10 hover:border-white/40 transition-all duration-500 shadow-lg hover:shadow-2xl"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(cat.slug);
                }
              }}
              aria-label={`Explore ${cat.name} collection`}
            >
              {/* Category Image with Subtle Zoom */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-108"
                style={{
                  backgroundImage: `url(${cat.image})`,
                  filter: 'brightness(0.68) contrast(1.05)',
                }}
              />

              {/* Gradient Overlay for Guaranteed Dark Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent group-hover:via-black/30 transition-colors duration-500" />

              {/* Text Card Content */}
              <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="category-tile-badge text-[10px] tracking-[0.25em] uppercase text-stone-200 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                    {countBadge}
                  </span>
                  <div className="category-tile-arrow w-7 h-7 rounded-full bg-white/15 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h3 className="category-tile-name text-lg sm:text-xl font-serif tracking-[0.04em] text-white group-hover:translate-x-1 transition-transform duration-300">
                    {cat.name}
                  </h3>
                  <span className="category-tile-sub text-[11px] font-sans tracking-[0.2em] uppercase text-stone-300 block mt-1">
                    Explore Silhouettes
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
