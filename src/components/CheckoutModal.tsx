import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import {
  X,
  CheckCircle2,
  Lock,
  CreditCard,
  Truck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  QrCode,
  Banknote,
  Navigation,
  Compass,
  MapPin,
  Loader2,
  AlertCircle,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  detectUserLocation,
  detectLocationByIP,
  getSavedAddress,
  saveAddressToStorage,
} from '../utils/geolocation';
import { MapPinPickerModal } from './MapPinPickerModal';
import type { DetectedAddress } from '../utils/geolocation';

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen, cartSubtotal, clearCart, cart, showToast } = useStore();
  const { user, saveOrder, signInWithGoogle, setIsAccountDrawerOpen, savedAddress, updateCustomerAddress } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Geolocation & Auto-detection state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState('');
  const [detectedMetadata, setDetectedMetadata] = useState<{
    source: 'gps' | 'ip';
    accuracy?: number;
    summary?: string;
  } | null>(() => {
    const saved = getSavedAddress();
    if (saved?.displayName) {
      return {
        source: saved.source || 'gps',
        accuracy: saved.accuracy,
        summary: saved.displayName,
      };
    }
    return null;
  });

  useModalBackHandler(
    isCheckoutOpen,
    () => {
      if (step > 1 && step < 4) {
        setStep((prev) => (prev - 1) as any);
      } else {
        setIsCheckoutOpen(false);
        setStep(1);
      }
    },
    `checkout-modal-step-${step}`
  );

  // Resume checkout if returning from Google OAuth redirect
  useEffect(() => {
    const shouldResume = localStorage.getItem('zarb_resume_checkout') === 'true';
    if (user && shouldResume) {
      localStorage.removeItem('zarb_resume_checkout');
      setIsCheckoutOpen(true);
    }
  }, [user, setIsCheckoutOpen]);

  // Form State — loads saved address from previous visit if available
  const [formData, setFormData] = useState(() => {
    const saved = getSavedAddress();
    return {
      email: user?.email || '',
      phone: '',
      firstName: user?.fullName ? user.fullName.split(' ')[0] : '',
      lastName: user?.fullName ? user.fullName.split(' ').slice(1).join(' ') : '',
      address: saved?.address || '42, Altamount Road, Cumballa Hill',
      apartment: saved?.apartment || 'Penthouse 12B',
      city: saved?.city || 'Mumbai',
      state: saved?.state || 'Maharashtra',
      postalCode: saved?.postalCode || '400026',
      country: saved?.country || 'India',
      shippingMethod: 'express',
      paymentMethod: 'card',
      cardNumber: '4532 •••• •••• 8842',
      cardExpiry: '08/29',
      cardCvc: '•••',
      cardHolder: user?.fullName ? user.fullName.toUpperCase() : 'CARDHOLDER NAME',
      upiId: 'user@okaxis',
    };
  });

  // Automatically sync phone, email, and name when user signs in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email,
        phone: prev.phone || (user.phone ? user.phone.replace(/^\+91\s*/, '') : ''),
        firstName: prev.firstName || (user.fullName ? user.fullName.split(' ')[0] : ''),
        cardHolder: prev.cardHolder === 'CARDHOLDER NAME' && user.fullName ? user.fullName.toUpperCase() : prev.cardHolder,
      }));
    }
  }, [user]);

  // Automatically prefill saved shipping address from Supabase cloud profile
  useEffect(() => {
    if (savedAddress && savedAddress.address) {
      setFormData((prev) => ({
        ...prev,
        address: savedAddress.address || prev.address,
        apartment: savedAddress.apartment !== undefined ? savedAddress.apartment : prev.apartment,
        city: savedAddress.city || prev.city,
        state: savedAddress.state || prev.state,
        postalCode: savedAddress.postalCode || prev.postalCode,
        country: savedAddress.country || prev.country || 'India',
      }));
      setDetectedMetadata({
        source: savedAddress.source || 'gps',
        accuracy: savedAddress.accuracy,
        summary: savedAddress.displayName || `${savedAddress.city}, ${savedAddress.state} · ${savedAddress.postalCode}`,
      });
      setLocationStatus('success');
      setLocationMessage('Saved destination prefilled from your account.');
    }
  }, [savedAddress]);

  const [orderNumber, setOrderNumber] = useState('');

  // Location detection triggers
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationStatus('detecting');
    setLocationMessage('Contacting GPS satellite & pinpointing address coordinates...');

    const res = await detectUserLocation();
    setIsDetectingLocation(false);

    if (res.success && res.address) {
      const { address, apartment, city, state, postalCode, country, source, accuracy, displayName } = res.address;
      setFormData((prev) => ({
        ...prev,
        address: address || prev.address,
        apartment: apartment !== undefined ? apartment : prev.apartment,
        city: city || prev.city,
        state: state || prev.state,
        postalCode: postalCode || prev.postalCode,
        country: country || prev.country,
      }));

      updateCustomerAddress({ address, apartment, city, state, postalCode, country, source, accuracy, displayName }).catch(() => {});
      setLocationStatus('success');
      setLocationMessage(
        source === 'gps'
          ? `High-accuracy GPS coordinates secured (${accuracy ? `±${accuracy}m` : 'live'}).`
          : 'Approximate locality auto-filled via high-speed network.'
      );
      setDetectedMetadata({
        source,
        accuracy,
        summary: displayName || `${city}, ${state} · ${postalCode}`,
      });
      showToast('Delivery address auto-filled & saved.');
    } else {
      setLocationStatus('error');
      setLocationMessage(res.error || 'Unable to pinpoint exact location. Please enter manually.');
      showToast(res.error || 'Location detection failed.');
    }
  };

  const handleIpFallback = async () => {
    setIsDetectingLocation(true);
    setLocationStatus('detecting');
    setLocationMessage('Resolving network location via IP...');

    const res = await detectLocationByIP();
    setIsDetectingLocation(false);

    if (res.success && res.address) {
      const { address, apartment, city, state, postalCode, country, source, displayName } = res.address;
      setFormData((prev) => ({
        ...prev,
        address: address || prev.address,
        apartment: apartment || prev.apartment,
        city: city || prev.city,
        state: state || prev.state,
        postalCode: postalCode || prev.postalCode,
        country: country || prev.country,
      }));

      updateCustomerAddress({ address, apartment, city, state, postalCode, country, source, displayName }).catch(() => {});
      setLocationStatus('success');
      setLocationMessage('Approximate locality auto-filled via network.');
      setDetectedMetadata({
        source: 'ip',
        summary: displayName || `${city}, ${state} · ${postalCode}`,
      });
      showToast('Approximate address auto-filled & saved.');
    } else {
      setLocationStatus('error');
      setLocationMessage('Could not resolve network location.');
      showToast('Network location lookup failed.');
    }
  };

  const handleConfirmMapAddress = (addr: DetectedAddress) => {
    setFormData((prev) => ({
      ...prev,
      address: addr.address || prev.address,
      apartment: addr.apartment || prev.apartment,
      city: addr.city || prev.city,
      state: addr.state || prev.state,
      postalCode: addr.postalCode || prev.postalCode,
      country: addr.country || 'India',
    }));

    updateCustomerAddress(addr).catch(() => {});
    setLocationStatus('success');
    setLocationMessage('Pinned exact destination via interactive map.');
    setDetectedMetadata({
      source: 'gps',
      summary: addr.displayName || `${addr.address}, ${addr.city} (${addr.postalCode})`,
    });
    showToast(`Pinned location & PIN code ${addr.postalCode || ''} applied & saved.`);
  };

  // Prefill authenticated user information whenever user logs in or changes
  useEffect(() => {
    if (user) {
      const parts = user.fullName ? user.fullName.split(' ') : [];
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        firstName: prev.firstName || parts[0] || '',
        lastName: prev.lastName || parts.slice(1).join(' ') || '',
        cardHolder: prev.cardHolder || user.fullName.toUpperCase(),
      }));
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    localStorage.setItem('zarb_resume_checkout', 'true');
    const res = await signInWithGoogle();
    if (res.error) {
      showToast(res.error);
      setIsSigningIn(false);
    }
  };

  if (!isCheckoutOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else if (step === 2) {
      saveAddressToStorage({
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      });
      setStep(3);
    }
    else if (step === 3) {
      // Guard: Ensure user is logged in
      if (!user) {
        showToast('Sign-in is required to record your order on the server.');
        setIsAccountDrawerOpen(true);
        return;
      }

      // Complete Order & Persist to Supabase + Local Cache
      const newOrderNum = `AN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      setOrderNumber(newOrderNum);

      const orderItems = cart.map((it) => ({
        id: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        size: it.size,
        color: it.color,
        image: it.image,
      }));

      const shippingCost = formData.shippingMethod === 'express' ? 0 : 0;
      const orderTotal = cartSubtotal + shippingCost;

      // Save order to cloud/local (user_id is automatically linked to user.id in AuthContext)
      await saveOrder({
        order_number: newOrderNum,
        customer_name: `${formData.firstName} ${formData.lastName}`.trim() || user.fullName,
        customer_email: user.email || formData.email,
        customer_phone: formData.phone,
        shipping_address: {
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          shippingMethod: formData.shippingMethod,
        },
        items: orderItems,
        subtotal: cartSubtotal,
        shipping_cost: shippingCost,
        discount_amount: 0,
        coupon_code: '',
        total_amount: orderTotal,
        payment_method: formData.paymentMethod,
        payment_status: 'paid',
        order_status: 'confirmed',
        status_history: [
          {
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            note: 'Order placed & confirmed during checkout.',
            updatedBy: 'Customer Checkout',
          },
        ],
      });

      // Ensure address is permanently saved to customer profile
      updateCustomerAddress({
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      }).catch(() => {});

      setStep(4);
      clearCart();

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#d4af37', '#e2e8f0'],
        });
      } catch {
        // graceful fallback
      }
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const shippingCost = formData.shippingMethod === 'express' ? 0 : 0;
  const total = cartSubtotal + shippingCost;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md"
        onClick={() => step !== 4 && setIsCheckoutOpen(false)}
      />

      <div className="relative w-full max-w-4xl bg-[#0e0e11] border border-white/10 sm:rounded-2xl z-10 shadow-2xl overflow-hidden my-auto min-h-screen sm:min-h-0 flex flex-col text-stone-200 animate-fade-in">
        {/* Checkout Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0a0a0c]">
          <div className="flex items-center space-x-3">
            <span className="font-brand text-base tracking-[0.25em] text-white">
              ZARB
            </span>
            <span className="text-xs text-stone-500">|</span>
            <span className="text-xs tracking-[0.2em] uppercase text-stone-400">
              {user ? 'Distraction-Free Haute Checkout' : 'Customer Authentication Gate'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-[11px] uppercase tracking-[0.15em] text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>{user ? 'Encrypted' : 'Security Verification'}</span>
            </div>
            {step !== 4 && (
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* CASE A: MANDATORY LOGIN GATE (USER NOT SIGNED IN)              */}
        {/* =============================================================== */}
        {!user ? (
          <div className="p-8 sm:p-14 text-center max-w-xl mx-auto my-auto space-y-7 animate-fade-in">
            {/* Security Crest */}
            <div className="relative inline-block">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-2xl">
                <Lock className="w-9 h-9 stroke-[1.5]" />
              </div>
              <div className="absolute -inset-2 bg-amber-500/10 rounded-3xl blur-xl -z-10" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 block mb-2 font-semibold">
                Sign In Required
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-wide">
                Sign In to Complete Your Order
              </h2>
              <p className="text-sm text-stone-300 font-light mt-2.5 leading-relaxed max-w-md mx-auto">
                Please sign in with your Google account to proceed with your order, receive digital receipts, and track your delivery in real time.
              </p>
            </div>

            {/* Value Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-amber-400 text-xs font-mono font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Order History</span>
                </div>
                <p className="text-xs text-stone-400 font-light leading-snug">
                  Digital receipts and order records safely saved to your account.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-emerald-400 text-xs font-mono font-semibold flex items-center space-x-1.5">
                  <Truck className="w-4 h-4" />
                  <span>Live Tracking</span>
                </div>
                <p className="text-xs text-stone-400 font-light leading-snug">
                  Real-time delivery updates and courier tracking notifications.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-blue-400 text-xs font-mono font-semibold flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Authentic Quality</span>
                </div>
                <p className="text-xs text-stone-400 font-light leading-snug">
                  Official guarantee of authenticity included with every piece.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-sans font-semibold tracking-wider uppercase flex items-center justify-center space-x-3 shadow-xl transition-all cursor-pointer border border-stone-300 active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-xs text-stone-500 hover:text-stone-300 transition-colors pt-2 block mx-auto cursor-pointer"
              >
                Return to Boutique
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 4-Step Progress Indicator */}
            <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5">
              <div className="flex items-center justify-between max-w-md mx-auto text-xs tracking-[0.15em] uppercase">
                <span className={step >= 1 ? 'text-white font-medium' : 'text-stone-600'}>
                  1. Contact
                </span>
                <span className="text-stone-700">&rarr;</span>
                <span className={step >= 2 ? 'text-white font-medium' : 'text-stone-600'}>
                  2. Delivery
                </span>
                <span className="text-stone-700">&rarr;</span>
                <span className={step >= 3 ? 'text-white font-medium' : 'text-stone-600'}>
                  3. Payment
                </span>
                <span className="text-stone-700">&rarr;</span>
                <span className={step === 4 ? 'text-emerald-400 font-medium' : 'text-stone-600'}>
                  4. Confirmation
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
              {step === 1 && (
                <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-xl font-serif text-white tracking-[0.03em] mb-1">
                      Customer Contact Information
                    </h3>
                    <p className="text-xs text-stone-400">
                      Authenticated customer checkout. Invoices and real-time tracking will be permanently registered to your account.
                    </p>
                  </div>

                  {/* Authenticated Customer Identity Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block font-semibold">
                          Authenticated Customer Account
                        </span>
                        <span className="text-xs text-stone-200 font-medium">
                          {user.fullName} ({user.email})
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 bg-black/40 px-2 py-0.5 rounded border border-white/10 hidden sm:inline-block">
                      Server Linked
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5 flex items-center justify-between">
                        <span>Verified Account Email</span>
                        <span className="text-[10px] font-mono text-emerald-400 lowercase">saved to server</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        readOnly
                        value={formData.email}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-stone-300 cursor-not-allowed focus:outline-none"
                        placeholder="customer@luxury.com"
                      />
                    </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    Mobile Phone (for delivery concierge)
                  </label>
                  <div className="flex items-center space-x-2">
                    {/* Separate Fixed Country Code Badge (+91) */}
                    <div className="flex items-center space-x-1.5 bg-white/[0.08] border border-white/20 rounded-xl px-3.5 py-3 text-sm text-stone-200 font-mono select-none shrink-0 shadow-inner">
                      <span className="text-base leading-none">🇮🇳</span>
                      <span className="font-semibold text-white tracking-wider">+91</span>
                    </div>

                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone.replace(/^\+91\s*/, '')}
                      onChange={(e) => {
                        // Strip any accidentally typed +91 and keep only digits/spaces
                        const cleanDigits = e.target.value.replace(/^\+91\s*/, '').replace(/[^\d\s-]/g, '');
                        setFormData({ ...formData, phone: cleanDigits });
                      }}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none tracking-wider font-mono placeholder:text-stone-600"
                      placeholder="98200 12345"
                      maxLength={15}
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono mt-1.5 block">
                    Concierge dispatch SMS & tracking will be delivered to +91 {formData.phone.replace(/^\+91\s*/, '') || '••••• •••••'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-stone-200 text-black py-4 rounded-xl text-xs tracking-[0.2em] uppercase font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>CONTINUE TO DELIVERY DETAILS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif text-white tracking-[0.03em] mb-1">
                    Delivery & Atelier Shipping
                  </h3>
                  <p className="text-xs text-stone-400">
                    Complimentary white-glove packaging with handwritten provenance certificate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-stone-400 hover:text-white flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Haute Geolocation / Detect My Location Card */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-black/40 to-white/[0.02] p-4 sm:p-5 backdrop-blur-md shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isDetectingLocation
                        ? 'bg-amber-500 text-black animate-pulse shadow-[0_0_22px_rgba(245,158,11,0.5)]'
                        : locationStatus === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : locationStatus === 'error'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {isDetectingLocation ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : locationStatus === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : locationStatus === 'error' ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <Compass className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          Atelier Geolocation
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {isDetectingLocation ? 'Pinging GPS...' : 'GPS LIVE'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">
                        {locationMessage || 'Pinpoint current coordinates to instantly autofill your luxury delivery destination.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setIsMapPickerOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:text-amber-200 font-semibold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-amber-500/10 transition-all cursor-pointer active:scale-95"
                      title="Open interactive map to pin exact residence and get accurate PIN code"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                      <span>Pin on Map</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5 fill-black" />
                          <span>Detect GPS</span>
                        </>
                      )}
                    </button>

                    {(locationStatus === 'error' || locationStatus === 'idle') && (
                      <button
                        type="button"
                        onClick={handleIpFallback}
                        disabled={isDetectingLocation}
                        className="px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-stone-300 hover:text-white text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                        title="Auto-fill city & PIN code via approximate IP network lookup"
                      >
                        IP Autofill
                      </button>
                    )}
                  </div>
                </div>

                {/* Detected Live Coordinates / Accuracy Pill */}
                {detectedMetadata && (
                  <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-stone-300">
                    <div className="flex items-center space-x-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate max-w-[280px] sm:max-w-md text-stone-200 font-medium">
                        {detectedMetadata.summary}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {detectedMetadata.accuracy && (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ±{detectedMetadata.accuracy}m GPS lock
                        </span>
                      )}
                      <span className="text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">
                        Via {detectedMetadata.source.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="text-amber-400 hover:text-amber-300 flex items-center space-x-1 pl-1 cursor-pointer underline underline-offset-2"
                        title="Adjust pinpoint location & PIN code on interactive map"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Adjust on Map</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        className="text-stone-400 hover:text-amber-300 flex items-center space-x-1 pl-1 cursor-pointer"
                        title="Re-run GPS detection"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Re-detect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300">
                    Street Address
                  </label>
                  {detectedMetadata && (
                    <span className="text-[10px] font-mono text-amber-400/80 flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Auto-filled</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 42, Altamount Road, Cumballa Hill"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none placeholder:text-stone-600"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                  Apartment, Suite, Floor (optional)
                </label>
                <input
                  type="text"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleChange}
                  placeholder="e.g. Penthouse 12B, Villa 4"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none placeholder:text-stone-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shipping Method Option */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-medium text-white block uppercase tracking-[0.1em] text-emerald-400">
                      Complimentary White-Glove Courier
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Estimated Delivery: 2–4 Business Days
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase text-emerald-400">FREE</span>
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-stone-200 text-black py-4 rounded-xl text-xs tracking-[0.2em] uppercase font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>PROCEED TO PAYMENT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif text-white tracking-[0.03em] mb-1">
                    Select Payment Gateway
                  </h3>
                  <p className="text-xs text-stone-400">
                    All transactions are 256-bit encrypted with PCI-DSS compliant protocols.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-stone-400 hover:text-white flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.paymentMethod === 'card'
                      ? 'border-white bg-white/10 text-white font-medium'
                      : 'border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs tracking-[0.1em] uppercase">Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.paymentMethod === 'upi'
                      ? 'border-white bg-white/10 text-white font-medium'
                      : 'border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs tracking-[0.1em] uppercase">Instant UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.paymentMethod === 'cod'
                      ? 'border-white bg-white/10 text-white font-medium'
                      : 'border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs tracking-[0.1em] uppercase">Concierge COD</span>
                </button>
              </div>

              {/* Card Inputs */}
              {formData.paymentMethod === 'card' && (
                <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      required
                      value={formData.cardNumber}
                      onChange={handleChange}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-white/40 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="cardExpiry"
                        required
                        value={formData.cardExpiry}
                        onChange={handleChange}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-white/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                        Security CVC
                      </label>
                      <input
                        type="text"
                        name="cardCvc"
                        required
                        value={formData.cardCvc}
                        onChange={handleChange}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-white/40 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Inputs */}
              {formData.paymentMethod === 'upi' && (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    UPI Virtual Payment Address (VPA)
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleChange}
                    placeholder="yourname@okhdfcbank"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-white/40 focus:outline-none"
                  />
                  <p className="text-[11px] text-stone-400">
                    Supports Google Pay, PhonePe, Paytm, and BHIM.
                  </p>
                </div>
              )}

              {/* COD Notice */}
              {formData.paymentMethod === 'cod' && (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-stone-400 leading-relaxed">
                  White-glove concierge delivery with cash or mobile card terminal payment on signature.
                </div>
              )}

              {/* Summary of Total */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex justify-between items-center text-sm font-sans">
                <span className="uppercase tracking-[0.15em] text-stone-400">Amount Due</span>
                <span className="text-xl font-medium text-white">{formatPrice(total)}</span>
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-stone-200 text-black py-4 rounded-xl text-xs tracking-[0.2em] uppercase font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-2xl"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>CONFIRM & PLACE ATELIER ORDER</span>
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="max-w-md mx-auto text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-fade-in">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-stone-400 block mb-1">
                  Zarb Acquisition Confirmed
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif text-white tracking-[0.02em]">
                  THANK YOU, {formData.firstName.toUpperCase()}
                </h3>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 text-left space-y-3 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-stone-400 uppercase tracking-wider">Order Reference</span>
                  <span className="font-mono font-medium text-white">{orderNumber}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-stone-400 uppercase tracking-wider">Destination</span>
                  <span className="text-white">{formData.city}, {formData.state}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-stone-400 uppercase tracking-wider">Dispatch Window</span>
                  <span className="text-emerald-400">24–48 Hours (White-Glove)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-stone-400 uppercase tracking-wider">Total Paid</span>
                  <span className="text-white font-medium">{formatPrice(total)}</span>
                </div>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">
                A formal provenance invoice and live concierge tracking dispatch link have been sent to <strong className="text-stone-200">{formData.email}</strong>.
              </p>

              {/* Order Confirmation Badge */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold block">
                  ✓ Order Confirmed & Recorded
                </span>
                <p className="text-xs text-stone-300">
                  Your order is safely recorded under your account (<strong className="text-white">{user?.email}</strong>).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setStep(1);
                    setIsAccountDrawerOpen(true);
                  }}
                  className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-sans tracking-[0.15em] uppercase font-medium border border-white/15 transition-colors cursor-pointer"
                >
                  View in My Orders
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setStep(1);
                  }}
                  className="w-full sm:w-1/2 bg-white text-black hover:bg-stone-200 py-3.5 px-4 rounded-xl text-xs tracking-[0.15em] uppercase font-medium transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    )}
      </div>

      {/* Interactive Map Pin Picker Modal */}
      <MapPinPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirmAddress={handleConfirmMapAddress}
        initialPostalCode={formData.postalCode}
        theme="noir"
      />
    </div>
  );
};
