import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, ArrowRight, Search, Heart, ShoppingBag } from 'lucide-react';
import type { GenderType } from '../types/product';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateCategory: (cat: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, onNavigateCategory }) => {
  const { gender, setGender, wishlist, cartCount, setIsSearchOpen, setIsWishlistOpen, setIsCartOpen, theme } = useStore();
  const isAlabaster = theme === 'alabaster';

  if (!isOpen) return null;

  const handleGenderSwitch = (newGender: GenderType) => {
    setGender(newGender);
  };

  const navLinks = [
    { label: 'New Arrivals', filter: 'newArrival' },
    { label: 'Tailored Jackets', category: 'Jackets' },
    { label: gender === 'women' ? 'Dresses & Gowns' : 'Shirts & Overshirts', category: gender === 'women' ? 'Dresses' : 'Shirts' },
    { label: 'Trousers & Tailoring', category: 'Trousers' },
    { label: 'Denim Collection', category: gender === 'women' ? 'Denim' : 'Jeans' },
    { label: 'Accessories & Leather', category: gender === 'women' ? 'Bags' : 'Accessories' },
    { label: 'Best Sellers', filter: 'bestSeller' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Dark backdrop */}
      <div
        className={`fixed inset-0 backdrop-blur-md transition-opacity ${
          isAlabaster ? 'bg-black/60' : 'bg-black/80'
        }`}
        onClick={onClose}
      />

      {/* Drawer content */}
      <div
        className={`relative w-full max-w-sm border-r p-6 flex flex-col justify-between h-full z-10 overflow-y-auto animate-fade-in transition-colors duration-300 ${
          isAlabaster
            ? 'bg-[#faf9f5] border-stone-300/80 text-stone-900 shadow-2xl'
            : 'bg-[#0e0e11] border-white/10 text-stone-200 shadow-2xl'
        }`}
      >
        <div>
          {/* Header row */}
          <div
            className={`flex items-center justify-between pb-6 border-b ${
              isAlabaster ? 'border-stone-200' : 'border-white/10'
            }`}
          >
            <div>
              <span
                className={`font-serif tracking-[0.2em] text-lg font-medium block ${
                  isAlabaster ? 'text-stone-950 font-normal' : 'text-white'
                }`}
              >
                ZARB
              </span>
              <span
                className={`text-[10px] tracking-[0.3em] uppercase ${
                  isAlabaster ? 'text-stone-500 font-medium' : 'text-stone-400'
                }`}
              >
                Haute Prêt-à-Porter
              </span>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isAlabaster
                  ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gender Selector in Mobile Drawer */}
          <div className="my-6">
            <label
              className={`text-[10px] tracking-[0.25em] uppercase block mb-2 font-medium ${
                isAlabaster ? 'text-stone-600' : 'text-stone-400'
              }`}
            >
              Active Collection
            </label>
            <div
              className={`p-1 rounded-xl border ${
                isAlabaster ? 'bg-stone-200/70 border-stone-300/80' : 'bg-white/5 border-white/10'
              }`}
            >
              {/* Men button temporarily hidden per request - preserved for future restoration
              <button
                onClick={() => handleGenderSwitch('men')}
                className={`py-3 text-xs tracking-[0.2em] uppercase font-medium rounded-lg transition-all ${
                  gender === 'men'
                    ? isAlabaster
                      ? 'drawer-tab-active bg-stone-900 text-white shadow-md'
                      : 'bg-white text-black shadow-md'
                    : isAlabaster
                    ? 'text-stone-600 hover:text-stone-950'
                    : 'text-stone-300 hover:text-white'
                }`}
                style={gender === 'men' && isAlabaster ? { color: '#ffffff', backgroundColor: '#1c1917' } : undefined}
              >
                Men
              </button>
              */}
              <button
                onClick={() => handleGenderSwitch('women')}
                className={`w-full py-3 text-xs tracking-[0.2em] uppercase font-medium rounded-lg transition-all ${
                  gender === 'women'
                    ? isAlabaster
                      ? 'drawer-tab-active bg-stone-900 text-white shadow-md'
                      : 'bg-white text-black shadow-md'
                    : isAlabaster
                    ? 'text-stone-600 hover:text-stone-950'
                    : 'text-stone-300 hover:text-white'
                }`}
                style={gender === 'women' && isAlabaster ? { color: '#ffffff', backgroundColor: '#1c1917' } : undefined}
              >
                Women
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 py-2">
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.category) onNavigateCategory(item.category);
                  onClose();
                }}
                className={`w-full text-left py-3.5 px-3 rounded-lg flex items-center justify-between text-sm tracking-[0.1em] font-light transition-colors group ${
                  isAlabaster
                    ? 'text-stone-800 hover:text-stone-950 hover:bg-stone-200/50'
                    : 'text-stone-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                <ArrowRight
                  className={`w-4 h-4 group-hover:translate-x-1 transition-all ${
                    isAlabaster
                      ? 'text-stone-400 group-hover:text-stone-950'
                      : 'text-stone-500 group-hover:text-white'
                  }`}
                />
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div
          className={`pt-6 border-t space-y-4 ${
            isAlabaster ? 'border-stone-200' : 'border-white/10'
          }`}
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                setIsSearchOpen(true);
              }}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs tracking-[0.15em] uppercase transition-colors ${
                isAlabaster
                  ? 'bg-stone-200/60 hover:bg-stone-200 text-stone-800 hover:text-stone-950 border border-stone-300/60'
                  : 'bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setIsWishlistOpen(true);
              }}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs tracking-[0.15em] uppercase transition-colors ${
                isAlabaster
                  ? 'bg-stone-200/60 hover:bg-stone-200 text-stone-800 hover:text-stone-950 border border-stone-300/60'
                  : 'bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Saved ({wishlist.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              setIsCartOpen(true);
            }}
            className={`drawer-primary-btn w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl font-medium text-xs tracking-[0.2em] uppercase transition-colors shadow-lg cursor-pointer ${
              isAlabaster
                ? 'bg-stone-950 text-white hover:bg-black'
                : 'bg-white text-black hover:bg-stone-200'
            }`}
            style={isAlabaster ? { color: '#ffffff', backgroundColor: '#0c0a09' } : undefined}
          >
            <ShoppingBag className="w-4 h-4" style={isAlabaster ? { color: '#ffffff', stroke: '#ffffff' } : undefined} />
            <span style={isAlabaster ? { color: '#ffffff' } : undefined}>Shopping Bag ({cartCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
