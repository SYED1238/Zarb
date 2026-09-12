import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import {
  X,
  CheckCircle2,
  Lock,
  Truck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Banknote,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getSavedAddress,
  saveAddressToStorage,
} from '../utils/geolocation';
import { createCashfreeOrderSession, launchCashfreeCheckout, verifyCashfreePayment } from '../services/cashfreeService';
import { useShippingConfig, calculateShippingCost, getShippingLabel } from '../utils/shippingConfig';

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen, cartSubtotal, clearCart, cart, showToast, theme } = useStore();
  const isAlabaster = theme === 'alabaster';
  const { user, saveOrder, signInWithGoogle, setIsAccountDrawerOpen, savedAddress, updateCustomerAddress } = useAuth();
  const shippingConfig = useShippingConfig();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(true);

  // Cashfree Payment processing state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [finalPaidAmount, setFinalPaidAmount] = useState<number>(0);

  // PIN Code lookup & auto-fill state
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const goToStep = (newStep: 1 | 2 | 3 | 4) => {
    setStep(newStep);
    setMaxVisitedStep((prev) => Math.max(prev, newStep) as 1 | 2 | 3 | 4);
  };

  const canNavigateToStep = (targetStep: 1 | 2 | 3 | 4) => {
    if (step === 4) return false;
    if (isProcessingPayment) return false;
    if (targetStep === 4) return false;
    if (targetStep === step) return false;
    if (targetStep < step) return true;
    if (targetStep <= maxVisitedStep) return true;
    return false;
  };

  const handleStepClick = (targetStep: 1 | 2 | 3 | 4) => {
    if (!canNavigateToStep(targetStep)) return;

    if (targetStep >= 3 && step < 3) {
      const cleanPin = (formData.postalCode || '').trim().replace(/\D/g, '');
      if (cleanPin.length !== 6) {
        showToast('Please enter a valid 6-digit PIN code.');
        setStep(2);
        return;
      }
      saveAddressToStorage({
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: cleanPin,
        country: formData.country,
      });
      updateCustomerAddress({
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: cleanPin,
        country: formData.country,
      }).catch(() => {});
    }

    setStep(targetStep);
  };

  useModalBackHandler(
    isCheckoutOpen,
    () => {
      setIsCheckoutOpen(false);
      setStep(1);
      setMaxVisitedStep(1);
    },
    'checkout-modal'
  );

  // Reset step tracking when checkout modal closes
  useEffect(() => {
    if (!isCheckoutOpen) {
      setStep(1);
      setMaxVisitedStep(1);
    }
  }, [isCheckoutOpen]);

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
      phone: user?.phone || '',
      firstName: user?.fullName ? user.fullName.split(' ')[0] : '',
      lastName: user?.fullName ? user.fullName.split(' ').slice(1).join(' ') : '',
      address: saved?.address || '',
      apartment: saved?.apartment || '',
      city: saved?.city || '',
      state: saved?.state || '',
      postalCode: saved?.postalCode || '',
      country: saved?.country || 'India',
      shippingMethod: 'express',
      paymentMethod: 'cashfree',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
      cardHolder: user?.fullName ? user.fullName.toUpperCase() : 'CARDHOLDER NAME',
      upiId: '',
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
    if (savedAddress && (savedAddress.address || savedAddress.postalCode)) {
      setFormData((prev) => ({
        ...prev,
        address: savedAddress.address || prev.address,
        apartment: savedAddress.apartment !== undefined ? savedAddress.apartment : prev.apartment,
        city: savedAddress.city || prev.city,
        state: savedAddress.state || prev.state,
        postalCode: savedAddress.postalCode || prev.postalCode,
        country: savedAddress.country || prev.country || 'India',
      }));
    }
  }, [savedAddress]);

  const [orderNumber, setOrderNumber] = useState('');

  // PIN Code verification & auto-fill (City & State)
  const handleCheckPincode = async (overridePin?: string) => {
    const pin = (overridePin !== undefined ? overridePin : formData.postalCode || '').trim().replace(/\D/g, '');
    if (pin.length !== 6) {
      setPincodeStatus({ type: 'error', message: 'Please enter a valid 6-digit PIN code.' });
      return;
    }

    setIsCheckingPincode(true);
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
        setFormData((prev) => ({
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
      setIsCheckingPincode(false);
    }
  };

  // Prefill authenticated user information whenever user logs in or changes
  useEffect(() => {
    if (user) {
      const parts = user.fullName ? user.fullName.split(' ') : [];
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        phone: prev.phone || user.phone || '',
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
    if (step === 1) goToStep(2);
    else if (step === 2) {
      const cleanPin = (formData.postalCode || '').trim().replace(/\D/g, '');
      if (cleanPin.length !== 6) {
        showToast('Please enter a valid 6-digit PIN code.');
        return;
      }
      saveAddressToStorage({
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: cleanPin,
        country: formData.country,
      });
      updateCustomerAddress({
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postalCode: cleanPin,
        country: formData.country,
      }).catch(() => {});
      goToStep(3);
    }
    else if (step === 3) {
      // Guard: Ensure user is logged in
      if (!user) {
        showToast('Sign-in is required to record your order on the server.');
        setIsAccountDrawerOpen(true);
        return;
      }

      if (cart.length === 0) {
        showToast('Your bag is currently empty.');
        return;
      }

      // A. Cashfree Hosted Payment Gateway (UPI, Cards, NetBanking)
      if (formData.paymentMethod === 'cashfree' || formData.paymentMethod === 'card' || formData.paymentMethod === 'upi') {
        setIsProcessingPayment(true);
        setPaymentStatusText('Securing 256-bit payment session with Cashfree...');
        setPaymentError(null);

        try {
          const currentShippingCost = calculateShippingCost(cartSubtotal, shippingConfig);
          const sessionRes = await createCashfreeOrderSession({
            items: cart,
            customer: {
              name: `${formData.firstName} ${formData.lastName}`.trim() || user.fullName,
              email: user.email || formData.email,
              phone: formData.phone,
              userId: user.id,
            },
            shippingAddress: {
              address: formData.address,
              apartment: formData.apartment,
              city: formData.city,
              state: formData.state,
              postalCode: formData.postalCode,
              country: formData.country,
              shippingMethod: formData.shippingMethod,
            },
            shippingCost: currentShippingCost,
          });

          if (!sessionRes.success || !sessionRes.payment_session_id) {
            setIsProcessingPayment(false);
            const err = sessionRes.error || 'Failed to initialize Cashfree payment session.';
            setPaymentError(err);
            showToast(err);
            return;
          }

          if (sessionRes.total_amount) {
            setFinalPaidAmount(sessionRes.total_amount);
          }

          setPaymentStatusText('Launching Cashfree hosted checkout...');

          // Update saved delivery address in customer profile
          updateCustomerAddress({
            address: formData.address,
            apartment: formData.apartment,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
          }).catch(() => {});

          const launchRes = await launchCashfreeCheckout({
            paymentSessionId: sessionRes.payment_session_id,
            environment: sessionRes.environment,
            redirectTarget: '_modal',
          });

          // User closed/cancelled the modal without paying
          if (launchRes.cancelled) {
            setIsProcessingPayment(false);
            setPaymentStatusText('');
            showToast('Payment cancelled. Your bag is still saved — try again when ready.');
            return;
          }

          if (launchRes.error) {
            setIsProcessingPayment(false);
            setPaymentError(launchRes.error);
            showToast(launchRes.error);
            return;
          }

          // Payment modal closed — verify with server
          setPaymentStatusText('Verifying payment with Cashfree...');
          try {
            const verifyRes = await verifyCashfreePayment(sessionRes.order_id!);
            if (verifyRes.verified && (verifyRes.payment_status === 'SUCCESS' || verifyRes.payment_status === 'paid')) {
              setIsProcessingPayment(false);
              setOrderNumber(sessionRes.order_number!);
              setFinalPaidAmount(sessionRes.total_amount || verifyRes.order?.total_amount || total);
              clearCart();
              goToStep(4);
              try {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#ffffff', '#d4af37', '#e2e8f0'] });
              } catch {}
            } else {
              setIsProcessingPayment(false);
              const status = verifyRes.payment_status || 'UNKNOWN';
              setPaymentError(`Payment status: ${status}. If amount was debited, contact support.`);
              showToast(`Payment not confirmed (Status: ${status}). Please retry or contact support.`);
            }
          } catch {
            // If verification fails, redirect to return page as fallback
            setIsProcessingPayment(false);
            window.location.href = `https://zarb.shop/payment-return?order_id=${sessionRes.order_id}`;
          }
          return;
        } catch (err: any) {
          setIsProcessingPayment(false);
          const msg = err?.message || 'Payment initiation failed. Please try again.';
          setPaymentError(msg);
          showToast(msg);
          return;
        }
      }

      // B. Concierge Cash on Delivery (COD)
      if (formData.paymentMethod === 'cod') {
        setIsProcessingPayment(true);
        setPaymentStatusText('Recording Concierge COD order...');

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

        const shippingCost = calculateShippingCost(cartSubtotal);
        const orderTotal = cartSubtotal + shippingCost;

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
          payment_method: 'Concierge COD',
          payment_status: 'pending',
          order_status: 'confirmed',
          status_history: [
            {
              status: 'confirmed',
              timestamp: new Date().toISOString(),
              note: 'Order placed via Concierge Cash on Delivery.',
              updatedBy: 'Customer Checkout',
            },
          ],
        });

        updateCustomerAddress({
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        }).catch(() => {});

        setFinalPaidAmount(orderTotal);
        setIsProcessingPayment(false);
        goToStep(4);
        clearCart();

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffffff', '#d4af37', '#e2e8f0'],
          });
        } catch {}
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

  const shippingCost = calculateShippingCost(cartSubtotal, shippingConfig);
  const shippingLabel = getShippingLabel(cartSubtotal, shippingConfig);
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

      <div className={`relative w-full max-w-4xl sm:rounded-2xl z-10 shadow-2xl overflow-hidden my-auto min-h-screen sm:min-h-0 flex flex-col animate-fade-in ${
        isAlabaster
          ? 'bg-[#faf9f5] border border-stone-300/80 text-stone-900 shadow-stone-900/15'
          : 'bg-[#0e0e11] border border-white/10 text-stone-200'
      }`}>
        {/* Checkout Header */}
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between ${
          isAlabaster ? 'bg-[#f4f2eb] border-stone-300/80' : 'bg-[#0a0a0c] border-white/10'
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <span className={`font-brand text-sm sm:text-base tracking-[0.25em] shrink-0 ${
              isAlabaster ? 'text-stone-950 font-bold' : 'text-white'
            }`}>
              ZARB
            </span>
            <span className={`text-xs shrink-0 ${isAlabaster ? 'text-stone-400' : 'text-stone-600'}`}>|</span>
            <span className={`text-[11px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase truncate ${
              isAlabaster ? 'text-stone-600' : 'text-stone-400'
            }`}>
              {user ? (
                <>
                  <span className="hidden sm:inline">Distraction-Free </span>Haute Checkout
                </>
              ) : (
                'Authentication Gate'
              )}
            </span>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className={`flex items-center space-x-1 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] ${
              isAlabaster ? 'text-emerald-700' : 'text-emerald-400'
            }`}>
              <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{user ? 'Encrypted' : 'Security'}</span>
            </div>
            {step !== 4 && (
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className={`p-1 sm:p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isAlabaster
                    ? 'text-stone-500 hover:text-black hover:bg-stone-200/60'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
                aria-label="Close Checkout"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
            {/* 4-Step Interactive Progress Indicator */}
            <div className={`px-2.5 sm:px-6 py-2.5 sm:py-3 border-b select-none overflow-x-auto no-scrollbar ${
              isAlabaster ? 'bg-[#f4f2eb]/70 border-stone-300/80' : 'bg-white/[0.02] border-white/5'
            }`}>
              <nav aria-label="Checkout Steps" className="flex items-center justify-between max-w-md mx-auto text-[10px] sm:text-xs tracking-[0.08em] sm:tracking-[0.15em] uppercase whitespace-nowrap">
                {[
                  { id: 1 as const, name: 'Contact', mobileName: 'Contact' },
                  { id: 2 as const, name: 'Delivery', mobileName: 'Delivery' },
                  { id: 3 as const, name: 'Payment', mobileName: 'Payment' },
                  { id: 4 as const, name: 'Confirmation', mobileName: 'Confirm' },
                ].map((s, index) => {
                  const isActive = step === s.id;
                  const canClick = canNavigateToStep(s.id);

                  return (
                    <React.Fragment key={s.id}>
                      {index > 0 && (
                        <span
                          className={`px-1 sm:px-1.5 text-[9px] sm:text-[11px] select-none transition-colors ${
                            step >= s.id
                              ? isAlabaster ? 'text-stone-500' : 'text-stone-400'
                              : isAlabaster ? 'text-stone-300' : 'text-stone-700'
                          }`}
                          aria-hidden="true"
                        >
                          &rarr;
                        </span>
                      )}

                      {canClick ? (
                        <button
                          type="button"
                          onClick={() => handleStepClick(s.id)}
                          title={s.id < step ? `Click to edit ${s.name}` : `Return to ${s.name}`}
                          aria-label={`${s.id}. ${s.name} - click to go to this step`}
                          className={`bg-transparent border-0 p-0 font-medium cursor-pointer transition-all duration-150 uppercase whitespace-nowrap inline-flex items-center ${
                            isAlabaster
                              ? 'text-stone-600 hover:text-black hover:underline underline-offset-4 decoration-amber-600 focus:text-black'
                              : 'text-stone-300 hover:text-white hover:underline underline-offset-4 decoration-amber-400/80 focus:text-white'
                          }`}
                        >
                          <span>{s.id}.&nbsp;</span>
                          <span className="hidden sm:inline">{s.name}</span>
                          <span className="sm:hidden">{s.mobileName}</span>
                        </button>
                      ) : (
                        <span
                          aria-current={isActive ? 'step' : undefined}
                          className={`uppercase whitespace-nowrap inline-flex items-center transition-colors ${
                            isActive
                              ? s.id === 4
                                ? isAlabaster
                                  ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600 pb-0.5'
                                  : 'text-emerald-400 font-semibold border-b-2 border-emerald-400/90 pb-0.5'
                                : isAlabaster
                                  ? 'text-stone-950 font-semibold border-b-2 border-amber-600 pb-0.5'
                                  : 'text-white font-semibold border-b-2 border-amber-400/90 pb-0.5'
                              : isAlabaster
                                ? 'text-stone-400 cursor-default'
                                : 'text-stone-600 cursor-default'
                          }`}
                        >
                          <span>{s.id}.&nbsp;</span>
                          <span className="hidden sm:inline">{s.name}</span>
                          <span className="sm:hidden">{s.mobileName}</span>
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
              {step === 1 && (
                <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-xl font-serif text-white tracking-[0.03em] mb-1">
                      Contact Information
                    </h3>
                    <p className="text-xs text-stone-400">
                      We'll send your order confirmation and tracking updates here.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none placeholder:text-stone-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                        Phone Number
                      </label>
                      <div className="flex items-center space-x-2">
                        {/* Country Code Badge (+91) */}
                        <div className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-3 text-sm font-mono select-none shrink-0 shadow-inner ${
                          isAlabaster
                            ? 'bg-white border border-stone-300 text-stone-900'
                            : 'bg-white/[0.08] border border-white/20 text-stone-200'
                        }`}>
                          <span className="text-base leading-none">🇮🇳</span>
                          <span className={`font-semibold tracking-wider ${isAlabaster ? 'text-stone-900' : 'text-white'}`}>+91</span>
                        </div>

                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone.replace(/^\+91\s*/, '')}
                          onChange={(e) => {
                            const cleanDigits = e.target.value.replace(/^\+91\s*/, '').replace(/[^\d\s-]/g, '');
                            setFormData({ ...formData, phone: cleanDigits });
                          }}
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none tracking-wider font-mono placeholder:text-stone-500"
                          placeholder="Enter 10-digit mobile number"
                          maxLength={15}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-white hover:bg-stone-200 active:scale-[0.98] text-black py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs tracking-[0.08em] sm:tracking-[0.15em] uppercase font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xl shadow-black/30 group"
                  >
                    <span className="whitespace-nowrap">
                      <span className="hidden sm:inline">CONTINUE TO DELIVERY DETAILS</span>
                      <span className="sm:hidden">CONTINUE TO DELIVERY</span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-black transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              )}

          {step === 2 && (
            <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif text-white tracking-[0.03em] mb-1">
                    Delivery Address
                  </h3>
                  <p className="text-xs text-stone-400">
                    Please provide your shipping and delivery address.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-stone-400 hover:text-white flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* 1. Enter PIN Code with Check Button on Top */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2">
                <label className="block text-xs uppercase tracking-[0.15em] text-stone-300">
                  PIN Code
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    name="postalCode"
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFormData({ ...formData, postalCode: clean });
                      if (pincodeStatus) setPincodeStatus(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckPincode();
                      }
                    }}
                    placeholder="Enter 6-digit PIN code"
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none tracking-widest font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-stone-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckPincode()}
                    disabled={isCheckingPincode || formData.postalCode.replace(/\D/g, '').length !== 6}
                    className="px-5 py-3 rounded-xl bg-white hover:bg-stone-200 text-black font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95 flex items-center space-x-1.5"
                  >
                    {isCheckingPincode ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <span>Check</span>
                    )}
                  </button>
                </div>

                {pincodeStatus && (
                  <div className={`pt-1 flex items-center space-x-1.5 text-xs font-mono ${
                    pincodeStatus.type === 'success' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {pincodeStatus.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{pincodeStatus.message}</span>
                  </div>
                )}
              </div>

              {/* 2. Recipient Name */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
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
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Address fields - fully editable, no '(optional)' labels */}
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                  Flat, House No., Building, Apartment
                </label>
                <input
                  type="text"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleChange}
                  placeholder="e.g. Penthouse 12B, Villa 4, Tower 2"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none placeholder:text-stone-600"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                  Street Address, Area, Landmark
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. 42, Altamount Road, Cumballa Hill"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none placeholder:text-stone-600"
                />
              </div>

              {/* 4. City & State (pre-filled by PIN check, fully editable) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City / District"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-stone-300 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shipping Method Option */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-medium text-white block uppercase tracking-[0.1em] text-emerald-400">
                      Delivery
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {shippingLabel}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase text-emerald-400">
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost.toLocaleString('en-IN')}`}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-stone-200 active:scale-[0.98] text-black py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs tracking-[0.08em] sm:tracking-[0.15em] uppercase font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xl shadow-black/30 group"
              >
                <span className="whitespace-nowrap">PROCEED TO PAYMENT</span>
                <ArrowRight className="w-4 h-4 shrink-0 text-black transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif text-white tracking-[0.03em] mb-1">
                    Select Payment Method
                  </h3>
                  <p className="text-xs text-stone-400">
                    256-bit encrypted bank checkout via Cashfree Payment Gateway (PCI-DSS Level 1 certified).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isProcessingPayment}
                  className="text-xs text-stone-400 hover:text-white flex items-center space-x-1 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Product Review Card - Customer can review products, quantities, variants & address before paying */}
              <div className={`rounded-2xl border overflow-hidden transition-all shadow-lg ${
                isAlabaster
                  ? 'bg-white border-stone-200 shadow-stone-900/5'
                  : 'bg-white/[0.03] border-white/10 shadow-black/20'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(!isReviewOpen)}
                  className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors cursor-pointer text-left select-none ${
                    isAlabaster ? 'hover:bg-stone-50' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs uppercase tracking-[0.15em] font-medium text-white">
                          Review Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
                          Tap to {isReviewOpen ? 'collapse' : 'view'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate max-w-[220px] sm:max-w-xs">
                        {cart.map((it) => it.name).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 pl-2">
                    <span className="text-xs font-mono font-medium text-stone-200">
                      {formatPrice(cartSubtotal)}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                        isReviewOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isReviewOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3 animate-fade-in">
                    {/* Item list */}
                    <div className="max-h-56 overflow-y-auto space-y-3 pr-1 divide-y divide-white/5">
                      {cart.map((item, idx) => (
                        <div
                          key={`${item.id || item.productId}-${item.size}-${item.color}-${idx}`}
                          className={`flex items-center justify-between gap-3 ${idx > 0 ? 'pt-3' : ''}`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg object-cover bg-stone-900 border border-white/10 shrink-0"
                            />
                            <div className="min-w-0 space-y-1">
                              <h4 className="text-xs sm:text-sm font-serif text-white truncate font-medium">
                                {item.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-stone-400">
                                {item.size && (
                                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                    Size: {item.size}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                    {item.color}
                                  </span>
                                )}
                                <span className="text-stone-500">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-mono font-medium text-stone-200 block">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] font-mono text-stone-500 block">
                                {formatPrice(item.price)} each
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping destination summary snapshot */}
                    <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-stone-400">
                      <div className="flex items-center space-x-1.5 min-w-0 truncate">
                        <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Shipping to:{' '}
                          <strong className="text-stone-300 font-normal">
                            {formData.city || formData.state ? `${formData.city ? `${formData.city}, ` : ''}${formData.state}` : 'Selected destination'}
                            {formData.postalCode ? ` (${formData.postalCode})` : ''}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-amber-400 hover:text-amber-300 hover:underline cursor-pointer text-[10px] uppercase tracking-wider shrink-0 pl-2 font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-3">
                {/* 1. Cashfree Payment Gateway (Online) */}
                <div
                  onClick={() => !isProcessingPayment && setFormData({ ...formData, paymentMethod: 'cashfree' })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    formData.paymentMethod === 'cashfree' || formData.paymentMethod === 'card' || formData.paymentMethod === 'upi'
                      ? 'border-amber-400/80 bg-gradient-to-br from-white/[0.07] to-white/[0.02] shadow-lg shadow-black/40'
                      : 'border-white/10 hover:border-white/25 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-white tracking-wide">
                            Instant Online Payment
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Pay instantly via Google Pay, PhonePe, Paytm, BHIM, Credit/Debit Cards, or NetBanking.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      formData.paymentMethod === 'cashfree' || formData.paymentMethod === 'card' || formData.paymentMethod === 'upi'
                        ? 'border-amber-400 bg-amber-400 text-black'
                        : 'border-white/30'
                    }`}>
                      {(formData.paymentMethod === 'cashfree' || formData.paymentMethod === 'card' || formData.paymentMethod === 'upi') && (
                        <div className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                  </div>

                  {/* Payment Badges Strip */}
                  <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono text-stone-400">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-stone-300">UPI Apps</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-stone-300">Cards / RuPay</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-stone-300">NetBanking</span>
                    </div>
                    <span className="text-[10px] text-stone-500 flex items-center space-x-1 shrink-0 pt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Cashfree</span>
                    </span>
                  </div>
                </div>

                {/* 2. Concierge Cash on Delivery */}
                <div
                  onClick={() => !isProcessingPayment && setFormData({ ...formData, paymentMethod: 'cod' })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    formData.paymentMethod === 'cod'
                      ? 'border-amber-400/80 bg-gradient-to-br from-white/[0.07] to-white/[0.02] shadow-lg shadow-black/40'
                      : 'border-white/10 hover:border-white/25 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-stone-300 shrink-0 mt-0.5">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-white tracking-wide block">
                          Concierge Cash on Delivery
                        </span>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          White-glove concierge delivery with cash or mobile card terminal payment on signature.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      formData.paymentMethod === 'cod'
                        ? 'border-amber-400 bg-amber-400 text-black'
                        : 'border-white/30'
                    }`}>
                      {formData.paymentMethod === 'cod' && (
                        <div className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Notice if payment fails */}
              {paymentError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start space-x-2.5 text-xs animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="font-semibold block text-rose-200">Payment Notice:</span>
                    <span>{paymentError}</span>
                  </div>
                </div>
              )}

              {/* Summary of Total & Shipping Breakdown */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-stone-400">
                  <span>Bag Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'})</span>
                  <span className="text-stone-200 font-mono">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-400">
                  <span className="truncate pr-2">Delivery ({shippingLabel})</span>
                  <span className="shrink-0 font-mono">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-400 uppercase tracking-wider text-[11px] font-medium font-sans">Complimentary</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                  <span className="uppercase tracking-[0.15em] text-white font-medium">Amount Due</span>
                  <span className="text-xl font-medium text-amber-400 font-mono">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full bg-white hover:bg-stone-200 active:scale-[0.98] text-black py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs tracking-[0.08em] sm:tracking-[0.15em] uppercase font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xl shadow-black/30 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 text-black animate-spin shrink-0" />
                    <span className="whitespace-nowrap">{paymentStatusText || 'CONNECTING TO CASHFREE...'}</span>
                  </div>
                ) : formData.paymentMethod === 'cod' ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Banknote className="w-4 h-4 shrink-0 text-black" />
                    <span className="whitespace-nowrap">
                      <span className="hidden sm:inline">CONFIRM & PLACE CONCIERGE COD ORDER</span>
                      <span className="sm:hidden">CONFIRM COD ORDER ({formatPrice(total)})</span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-black transition-transform group-hover:translate-x-0.5" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-black" />
                    <span className="whitespace-nowrap">
                      <span className="hidden sm:inline">PROCEED TO CASHFREE SECURE PAYMENT</span>
                      <span className="sm:hidden">PAY {formatPrice(total)} SECURELY</span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-black transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
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
                  <span className="text-white font-medium">{formatPrice(finalPaidAmount || total)}</span>
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
    </div>
  );
};
