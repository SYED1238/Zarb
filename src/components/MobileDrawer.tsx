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
  const { gender, setGender, wishlist, cartCount, setIsSearchOpen, setIsWishlistOpen, setIsCartOpen } = useStore();

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
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-sm bg-[#0e0e11] border-r border-white/10 p-6 flex flex-col justify-between h-full z-10 overflow-y-auto animate-fade-in">
        <div>
          {/* Header row */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div>
              <span className="font-serif tracking-[0.2em] text-lg font-medium text-white block">
                ZARB
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400">
                Haute Prêt-à-Porter
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Gender Selector in Mobile Drawer */}
          <div className="my-6">
            <label className="text-[10px] tracking-[0.25em] uppercase text-stone-400 block mb-2 font-medium">
              Active Collection
            </label>
            <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10">
              <button
                onClick={() => handleGenderSwitch('men')}
                className={`py-3 text-xs tracking-[0.2em] uppercase font-medium rounded-lg transition-all ${gender === 'men'
                    ? 'bg-white text-black shadow-md'
                    : 'text-stone-300 hover:text-white'
                  }`}
              >
                Men
              </button>
              <button
                onClick={() => handleGenderSwitch('women')}
                className={`py-3 text-xs tracking-[0.2em] uppercase font-medium rounded-lg transition-all ${gender === 'women'
                    ? 'bg-white text-black shadow-md'
                    : 'text-stone-300 hover:text-white'
                  }`}
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
                className="w-full text-left py-3.5 px-3 rounded-lg text-stone-200 hover:text-white hover:bg-white/5 flex items-center justify-between text-sm tracking-[0.1em] font-light transition-colors group"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                setIsSearchOpen(true);
              }}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs tracking-[0.15em] uppercase transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setIsWishlistOpen(true);
              }}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs tracking-[0.15em] uppercase transition-colors"
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
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-white text-black font-medium text-xs tracking-[0.2em] uppercase hover:bg-stone-200 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shopping Bag ({cartCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
