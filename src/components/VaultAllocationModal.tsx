import React, { useState } from 'react';
import type { VaultPiece } from '../data/vaultPieces';
import { useStore } from '../context/StoreContext';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface VaultAllocationModalProps {
  piece: VaultPiece | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VaultAllocationModal: React.FC<VaultAllocationModalProps> = ({
  piece,
  isOpen,
  onClose,
}) => {
  const { theme, products, addToCart, setIsCartOpen } = useStore();
  const isAlabaster = theme === 'alabaster';

  const [selectedSerial, setSelectedSerial] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [isAllocating, setIsAllocating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Set default selected serial when piece changes
  React.useEffect(() => {
    if (piece && piece.availableSerials.length > 0) {
      setSelectedSerial(piece.availableSerials[0]);
      setIsSuccess(false);
    }
  }, [piece]);

  if (!isOpen || !piece) return null;

  const handleConfirmAllocation = () => {
    setIsAllocating(true);

    // Find linked product in catalog or fallback to synthetic product
    let product = products.find((p) => p.id === piece.linkedProductId);
    if (!product) {
      product = products[0]; // fallback
    }

    // Custom bespoke color name matching the piece
    const colorName = `Archival Edition (${selectedSerial})`;

    setTimeout(() => {
      if (product) {
        addToCart(product, selectedSize, colorName, 1);
      }
      setIsAllocating(false);
      setIsSuccess(true);

      setTimeout(() => {
        onClose();
        setIsCartOpen(true);
      }, 1100);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden border shadow-2xl z-10 my-auto transition-all transform animate-fade-in"
        style={{
          backgroundColor: isAlabaster ? '#fcfbf7' : '#0a0a0d',
          borderColor: isAlabaster ? 'rgba(180, 140, 50, 0.35)' : 'rgba(212, 175, 55, 0.35)',
          boxShadow: isAlabaster
            ? '0 30px 60px -15px rgba(180, 140, 50, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.3)'
            : '0 35px 80px -15px rgba(0, 0, 0, 0.95), 0 0 40px rgba(212, 175, 55, 0.25)',
        }}
      >
        {/* Top Gold Foil Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-all cursor-pointer z-30 ${
            isAlabaster
              ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
              : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
          }`}
          aria-label="Close allocation modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-10 max-h-[85vh] overflow-y-auto scrollbar-none">
          {/* Header Security / Provenance Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-amber-500/20 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-500 font-bold block">
                  OFFICIAL ARCHIVAL CERTIFICATE
                </span>
                <h3
                  className={`text-xl sm:text-2xl font-serif tracking-wide ${
                    isAlabaster ? 'text-stone-950' : 'text-white'
                  }`}
                >
                  Haute Couture Serial Allocation
                </h3>
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono tracking-widest uppercase font-bold flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>REGISTRY: AW26-VAULT</span>
            </div>
          </div>

          {/* Body Content Grid: Photo + Certificate Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Column: Image with Metallic Frame */}
            <div className="md:col-span-5 relative">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl bg-black/60">
                <img
                  src={piece.image}
                  alt={piece.title}
                  className="w-full h-full object-cover object-center filter brightness-[0.9] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-4 inset-x-4">
                  <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest block mb-1">
                    {piece.serialCode}
                  </span>
                  <span className="text-sm font-serif text-white font-normal block leading-tight">
                    {piece.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Serial Selector & Provenance Dossier */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <h4
                    className={`text-lg font-serif font-medium ${
                      isAlabaster ? 'text-stone-900' : 'text-white'
                    }`}
                  >
                    {piece.title}
                  </h4>
                  <span className="text-xl font-serif text-amber-500 font-semibold ml-2">
                    ${piece.price.toLocaleString()} USD
                  </span>
                </div>
                <p
                  className={`text-xs font-light leading-relaxed ${
                    isAlabaster ? 'text-stone-600' : 'text-stone-400'
                  }`}
                >
                  {piece.subtitle}
                </p>
              </div>

              {/* Atelier Provenance Box */}
              <div
                className={`p-4 rounded-2xl border space-y-2 text-xs font-mono ${
                  isAlabaster
                    ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                    : 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <span className="text-stone-500 uppercase">Crafting Atelier:</span>
                  <span className="font-semibold">{piece.originAtelier}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                  <span className="text-stone-500 uppercase">Master Artisan:</span>
                  <span className="font-semibold">{piece.artisanName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 uppercase">Atelier Hours:</span>
                  <span className="font-semibold">{piece.hoursCrafted} Tailoring Hours</span>
                </div>
              </div>

              {/* Serial Number Picker */}
              <div>
                <label className="text-[11px] font-mono tracking-[0.18em] uppercase text-amber-500 font-bold block mb-2">
                  Select Your Serial Number (Remaining Allocations)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {piece.availableSerials.map((serial) => {
                    const isSelected = selectedSerial === serial;
                    return (
                      <button
                        key={serial}
                        type="button"
                        onClick={() => setSelectedSerial(serial)}
                        className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold tracking-wider transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md scale-105 ring-2 ring-amber-400/40'
                            : isAlabaster
                            ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                            : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/15'
                        }`}
                      >
                        {serial}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizing Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-mono tracking-[0.18em] uppercase font-bold ${
                      isAlabaster ? 'text-stone-700' : 'text-stone-300'
                    }`}
                  >
                    Select Tailoring Size
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 uppercase">
                    Bespoke Alterations Included
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {['XS', 'S', 'M', 'L', 'XL'].map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? isAlabaster
                              ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                              : 'bg-white text-stone-950 border-white shadow-xs'
                            : isAlabaster
                            ? 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                            : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/15'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Archival Notes */}
              <p
                className={`text-[11px] font-light italic leading-relaxed pt-2 border-t ${
                  isAlabaster
                    ? 'border-stone-200 text-stone-500'
                    : 'border-white/10 text-stone-400'
                }`}
              >
                "{piece.certificateNotes}"
              </p>

              {/* CTA Action Button */}
              <div>
                {isSuccess ? (
                  <div className="w-full py-3.5 rounded-2xl bg-emerald-500 text-stone-950 font-sans font-bold tracking-widest uppercase text-xs flex items-center justify-center space-x-2 shadow-lg animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ALLOCATION CONFIRMED · ADDED TO BAG</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmAllocation}
                    disabled={isAllocating}
                    className={`w-full py-4 rounded-2xl text-xs font-sans font-bold tracking-[0.2em] uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xl active:scale-98 ${
                      isAllocating
                        ? 'opacity-70 cursor-wait bg-amber-500 text-stone-950'
                        : isAlabaster
                        ? 'bg-stone-950 hover:bg-black text-amber-300 border border-amber-500/40 hover:shadow-2xl'
                        : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-stone-950 border border-amber-300 shadow-amber-500/20'
                    }`}
                  >
                    {isAllocating ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-stone-950 border-t-transparent animate-spin" />
                        <span>ENGRAVING CERTIFICATE...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          CLAIM ALLOCATION {selectedSerial} & ADD TO BAG
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
