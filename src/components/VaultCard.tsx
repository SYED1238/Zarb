import React, { useState, useRef, useCallback } from 'react';
import type { VaultPiece } from '../data/vaultPieces';
import { Sparkles, ShieldCheck, ArrowUpRight, Clock, Award } from 'lucide-react';

interface VaultCardProps {
  piece: VaultPiece;
  isAlabaster: boolean;
  onOpenAllocation: (piece: VaultPiece) => void;
  onInspectProduct: (piece: VaultPiece) => void;
}

export const VaultCard: React.FC<VaultCardProps> = ({
  piece,
  isAlabaster,
  onOpenAllocation,
  onInspectProduct,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt calculation based on cursor coordinates relative to card center
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalizing between -1 and 1
    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    // Subtle, elegant 3D tilt angles (max ~10 degrees)
    const rotateY = normX * 10;
    const rotateX = -normY * 10;

    // Glare position percentage
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.85 });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smooth reset back to 0
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const allocationPercent = Math.round(
    ((piece.editionTotal - piece.editionRemaining) / piece.editionTotal) * 100
  );

  return (
    <div
      className="perspective-1000 w-full"
      style={{ perspective: '1200px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-3xl overflow-hidden transition-transform duration-300 ease-out border shadow-2xl flex flex-col group select-none"
        style={{
          transform: isHovered
            ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1.02, 1.02, 1.02)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          backgroundColor: isAlabaster ? '#ffffff' : '#0c0c10',
          borderColor: isAlabaster
            ? isHovered
              ? 'rgba(180, 140, 50, 0.45)'
              : 'rgba(0, 0, 0, 0.1)'
            : isHovered
            ? 'rgba(234, 179, 8, 0.5)'
            : 'rgba(255, 255, 255, 0.12)',
          boxShadow: isHovered
            ? isAlabaster
              ? '0 30px 60px -15px rgba(180, 140, 50, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.4)'
              : '0 35px 70px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.2)'
            : isAlabaster
            ? '0 15px 35px -10px rgba(0, 0, 0, 0.08)'
            : '0 20px 45px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* =================================================================== */}
        {/* HOLOGRAPHIC GOLD FOIL SPECULAR GLARE                                 */}
        {/* =================================================================== */}
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 rounded-3xl"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${
              isAlabaster
                ? 'rgba(255, 223, 130, 0.5) 0%, rgba(212, 175, 55, 0.25) 30%, rgba(255, 255, 255, 0) 70%'
                : 'rgba(255, 215, 0, 0.45) 0%, rgba(212, 175, 55, 0.2) 35%, rgba(0, 0, 0, 0) 75%'
            })`,
            mixBlendMode: isAlabaster ? 'multiply' : 'screen',
          }}
        />

        {/* =================================================================== */}
        {/* TOP IMAGE SECTION (3:4 Ratio with Vignette)                         */}
        {/* =================================================================== */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/60">
          <img
            src={piece.image}
            alt={piece.title}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-108 filter brightness-[0.88] contrast-[1.06]"
          />

          {/* Deep Cinematic Shadow Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/25 pointer-events-none" />

          {/* Serial Number & Atelier Badges */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
            {/* Serial Seal */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 shadow-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-amber-300 font-bold">
                {piece.serialCode}
              </span>
            </div>

            {/* Gold Bullion Ingot Accent Pill */}
            <div className="px-2.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 shadow-md hidden sm:flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-amber-200/90 font-medium">
                {piece.goldAccentText}
              </span>
            </div>
          </div>

          {/* Bottom Photo Title & Price Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-5 z-20 pointer-events-none">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold backdrop-blur-xs">
                ATELIER PIECE
              </span>
              <span className="text-[9px] font-mono tracking-[0.15em] uppercase text-stone-300">
                {piece.originAtelier.split('(')[0].trim()}
              </span>
            </div>

            <h3
              className="text-lg sm:text-xl font-serif text-white leading-tight font-normal mb-2"
              style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 16px rgba(0, 0, 0, 0.8)',
              }}
            >
              {piece.title}
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-base font-serif text-amber-300 font-medium">
                ${piece.price.toLocaleString()} USD
              </span>
              <span className="text-[10px] font-mono text-stone-300 uppercase tracking-widest flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400 inline" />
                <span>{piece.hoursCrafted}h Master Work</span>
              </span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CARD BODY: PROVENANCE, ALLOCATION PROGRESS & CTAS                   */}
        {/* =================================================================== */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Subtitle & Fiber Provenance */}
          <div>
            <p
              className={`text-xs font-light leading-relaxed mb-3 line-clamp-2 ${
                isAlabaster ? 'text-stone-700' : 'text-stone-300'
              }`}
            >
              {piece.subtitle}
            </p>

            <div
              className={`text-[10px] font-mono tracking-wider p-2.5 rounded-xl border flex items-center space-x-2 ${
                isAlabaster
                  ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                  : 'bg-amber-950/20 border-amber-500/20 text-amber-200/90'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{piece.materials}</span>
            </div>
          </div>

          {/* Allocation Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1.5">
              <span className={isAlabaster ? 'text-stone-600' : 'text-stone-400'}>
                Worldwide Allocation
              </span>
              <span className="font-bold text-amber-500">
                {piece.editionRemaining} of {piece.editionTotal} Left
              </span>
            </div>

            {/* Gauge Track */}
            <div
              className={`h-1.5 w-full rounded-full overflow-hidden ${
                isAlabaster ? 'bg-stone-200' : 'bg-white/10'
              }`}
            >
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300"
                style={{ width: `${allocationPercent}%` }}
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div
            className="pt-3 border-t flex items-center justify-between gap-3"
            style={{
              borderColor: isAlabaster ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Quick Inspect Button */}
            <button
              type="button"
              onClick={() => onInspectProduct(piece)}
              className={`text-[11px] font-mono tracking-widest uppercase transition-colors cursor-pointer py-2 px-1 ${
                isAlabaster
                  ? 'text-stone-600 hover:text-black'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Inspect
            </button>

            {/* Main "Acquire Allocation" Button */}
            <button
              type="button"
              onClick={() => onOpenAllocation(piece)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-sans font-semibold tracking-[0.16em] uppercase flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg active:scale-95 border ${
                isAlabaster
                  ? 'bg-stone-950 hover:bg-black text-amber-200 border-amber-600/30 hover:border-amber-500 hover:shadow-xl'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold border-amber-300 shadow-amber-500/20'
              }`}
            >
              <span>ACQUIRE ALLOCATION</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.4]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
