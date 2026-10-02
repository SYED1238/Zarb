import React, { useState, useEffect } from 'react';
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
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountPercent,
    discountAmount,
    theme,
  } = useStore();

  const isAlabaster = theme === 'alabaster';
  const shippingConfig = useShippingConfig();

  useModalBackHandler(isCartOpen, () => setIsCartOpen(false), 'cart-drawer');

  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    const res = applyCoupon(promoCode);
    if (res.success) {
      setPromoSuccess(res.message);
      setPromoError('');
      setPromoCode('');
    } else {
      setPromoError(res.message);
      setPromoSuccess('');
    }
  };

  const handleRemovePromo = () => {
    removeCoupon();
    setPromoSuccess('');
    setPromoError('');
  };

  const shippingFee = calculateShippingCost(cartSubtotal, shippingConfig);
  const shippingLabel = getShippingLabel(cartSubtotal, shippingConfig);
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

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
        className={`fixed inset-0 backdrop-blur-sm transition-opacity ${
          isAlabaster ? 'bg-black/60' : 'bg-black/80'
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
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
            <ShoppingBag className={`w-5 h-5 ${isAlabaster ? 'text-stone-900' : 'text-white'}`} />
            <h2 className={`text-lg font-serif tracking-[0.05em] ${isAlabaster ? 'text-stone-950 font-normal' : 'text-white'}`}>
              YOUR SHOPPING BAG
            </h2>
            <span className={`text-xs font-mono ${isAlabaster ? 'text-stone-500' : 'text-stone-400'}`}>
              ({cart.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isAlabaster
                ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Free Shipping Progress Bar */}
        <div
          className={`px-6 py-3.5 border-b ${
            isAlabaster ? 'bg-stone-200/50 border-stone-200' : 'bg-white/[0.03] border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-xs tracking-[0.08em] mb-2">
            {shippingConfig.mode === 'free' ? (
              <span className="text-emerald-500 font-medium flex items-center space-x-1">
                <span>✓ {shippingConfig.freeShippingMessage || 'Complimentary Worldwide White-Glove Shipping on all orders'}</span>
              </span>
            ) : freeTargetThreshold > 0 ? (
              dynamicAmountToFree > 0 ? (
                <span className={isAlabaster ? 'text-stone-700' : 'text-stone-300'}>
                  You're <strong className={`font-medium ${isAlabaster ? 'text-stone-950' : 'text-white'}`}>{formatPrice(dynamicAmountToFree)}</strong> away from <span className="text-emerald-500 font-medium">FREE SHIPPING</span>.
                </span>
              ) : (
                <span className="text-emerald-500 font-medium flex items-center space-x-1">
                  <span>✓ Complimentary Worldwide White-Glove Shipping Unlocked</span>
                </span>
              )
            ) : (
              <span className={isAlabaster ? 'text-stone-700' : 'text-stone-300'}>
                Delivery: <strong className={`font-medium ${isAlabaster ? 'text-stone-950' : 'text-white'}`}>{shippingLabel}</strong>
              </span>
            )}
            <span className={`font-mono text-[11px] ${isAlabaster ? 'text-stone-500' : 'text-stone-400'}`}>{progressPercent}%</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isAlabaster ? 'bg-stone-300/80' : 'bg-white/10'}`}>
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 divide-y ${
          isAlabaster ? 'divide-stone-200' : 'divide-white/5'
        }`}>
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-stone-400">
              <ShoppingBag className={`w-12 h-12 stroke-1 mb-4 ${isAlabaster ? 'text-stone-400' : 'text-stone-600'}`} />
              <p className={`text-base font-serif mb-2 ${isAlabaster ? 'text-stone-800' : 'text-stone-300'}`}>Your shopping bag is empty.</p>
              <p className={`text-xs tracking-[0.05em] max-w-xs mb-6 ${isAlabaster ? 'text-stone-600' : 'text-stone-500'}`}>
                Explore our curated Autumn / Winter 2026 collection and discover modern silhouettes.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className={`drawer-primary-btn px-6 py-3 rounded-xl text-xs tracking-[0.2em] uppercase font-medium transition-colors cursor-pointer shadow-md ${
                  isAlabaster
                    ? 'bg-stone-950 text-white hover:bg-black'
                    : 'bg-white text-black hover:bg-stone-200'
                }`}
                style={isAlabaster ? { color: '#ffffff', backgroundColor: '#0c0a09' } : undefined}
              >
                <span style={isAlabaster ? { color: '#ffffff' } : undefined}>DISCOVER THE ATELIER</span>
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pt-4 flex space-x-4 group">
                <div className={`w-20 aspect-[3/4] rounded-lg overflow-hidden shrink-0 border ${
                  isAlabaster ? 'bg-stone-200 border-stone-300/80' : 'bg-[#16161b] border-white/10'
                }`}>
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
                      <h4 className={`text-xs sm:text-sm font-sans font-normal line-clamp-1 pr-2 ${
                        isAlabaster ? 'text-stone-950' : 'text-white'
                      }`}>
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-500 hover:text-red-500 p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className={`text-[11px] space-x-2 mt-1 ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
                      <span>Size: <strong className={`font-normal ${isAlabaster ? 'text-stone-900' : 'text-stone-200'}`}>{item.size}</strong></span>
                      {Boolean(!item.isPerfume && item.color && item.color !== 'Standard' && item.color !== 'Default') && (
                        <>
                          <span>&middot;</span>
                          <span>Color: <strong className={`font-normal ${isAlabaster ? 'text-stone-900' : 'text-stone-200'}`}>{item.color}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Stepper */}
                    <div className={`flex items-center rounded-lg px-2 py-1 border ${
                      isAlabaster ? 'bg-stone-200/70 border-stone-300' : 'bg-white/[0.05] border-white/10'
                    }`}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className={`p-0.5 transition-colors ${
                          isAlabaster ? 'text-stone-600 hover:text-stone-950' : 'text-stone-400 hover:text-white'
                        }`}
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`w-6 text-center text-xs font-mono ${
                        isAlabaster ? 'text-stone-950 font-medium' : 'text-white'
                      }`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={`p-0.5 transition-colors ${
                          isAlabaster ? 'text-stone-600 hover:text-stone-950' : 'text-stone-400 hover:text-white'
                        }`}
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className={`text-xs sm:text-sm font-medium ${
                      isAlabaster ? 'text-stone-950' : 'text-white'
                    }`}>
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
          <div className={`p-6 border-t space-y-4 ${
            isAlabaster ? 'bg-[#faf9f5] border-stone-200' : 'bg-[#0e0e11] border-white/10'
          }`}>
            {/* Promo Code Form */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500">
                <span className="font-mono">
                  Applied: <strong>{appliedCoupon.code}</strong> ({appliedCoupon.percent}% OFF)
                </span>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="text-stone-500 hover:text-red-500 underline text-[11px] cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Coupon code (try ATELIER10)"
                    className={`w-full rounded-lg px-3 py-2 text-xs uppercase tracking-[0.1em] focus:outline-none border ${
                      isAlabaster
                        ? 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-600'
                        : 'bg-white/[0.04] border-white/10 text-white placeholder-stone-500 focus:border-white/40'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className={`cart-apply-btn px-4 py-2 rounded-lg text-xs font-sans tracking-[0.15em] uppercase transition-colors cursor-pointer shadow-sm ${
                    isAlabaster
                      ? 'bg-stone-900 hover:bg-black text-white'
                      : 'bg-white/10 hover:bg-white text-stone-200 hover:text-black'
                  }`}
                  style={isAlabaster ? { color: '#ffffff', backgroundColor: '#1c1917' } : undefined}
                >
                  <span style={isAlabaster ? { color: '#ffffff' } : undefined}>Apply</span>
                </button>
              </form>
            )}
            {!appliedCoupon && (
              <div className="flex items-center space-x-2 pt-0.5">
                <span className={`text-[10px] uppercase tracking-wider shrink-0 ${isAlabaster ? 'text-stone-500' : 'text-stone-400'}`}>Privilege:</span>
                <button
                  type="button"
                  onClick={() => {
                    const res = applyCoupon('ATELIER10');
                    if (res.success) {
                      setPromoSuccess(res.message);
                      setPromoError('');
                      setPromoCode('');
                    }
                  }}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer font-mono flex items-center space-x-1 shrink-0 ${
                    isAlabaster
                      ? 'border-stone-300/80 hover:border-stone-900 bg-stone-200/50 hover:bg-stone-900 hover:text-white text-stone-800'
                      : 'border-white/20 hover:border-white bg-white/5 hover:bg-white hover:text-black text-stone-200'
                  }`}
                >
                  <span>ATELIER10</span>
                  <span className="opacity-70 text-[9px]">• 10% OFF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = applyCoupon('HAUTE20');
                    if (res.success) {
                      setPromoSuccess(res.message);
                      setPromoError('');
                      setPromoCode('');
                    }
                  }}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer font-mono flex items-center space-x-1 shrink-0 ${
                    isAlabaster
                      ? 'border-stone-300/80 hover:border-stone-900 bg-stone-200/50 hover:bg-stone-900 hover:text-white text-stone-800'
                      : 'border-white/20 hover:border-white bg-white/5 hover:bg-white hover:text-black text-stone-200'
                  }`}
                >
                  <span>HAUTE20</span>
                  <span className="opacity-70 text-[9px]">• 20% OFF</span>
                </button>
              </div>
            )}
            {promoSuccess && (
              <p className="text-[11px] text-emerald-500 tracking-[0.05em]">{promoSuccess}</p>
            )}
            {promoError && (
              <p className="text-[11px] text-red-500 tracking-[0.05em]">{promoError}</p>
            )}

            {/* Calculations */}
            <div className={`space-y-1.5 text-xs pt-2 ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className={`font-medium ${isAlabaster ? 'text-stone-950' : 'text-stone-200'}`}>{formatPrice(cartSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500 font-medium">
                  <span>VIP Atelier Privilege ({discountPercent}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="truncate pr-2">Shipping ({shippingLabel})</span>
                <span className="shrink-0">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-500 uppercase tracking-wider text-[11px] font-medium">Free Complimentary</span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
              <div className={`flex justify-between text-sm font-medium pt-2 border-t ${
                isAlabaster ? 'border-stone-200 text-stone-950' : 'border-white/10 text-white'
              }`}>
                <span>Estimated Total</span>
                <span className="text-base font-semibold">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleProceedToCheckout}
              className={`cart-checkout-btn w-full py-4 px-6 rounded-xl font-sans font-medium text-xs sm:text-sm tracking-[0.2em] uppercase flex items-center justify-center space-x-2 transition-all duration-300 shadow-xl cursor-pointer ${
                isAlabaster
                  ? 'bg-stone-950 text-white hover:bg-black'
                  : 'bg-white hover:bg-stone-200 text-black'
              }`}
              style={isAlabaster ? { color: '#ffffff', backgroundColor: '#0c0a09' } : undefined}
            >
              <span style={isAlabaster ? { color: '#ffffff' } : undefined}>
                {user ? 'PROCEED TO CHECKOUT' : 'SIGN IN & SECURE ORDER'}
              </span>
              <ArrowRight className="w-4 h-4" style={isAlabaster ? { color: '#ffffff', stroke: '#ffffff' } : undefined} />
            </button>

            {/* Security Assurance */}
            <div className={`flex items-center justify-center space-x-2 text-[10px] uppercase tracking-[0.15em] ${
              isAlabaster ? 'text-stone-500' : 'text-stone-400'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{user ? 'Authenticated Server-Linked Checkout' : 'Login Mandatory for Cloud Server Registration'}</span>
            </div>

            {/* Instant Concierge Help */}
            <div className="pt-1 text-center">
              <a
                href="https://wa.me/917676753683?text=Hi%20ZARB%20Team%2C%20I%20need%20assistance%20with%20my%20bag%20or%20order."
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center space-x-1.5 text-[11px] font-medium tracking-wide transition-colors cursor-pointer hover:underline ${
                  isAlabaster ? 'text-emerald-700 hover:text-emerald-900' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.971.554 1.761.817 2.796.817 3.18 0 5.767-2.587 5.767-5.766.001-3.182-2.585-5.768-5.767-5.768zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.693.075-2.227-.562-1.78-.742-2.923-2.56-3.012-2.678-.088-.119-.724-.962-.724-1.833 0-.871.455-1.298.616-1.477.162-.18.354-.225.472-.225.118 0 .236.001.339.006.109.005.255-.041.399.305.148.355.508 1.238.552 1.328.045.09.075.195.015.314-.06.119-.09.194-.179.299-.089.105-.188.234-.268.315-.09.09-.184.187-.079.367.104.18.464.767.996 1.242.686.613 1.265.803 1.445.893.18.09.285.075.39-.045.105-.12.449-.523.569-.703.12-.18.239-.15.399-.09.16.06 1.018.48 1.198.57.18.09.299.135.344.21.045.075.045.435-.099.84zm-3.392-10.416c-4.298 0-7.794 3.496-7.794 7.794 0 1.374.356 2.713 1.034 3.896l-1.099 4.016 4.108-1.077c1.139.622 2.428.951 3.751.951 4.298 0 7.795-3.496 7.795-7.794 0-4.298-3.497-7.794-7.795-7.794zm0 14.029c-1.18 0-2.337-.315-3.348-.915l-.24-.143-2.488.652.664-2.426-.157-.251a6.223 6.223 0 0 1-.955-3.327c0-3.433 2.793-6.226 6.226-6.226 3.433 0 6.227 2.793 6.227 6.226 0 3.433-2.794 6.226-6.227 6.226z"/>
                </svg>
                <span>Instant Help on WhatsApp: 7676753683</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
