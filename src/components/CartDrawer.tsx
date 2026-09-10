import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { getMediaUrl } from '../utils/media';
import { useShippingConfig, calculateShippingCost, getShippingLabel } from '../utils/shippingConfig';

export const CartDrawer: React.FC = () => {
  const { user } = useAuth();
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    setIsCheckoutOpen,
  } = useStore();

  const shippingConfig = useShippingConfig();

  useModalBackHandler(isCartOpen, () => setIsCartOpen(false), 'cart-drawer');

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'ATELIER10') {
      setDiscountPercent(10);
      setPromoSuccess('10% VIP Atelier privilege applied.');
      setPromoError('');
    } else if (promoCode.trim().toUpperCase() === 'FIRST15') {
      setDiscountPercent(15);
      setPromoSuccess('15% First Haute Order privilege applied.');
      setPromoError('');
    } else {
      setPromoError('Invalid coupon code. Try "ATELIER10".');
      setPromoSuccess('');
    }
  };

  const discountAmount = Math.round((cartSubtotal * discountPercent) / 100);
  const shippingFee = calculateShippingCost(cartSubtotal, shippingConfig);
  const shippingLabel = getShippingLabel(cartSubtotal, shippingConfig);
  const finalTotal = cartSubtotal - discountAmount + shippingFee;

  // Compute dynamic progress to free delivery
  let progressPercent = 100;
  let dynamicAmountToFree = 0;
  let freeTargetThreshold = 0;

  if (shippingConfig.mode === 'flat' && shippingConfig.freeAbove > 0) {
    freeTargetThreshold = shippingConfig.freeAbove;
    dynamicAmountToFree = Math.max(0, shippingConfig.freeAbove - cartSubtotal);
    progressPercent = Math.min(100, Math.round((cartSubtotal / shippingConfig.freeAbove) * 100));
  } else if (shippingConfig.mode === 'tiered') {
    const freeTier = shippingConfig.tiers.find(t => t.cost === 0 && t.minOrderAmount > 0);
    if (freeTier) {
      freeTargetThreshold = freeTier.minOrderAmount;
      dynamicAmountToFree = Math.max(0, freeTier.minOrderAmount - cartSubtotal);
      progressPercent = Math.min(100, Math.round((cartSubtotal / freeTier.minOrderAmount) * 100));
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#0e0e11] border-l border-white/10 h-full flex flex-col justify-between z-10 shadow-2xl animate-slide-right text-stone-200">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="w-5 h-5 text-white" />
            <h2 className="text-lg font-serif tracking-[0.05em] text-white">
              YOUR SHOPPING BAG
            </h2>
            <span className="text-xs text-stone-400 font-mono">
              ({cart.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Free Shipping Progress Bar */}
        <div className="bg-white/[0.03] px-6 py-3.5 border-b border-white/10">
          <div className="flex items-center justify-between text-xs tracking-[0.08em] mb-2">
            {shippingConfig.mode === 'free' ? (
              <span className="text-emerald-400 font-medium flex items-center space-x-1">
                <span>✓ {shippingConfig.freeShippingMessage || 'Complimentary Worldwide White-Glove Shipping on all orders'}</span>
              </span>
            ) : freeTargetThreshold > 0 ? (
              dynamicAmountToFree > 0 ? (
                <span className="text-stone-300">
                  You're <strong className="text-white font-medium">{formatPrice(dynamicAmountToFree)}</strong> away from <span className="text-emerald-400">FREE SHIPPING</span>.
                </span>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center space-x-1">
                  <span>✓ Complimentary Worldwide White-Glove Shipping Unlocked</span>
                </span>
              )
            ) : (
              <span className="text-stone-300">
                Delivery: <strong className="text-white font-medium">{shippingLabel}</strong>
              </span>
            )}
            <span className="font-mono text-[11px] text-stone-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-white/5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-stone-400">
              <ShoppingBag className="w-12 h-12 stroke-1 text-stone-600 mb-4" />
              <p className="text-base font-serif text-stone-300 mb-2">Your shopping bag is empty.</p>
              <p className="text-xs text-stone-500 tracking-[0.05em] max-w-xs mb-6">
                Explore our curated Autumn / Winter 2026 collection and discover modern silhouettes.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 rounded-xl bg-white text-black text-xs tracking-[0.2em] uppercase font-medium hover:bg-stone-200 transition-colors cursor-pointer"
              >
                DISCOVER THE ATELIER
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pt-4 flex space-x-4 group">
                <div className="w-20 aspect-[3/4] rounded-lg overflow-hidden bg-[#16161b] shrink-0 border border-white/10">
                  <img
                    src={getMediaUrl(item.image)}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs sm:text-sm font-sans text-white font-normal line-clamp-1 pr-2">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-stone-400 space-x-2 mt-1">
                      <span>Size: <strong className="text-stone-200 font-normal">{item.size}</strong></span>
                      <span>&middot;</span>
                      <span>Color: <strong className="text-stone-200 font-normal">{item.color}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Stepper */}
                    <div className="flex items-center bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-stone-400 hover:text-white p-0.5"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-stone-400 hover:text-white p-0.5"
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs sm:text-sm font-medium text-white">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Subtotal & Checkout Button */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-[#0e0e11] space-y-4">
            {/* Promo Code Form */}
            <form onSubmit={handleApplyPromo} className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Coupon code (try ATELIER10)"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 uppercase tracking-[0.1em] focus:border-white/40 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-white/10 hover:bg-white text-stone-200 hover:text-black px-4 py-2 rounded-lg text-xs font-sans tracking-[0.15em] uppercase transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>
            {promoSuccess && (
              <p className="text-[11px] text-emerald-400 tracking-[0.05em]">{promoSuccess}</p>
            )}
            {promoError && (
              <p className="text-[11px] text-red-400 tracking-[0.05em]">{promoError}</p>
            )}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-stone-400 pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-stone-200 font-medium">{formatPrice(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>VIP Atelier Privilege ({discountPercent}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="truncate pr-2">Shipping ({shippingLabel})</span>
                <span className="shrink-0">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-400 uppercase tracking-wider text-[11px] font-medium">Free Complimentary</span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium text-white pt-2 border-t border-white/10">
                <span>Estimated Total</span>
                <span className="text-base font-semibold">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-white hover:bg-stone-200 text-black py-4 px-6 rounded-xl font-sans font-medium text-xs sm:text-sm tracking-[0.2em] uppercase flex items-center justify-center space-x-2 transition-all duration-300 shadow-xl cursor-pointer"
            >
              <span>{user ? 'PROCEED TO CHECKOUT' : 'SIGN IN & SECURE ORDER'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Security Assurance */}
            <div className="flex items-center justify-center space-x-2 text-[10px] uppercase tracking-[0.15em] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user ? 'Authenticated Server-Linked Checkout' : 'Login Mandatory for Cloud Server Registration'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
