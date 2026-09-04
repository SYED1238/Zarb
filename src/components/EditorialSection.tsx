import { Sparkles, Scissors, Gem, Feather } from 'lucide-react';

interface EditorialSectionProps {
  onShopCollection: (gender: 'men' | 'women') => void;
}

export const EditorialSection: React.FC<EditorialSectionProps> = ({ onShopCollection }) => {

  return (
    <div id="editorial-section" className="py-20 sm:py-32 bg-[#0a0a0c] border-y border-white/10">
      {/* Campaign Feature 1: The Philosophy */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center space-x-2 text-stone-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-sans tracking-[0.3em] uppercase">
                Campaign No. 08 Editorial
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white font-light leading-tight">
              THE QUIET REVOLUTION OF RESTRAINT
            </h2>

            <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed">
              We reject the transient cadence of fast fashion. Each silhouette in the Zarb catalog is sculpted through months of pattern adjustments, draped directly onto live forms in our Milanese studio, and constructed with floating horsehair canvases.
            </p>

            <blockquote className="border-l border-white/30 pl-4 py-1 text-sm italic font-serif text-stone-200">
              "True luxury is not about loudness or logos; it is the silent assurance of architectural proportion and noble fibers."
            </blockquote>

            <div className="pt-4 flex items-center space-x-4">
              <button
                onClick={() => onShopCollection('men')}
                className="px-6 py-3 rounded-xl border border-white/20 hover:border-white text-xs tracking-[0.2em] uppercase text-white hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                Men's Lookbook
              </button>
              <button
                onClick={() => onShopCollection('women')}
                className="px-6 py-3 rounded-xl border border-white/20 hover:border-white text-xs tracking-[0.2em] uppercase text-white hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                Women's Lookbook
              </button>
            </div>
          </div>

          {/* Right Column Editorial Image Pair */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#121216] border border-white/10 group">
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=85&w=1200&auto=format&fit=crop"
                alt="Men's Editorial Tailoring"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-300 block mb-1">
                    Editorial
                  </span>
                  <h4 className="font-serif text-lg text-white">Sartorial Precision &middot; Men</h4>
                </div>
              </div>
            </div>

            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#121216] border border-white/10 group sm:translate-y-8">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop"
                alt="Women's Editorial Silhouette"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-stone-300 block mb-1">
                    Editorial
                  </span>
                  <h4 className="font-serif text-lg text-white">Sculpted Fluidity &middot; Women</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pillars of Haute Sourcing */}
      <div id="brand-story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-sans tracking-[0.3em] uppercase text-stone-400 block mb-2">
            The Atelier Sourcing Standard
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif text-white">
            MATERIALS OF UNCOMPROMISING NOBILITY
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: Biella Wool & Mongolian Cashmere */}
          <div className="craft-card group relative p-8 sm:p-9 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="craft-icon-wrapper w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-6 text-stone-200 group-hover:scale-105 transition-transform duration-300">
                <Scissors className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400 block mb-2 font-medium">
                Piedmont & Inner Mongolia
              </span>
              <h4 className="craft-card-title text-xl font-serif text-white mb-3 tracking-[0.02em] font-normal leading-snug">
                Biella Wool & Mongolian Cashmere
              </h4>
              <p className="text-xs sm:text-[13px] text-stone-400 leading-relaxed font-light">
                We exclusively select Super 130s and 150s virgin wools spun in Piedmont, Italy, and Grade-A cashmere combed humanely from the steppes of Inner Mongolia.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 craft-card-divider flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-stone-400 font-sans">
              <span>Grade-A Certified</span>
              <span className="text-stone-300 font-serif italic">Pure Noble Fiber</span>
            </div>
          </div>

          {/* Card 2: Mulberry Silks & Egyptian Giza Cotton */}
          <div className="craft-card group relative p-8 sm:p-9 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="craft-icon-wrapper w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-6 text-stone-200 group-hover:scale-105 transition-transform duration-300">
                <Feather className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400 block mb-2 font-medium">
                Como & Nile River Valley
              </span>
              <h4 className="craft-card-title text-xl font-serif text-white mb-3 tracking-[0.02em] font-normal leading-snug">
                Mulberry Silks & Egyptian Giza Cotton
              </h4>
              <p className="text-xs sm:text-[13px] text-stone-400 leading-relaxed font-light">
                Heavy 22-momme pure charmeuse silk cut on 45-degree true bias and long-staple double-twisted cotton poplins that yield breathable, liquid drape.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 craft-card-divider flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-stone-400 font-sans">
              <span>22-Momme Bias Cut</span>
              <span className="text-stone-300 font-serif italic">Liquid Drape</span>
            </div>
          </div>

          {/* Card 3: Box Calfskin & Palladium Hardware */}
          <div className="craft-card group relative p-8 sm:p-9 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="craft-icon-wrapper w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-6 text-stone-200 group-hover:scale-105 transition-transform duration-300">
                <Gem className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-400 block mb-2 font-medium">
                Tuscany & Swiss Metalworks
              </span>
              <h4 className="craft-card-title text-xl font-serif text-white mb-3 tracking-[0.02em] font-normal leading-snug">
                Box Calfskin & Palladium Hardware
              </h4>
              <p className="text-xs sm:text-[13px] text-stone-400 leading-relaxed font-light">
                Full-grain box calf leather tanned naturally with mimosa tree extracts, finished with custom-milled solid brass fixtures electroplated in brushed palladium.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 craft-card-divider flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-stone-400 font-sans">
              <span>Natural Mimosa Tan</span>
              <span className="text-stone-300 font-serif italic">Palladium Plate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
