import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import {
  X,
  Lock,
  LogOut,
  Package,
  ShieldCheck,
  Sparkles,
  MapPin,
  Navigation,
  Loader2,
} from 'lucide-react';
import {
  detectUserLocation,
  type DetectedAddress,
} from '../utils/geolocation';
import { MapPinPickerModal } from './MapPinPickerModal';
import { getMediaUrl } from '../utils/media';

export const AccountDrawer: React.FC = () => {
  const {
    user,
    isAccountDrawerOpen,
    setIsAccountDrawerOpen,
    signInWithGoogle,
    signOut,
    userOrders,
    isLoadingOrders,
    pendingSyncCount,
    triggerPendingSync,
    savedAddress,
    updateCustomerAddress,
  } = useAuth();

  const { theme, showToast } = useStore();

  useModalBackHandler(isAccountDrawerOpen, () => setIsAccountDrawerOpen(false), 'account-drawer');

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Jaw-dropping button interaction states
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isShockwaveActive, setIsShockwaveActive] = useState(false);

  // Saved Delivery Address State
  const [isDetectingAddress, setIsDetectingAddress] = useState(false);

  const handleDetectSavedAddress = async () => {
    setIsDetectingAddress(true);
    const res = await detectUserLocation();
    setIsDetectingAddress(false);

    if (res.success && res.address) {
      await updateCustomerAddress(res.address);
      showToast('Delivery address pinpointed & saved to your profile.');
    } else {
      showToast(res.error || 'Failed to detect location.');
    }
  };

  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const handleConfirmMapAddress = async (addr: DetectedAddress) => {
    await updateCustomerAddress(addr);
    showToast(`Delivery destination & PIN ${addr.postalCode || ''} pinned & saved.`);
  };

  if (!isAccountDrawerOpen) return null;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const handleGoogleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // 1. Jaw-dropping shockwave animation
    setIsShockwaveActive(true);
    setTimeout(() => setIsShockwaveActive(false), 900);

    // 2. Jaw-dropping confetti & champagne gold starlight burst
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 55,
        spread: 75,
        origin: { x, y },
        colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff', '#38bdf8', '#34d399'],
        ticks: 150,
        gravity: 1.1,
        scalar: 0.95,
      });
    } catch {
      // Graceful fallback
    }

    setIsSigningIn(true);

    // Micro-delay for ripple feedback before redirect
    await new Promise((resolve) => setTimeout(resolve, 80));

    const res = await signInWithGoogle();
    if (res.error) {
      setIsSigningIn(false);
      showToast(res.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Account Center"
    >
      {/* Deep Luxury Backdrop Blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-all duration-300 animate-fade-in"
        onClick={() => setIsAccountDrawerOpen(false)}
      />

      {/* Centered Modal Box */}
      <div
        className={`relative w-full ${
          !user ? 'max-w-md sm:max-w-lg' : 'max-w-2xl max-h-[88vh]'
        } flex flex-col z-10 shadow-2xl overflow-hidden rounded-3xl animate-modal-zoom border transition-all ${
          theme === 'alabaster'
            ? 'bg-[#faf9f5]/95 text-[#121214] border-stone-300/80 shadow-[0_25px_70px_rgba(0,0,0,0.3)]'
            : 'bg-[#0c0c11]/95 text-stone-100 border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-2xl'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            theme === 'alabaster' ? 'bg-white/80 border-stone-200' : 'bg-white/[0.03] border-white/10'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-brand tracking-[0.25em] text-sm font-semibold uppercase block">
                ZARB
              </span>
              <span className="text-xs text-stone-400 font-sans tracking-wide">
                {user ? 'Verified Personal Account' : 'Account & Orders'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsAccountDrawerOpen(false)}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto">
          {/* =============================================================== */}
          {/* STATE A: NOT SIGNED IN (CENTER BOX DIALOG)                      */}
          {/* =============================================================== */}
          {!user ? (
            <div className="p-6 sm:p-8 space-y-6 text-center">
              {/* Crest Badge */}
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-600/20 rounded-3xl blur-xl animate-glow-pulse" />
                <div className="relative w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
                  <Lock className="w-9 h-9 stroke-[1.75]" />
                </div>
              </div>

              {/* Attractive, Clear Heading & Subtitle */}
              <div className="space-y-2">
                <h3 className={`text-2xl sm:text-3xl font-serif font-medium tracking-wide ${
                  theme === 'alabaster' ? 'text-[#121214]' : 'text-white'
                }`}>
                  Sign in to Zarb
                </h3>
                <p className={`text-sm sm:text-base font-light max-w-sm mx-auto leading-relaxed ${
                  theme === 'alabaster' ? 'text-stone-600' : 'text-stone-300'
                }`}>
                  Access your order history, track deliveries in real time, and manage your saved addresses.
                </p>
              </div>

              {/* The Jaw-Dropping Google Button Container */}
              <div className="relative pt-2">
                {/* Ambient dynamic glowing aura behind button */}
                <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-amber-500/30 via-yellow-400/30 to-amber-500/30 blur-lg opacity-70 group-hover:opacity-100 transition-opacity animate-glow-pulse pointer-events-none" />

                {/* Shockwave expanding halo ring */}
                {isShockwaveActive && (
                  <span className="absolute inset-0 rounded-2xl bg-amber-400/60 animate-shockwave pointer-events-none z-20" />
                )}

                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isSigningIn}
                  className={`relative w-full py-4 px-6 rounded-2xl flex items-center justify-center space-x-3.5 shadow-xl transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.97] hover:-translate-y-0.5 z-10 ${
                    theme === 'alabaster'
                      ? 'bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_35px_rgba(245,158,11,0.2)]'
                      : 'bg-white hover:bg-stone-50 text-stone-950 border border-white/90 shadow-[0_10px_35px_rgba(255,255,255,0.18)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)]'
                  }`}
                >
                  {/* Continuous Shimmer Light Beam */}
                  <span className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent -translate-x-full animate-shimmer-ray" />
                  </span>

                  {isSigningIn ? (
                    <div className="flex items-center space-x-3 text-stone-900">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                      <span className="text-base sm:text-lg font-semibold tracking-wide text-stone-900">
                        Connecting to Google...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Official Google Icon SVG */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span className="text-base sm:text-lg font-semibold tracking-wide text-stone-900">
                        Continue with Google
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Value Guarantees Badges (clear, readable, not small) */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div
                  className={`p-3.5 rounded-2xl border text-center space-y-1 ${
                    theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 mx-auto text-emerald-500" />
                  <div className={`text-xs font-semibold ${theme === 'alabaster' ? 'text-stone-900' : 'text-stone-200'}`}>
                    Encrypted
                  </div>
                  <div className={`text-[11px] ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                    256-bit SSL
                  </div>
                </div>
                <div
                  className={`p-3.5 rounded-2xl border text-center space-y-1 ${
                    theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mx-auto text-amber-500" />
                  <div className={`text-xs font-semibold ${theme === 'alabaster' ? 'text-stone-900' : 'text-stone-200'}`}>
                    Instant
                  </div>
                  <div className={`text-[11px] ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                    1-Tap Login
                  </div>
                </div>
                <div
                  className={`p-3.5 rounded-2xl border text-center space-y-1 ${
                    theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <Package className="w-5 h-5 mx-auto text-sky-500" />
                  <div className={`text-xs font-semibold ${theme === 'alabaster' ? 'text-stone-900' : 'text-stone-200'}`}>
                    Orders
                  </div>
                  <div className={`text-[11px] ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                    Live Tracking
                  </div>
                </div>
              </div>

              {/* Security Footnote */}
              <p className={`text-xs sm:text-sm font-light leading-relaxed max-w-sm mx-auto ${
                theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
              }`}>
                Single-tap authentication securely registered to your personal account.
              </p>
            </div>
          ) : (
            /* =============================================================== */
            /* STATE B: AUTHENTICATED (CENTER MODAL DIALOG)                    */
            /* =============================================================== */
            <div className="p-6 sm:p-8 space-y-6">
              {/* User Profile Card */}
              <div
                className={`p-5 rounded-2xl border flex items-center space-x-4 ${
                  theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-white/[0.03] border-white/10'
                }`}
              >
                {user.avatarUrl ? (
                  <img
                    src={getMediaUrl(user.avatarUrl)}
                    alt={user.fullName}
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 rounded-2xl border border-amber-500/40 object-cover shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-xl shadow-md">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif text-lg font-medium truncate">
                      {user.fullName}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-sm text-stone-400 truncate mt-0.5">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1.5 text-xs font-mono tracking-wider text-amber-500 uppercase font-medium">
                    Verified Member
                  </span>
                </div>
              </div>

              {/* Sub-Tabs: Orders vs Preferences */}
              <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm tracking-wider uppercase font-semibold transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-white text-black shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Order History ({userOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm tracking-wider uppercase font-semibold transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-white text-black shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Preferences & Addresses
                </button>
              </div>

              {/* Orders List */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Pending Sync Alert Banner if offline orders exist */}
                  {pendingSyncCount > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm animate-fade-in">
                      <div className="flex items-center space-x-2 text-amber-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="font-mono">
                          {pendingSyncCount} order{pendingSyncCount > 1 ? 's' : ''} queued offline
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerPendingSync()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs uppercase font-mono font-semibold tracking-wider hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        Sync Now
                      </button>
                    </div>
                  )}

                  {isLoadingOrders ? (
                    <div className="text-center py-12 text-sm text-stone-400">
                      Loading your orders...
                    </div>
                  ) : userOrders.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {userOrders.map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrder(ord)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-amber-400/50 ${
                            theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-mono text-sm font-semibold text-amber-400">
                                {ord.order_number}
                              </div>
                              <div className="text-xs text-stone-400 mt-0.5">
                                {formatDate(ord.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              {ord.sync_status === 'pending_sync' && (
                                <span className="text-xs uppercase px-2 py-0.5 rounded-md font-mono font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  <span>Pending Sync</span>
                                </span>
                              )}
                              <span className="text-xs uppercase px-2.5 py-0.5 rounded-md font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {ord.order_status}
                              </span>
                            </div>
                          </div>

                          {/* Items Preview */}
                          <div className="mt-3 flex items-center space-x-2 overflow-x-auto py-1">
                            {ord.items.slice(0, 3).map((item, idx) => (
                              <img
                                key={idx}
                                src={getMediaUrl(item.image)}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                className="w-12 h-14 object-cover rounded-lg bg-stone-900 border border-white/10 shrink-0"
                              />
                            ))}
                            {ord.items.length > 3 && (
                              <span className="text-xs text-stone-400 pl-1 font-mono">
                                +{ord.items.length - 3} more
                              </span>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-stone-400">Total Paid:</span>
                            <span className="font-semibold text-white">
                              {formatPrice(ord.total_amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl p-6 text-stone-400 space-y-2">
                      <Package className="w-10 h-10 mx-auto text-stone-500" />
                      <h4 className="text-base font-serif text-white">No Orders Placed Yet</h4>
                      <p className="text-xs sm:text-sm font-light">
                        Acquisitions made under {user.email} will permanently display here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Details Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-3 ${
                      theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div className="flex justify-between border-b border-white/5 pb-2.5">
                      <span className="text-stone-400">Sign-in Method</span>
                      <span className="font-medium text-emerald-400">
                        {user.phone ? 'Verified Mobile' : 'Google Account'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2.5">
                      <span className="text-stone-400">Account ID</span>
                      <span className="font-mono text-stone-300 text-xs truncate max-w-[200px]">{user.id}</span>
                    </div>
                    {user.phone && (
                      <div className="flex justify-between border-b border-white/5 pb-2.5">
                        <span className="text-stone-400">Verified Phone</span>
                        <span className="font-mono text-amber-400 text-xs">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-stone-400">Membership Status</span>
                      <span className="text-white font-medium">Verified Active Member</span>
                    </div>
                  </div>

                  {/* Saved Delivery Destination Card */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span className="font-medium text-xs sm:text-sm text-white">Default Delivery Address</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsMapPickerOpen(true)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs uppercase tracking-wider font-mono flex items-center space-x-1.5 transition-colors cursor-pointer"
                          title="Open interactive map to pin exact residence"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pin on Map</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDetectSavedAddress}
                          disabled={isDetectingAddress}
                          className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 border border-white/10 text-xs uppercase tracking-wider font-mono flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDetectingAddress ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <Navigation className="w-3.5 h-3.5" />
                              <span>GPS</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {savedAddress?.address ? (
                      <div className="text-xs sm:text-sm space-y-1">
                        <p className="text-stone-200 font-medium leading-snug">{savedAddress.address}</p>
                        {savedAddress.apartment && (
                          <p className="text-stone-400">{savedAddress.apartment}</p>
                        )}
                        <p className="text-stone-400">
                          {savedAddress.city}, {savedAddress.state} — {savedAddress.postalCode}, {savedAddress.country || 'India'}
                        </p>
                        <div className="pt-1.5 flex items-center space-x-2">
                          {savedAddress.accuracy && (
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              GPS ±{savedAddress.accuracy}m
                            </span>
                          )}
                          <span className="text-xs font-mono text-stone-400">
                            Saved for fast 1-tap checkout
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-stone-400 text-xs sm:text-sm space-y-1">
                        <p>No default address saved yet.</p>
                        <p className="text-xs text-stone-500">
                          Click "Pin on Map" or "GPS" above to save your delivery location.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={signOut}
                      className="w-full py-3.5 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs sm:text-sm tracking-wider uppercase font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of Zarb</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* =============================================================== */}
      {/* ORDER DETAILS MODAL                                             */}
      {/* =============================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-5 ${
            theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-[#121216] border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block">
                  Provenance Invoice & Tracking
                </span>
                <h3 className="font-mono text-base font-semibold">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {selectedOrder.items.map((it: any, i: number) => (
                <div key={i} className="flex items-center space-x-3 text-xs border-b border-white/5 pb-2">
                  <img src={getMediaUrl(it.image)} alt={it.name} loading="lazy" decoding="async" className="w-10 h-13 object-cover rounded bg-stone-900 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-[10px] text-stone-400">
                      {it.color} · Size: {it.size} · Qty: {it.quantity}
                    </div>
                  </div>
                  <div className="font-medium text-right">
                    {formatPrice(it.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Haute Couture Dispatch Progress Bar */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono text-[10px] uppercase tracking-wider">Provenance Status</span>
                <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-medium ${
                  selectedOrder.order_status === 'delivered'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : selectedOrder.order_status === 'dispatched'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : selectedOrder.order_status === 'cancelled'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : selectedOrder.order_status === 'refunded'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {selectedOrder.order_status}
                </span>
              </div>

              {/* Progress Stepper (if not cancelled/refunded) */}
              {selectedOrder.order_status !== 'cancelled' && selectedOrder.order_status !== 'refunded' ? (
                <div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {['confirmed', 'processing', 'dispatched', 'delivered'].map((st, idx) => {
                      const stages = ['confirmed', 'processing', 'dispatched', 'delivered'];
                      const currentIdx = stages.indexOf(selectedOrder.order_status || 'confirmed');
                      const isDone = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;
                      return (
                        <div key={st} className="space-y-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${
                            isDone
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm'
                              : 'bg-white/10'
                          }`} />
                          <div className={`text-[9px] font-mono uppercase tracking-wider text-center ${
                            isCurrent
                              ? 'text-amber-400 font-semibold'
                              : isDone
                              ? 'text-stone-300'
                              : 'text-stone-500'
                          }`}>
                            {st}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 font-mono">
                  Order status: {selectedOrder.order_status.toUpperCase()}
                </div>
              )}

              {/* Order Status History Log (Requirement 3: Preserve update history) */}
              {Array.isArray(selectedOrder.status_history) && selectedOrder.status_history.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block">
                    Order Status History
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {selectedOrder.status_history.map((h: any, idx: number) => (
                      <div key={idx} className="flex items-start justify-between text-[10px] p-1.5 rounded bg-white/[0.02] border border-white/5 font-mono">
                        <div>
                          <span className="text-amber-400 font-medium uppercase">{h.status}</span>
                          {h.note && <span className="text-stone-400 ml-1.5 font-sans text-[10px]">{h.note}</span>}
                        </div>
                        <span className="text-stone-500 text-[9px] shrink-0 ml-2">
                          {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white/[0.03] p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between text-stone-400">
                <span>Destination</span>
                <span className="text-white text-right max-w-[240px] truncate">
                  {selectedOrder.shipping_address?.address}, {selectedOrder.shipping_address?.city} ({selectedOrder.shipping_address?.postalCode})
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Subtotal</span>
                <span className="text-stone-300">{formatPrice(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount {selectedOrder.coupon_code ? `(${selectedOrder.coupon_code})` : ''}</span>
                  <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-400">
                <span>Shipping</span>
                <span className="text-stone-300">{selectedOrder.shipping_cost === 0 ? 'Complimentary' : formatPrice(selectedOrder.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-medium pt-1.5 border-t border-white/10 text-sm">
                <span>Total Amount Paid</span>
                <span className="text-amber-400">{formatPrice(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-stone-200"
            >
              Close Record
            </button>
          </div>
        </div>
      )}

      {/* Interactive Map Pin Picker Modal */}
      <MapPinPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirmAddress={handleConfirmMapAddress}
        initialPostalCode={savedAddress?.postalCode}
        theme={theme}
      />
    </div>
  );
};
