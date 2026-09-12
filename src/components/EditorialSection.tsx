import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { GARMENT_LAYERS, COMPARISON_POINTS } from '../data/garmentAnatomy';
import {
  Layers,
  Scissors,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface EditorialSectionProps {
  onShopCollection: (gender: 'men' | 'women') => void;
}

export const EditorialSection: React.FC<EditorialSectionProps> = ({ onShopCollection }) => {
  const { theme } = useStore();
  const isAlabaster = theme === 'alabaster';

  // Active layer in deconstruction view
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const activeLayer = GARMENT_LAYERS[activeLayerIndex];

  // Comparison toggle state
  const [comparisonMode, setComparisonMode] = useState<'haute' | 'fast'>('haute');

  return (
    <section
      id="editorial-section"
      className={`relative py-24 sm:py-32 border-y transition-colors duration-500 overflow-hidden select-none ${
        isAlabaster
          ? 'bg-[#f8f7f2] border-stone-300/80 text-stone-900'
          : 'bg-[#060608] border-white/10 text-white'
      }`}
      aria-label="The Anatomy of Haute Couture — Architectural Craftsmanship"
    >
      {/* Background Architectural Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: isAlabaster
            ? 'radial-gradient(#000000 1px, transparent 1px)'
            : 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient Gold Radial Flare */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{
          background: isAlabaster
            ? 'radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245, 197, 24, 0.22) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ========================================================================= */}
        {/* 1. SECTION EDITORIAL HEADER                                               */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-mono tracking-[0.25em] uppercase font-bold mb-5">
            <Layers className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL DECONSTRUCTION</span>
          </div>

          <h2
            className={`text-3xl sm:text-5xl lg:text-6xl font-serif tracking-[0.03em] leading-tight mb-5 ${
              isAlabaster ? 'text-stone-950' : 'text-white'
            }`}
          >
            THE ANATOMY OF RESTRAINT
          </h2>

          <p
            className={`text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto ${
              isAlabaster ? 'text-stone-700' : 'text-stone-300'
            }`}
          >
            True luxury is never defined by logos or loudness. It lives within the hidden interior layers —
            where unglued horsehair, unspun silk, and glacial-washed fibers grant a silhouette eternal memory.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2. INTERACTIVE 5-LAYER GARMENT DECONSTRUCTION EXPLODER                    */}
        {/* ========================================================================= */}
        <div
          className="rounded-3xl p-6 sm:p-10 border shadow-2xl mb-24 transition-all duration-500"
          style={{
            backgroundColor: isAlabaster ? '#ffffff' : '#0c0c10',
            borderColor: isAlabaster ? 'rgba(0, 0, 0, 0.09)' : 'rgba(255, 255, 255, 0.12)',
            boxShadow: isAlabaster
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.07)'
              : '0 30px 60px -15px rgba(0, 0, 0, 0.85)',
          }}
        >
          {/* Layer Selection Step Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-8 border-b mb-8"
            style={{ borderColor: isAlabaster ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-500 font-bold block mb-1">
                STEP-BY-STEP EXPLORATION
              </span>
              <h3 className={`text-xl sm:text-2xl font-serif ${isAlabaster ? 'text-stone-950' : 'text-white'}`}>
                Five Internal Strata of Construction
              </h3>
            </div>

            {/* Step Pills */}
            <div className="flex items-center flex-wrap gap-2">
              {GARMENT_LAYERS.map((layer, index) => {
                const isActive = activeLayerIndex === index;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setActiveLayerIndex(index)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
                      isActive
                        ? isAlabaster
                          ? 'bg-stone-950 text-white font-bold shadow-md scale-102 ring-2 ring-stone-950/20'
                          : 'bg-amber-500 text-stone-950 font-bold shadow-lg scale-102 ring-2 ring-amber-400/40'
                        : isAlabaster
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        : 'bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] opacity-70">{layer.layerNumber}</span>
                    <span className="font-semibold">{layer.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layer Deep Dive Layout: Visual Silhouette & Technical Lab Report */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Visual Architectural Silhouette Callout */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border shadow-xl bg-black/60"
                style={{ borderColor: isAlabaster ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }}
              >
                {/* Visual Macro Texture Image */}
                <img
                  src={activeLayer.macroImage}
                  alt={activeLayer.name}
                  className="w-full h-full object-cover object-center filter brightness-[0.9] contrast-[1.05] transition-all duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/25 pointer-events-none" />

                {/* Animated Highlight Target Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    <span className="w-24 h-24 rounded-full border-2 border-amber-400/50 animate-ping opacity-60" />
                    <span className="w-16 h-16 rounded-full border border-amber-400/80 animate-pulse bg-amber-500/10" />
                    <div className="w-4 h-4 rounded-full bg-amber-400 shadow-lg shadow-amber-400/60" />
                  </div>
                </div>

                {/* Layer Identification Badge */}
                <div className="absolute top-4 left-4 z-20">
                  <div className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 shadow-lg flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest">
                      LAYER {activeLayer.layerNumber} / 05
                    </span>
                    <span className="text-[9px] font-mono text-stone-300">·</span>
                    <span className="text-[9px] font-mono text-stone-300 uppercase tracking-wider">
                      {activeLayer.tag}
                    </span>
                  </div>
                </div>

                {/* Bottom Position Callout */}
                <div className="absolute bottom-4 inset-x-4 z-20 pointer-events-none">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-400 block mb-1 font-semibold">
                    PHYSICAL PLACEMENT
                  </span>
                  <p className="text-sm font-serif text-white font-normal leading-snug">
                    {activeLayer.positionDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Lab Dossier */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-500 text-[10px] font-mono font-bold tracking-widest uppercase">
                    {activeLayer.tag}
                  </span>
                  <span className={`text-xs font-mono ${isAlabaster ? 'text-stone-500' : 'text-stone-400'}`}>
                    {activeLayer.provenance}
                  </span>
                </div>

                <h3
                  className={`text-2xl sm:text-3xl font-serif font-medium leading-snug mb-2 ${
                    isAlabaster ? 'text-stone-950' : 'text-white'
                  }`}
                >
                  {activeLayer.shortRole}
                </h3>

                <p
                  className={`text-sm font-light leading-relaxed ${
                    isAlabaster ? 'text-stone-700' : 'text-stone-300'
                  }`}
                >
                  {activeLayer.whyItMatters}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div
                className={`p-5 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono ${
                  isAlabaster
                    ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                    : 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                }`}
              >
                <div>
                  <span className="text-stone-500 text-[10px] uppercase block mb-1">
                    Raw Material Composition
                  </span>
                  <span className="font-semibold text-xs leading-snug block">
                    {activeLayer.material}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500 text-[10px] uppercase block mb-1">
                    Atelier Tailoring Method
                  </span>
                  <span className="font-semibold text-xs leading-snug block">
                    {activeLayer.tailoringMethod}
                  </span>
                </div>
              </div>

              {/* Lab Metric Highlight Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isAlabaster
                    ? 'bg-white border-stone-200 shadow-xs'
                    : 'bg-[#121217] border-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-stone-500 block">
                      VERIFIED LAB METRIC
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        isAlabaster ? 'text-stone-900' : 'text-white'
                      }`}
                    >
                      {activeLayer.labMetric.label}
                    </span>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 font-mono font-bold text-sm tracking-wider">
                  {activeLayer.labMetric.value}
                </div>
              </div>

              {/* Next/Previous Layer Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveLayerIndex((prev) => (prev > 0 ? prev - 1 : GARMENT_LAYERS.length - 1))
                  }
                  className={`text-xs font-mono tracking-widest uppercase py-2 px-3 rounded-xl border transition-colors cursor-pointer ${
                    isAlabaster
                      ? 'border-stone-300 text-stone-700 hover:bg-stone-100'
                      : 'border-white/15 text-stone-300 hover:bg-white/10'
                  }`}
                >
                  ← Previous Layer
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveLayerIndex((prev) => (prev < GARMENT_LAYERS.length - 1 ? prev + 1 : 0))
                  }
                  className={`text-xs font-mono tracking-widest uppercase py-2 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                    isAlabaster
                      ? 'bg-stone-950 text-white hover:bg-black shadow-xs'
                      : 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                  }`}
                >
                  <span>Next: Layer {GARMENT_LAYERS[(activeLayerIndex + 1) % GARMENT_LAYERS.length].layerNumber}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. HAUTE COUTURE VS. FAST FASHION DIRECT COMPARISON MATRIX                 */}
        {/* ========================================================================= */}
        <div className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-500 font-bold block mb-2">
                THE HONEST CONTRAST
              </span>
              <h3
                className={`text-2xl sm:text-4xl font-serif tracking-wide ${
                  isAlabaster ? 'text-stone-950' : 'text-white'
                }`}
              >
                Haute Couture vs. Conventional Fast Fashion
              </h3>
            </div>

            {/* Interactive Toggle Pill */}
            <div
              className={`p-1.5 rounded-2xl border flex items-center gap-1 shadow-md self-start md:self-auto ${
                isAlabaster ? 'bg-white border-stone-300' : 'bg-[#101014] border-white/15'
              }`}
            >
              <button
                type="button"
                onClick={() => setComparisonMode('haute')}
                className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider uppercase font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                  comparisonMode === 'haute'
                    ? isAlabaster
                      ? 'bg-stone-950 text-white shadow-xs'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-xs'
                    : isAlabaster
                    ? 'text-stone-600 hover:text-black'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zarb Atelier Standard</span>
              </button>

              <button
                type="button"
                onClick={() => setComparisonMode('fast')}
                className={`px-4 py-2 rounded-xl text-xs font-mono tracking-wider uppercase font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                  comparisonMode === 'fast'
                    ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                    : isAlabaster
                    ? 'text-stone-600 hover:text-black'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Fast Fashion Reality</span>
              </button>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMPARISON_POINTS.slice(0, 3).map((pt, i) => (
              <div
                key={pt.feature}
                className="p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between shadow-lg"
                style={{
                  backgroundColor: isAlabaster ? '#ffffff' : '#0e0e12',
                  borderColor: isAlabaster ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                }}
              >
                <div>
                  <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-stone-500 block mb-2">
                    SPECIFICATION 0{i + 1}
                  </span>
                  <h4
                    className={`text-lg font-serif font-medium mb-4 ${
                      isAlabaster ? 'text-stone-950' : 'text-white'
                    }`}
                  >
                    {pt.feature}
                  </h4>

                  {/* Dynamic Focus Based on Toggle */}
                  {comparisonMode === 'haute' ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-bold">
                          ZARB HAUTE COUTURE
                        </span>
                      </div>
                      <p className={`text-xs font-semibold ${isAlabaster ? 'text-stone-900' : 'text-stone-100'}`}>
                        {pt.hauteCouture}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold">
                          FAST FASHION INDUSTRY
                        </span>
                      </div>
                      <p className={`text-xs font-semibold ${isAlabaster ? 'text-stone-900' : 'text-stone-100'}`}>
                        {pt.fastFashion}
                      </p>
                    </div>
                  )}

                  <p
                    className={`text-xs font-light leading-relaxed ${
                      isAlabaster ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    {pt.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. THE ATELIER GUARANTEE (AUTHENTICITY & TRUST CERTIFICATIONS)             */}
        {/* ========================================================================= */}
        <div
          className="p-8 sm:p-12 rounded-3xl border shadow-xl"
          style={{
            backgroundColor: isAlabaster ? '#ffffff' : '#0c0c10',
            borderColor: isAlabaster ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
          }}
        >
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-500 font-bold block mb-2">
              THE ATELIER COVENANT
            </span>
            <h3
              className={`text-2xl sm:text-3xl font-serif tracking-wide ${
                isAlabaster ? 'text-stone-950' : 'text-white'
              }`}
            >
              The Triad of Structural Integrity
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Guarantee 1 */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className={`text-base font-serif font-medium ${isAlabaster ? 'text-stone-950' : 'text-white'}`}>
                Zero Fused Adhesives
              </h4>
              <p className={`text-xs font-light leading-relaxed ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
                Every Zarb jacket is constructed with a 100% free-floating horsehair canvas. Guaranteed to never bubble, blister, or delaminate over a lifetime of wear.
              </p>
            </div>

            {/* Guarantee 2 */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className={`text-base font-serif font-medium ${isAlabaster ? 'text-stone-950' : 'text-white'}`}>
                Heritage Mill Traceability
              </h4>
              <p className={`text-xs font-light leading-relaxed ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
                Every bolt of cashmere, silk, and virgin wool is directly registered to centuries-old family looms in Biella and Lake Como with certified alpine purity.
              </p>
            </div>

            {/* Guarantee 3 */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                <Scissors className="w-6 h-6" />
              </div>
              <h4 className={`text-base font-serif font-medium ${isAlabaster ? 'text-stone-950' : 'text-white'}`}>
                Lifetime Atelier Alterations
              </h4>
              <p className={`text-xs font-light leading-relaxed ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
                Constructed with up to 4cm of generous internal seam allowances, our garments are built to be tailored, let out, or re-lined across generations.
              </p>
            </div>
          </div>

          {/* Atelier Navigation Footer */}
          <div
            className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: isAlabaster ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
          >
            <span className={`text-[11px] font-mono tracking-widest uppercase ${isAlabaster ? 'text-stone-500' : 'text-stone-400'}`}>
              AUTHENTIC MILANESE ATELIER TAILORING · AW26 SPECIFICATION
            </span>
            <div className="flex items-center space-x-3 text-xs font-mono tracking-widest uppercase">
              <button
                type="button"
                onClick={() => onShopCollection('women')}
                className={`font-bold transition-colors cursor-pointer ${
                  isAlabaster ? 'text-stone-900 hover:text-amber-600' : 'text-amber-400 hover:text-white'
                }`}
              >
                Women's Collection →
              </button>
              <span className={isAlabaster ? 'text-stone-300' : 'text-stone-600'}>|</span>
              <button
                type="button"
                onClick={() => onShopCollection('men')}
                className={`font-bold transition-colors cursor-pointer ${
                  isAlabaster ? 'text-stone-900 hover:text-amber-600' : 'text-amber-400 hover:text-white'
                }`}
              >
                Men's Collection →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
