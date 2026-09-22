import React, { useState, useEffect } from 'react';
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
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Check,
  Home,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  type CustomerAddress,
} from '../utils/geolocation';
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
    savedAddresses,
    addCustomerAddress,
    updateCustomerAddressItem,
    deleteCustomerAddress,
    setDefaultAddress,
  } = useAuth();

  const { theme, showToast } = useStore();

  useModalBackHandler(isAccountDrawerOpen, () => setIsAccountDrawerOpen(false), 'account-drawer');

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Jaw-dropping button interaction states
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isShockwaveActive, setIsShockwaveActive] = useState(false);

  // Ensure authentication loading state is immediately cleared when returning or pressing back
  useEffect(() => {
    const handleResetAuthLoading = () => {
      setIsSigningIn(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsSigningIn(false);
      }
    };

    window.addEventListener('pageshow', handleResetAuthLoading);
    window.addEventListener('focus', handleResetAuthLoading);
    window.addEventListener('popstate', handleResetAuthLoading);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handleResetAuthLoading);
      window.removeEventListener('focus', handleResetAuthLoading);
      window.removeEventListener('popstate', handleResetAuthLoading);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setIsSigningIn(false);
  }, [isAccountDrawerOpen, user]);

  // Multi-Address Management State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useModalBackHandler(isAddressModalOpen, () => setIsAddressModalOpen(false), 'account-address-modal');

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      recipientName: user?.fullName || '',
      phone: user?.phone ? user.phone.replace(/^\+91\s*/, '') : '',
      address: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: savedAddresses.length === 0,
    });
    setPincodeStatus(null);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || 'Home',
      recipientName: addr.recipientName || user?.fullName || '',
      phone: addr.phone || (user?.phone ? user.phone.replace(/^\+91\s*/, '') : ''),
      address: addr.address || '',
      apartment: addr.apartment || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'India',
      isDefault: !!addr.isDefault,
    });
    setPincodeStatus(
      addr.postalCode && addr.city
        ? { type: 'success', message: `Verified: ${addr.city ? `${addr.city}, ` : ''}${addr.state}` }
        : null
    );
    setIsAddressModalOpen(true);
  };

  const handleLookupPincodeForForm = async (overridePin?: string) => {
    const pin = (overridePin !== undefined ? overridePin : addressForm.postalCode || '').trim().replace(/\D/g, '');
    if (pin.length !== 6) {
      setPincodeStatus({ type: 'error', message: 'Please enter a valid 6-digit PIN code.' });
      return;
    }
    setIsLookingUpPincode(true);
    setPincodeStatus(null);
    try {
      const postOfficePromise = fetch(`https://api.postalpincode.in/pincode/${pin}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            const city = po.District || po.Block || po.Circle || po.Name || '';
            const state = po.State || '';
            if (city || state) return { city, state };
          }
          throw new Error('Not found in PostOffice');
        });

      const zippoPromise = fetch(`https://api.zippopotam.us/in/${pin}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          if (data?.places?.length > 0) {
            const place = data.places[0];
            const city = place['place name'] || '';
            const state = place['state'] || '';
            if (city || state) return { city, state };
          }
          throw new Error('Not found in Zippo');
        });

      const result = await Promise.any([postOfficePromise, zippoPromise]);
      if (result) {
        setAddressForm((prev) => ({
          ...prev,
          postalCode: pin,
          city: result.city || prev.city,
          state: result.state || prev.state,
        }));
        setPincodeStatus({
          type: 'success',
          message: `Verified: ${result.city ? `${result.city}, ` : ''}${result.state}`,
        });
        showToast(`PIN Code verified: ${result.city || result.state}`);
      }
    } catch {
      setPincodeStatus({
        type: 'error',
        message: 'Could not auto-detect location. Please enter city and state below.',
      });
    } finally {
      setIsLookingUpPincode(false);
    }
  };

  const handleSaveAddressForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.address.trim()) {
      showToast('Street address / building is required.');
      return;
    }
    const cleanPin = addressForm.postalCode.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      showToast('Please enter a valid 6-digit PIN code.');
      return;
    }
    if (!addressForm.city.trim()) {
      showToast('City is required.');
      return;
    }

    setIsSavingAddress(true);
    try {
      if (editingAddressId) {
        await updateCustomerAddressItem(editingAddressId, {
          label: addressForm.label,
          recipientName: addressForm.recipientName.trim() || undefined,
          phone: addressForm.phone.trim() || undefined,
          address: addressForm.address.trim(),
          apartment: addressForm.apartment.trim() || undefined,
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          postalCode: cleanPin,
          country: addressForm.country.trim() || 'India',
          isDefault: addressForm.isDefault,
        });
        showToast('Address updated successfully.');
      } else {
        await addCustomerAddress({
          label: addressForm.label,
          recipientName: addressForm.recipientName.trim() || undefined,
          phone: addressForm.phone.trim() || undefined,
          address: addressForm.address.trim(),
          apartment: addressForm.apartment.trim() || undefined,
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          postalCode: cleanPin,
          country: addressForm.country.trim() || 'India',
          isDefault: addressForm.isDefault,
          source: 'manual',
        });
        showToast('New address saved to your profile.');
      }
      setIsAddressModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save address:', err);
      showToast(`Failed to save address: ${err.message || 'Error'}`);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteCustomerAddress(id);
      showToast('Address removed.');
    } catch (err: any) {
      showToast(`Failed to delete address: ${err.message || 'Error'}`);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      showToast('Default delivery address updated.');
    } catch (err: any) {
      showToast(`Failed to update default: ${err.message || 'Error'}`);
    }
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

    // Fallback safety timeout if user cancels or presses back
    const timer = setTimeout(() => {
      setIsSigningIn(false);
    }, 6000);

    try {
      const res = await signInWithGoogle();
      if (res.error) {
        clearTimeout(timer);
        setIsSigningIn(false);
        showToast(res.error);
      }
    } catch (err: any) {
      clearTimeout(timer);
      setIsSigningIn(false);
      showToast(err?.message || 'Authentication error.');
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
                  className={`auth-google-btn relative w-full py-4 px-6 rounded-2xl flex items-center justify-center space-x-3.5 shadow-xl transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.97] hover:-translate-y-0.5 z-10 ${
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

              {/* Cancel / Retry option if connecting takes too long or user returned */}
              {isSigningIn && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSigningIn(false);
                  }}
                  className={`text-[11px] underline transition-colors pt-1 cursor-pointer font-medium block mx-auto text-center animate-fade-in ${
                    theme === 'alabaster' ? 'text-amber-800 hover:text-amber-950' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  Cancel / Tap to retry
                </button>
              )}

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
                    <div className={`text-center py-12 border border-dashed rounded-3xl p-6 space-y-2 ${
                      theme === 'alabaster' ? 'border-stone-300 text-stone-500' : 'border-white/10 text-stone-400'
                    }`}>
                      <Package className="w-10 h-10 mx-auto text-stone-500" />
                      <h4 className={`text-base font-serif ${theme === 'alabaster' ? 'text-stone-900' : 'text-white'}`}>No Orders Placed Yet</h4>
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
                    <div className={`flex justify-between border-b pb-2.5 ${theme === 'alabaster' ? 'border-stone-200' : 'border-white/5'}`}>
                      <span className="text-stone-400">Sign-in Method</span>
                      <span className={`font-medium ${theme === 'alabaster' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        {user.phone ? 'Verified Mobile' : 'Google Account'}
                      </span>
                    </div>
                    <div className={`flex justify-between border-b pb-2.5 ${theme === 'alabaster' ? 'border-stone-200' : 'border-white/5'}`}>
                      <span className="text-stone-400">Account ID</span>
                      <span className={`font-mono text-xs truncate max-w-[200px] ${theme === 'alabaster' ? 'text-stone-600' : 'text-stone-300'}`}>{user.id}</span>
                    </div>
                    {user.phone && (
                      <div className={`flex justify-between border-b pb-2.5 ${theme === 'alabaster' ? 'border-stone-200' : 'border-white/5'}`}>
                        <span className="text-stone-400">Verified Phone</span>
                        <span className="font-mono text-amber-400 text-xs">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-stone-400">Membership Status</span>
                      <span className={`font-medium ${theme === 'alabaster' ? 'text-stone-900' : 'text-white'}`}>Verified Active Member</span>
                    </div>
                  </div>

                  {/* Saved Delivery Destinations Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <h4 className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                          theme === 'alabaster' ? 'text-stone-900' : 'text-white'
                        }`}>
                          Delivery Addresses
                        </h4>
                        {savedAddresses.length > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            theme === 'alabaster' ? 'bg-stone-200 text-stone-700' : 'bg-white/10 text-stone-300'
                          }`}>
                            {savedAddresses.length}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddAddress}
                        className={`px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider font-mono flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-[1.02] ${
                          theme === 'alabaster'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 shadow-sm'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Address</span>
                      </button>
                    </div>

                    {/* Address Cards List */}
                    {savedAddresses.length > 0 ? (
                      <div className="space-y-3">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              addr.isDefault
                                ? (theme === 'alabaster' ? 'bg-amber-500/5 border-amber-500/40 shadow-sm' : 'bg-amber-500/[0.04] border-amber-500/40 shadow-md')
                                : (theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-white/[0.02] border-white/10')
                            }`}
                          >
                            <div className={`flex items-start justify-between border-b pb-2.5 mb-2.5 ${
                              theme === 'alabaster' ? 'border-stone-200/60' : 'border-white/5'
                            }`}>
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center space-x-1 ${
                                  theme === 'alabaster' ? 'bg-stone-100 text-stone-800' : 'bg-white/10 text-stone-200'
                                }`}>
                                  {addr.label?.toLowerCase() === 'work' ? (
                                    <Briefcase className="w-3 h-3 text-amber-400" />
                                  ) : addr.label?.toLowerCase() === 'studio' || addr.label?.toLowerCase() === 'villa' ? (
                                    <Building className="w-3 h-3 text-amber-400" />
                                  ) : (
                                    <Home className="w-3 h-3 text-amber-400" />
                                  )}
                                  <span>{addr.label || 'Home'}</span>
                                </span>

                                {addr.isDefault ? (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black font-mono font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1">
                                    <Check className="w-3 h-3" />
                                    <span>Default</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefault(addr.id)}
                                    className={`text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer ${
                                      theme === 'alabaster' ? 'text-stone-500 hover:text-amber-600' : 'text-stone-400 hover:text-amber-400'
                                    }`}
                                  >
                                    Set as Default
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAddress(addr)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    theme === 'alabaster'
                                      ? 'hover:bg-stone-100 text-stone-500 hover:text-stone-900'
                                      : 'hover:bg-white/10 text-stone-400 hover:text-white'
                                  }`}
                                  title="Edit Address"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    theme === 'alabaster'
                                      ? 'hover:bg-red-50 text-stone-500 hover:text-red-600'
                                      : 'hover:bg-red-500/15 text-stone-400 hover:text-red-400'
                                  }`}
                                  title="Delete Address"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-xs sm:text-sm space-y-1">
                              {(addr.recipientName || addr.phone) && (
                                <p className={`font-medium ${theme === 'alabaster' ? 'text-stone-900' : 'text-white'}`}>
                                  {addr.recipientName}
                                  {addr.phone && (
                                    <span className={`font-normal ml-1.5 ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                                      · {addr.phone}
                                    </span>
                                  )}
                                </p>
                              )}
                              <p className={`font-medium leading-snug ${theme === 'alabaster' ? 'text-stone-800' : 'text-stone-200'}`}>
                                {addr.address}
                              </p>
                              {addr.apartment && (
                                <p className={theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}>
                                  {addr.apartment}
                                </p>
                              )}
                              <p className={theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}>
                                {addr.city}, {addr.state} — {addr.postalCode}, {addr.country || 'India'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`p-6 rounded-2xl border text-center space-y-3 ${
                          theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-white/[0.02] border-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className={`text-sm font-serif ${theme === 'alabaster' ? 'text-stone-900' : 'text-white'}`}>
                            No Addresses Saved Yet
                          </h5>
                          <p className={`text-xs mt-1 max-w-xs mx-auto ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                            Save your home, work, or studio address for seamless 1-tap checkout.
                          </p>
                        </div>
                        <div className="flex items-center justify-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={handleOpenAddAddress}
                            className={`drawer-primary-btn px-3 py-2 rounded-xl text-xs uppercase font-mono font-semibold transition-colors cursor-pointer ${
                              theme === 'alabaster'
                                ? 'bg-stone-900 text-white hover:bg-black'
                                : 'bg-white text-black hover:bg-stone-200'
                            }`}
                            style={theme === 'alabaster' ? { color: '#ffffff', backgroundColor: '#1c1917' } : undefined}
                          >
                            <span style={theme === 'alabaster' ? { color: '#ffffff' } : undefined}>+ Add New Address</span>
                          </button>
                        </div>
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

      {/* Modal: Add / Edit Address Drawer / Dialog */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              theme === 'alabaster' ? 'bg-[#faf9f5] border-stone-300 text-black' : 'bg-[#0f0f13] border-white/15 text-white'
            }`}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
              theme === 'alabaster' ? 'border-stone-200' : 'border-white/10'
            }`}>
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-amber-400 uppercase block">
                  {editingAddressId ? 'Update Coordinates' : 'New Destination'}
                </span>
                <h3 className={`text-lg font-serif ${theme === 'alabaster' ? 'text-stone-900' : 'text-white'}`}>
                  {editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  theme === 'alabaster'
                    ? 'hover:bg-stone-200 text-stone-500 hover:text-stone-900'
                    : 'hover:bg-white/10 text-stone-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveAddressForm} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Address Label Chips */}
              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1.5 font-mono ${
                  theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  Address Label *
                </label>
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {['Home', 'Work', 'Studio', 'Villa', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                        addressForm.label === lbl
                          ? 'bg-amber-400 text-black border-amber-400 font-semibold shadow-sm'
                          : theme === 'alabaster'
                          ? 'bg-stone-100 border-stone-200 text-stone-700 hover:border-stone-400'
                          : 'bg-white/[0.04] border-white/10 text-stone-300 hover:border-white/20'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 font-mono ${
                    theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                  }`}>
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    placeholder="e.g. Syed Hamza"
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors ${
                      theme === 'alabaster'
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                        : 'bg-white/[0.04] border-white/10 text-white placeholder:text-stone-600 focus:border-white/30'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 font-mono ${
                    theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                  }`}>
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs font-mono transition-colors ${
                      theme === 'alabaster'
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                        : 'bg-white/[0.04] border-white/10 text-white placeholder:text-stone-600 focus:border-white/30'
                    }`}
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 font-mono ${
                  theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  Street Address, Building, House No. *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="e.g. Villa 14, Lavelle Road"
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors ${
                    theme === 'alabaster'
                      ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                      : 'bg-white/[0.04] border-white/10 text-white placeholder:text-stone-600 focus:border-white/30'
                  }`}
                />
              </div>

              {/* Apartment / Landmark */}
              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 font-mono ${
                  theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  Apartment, Suite, Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.apartment}
                  onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                  placeholder="e.g. Near Cubbon Park"
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors ${
                    theme === 'alabaster'
                      ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                      : 'bg-white/[0.04] border-white/10 text-white placeholder:text-stone-600 focus:border-white/30'
                  }`}
                />
              </div>

              {/* PIN Code Verification Card (Auto-fills City & State) */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  theme === 'alabaster'
                    ? 'bg-white border-stone-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
                    : 'bg-white/[0.04] border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
                } space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <label
                    className={`block text-[11px] font-semibold uppercase tracking-[0.14em] font-mono ${
                      theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    PIN Code *
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      theme === 'alabaster' ? 'text-stone-400' : 'text-stone-500'
                    }`}
                  >
                    Auto-fills City & State
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.postalCode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setAddressForm({ ...addressForm, postalCode: clean });
                      if (pincodeStatus) setPincodeStatus(null);
                      if (clean.length === 6) {
                        handleLookupPincodeForForm(clean);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLookupPincodeForForm();
                      }
                    }}
                    placeholder="e.g. 560001"
                    className={`flex-1 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs font-mono tracking-wider border focus:outline-none transition-colors ${
                      theme === 'alabaster'
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-stone-900'
                        : 'bg-black/30 border-white/15 text-white placeholder:text-stone-500 focus:border-white/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupPincodeForForm()}
                    disabled={isLookingUpPincode || addressForm.postalCode.replace(/\D/g, '').length !== 6}
                    className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95 flex items-center space-x-1.5 shadow-sm ${
                      theme === 'alabaster'
                        ? 'bg-[#111111] hover:bg-black text-white'
                        : 'bg-white hover:bg-stone-200 text-black'
                    }`}
                  >
                    {isLookingUpPincode ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>CHECKING...</span>
                      </>
                    ) : (
                      <span>CHECK</span>
                    )}
                  </button>
                </div>

                {pincodeStatus && (
                  <div
                    className={`pt-1 flex items-center space-x-1.5 text-xs ${
                      pincodeStatus.type === 'success'
                        ? 'text-emerald-600 font-medium'
                        : 'text-amber-600'
                    }`}
                  >
                    {pincodeStatus.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    )}
                    <span>{pincodeStatus.message}</span>
                  </div>
                )}
              </div>

              {/* City / District & State (Auto-filled by PIN) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 font-mono ${
                      theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors ${
                      theme === 'alabaster'
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-stone-900'
                        : 'bg-white/[0.04] border-white/10 text-white placeholder:text-stone-600 focus:border-white/30'
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 font-mono ${
                      theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-xs transition-colors ${
                      theme === 'alabaster'
                        ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-stone-900'
                        : 'bg-white/[0.04] border-white/10 text-white placeholder:text-stone-600 focus:border-white/30'
                    }`}
                  />
                </div>
              </div>

              {/* Set Default Toggle */}
              <label className="flex items-center space-x-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className={`w-4 h-4 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500 ${
                    theme === 'alabaster'
                      ? 'border-stone-400 bg-white text-amber-500'
                      : 'border-white/20 bg-white/5 text-amber-400'
                  }`}
                />
                <span className={`text-xs font-medium ${
                  theme === 'alabaster' ? 'text-stone-700' : 'text-stone-300'
                }`}>
                  Set as default delivery address for checkout
                </span>
              </label>

              {/* Actions */}
              <div className={`pt-3 border-t flex items-center justify-end space-x-2 ${
                theme === 'alabaster' ? 'border-stone-200' : 'border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    theme === 'alabaster'
                      ? 'border-stone-300 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      : 'border-white/10 text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className={`drawer-primary-btn px-5 py-2.5 rounded-xl font-semibold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 ${
                    theme === 'alabaster'
                      ? 'bg-stone-900 text-white hover:bg-black'
                      : 'bg-white text-black hover:bg-stone-200'
                  }`}
                  style={theme === 'alabaster' ? { color: '#ffffff', backgroundColor: '#1c1917' } : undefined}
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
