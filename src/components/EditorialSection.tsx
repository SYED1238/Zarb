import React from 'react';
import { Sparkles, Scissors, Gem, Feather } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface EditorialSectionProps {
  onShopCollection: (gender: 'men' | 'women') => void;
}

export const EditorialSection: React.FC<EditorialSectionProps> = ({ onShopCollection }) => {
  const { theme } = useStore();
  const isAlabaster = theme === 'alabaster';

  return (
    <div
      id="editorial-section"
      className={`py-20 sm:py-32 border-y transition-colors duration-500 ${
        isAlabaster
          ? 'bg-[#ece8df] border-stone-300/80 text-stone-900'
          : 'bg-[#0a0a0c] border-white/10 text-white'
      }`}
    >
      {/* Campaign Feature 1: The Philosophy */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column Text */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className={`inline-flex items-center space-x-2 ${
                isAlabaster ? 'text-stone-600' : 'text-stone-400'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAlabaster ? 'text-amber-700' : 'text-amber-400'}`} />
              <span className="text-[11px] font-sans tracking-[0.3em] uppercase font-medium">
                Campaign No. 08 Editorial
              </span>
            </div>

            <h2
              className={`text-3xl sm:text-4xl md:text-5xl font-serif font-light leading-tight tracking-[0.02em] ${
                isAlabaster ? 'text-stone-950' : 'text-white'
              }`}
            >
              THE QUIET REVOLUTION OF RESTRAINT
            </h2>

            <p
              className={`text-sm sm:text-base font-light leading-relaxed ${
                isAlabaster ? 'text-stone-700' : 'text-stone-300'
              }`}
            >
              We reject the transient cadence of fast fashion. Each silhouette in the Zarb catalog is sculpted through months of pattern adjustments, draped directly onto live forms in our Milanese studio, and constructed with floating horsehair canvases.
            </p>

            <blockquote
              className={`pl-4 py-1 text-sm italic font-serif border-l ${
                isAlabaster
                  ? 'border-stone-400 text-stone-800'
                  : 'border-white/30 text-stone-200'
              }`}
            >
              "True luxury is not about loudness or logos; it is the silent assurance of architectural proportion and noble fibers."
            </blockquote>

            <div className="pt-4 flex items-center space-x-4">
              <button
                onClick={() => onShopCollection('men')}
                className={`px-6 py-3 rounded-xl text-xs tracking-[0.2em] uppercase transition-all cursor-pointer font-medium ${
                  isAlabaster
                    ? 'bg-stone-950 text-white hover:bg-black shadow-sm'
                    : 'border border-white/20 hover:border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                Men's Lookbook
              </button>
              <button
                onClick={() => onShopCollection('women')}
                className={`px-6 py-3 rounded-xl text-xs tracking-[0.2em] uppercase transition-all cursor-pointer font-medium ${
                  isAlabaster
                    ? 'bg-white border border-stone-300 text-stone-900 hover:bg-stone-100 shadow-sm'
                    : 'border border-white/20 hover:border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                Women's Lookbook
              </button>
            </div>
          </div>

          {/* Right Column Editorial Image Pair */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden border group shadow-lg ${
                isAlabaster ? 'bg-stone-200 border-stone-300/80' : 'bg-[#121216] border-white/10'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=85&w=1200&auto=format&fit=crop"
                alt="Men's Editorial Tailoring"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-300 block mb-1">
                    Editorial
                  </span>
                  <h4 className="font-serif text-lg text-white drop-shadow-sm">
                    Sartorial Precision &middot; Men
                  </h4>
                </div>
              </div>
            </div>

            <div
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden border group sm:translate-y-8 shadow-lg ${
                isAlabaster ? 'bg-stone-200 border-stone-300/80' : 'bg-[#121216] border-white/10'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop"
                alt="Women's Editorial Silhouette"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-300 block mb-1">
                    Editorial
                  </span>
                  <h4 className="font-serif text-lg text-white drop-shadow-sm">
                    Sculpted Fluidity &middot; Women
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pillars of Haute Sourcing */}
      <div
        id="brand-story"
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t ${
          isAlabaster ? 'border-stone-300/70' : 'border-white/10'
        }`}
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className={`text-[11px] font-sans tracking-[0.3em] uppercase block mb-2 font-medium ${
              isAlabaster ? 'text-stone-600' : 'text-stone-400'
            }`}
          >
            The Atelier Sourcing Standard
          </span>
          <h3
            className={`text-2xl sm:text-3xl font-serif tracking-[0.03em] ${
              isAlabaster ? 'text-stone-950' : 'text-white'
            }`}
          >
            MATERIALS OF UNCOMPROMISING NOBILITY
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: Biella Wool & Mongolian Cashmere */}
          <div
            className={`craft-card group relative p-8 sm:p-9 rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
              isAlabaster
                ? 'bg-white border-stone-200/90 shadow-sm hover:shadow-xl hover:border-stone-300'
                : 'bg-white/[0.02] border-white/10 hover:border-white/25'
            }`}
          >
            <div>
              <div
                className={`craft-icon-wrapper w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 ${
                  isAlabaster
                    ? 'bg-[#f6f5f0] border-stone-200 text-stone-900 shadow-xs'
                    : 'bg-white/[0.04] border-white/10 text-stone-200'
                }`}
              >
                <Scissors className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span
                className={`text-[10px] font-sans tracking-[0.25em] uppercase block mb-2 font-medium ${
                  isAlabaster ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                Piedmont & Inner Mongolia
              </span>
              <h4
                className={`craft-card-title text-xl font-serif mb-3 tracking-[0.02em] font-normal leading-snug ${
                  isAlabaster ? 'text-stone-950' : 'text-white'
                }`}
              >
                Biella Wool & Mongolian Cashmere
              </h4>
              <p
                className={`text-xs sm:text-[13px] leading-relaxed font-light ${
                  isAlabaster ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                We exclusively select Super 130s and 150s virgin wools spun in Piedmont, Italy, and Grade-A cashmere combed humanely from the steppes of Inner Mongolia.
              </p>
            </div>
            <div
              className={`mt-8 pt-4 border-t craft-card-divider flex items-center justify-between text-[11px] tracking-[0.2em] uppercase font-sans ${
                isAlabaster ? 'border-stone-200 text-stone-500' : 'border-white/10 text-stone-400'
              }`}
            >
              <span>Grade-A Certified</span>
              <span className={`font-serif italic ${isAlabaster ? 'text-stone-800' : 'text-stone-300'}`}>
                Pure Noble Fiber
              </span>
            </div>
          </div>

          {/* Card 2: Mulberry Silks & Egyptian Giza Cotton */}
          <div
            className={`craft-card group relative p-8 sm:p-9 rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
              isAlabaster
                ? 'bg-white border-stone-200/90 shadow-sm hover:shadow-xl hover:border-stone-300'
                : 'bg-white/[0.02] border-white/10 hover:border-white/25'
            }`}
          >
            <div>
              <div
                className={`craft-icon-wrapper w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 ${
                  isAlabaster
                    ? 'bg-[#f6f5f0] border-stone-200 text-stone-900 shadow-xs'
                    : 'bg-white/[0.04] border-white/10 text-stone-200'
                }`}
              >
                <Feather className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span
                className={`text-[10px] font-sans tracking-[0.25em] uppercase block mb-2 font-medium ${
                  isAlabaster ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                Como & Nile River Valley
              </span>
              <h4
                className={`craft-card-title text-xl font-serif mb-3 tracking-[0.02em] font-normal leading-snug ${
                  isAlabaster ? 'text-stone-950' : 'text-white'
                }`}
              >
                Mulberry Silks & Egyptian Giza Cotton
              </h4>
              <p
                className={`text-xs sm:text-[13px] leading-relaxed font-light ${
                  isAlabaster ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                Heavy 22-momme pure charmeuse silk cut on 45-degree true bias and long-staple double-twisted cotton poplins that yield breathable, liquid drape.
              </p>
            </div>
            <div
              className={`mt-8 pt-4 border-t craft-card-divider flex items-center justify-between text-[11px] tracking-[0.2em] uppercase font-sans ${
                isAlabaster ? 'border-stone-200 text-stone-500' : 'border-white/10 text-stone-400'
              }`}
            >
              <span>22-Momme Bias Cut</span>
              <span className={`font-serif italic ${isAlabaster ? 'text-stone-800' : 'text-stone-300'}`}>
                Liquid Drape
              </span>
            </div>
          </div>

          {/* Card 3: Box Calfskin & Palladium Hardware */}
          <div
            className={`craft-card group relative p-8 sm:p-9 rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
              isAlabaster
                ? 'bg-white border-stone-200/90 shadow-sm hover:shadow-xl hover:border-stone-300'
                : 'bg-white/[0.02] border-white/10 hover:border-white/25'
            }`}
          >
            <div>
              <div
                className={`craft-icon-wrapper w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 ${
                  isAlabaster
                    ? 'bg-[#f6f5f0] border-stone-200 text-stone-900 shadow-xs'
                    : 'bg-white/[0.04] border-white/10 text-stone-200'
                }`}
              >
                <Gem className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span
                className={`text-[10px] font-sans tracking-[0.25em] uppercase block mb-2 font-medium ${
                  isAlabaster ? 'text-stone-500' : 'text-stone-400'
                }`}
              >
                Tuscany & Swiss Metalworks
              </span>
              <h4
                className={`craft-card-title text-xl font-serif mb-3 tracking-[0.02em] font-normal leading-snug ${
                  isAlabaster ? 'text-stone-950' : 'text-white'
                }`}
              >
                Box Calfskin & Palladium Hardware
              </h4>
              <p
                className={`text-xs sm:text-[13px] leading-relaxed font-light ${
                  isAlabaster ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                Full-grain box calf leather tanned naturally with mimosa tree extracts, finished with custom-milled solid brass fixtures electroplated in brushed palladium.
              </p>
            </div>
            <div
              className={`mt-8 pt-4 border-t craft-card-divider flex items-center justify-between text-[11px] tracking-[0.2em] uppercase font-sans ${
                isAlabaster ? 'border-stone-200 text-stone-500' : 'border-white/10 text-stone-400'
              }`}
            >
              <span>Natural Mimosa Tan</span>
              <span className={`font-serif italic ${isAlabaster ? 'text-stone-800' : 'text-stone-300'}`}>
                Palladium Plate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
