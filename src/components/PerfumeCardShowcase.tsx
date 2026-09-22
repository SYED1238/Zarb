import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { PerfumeProductCard } from './PerfumeProductCard';
import type { Product } from '../types/product';
import { ProductDetailModal } from './ProductDetailModal';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const PerfumeCardShowcase: React.FC = () => {
  const { products } = useStore();
  const [selectedProductId, setSelectedProductId] = useState<string>('perfume-01');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);

  // All 5 perfumes from the reference image
  const perfumeList = React.useMemo(() => {
    return products.filter((p) => p.isPerfume || p.category === 'perfumes');
  }, [products]);

  // Active single product
  const activeProduct = React.useMemo(() => {
    return perfumeList.find((p) => p.id === selectedProductId) || perfumeList[0];
  }, [perfumeList, selectedProductId]);

  if (!activeProduct) return null;

  return (
    <main className="relative min-h-screen w-full bg-[#f4efe6] text-[#1c1815] flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 overflow-x-hidden selection:bg-[#c59450] selection:text-white">
      {/* ---------------- Warm Ambient Canvas Background Elements ---------------- */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(218,185,138,0.22),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-400/[0.04] blur-[150px] rounded-full pointer-events-none" />

      {/* Editorial Decorative Calligraphy Watermark inspired by reference image */}
      <div className="absolute top-8 left-6 sm:top-14 sm:left-14 pointer-events-none opacity-20 select-none">
        <p className="font-serif italic text-3xl sm:text-5xl lg:text-6xl text-[#9c8972] tracking-wide leading-tight">
          More than a<br />
          <span className="font-serif font-light tracking-widest pl-4 sm:pl-8">Fragrance</span>
        </p>
      </div>

      <div className="absolute top-8 right-6 sm:top-14 sm:right-14 text-right pointer-events-none opacity-30 select-none hidden sm:block">
        <p className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase text-[#736352]">
          A SCENT · A STORY
        </p>
      </div>

      {/* ---------------- Top Minimal Brand Navigation ---------------- */}
      <header className="w-full max-w-5xl flex items-center justify-between relative z-20 mb-6 sm:mb-8">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-sans uppercase tracking-widest text-[#736352] hover:text-[#1c1815] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Boutique</span>
        </Link>

        <div className="text-center">
          <span className="font-brand tracking-[0.35em] text-lg sm:text-xl font-medium text-[#1c1815]">
            Z A R B
          </span>
          <p className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.25em] text-[#9c8972]">
            HAUTE PARFUMERIE
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#e8e1d5] border border-[#d8cfbf] text-[10px] font-mono uppercase tracking-wider text-[#685848]">
          <Sparkles className="w-3 h-3 text-[#c59450]" />
          <span>Glass Card Dossier</span>
        </div>
      </header>

      {/* ---------------- THE SINGLE COMPLETE PERFUME PRODUCT CARD ---------------- */}
      <div className="relative z-20 w-full max-w-sm flex items-center justify-center my-auto py-2">
        <PerfumeProductCard
          product={activeProduct}
          isStandalone={true}
          onQuickView={(p) => setActiveModalProduct(p)}
        />
      </div>

      {/* ---------------- Minimal Bottom Fragrance Selector ---------------- */}
      <footer className="w-full max-w-xl relative z-20 mt-6 sm:mt-8 flex flex-col items-center">
        <div className="flex items-center justify-center flex-wrap gap-2 p-1.5 bg-[#eae2d5]/80 backdrop-blur-md border border-[#dbd1c2] rounded-full shadow-sm">
          {perfumeList.map((p) => {
            const isSelected = p.id === activeProduct.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProductId(p.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-sans tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1c1815] text-[#dfb56c] font-semibold shadow-xs'
                    : 'text-[#685848] hover:text-[#1c1815] hover:bg-[#ded4c3]/60'
                }`}
              >
                {p.perfumeFamily?.split('&')[0]?.trim() || p.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] font-mono tracking-widest text-[#8c7b69] uppercase mt-3">
          Editorial Liquid Glass Product Card · ZARB Haute Parfumerie
        </p>
      </footer>

      {/* Formulation & Dossier Modal */}
      {activeModalProduct && (
        <ProductDetailModal
          product={activeModalProduct}
          onClose={() => setActiveModalProduct(null)}
          onSelectProduct={(p) => setActiveModalProduct(p)}
        />
      )}
    </main>
  );
};

export default PerfumeCardShowcase;
