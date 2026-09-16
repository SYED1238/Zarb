import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import type { Product } from '../types/product';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { getMediaUrl } from '../utils/media';

interface WishlistDrawerProps {
  onSelectProduct: (p: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ onSelectProduct }) => {
  const { isWishlistOpen, setIsWishlistOpen, wishlist, toggleWishlist, addToCart, products, theme } = useStore();
  const isAlabaster = theme === 'alabaster';

  useModalBackHandler(isWishlistOpen, () => setIsWishlistOpen(false), 'wishlist-drawer');

  useEffect(() => {
    if (!isWishlistOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWishlistOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWishlistOpen, setIsWishlistOpen]);

  if (!isWishlistOpen) return null;

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleMoveToBag = (product: Product) => {
    const defaultSize = product.sizes?.[0] || 'Standard';
    const defaultColor = product.colors?.[0]?.name || 'Standard';
    addToCart(product, defaultSize, defaultColor, 1);
    toggleWishlist(product.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Wishlist Drawer"
    >
      <div
        className={`fixed inset-0 backdrop-blur-sm transition-opacity ${
          isAlabaster ? 'bg-black/60' : 'bg-black/80'
        }`}
        onClick={() => setIsWishlistOpen(false)}
      />

      <div
        className={`relative w-full max-w-md border-l h-full flex flex-col justify-between z-10 shadow-2xl animate-slide-right transition-colors duration-300 ${
          isAlabaster
            ? 'bg-[#faf9f5] border-stone-300/80 text-stone-900 shadow-2xl'
            : 'bg-[#0e0e11] border-white/10 text-stone-200 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isAlabaster ? 'border-stone-200' : 'border-white/10'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h2 className={`text-lg font-serif tracking-[0.05em] ${isAlabaster ? 'text-stone-950 font-normal' : 'text-white'}`}>
              YOUR SAVED PIECES
            </h2>
            <span className={`text-xs font-mono ${isAlabaster ? 'text-stone-500' : 'text-stone-400'}`}>
              ({savedProducts.length})
            </span>
          </div>

          <button
            onClick={() => setIsWishlistOpen(false)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isAlabaster
                ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
            aria-label="Close wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 divide-y ${
          isAlabaster ? 'divide-stone-200' : 'divide-white/5'
        }`}>
          {savedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-stone-400">
              <Heart className={`w-12 h-12 stroke-1 mb-4 ${isAlabaster ? 'text-stone-400' : 'text-stone-600'}`} />
              <p className={`text-base font-serif mb-2 ${isAlabaster ? 'text-stone-800' : 'text-stone-300'}`}>
                No items saved to your atelier wishlist.
              </p>
              <p className={`text-xs max-w-xs mb-6 ${isAlabaster ? 'text-stone-600' : 'text-stone-500'}`}>
                Tap the heart icon on any silhouette to curate your personal lookbook.
              </p>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className={`drawer-primary-btn px-6 py-3 rounded-xl text-xs tracking-[0.2em] uppercase font-medium transition-colors cursor-pointer shadow-md ${
                  isAlabaster
                    ? 'bg-stone-950 text-white hover:bg-black'
                    : 'bg-white text-black hover:bg-stone-200'
                }`}
                style={isAlabaster ? { color: '#ffffff', backgroundColor: '#0c0a09' } : undefined}
              >
                <span style={isAlabaster ? { color: '#ffffff' } : undefined}>DISCOVER THE COLLECTION</span>
              </button>
            </div>
          ) : (
            savedProducts.map((product) => (
              <div key={product.id} className="pt-4 flex space-x-4">
                <div
                  onClick={() => {
                    onSelectProduct(product);
                    setIsWishlistOpen(false);
                  }}
                  className={`w-20 aspect-[3/4] rounded-lg overflow-hidden shrink-0 border cursor-pointer ${
                    isAlabaster ? 'bg-stone-200 border-stone-300/80' : 'bg-[#16161b] border-white/10'
                  }`}
                >
                  <img
                    src={getMediaUrl(product.images[0])}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4
                        onClick={() => {
                          onSelectProduct(product);
                          setIsWishlistOpen(false);
                        }}
                        className={`text-xs sm:text-sm font-sans font-normal line-clamp-1 pr-2 cursor-pointer hover:underline ${
                          isAlabaster ? 'text-stone-950' : 'text-white'
                        }`}
                      >
                        {product.name}
                      </h4>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="text-stone-500 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className={`text-[10px] tracking-[0.2em] uppercase block mt-0.5 ${
                      isAlabaster ? 'text-stone-600' : 'text-stone-400'
                    }`}>
                      {product.gender} &middot; {product.category}
                    </span>
                    <span className={`text-xs font-semibold block mt-1 ${
                      isAlabaster ? 'text-stone-950' : 'text-stone-200'
                    }`}>
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleMoveToBag(product)}
                    className={`wishlist-move-btn mt-3 w-full py-2 rounded-lg text-xs tracking-[0.15em] uppercase font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-sm ${
                      isAlabaster
                        ? 'bg-stone-950 text-white hover:bg-black'
                        : 'bg-white hover:bg-stone-200 text-black'
                    }`}
                    style={isAlabaster ? { color: '#ffffff', backgroundColor: '#0c0a09' } : undefined}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" style={isAlabaster ? { color: '#ffffff', stroke: '#ffffff' } : undefined} />
                    <span style={isAlabaster ? { color: '#ffffff' } : undefined}>Move to Bag</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
