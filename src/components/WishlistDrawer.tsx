import React from 'react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/product';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface WishlistDrawerProps {
  onSelectProduct: (p: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ onSelectProduct }) => {
  const { isWishlistOpen, setIsWishlistOpen, wishlist, toggleWishlist, addToCart, products } = useStore();

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
    addToCart(product, product.sizes[0], product.colors[0]?.name || 'Standard', 1);
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />

      <div className="relative w-full max-w-md bg-[#0e0e11] border-l border-white/10 h-full flex flex-col justify-between z-10 shadow-2xl animate-slide-right text-stone-200">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h2 className="text-lg font-serif tracking-[0.05em] text-white">
              YOUR SAVED PIECES
            </h2>
            <span className="text-xs text-stone-400 font-mono">
              ({savedProducts.length})
            </span>
          </div>

          <button
            onClick={() => setIsWishlistOpen(false)}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-white/5">
          {savedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-stone-400">
              <Heart className="w-12 h-12 stroke-1 text-stone-600 mb-4" />
              <p className="text-base font-serif text-stone-300 mb-2">
                No items saved to your atelier wishlist.
              </p>
              <p className="text-xs text-stone-500 max-w-xs mb-6">
                Tap the heart icon on any silhouette to curate your personal lookbook.
              </p>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="px-6 py-3 rounded-xl bg-white text-black text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-200 transition-colors cursor-pointer"
              >
                DISCOVER THE COLLECTION
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
                  className="w-20 aspect-[3/4] rounded-lg overflow-hidden bg-[#16161b] shrink-0 border border-white/10 cursor-pointer"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
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
                        className="text-xs sm:text-sm font-sans text-white font-normal line-clamp-1 pr-2 cursor-pointer hover:underline"
                      >
                        {product.name}
                      </h4>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="text-stone-500 hover:text-red-400 p-1"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 block mt-0.5">
                      {product.gender} &middot; {product.category}
                    </span>
                    <span className="text-xs font-medium text-stone-200 block mt-1">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleMoveToBag(product)}
                    className="mt-3 w-full bg-white hover:bg-stone-200 text-black py-2 rounded-lg text-xs tracking-[0.15em] uppercase font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Bag</span>
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
