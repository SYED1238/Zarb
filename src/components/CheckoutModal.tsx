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
  Plus,
  Edit3,
  Trash2,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getSavedAddress,
  saveAddressToStorage,
  type CustomerAddress,
} from '../utils/geolocation';
import { createCashfreeOrderSession, launchCashfreeCheckout, verifyCashfreePayment } from '../services/cashfreeService';
import { useShippingConfig, calculateShippingCost, getShippingLabel } from '../utils/shippingConfig';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cartSubtotal,
    clearCart,
    cart,
    showToast,
    appliedCoupon,
    discountAmount,
    discountPercent,
  } = useStore();
  const {
    user,
    saveOrder,
    signInWithGoogle,
    setIsAccountDrawerOpen,
    savedAddress,
    savedAddresses,
    updateCustomerAddress,
    addCustomerAddress,
    updateCustomerAddressItem,
    deleteCustomerAddress,
    setDefaultAddress,
  } = useAuth();
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

  // Saved Address selection & In-checkout Management State
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [isManageAddressesOpen, setIsManageAddressesOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddingNewInManager, setIsAddingNewInManager] = useState(false);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [managerForm, setManagerForm] = useState({
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
  const [isManagerCheckingPin, setIsManagerCheckingPin] = useState(false);
  const [managerPinStatus, setManagerPinStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  useEffect(() => {
    if (!isCheckoutOpen || isProcessingPayment) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setStep(1);
        setMaxVisitedStep(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, isProcessingPayment, setIsCheckoutOpen]);

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

  // Reset step tracking and auth state when checkout modal closes or user changes
  useEffect(() => {
    setIsSigningIn(false);
    if (!isCheckoutOpen) {
      setStep(1);
      setMaxVisitedStep(1);
    }
  }, [isCheckoutOpen, user]);

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

  const applyAddressToForm = (addr: CustomerAddress) => {
    const parts = addr.recipientName ? addr.recipientName.split(' ') : [];
    setFormData((prev) => ({
      ...prev,
      firstName: parts[0] || (user?.fullName ? user.fullName.split(' ')[0] : prev.firstName),
      lastName: parts.slice(1).join(' ') || (user?.fullName ? user.fullName.split(' ').slice(1).join(' ') : prev.lastName),
      phone: addr.phone || prev.phone,
      address: addr.address || '',
      apartment: addr.apartment || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'India',
    }));
    setPincodeStatus(null);
  };

  const handleSelectAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    applyAddressToForm(addr);
    showToast(`Applied "${addr.label}" address`);
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setFormData((prev) => ({
      ...prev,
      address: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
    }));
    setPincodeStatus(null);
  };

  // Sync initial default address when savedAddresses loads
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      if (selectedAddressId === 'new' && !formData.address) {
        const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
        if (def) {
          setSelectedAddressId(def.id);
          applyAddressToForm(def);
        }
      }
    }
  }, [savedAddresses]);

  const handleManagerLookupPin = async (pin: string) => {
    const clean = pin.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      setManagerPinStatus({ type: 'error', message: 'Please enter a valid 6-digit PIN code.' });
      return;
    }
    setIsManagerCheckingPin(true);
    setManagerPinStatus(null);
    try {
      const postOfficePromise = fetch(`https://api.postalpincode.in/pincode/${clean}`)
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

      const zippoPromise = fetch(`https://api.zippopotam.us/in/${clean}`)
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
        setManagerForm((prev) => ({
          ...prev,
          postalCode: clean,
          city: result.city || prev.city,
          state: result.state || prev.state,
        }));
        setManagerPinStatus({
          type: 'success',
          message: `Verified: ${result.city ? `${result.city}, ` : ''}${result.state}`,
        });
        showToast(`PIN Code verified: ${result.city || result.state}`);
      }
    } catch {
      setManagerPinStatus({
        type: 'error',
        message: 'Could not auto-detect location. Please enter city and state below.',
      });
    } finally {
      setIsManagerCheckingPin(false);
    }
  };

  const handleSaveManagerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = managerForm.postalCode.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      showToast('Please enter a valid 6-digit PIN code.');
      return;
    }
    if (!managerForm.address.trim()) {
      showToast('Street address is required.');
      return;
    }
    if (!managerForm.city.trim()) {
      showToast('City is required.');
      return;
    }

    try {
      if (editingAddressId) {
        await updateCustomerAddressItem(editingAddressId, {
          label: managerForm.label,
          recipientName: managerForm.recipientName.trim() || undefined,
          phone: managerForm.phone.trim() || undefined,
          address: managerForm.address.trim(),
          apartment: managerForm.apartment.trim() || undefined,
          city: managerForm.city.trim(),
          state: managerForm.state.trim(),
          postalCode: cleanPin,
          country: managerForm.country.trim() || 'India',
          isDefault: managerForm.isDefault,
        });
        showToast('Address updated.');
        if (selectedAddressId === editingAddressId) {
          applyAddressToForm({
            id: editingAddressId,
            label: managerForm.label,
            recipientName: managerForm.recipientName.trim() || undefined,
            phone: managerForm.phone.trim() || undefined,
            address: managerForm.address.trim(),
            apartment: managerForm.apartment.trim() || undefined,
            city: managerForm.city.trim(),
            state: managerForm.state.trim(),
            postalCode: cleanPin,
            country: managerForm.country.trim() || 'India',
            isDefault: managerForm.isDefault,
          });
        }
      } else {
        const added = await addCustomerAddress({
          label: managerForm.label,
          recipientName: managerForm.recipientName.trim() || undefined,
          phone: managerForm.phone.trim() || undefined,
          address: managerForm.address.trim(),
          apartment: managerForm.apartment.trim() || undefined,
          city: managerForm.city.trim(),
          state: managerForm.state.trim(),
          postalCode: cleanPin,
          country: managerForm.country.trim() || 'India',
          isDefault: managerForm.isDefault || savedAddresses.length === 0,
        });
        setSelectedAddressId(added.id);
        applyAddressToForm(added);
        showToast('New address added.');
      }
      setEditingAddressId(null);
      setIsAddingNewInManager(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save address.');
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

    // Automatic safety reset if redirect takes longer than 6 seconds or user cancels/presses back
    const timer = setTimeout(() => {
      setIsSigningIn(false);
    }, 6000);

    try {
      const res = await signInWithGoogle();
      if (res.error) {
        clearTimeout(timer);
        showToast(res.error);
        setIsSigningIn(false);
      }
    } catch (err: any) {
      clearTimeout(timer);
      setIsSigningIn(false);
      showToast(err?.message || 'Authentication error.');
    }
  };

  if (!isCheckoutOpen) return null;

  const totalPieces = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const ONLINE_DISCOUNT_PER_PIECE = 15;
  const isOnlinePayment =
    formData.paymentMethod === 'cashfree' ||
    formData.paymentMethod === 'card' ||
    formData.paymentMethod === 'upi';
  const onlineDiscountAmount = isOnlinePayment ? totalPieces * ONLINE_DISCOUNT_PER_PIECE : 0;

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
      if (!formData.firstName.trim()) {
        showToast('Please enter your first name.');
        return;
      }
      if (!formData.address.trim()) {
        showToast('Please enter your street address.');
        return;
      }
      if (!formData.city.trim() || !formData.state.trim()) {
        showToast('Please enter city and state.');
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

      // Save / update in user profile if logged in
      if (user) {
        if (selectedAddressId === 'new' && saveToAccount) {
          addCustomerAddress({
            label: 'Home',
            recipientName: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.phone,
            address: formData.address,
            apartment: formData.apartment,
            city: formData.city,
            state: formData.state,
            postalCode: cleanPin,
            country: formData.country,
            isDefault: savedAddresses.length === 0,
          }).catch(() => {});
        } else if (selectedAddressId !== 'new') {
          updateCustomerAddressItem(selectedAddressId, {
            recipientName: `${formData.firstName} ${formData.lastName}`.trim(),
            address: formData.address,
            apartment: formData.apartment,
            city: formData.city,
            state: formData.state,
            postalCode: cleanPin,
            country: formData.country,
          }).catch(() => {});
        }
      }

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
            couponCode: appliedCoupon?.code,
            onlineDiscount: onlineDiscountAmount,
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

      // B. Cash on Delivery (COD)
      if (formData.paymentMethod === 'cod') {
        setIsProcessingPayment(true);
        setPaymentStatusText('Recording Cash on Delivery order...');

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

        const shippingCost = calculateShippingCost(cartSubtotal, shippingConfig);
        const orderTotal = Math.max(0, cartSubtotal - discountAmount + shippingCost);

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
          discount_amount: discountAmount,
          coupon_code: appliedCoupon?.code || '',
          total_amount: orderTotal,
          payment_method: 'Cash on Delivery',
          payment_status: 'pending',
          order_status: 'confirmed',
          status_history: [
            {
              status: 'confirmed',
              timestamp: new Date().toISOString(),
              note: 'Order placed via Cash on Delivery.',
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
  const total = Math.max(0, cartSubtotal - discountAmount - onlineDiscountAmount + shippingCost);

  return (
    <div
      id="checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => step !== 4 && setIsCheckoutOpen(false)}
      />

      <div className="relative w-full max-w-2xl sm:rounded-3xl z-10 shadow-2xl overflow-hidden my-auto min-h-screen sm:min-h-0 flex flex-col animate-fade-in bg-[#faf9f6] border border-stone-200/80 text-stone-900">
        {/* Checkout Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-stone-200/80 bg-[#f4f2eb] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <span className="font-brand text-base tracking-[0.25em] shrink-0 text-stone-950 font-bold">
              ZARB
            </span>
            <span className="text-xs shrink-0 text-stone-400">|</span>
            <span className="text-[11px] sm:text-xs tracking-[0.18em] uppercase truncate text-stone-600 font-medium">
              {user ? 'Haute Checkout' : 'Authentication Gate'}
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-1.5 text-[11px] uppercase tracking-[0.15em] text-emerald-700 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>{user ? 'Encrypted' : 'Security'}</span>
            </div>
            {step !== 4 && (
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl cursor-pointer text-stone-500 hover:text-black hover:bg-stone-200/60 transition-colors"
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
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xl">
                <Lock className="w-9 h-9 stroke-[1.5]" />
              </div>
              <div className="absolute -inset-2 bg-amber-500/10 rounded-3xl blur-xl -z-10" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-700 block mb-2 font-semibold">
                Sign In Required
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-wide font-bold">
                Sign In to Complete Your Order
              </h2>
              <p className="text-sm text-stone-600 font-normal mt-2.5 leading-relaxed max-w-md mx-auto">
                Please sign in with your Google account to proceed with your order, receive digital receipts, and track your delivery in real time.
              </p>
            </div>

            {/* Value Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
                <div className="text-amber-700 text-xs font-mono font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Order History</span>
                </div>
                <p className="text-xs text-stone-600 font-light leading-snug">
                  Digital receipts and order records safely saved to your account.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
                <div className="text-emerald-700 text-xs font-mono font-semibold flex items-center space-x-1.5">
                  <Truck className="w-4 h-4" />
                  <span>Live Tracking</span>
                </div>
                <p className="text-xs text-stone-600 font-light leading-snug">
                  Real-time delivery updates and courier tracking notifications.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1">
                <div className="text-blue-700 text-xs font-mono font-semibold flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Authentic Quality</span>
                </div>
                <p className="text-xs text-stone-600 font-light leading-snug">
                  Official guarantee of authenticity included with every piece.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-2 max-w-sm mx-auto">
              <div className="relative group">
                {/* Ambient dynamic glowing aura behind button */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-amber-500/25 blur-md opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="auth-google-btn relative w-full py-4 px-6 rounded-2xl flex items-center justify-center space-x-3.5 shadow-xl transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98] hover:-translate-y-0.5 border border-stone-300/80 bg-white"
                >
                  {isSigningIn ? (
                    <div className="flex items-center space-x-2.5 text-stone-900">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
                      <span className="text-sm font-semibold tracking-wide text-stone-900">
                        Connecting to Google...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Official Google Icon Badge */}
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs border border-stone-200/80 p-0.5">
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
                      </div>
                      <span className="text-sm font-semibold tracking-wide text-stone-900">
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
                  className="text-[11px] text-amber-800 hover:text-amber-950 underline transition-colors cursor-pointer font-medium block mx-auto text-center"
                >
                  Cancel / Tap to retry
                </button>
              )}

              {/* Security Trust Micro-Badge */}
              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-stone-500 font-sans tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Fast 1-Click Authentication &middot; SSL 256-Bit Encrypted</span>
              </div>

              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-xs text-stone-500 hover:text-stone-900 transition-colors pt-1 block mx-auto cursor-pointer font-medium hover:underline"
              >
                Return to Boutique
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 4-Step Interactive Progress Indicator */}
            <div className="px-4 sm:px-7 py-3 border-b border-stone-200 bg-white/70 select-none overflow-x-auto no-scrollbar">
              <nav aria-label="Checkout Steps" className="flex items-center justify-between max-w-md mx-auto text-[10px] sm:text-xs tracking-[0.12em] uppercase whitespace-nowrap font-medium">
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
                            step >= s.id ? 'text-stone-500' : 'text-stone-300'
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
                          className="bg-transparent border-0 p-0 font-medium cursor-pointer transition-all duration-150 uppercase whitespace-nowrap inline-flex items-center text-stone-600 hover:text-black hover:underline underline-offset-4 decoration-black"
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
                              ? 'text-stone-950 font-bold border-b-2 border-black pb-0.5'
                              : 'text-stone-400 cursor-default'
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
            <div className="p-4 sm:p-7 flex-1 overflow-y-auto bg-[#faf9f6]">
              {step === 1 && (
                <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-xl font-serif text-stone-900 tracking-[0.02em] font-bold mb-1">
                      Contact Information
                    </h3>
                    <p className="text-xs text-stone-500">
                      We'll send your order confirmation and tracking updates here.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none placeholder:text-stone-400 transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                        Phone Number
                      </label>
                      <div className="flex items-center space-x-2">
                        {/* Country Code Badge (+91) */}
                        <div className="flex items-center space-x-1.5 rounded-xl px-3.5 py-3.5 text-sm font-mono select-none shrink-0 bg-stone-100 border border-stone-200 text-stone-900 shadow-inner">
                          <span className="text-base leading-none">🇮🇳</span>
                          <span className="font-semibold tracking-wider text-stone-900">+91</span>
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
                          className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none tracking-wider font-mono placeholder:text-stone-400 transition-colors"
                          placeholder="Enter 10-digit mobile number"
                          maxLength={15}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white py-4 px-6 rounded-2xl text-xs tracking-[0.15em] uppercase font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-black/10 group"
                  >
                    <span className="whitespace-nowrap">CONTINUE TO DELIVERY DETAILS</span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-white transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              )}

          {step === 2 && (
            <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-4">
              {/* Back / Title / Manage Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 flex items-center space-x-1 cursor-pointer transition-colors text-xs font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                {/* Manage Addresses Trigger Button */}
                {user && savedAddresses && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId(null);
                      setIsAddingNewInManager(false);
                      setIsManageAddressesOpen(true);
                    }}
                    className="text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-black transition-colors underline underline-offset-4 cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Manage Addresses</span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-full font-mono">
                      {savedAddresses.length}
                    </span>
                  </button>
                )}
              </div>

              {/* Saved Addresses 1-Tap Switcher Chips (when addresses exist) */}
              {user && savedAddresses && savedAddresses.length > 0 && (
                <div className="space-y-1.5 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-stone-500 font-semibold">
                      SAVED ADDRESSES
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectAddress(addr)}
                          className={`checkout-addr-chip px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                            isSelected
                              ? 'checkout-addr-chip-active bg-black text-white border-black shadow-sm font-semibold'
                              : 'checkout-addr-chip-inactive bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          <span className={isSelected ? 'text-white font-semibold' : 'text-stone-700'}>{addr.label || 'Home'}</span>
                          {addr.isDefault && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                              isSelected ? 'bg-white/25 text-white font-semibold' : 'bg-stone-100 text-stone-500'
                            }`}>
                              Default
                            </span>
                          )}
                          {isSelected && <Check className="w-3 h-3 ml-0.5 text-white" />}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={handleSelectNewAddress}
                      className={`checkout-addr-chip px-3.5 py-2 rounded-xl border text-xs font-medium transition-all shrink-0 flex items-center space-x-1 cursor-pointer ${
                        selectedAddressId === 'new'
                          ? 'checkout-addr-chip-active bg-black text-white border-black shadow-sm font-semibold'
                          : 'checkout-addr-chip-inactive bg-white border-dashed border-stone-300 text-stone-600 hover:border-stone-500 hover:text-black'
                      }`}
                    >
                      <Plus className={`w-3.5 h-3.5 ${selectedAddressId === 'new' ? 'text-white' : 'text-stone-600'}`} />
                      <span className={selectedAddressId === 'new' ? 'text-white font-semibold' : 'text-stone-600'}>New Address</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 1. PIN CODE Card (Matches Screenshot EXACTLY) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  PIN CODE
                </label>
                <div className="flex items-center space-x-2.5">
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
                    placeholder="571511"
                    className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckPincode()}
                    disabled={isCheckingPincode || formData.postalCode.replace(/\D/g, '').length !== 6}
                    className="checkout-pincode-btn px-6 py-3.5 rounded-xl bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95 flex items-center space-x-1.5 shadow-sm"
                  >
                    {isCheckingPincode ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span className="text-white font-bold">CHECKING...</span>
                      </>
                    ) : (
                      <span className="text-white font-bold">CHECK</span>
                    )}
                  </button>
                </div>

                {pincodeStatus && (
                  <div className={`pt-1 flex items-center space-x-1.5 text-xs ${
                    pincodeStatus.type === 'success' ? 'text-emerald-600 font-medium' : 'text-amber-600'
                  }`}>
                    {pincodeStatus.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    )}
                    <span>{pincodeStatus.message}</span>
                  </div>
                )}
              </div>

              {/* 2. FIRST NAME & LAST NAME (Matches Screenshot EXACTLY) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                    FIRST NAME
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Syed"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                    LAST NAME
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Hamza"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 3. FLAT, HOUSE NO., BUILDING, APARTMENT (Matches Screenshot EXACTLY) */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                  FLAT, HOUSE NO., BUILDING, APARTMENT
                </label>
                <input
                  type="text"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleChange}
                  placeholder="e.g. Penthouse 12B, Villa 4, Tower 2"
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none transition-colors"
                />
              </div>

              {/* 4. STREET ADDRESS, AREA, LANDMARK (Matches Screenshot EXACTLY) */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                  STREET ADDRESS, AREA, LANDMARK
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ramanagara, Ramanagara taluk"
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none transition-colors"
                />
              </div>

              {/* 5. CITY & STATE (Matches Screenshot EXACTLY) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                    CITY
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Ramanagara"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 mb-1.5">
                    STATE
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Karnataka"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 6. DELIVERY Card (Matches Screenshot EXACTLY) */}
              <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="text-emerald-500 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block uppercase tracking-[0.12em]">
                      DELIVERY
                    </span>
                    <span className="text-[12px] text-stone-400 font-normal">
                      Complimentary White-Glove Delivery on all orders
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase text-emerald-500 tracking-wider">
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </span>
              </div>

              {/* Save Address Checkbox (when adding new address) */}
              {user && selectedAddressId === 'new' && (
                <label className="flex items-center space-x-2.5 pt-1 px-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveToAccount}
                    onChange={(e) => setSaveToAccount(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 bg-white text-black focus:ring-0 focus:ring-offset-0 cursor-pointer accent-black"
                  />
                  <span className="text-xs text-stone-600 font-medium">
                    Save this address to my account for future orders
                  </span>
                </label>
              )}

              {/* 7. PROCEED TO PAYMENT Button (Matches Screenshot EXACTLY) */}
              <button
                type="submit"
                className="w-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white py-4 px-6 rounded-2xl text-xs tracking-[0.15em] uppercase font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-black/10 group mt-2"
              >
                <span>PROCEED TO PAYMENT</span>
                <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleNext} className="max-w-xl mx-auto space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif text-stone-900 tracking-[0.02em] font-bold mb-1">
                    Select Payment Method
                  </h3>
                  <p className="text-xs text-stone-500">
                    256-bit encrypted bank checkout via Cashfree Payment Gateway (PCI-DSS Level 1 certified).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isProcessingPayment}
                  className="text-xs text-stone-500 hover:text-stone-900 flex items-center space-x-1 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Product Review Card */}
              <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(!isReviewOpen)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer text-left select-none"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs uppercase tracking-[0.15em] font-bold text-stone-900">
                          Review Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                        </span>
                        <span className="text-[10px] text-stone-400 hidden sm:inline font-mono">
                          Tap to {isReviewOpen ? 'collapse' : 'view'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate max-w-[220px] sm:max-w-xs">
                        {cart.map((it) => it.name).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 pl-2">
                    <span className="text-xs font-mono font-bold text-stone-900">
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
                  <div className="px-4 pb-4 pt-1 border-t border-stone-100 space-y-3 animate-fade-in bg-stone-50/50">
                    {/* Item list */}
                    <div className="max-h-56 overflow-y-auto space-y-3 pr-1 divide-y divide-stone-100">
                      {cart.map((item, idx) => (
                        <div
                          key={`${item.id || item.productId}-${item.size}-${item.color}-${idx}`}
                          className={`flex items-center justify-between gap-3 ${idx > 0 ? 'pt-3' : ''}`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                            />
                            <div className="min-w-0 space-y-1">
                              <h4 className="text-xs sm:text-sm font-serif text-stone-900 truncate font-semibold">
                                {item.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-stone-500">
                                {item.size && (
                                  <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                                    Size: {item.size}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                                    {item.color}
                                  </span>
                                )}
                                <span>
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-mono font-bold text-stone-900 block">
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

                    {/* Shipping destination summary */}
                    <div className="pt-2.5 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-600">
                      <div className="flex items-center space-x-1.5 min-w-0 truncate">
                        <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Shipping to:{' '}
                          <strong className="text-stone-900 font-medium">
                            {formData.city || formData.state ? `${formData.city ? `${formData.city}, ` : ''}${formData.state}` : 'Selected destination'}
                            {formData.postalCode ? ` (${formData.postalCode})` : ''}
                          </strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-stone-900 hover:underline cursor-pointer text-[10px] uppercase tracking-wider shrink-0 pl-2 font-bold"
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative bg-white ${
                    formData.paymentMethod === 'cashfree' || formData.paymentMethod === 'card' || formData.paymentMethod === 'upi'
                      ? 'border-black ring-2 ring-black/10 shadow-md'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 shrink-0 mt-0.5">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-stone-900 tracking-wide">
                            Instant Online Payment
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                            Recommended
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            ₹15 OFF / PIECE
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          Pay instantly via Google Pay, PhonePe, Paytm, BHIM, Credit/Debit Cards, or NetBanking & save ₹15 on every piece.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      formData.paymentMethod === 'cashfree' || formData.paymentMethod === 'card' || formData.paymentMethod === 'upi'
                        ? 'border-black bg-black text-white'
                        : 'border-stone-300'
                    }`}>
                      {(formData.paymentMethod === 'cashfree' || formData.paymentMethod === 'card' || formData.paymentMethod === 'upi') && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Highlight for instant online payment savings */}
                  {(formData.paymentMethod === 'cashfree' || formData.paymentMethod === 'card' || formData.paymentMethod === 'upi') && (
                    <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Instant ₹15 discount applied per piece</span>
                      </span>
                      <span className="font-mono font-bold">-₹{totalPieces * ONLINE_DISCOUNT_PER_PIECE} ({totalPieces} {totalPieces === 1 ? 'piece' : 'pieces'})</span>
                    </div>
                  )}

                  {/* Payment Badges Strip */}
                  <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono text-stone-500">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700">UPI Apps</span>
                      <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700">Cards / RuPay</span>
                      <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700">NetBanking</span>
                    </div>
                    <span className="text-[10px] text-stone-400 flex items-center space-x-1 shrink-0 pt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Cashfree PCI-DSS</span>
                    </span>
                  </div>
                </div>

                {/* 2. Cash on Delivery */}
                <div
                  onClick={() => !isProcessingPayment && setFormData({ ...formData, paymentMethod: 'cod' })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                    formData.paymentMethod === 'cod'
                      ? 'border-black ring-2 ring-black/10 shadow-md'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 shrink-0 mt-0.5">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-stone-900 tracking-wide block">
                          Cash on Delivery
                        </span>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          Pay with cash or UPI upon delivery at your doorstep.
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      formData.paymentMethod === 'cod'
                        ? 'border-black bg-black text-white'
                        : 'border-stone-300'
                    }`}>
                      {formData.paymentMethod === 'cod' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Notice if payment fails */}
              {paymentError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2.5 text-xs animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold block text-rose-900">Payment Notice:</span>
                    <span>{paymentError}</span>
                  </div>
                </div>
              )}

              {/* Summary Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Bag Subtotal ({totalPieces} {totalPieces === 1 ? 'item' : 'items'})</span>
                  <span className="text-stone-900 font-mono font-medium">{formatPrice(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>VIP Privilege ({appliedCoupon?.code || 'Privilege'} &middot; {discountPercent}% off)</span>
                    <span className="font-mono font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                {onlineDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-medium">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Instant Online Payment Discount (₹15 off &times; {totalPieces} {totalPieces === 1 ? 'piece' : 'pieces'})</span>
                    </span>
                    <span className="font-mono font-bold">-{formatPrice(onlineDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-stone-500">
                  <span className="truncate pr-2">Delivery ({shippingLabel})</span>
                  <span className="shrink-0 font-mono font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-600 uppercase tracking-wider text-[11px] font-bold">Complimentary</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-stone-100 flex justify-between items-center">
                  <span className="uppercase tracking-[0.15em] text-stone-900 font-bold text-xs">Amount Due</span>
                  <span className="text-xl font-bold text-stone-950 font-mono">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white py-4 px-6 rounded-2xl text-xs tracking-[0.15em] uppercase font-bold flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
                    <span className="whitespace-nowrap">{paymentStatusText || 'CONNECTING TO CASHFREE...'}</span>
                  </div>
                ) : formData.paymentMethod === 'cod' ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Banknote className="w-4 h-4 shrink-0 text-white" />
                    <span className="whitespace-nowrap">
                      CONFIRM CASH ON DELIVERY ({formatPrice(total)})
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-white transition-transform group-hover:translate-x-1" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-white" />
                    <span className="whitespace-nowrap">
                      PAY {formatPrice(total)} SECURELY
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-white transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="max-w-md mx-auto text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 animate-fade-in">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-stone-500 block mb-1">
                  Zarb Acquisition Confirmed
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-[0.02em] font-bold">
                  THANK YOU, {formData.firstName.toUpperCase()}
                </h3>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-stone-200 text-left space-y-3 text-xs shadow-sm">
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-500 uppercase tracking-wider">Order Reference</span>
                  <span className="font-mono font-bold text-stone-900">{orderNumber}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-500 uppercase tracking-wider">Destination</span>
                  <span className="text-stone-900 font-medium">{formData.city}, {formData.state}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-2">
                  <span className="text-stone-500 uppercase tracking-wider">Dispatch Window</span>
                  <span className="text-emerald-600 font-semibold">24–48 Hours (White-Glove)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-stone-500 uppercase tracking-wider">Total Paid</span>
                  <span className="text-stone-950 font-bold font-mono text-sm">{formatPrice(finalPaidAmount || total)}</span>
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                A formal provenance invoice and live concierge tracking dispatch link have been sent to <strong className="text-stone-900">{formData.email}</strong>.
              </p>

              {/* Order Confirmation Badge */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <span className="text-xs uppercase font-mono tracking-wider text-emerald-800 font-bold block">
                  ✓ Order Confirmed & Recorded
                </span>
                <p className="text-xs text-stone-600">
                  Your order is safely recorded under your account (<strong className="text-stone-900">{user?.email}</strong>).
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
                  className="checkout-secondary-btn w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-semibold tracking-[0.15em] uppercase border border-stone-200 transition-colors cursor-pointer"
                >
                  View in My Orders
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setStep(1);
                  }}
                  className="checkout-primary-btn w-full sm:w-1/2 bg-black text-white hover:bg-stone-800 py-3.5 px-4 rounded-xl text-xs font-semibold tracking-[0.15em] uppercase transition-colors cursor-pointer"
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

      {/* In-Checkout Manage Addresses Modal */}
      {isManageAddressesOpen && (
        <div
          id="checkout-manage-addresses-modal"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsManageAddressesOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-[#faf9f6] rounded-3xl z-10 shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900 tracking-wide">
                  Manage Delivery Addresses
                </h3>
                <p className="text-[11px] text-stone-500">
                  Select, edit, or remove your saved destinations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManageAddressesOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
              {/* If editing or adding an address */}
              {(editingAddressId || isAddingNewInManager) ? (
                <form onSubmit={handleSaveManagerForm} className="space-y-3.5 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      {editingAddressId ? 'Edit Address' : 'Add New Address'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setIsAddingNewInManager(false);
                      }}
                      className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Label chips */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      Address Label
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['Home', 'Work', 'Studio', 'Villa', 'Other'].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setManagerForm({ ...managerForm, label: lbl })}
                          className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                            managerForm.label === lbl
                              ? 'bg-black text-white border-black font-semibold'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PIN Code lookup */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      PIN Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={managerForm.postalCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setManagerForm({ ...managerForm, postalCode: val });
                          if (managerPinStatus) setManagerPinStatus(null);
                          if (val.length === 6) handleManagerLookupPin(val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleManagerLookupPin(managerForm.postalCode);
                          }
                        }}
                        placeholder="6-digit PIN"
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleManagerLookupPin(managerForm.postalCode)}
                        disabled={isManagerCheckingPin || managerForm.postalCode.length !== 6}
                        className="px-3.5 py-2 rounded-xl bg-black text-white font-bold text-xs uppercase cursor-pointer disabled:opacity-40"
                      >
                        {isManagerCheckingPin ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check'}
                      </button>
                    </div>
                    {managerPinStatus && (
                      <div className={`pt-1 flex items-center space-x-1 text-[11px] ${
                        managerPinStatus.type === 'success' ? 'text-emerald-600 font-medium' : 'text-amber-600'
                      }`}>
                        {managerPinStatus.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        )}
                        <span>{managerPinStatus.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Recipient details */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={managerForm.recipientName}
                        onChange={(e) => setManagerForm({ ...managerForm, recipientName: e.target.value })}
                        placeholder="Full Name"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={managerForm.phone}
                        onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                        placeholder="Mobile number"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Flat / Building */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      Flat, House No., Building
                    </label>
                    <input
                      type="text"
                      value={managerForm.apartment}
                      onChange={(e) => setManagerForm({ ...managerForm, apartment: e.target.value })}
                      placeholder="e.g. Penthouse 12B"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                  </div>

                  {/* Street address */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                      Street Address, Area, Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      value={managerForm.address}
                      onChange={(e) => setManagerForm({ ...managerForm, address: e.target.value })}
                      placeholder="e.g. 42, Altamount Road"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={managerForm.city}
                        onChange={(e) => setManagerForm({ ...managerForm, city: e.target.value })}
                        placeholder="City"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={managerForm.state}
                        onChange={(e) => setManagerForm({ ...managerForm, state: e.target.value })}
                        placeholder="State"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Default checkbox */}
                  <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={managerForm.isDefault}
                      onChange={(e) => setManagerForm({ ...managerForm, isDefault: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-stone-300 accent-black cursor-pointer"
                    />
                    <span className="text-[11px] text-stone-600 font-medium">Set as default delivery address</span>
                  </label>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setIsAddingNewInManager(false);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                      Your Addresses ({savedAddresses.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setIsAddingNewInManager(true);
                        setManagerForm({
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
                      }}
                      className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-semibold uppercase tracking-wider flex items-center space-x-1 cursor-pointer hover:bg-stone-800 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {savedAddresses.map((addr) => {
                      const isCurrentlyActive = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          className={`p-3.5 rounded-2xl border transition-all bg-white shadow-sm ${
                            isCurrentlyActive ? 'border-black ring-1 ring-black/10' : 'border-stone-200'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                                {addr.label || 'Home'}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-800 font-bold uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                              {isCurrentlyActive && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider">
                                  Active
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              {!addr.isDefault && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await setDefaultAddress(addr.id);
                                    showToast(`Set "${addr.label}" as default.`);
                                  }}
                                  className="text-[10px] uppercase font-semibold text-stone-500 hover:text-black px-2 py-1 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAddressId(addr.id);
                                  setIsAddingNewInManager(false);
                                  setManagerForm({
                                    label: addr.label || 'Home',
                                    recipientName: addr.recipientName || '',
                                    phone: addr.phone || '',
                                    address: addr.address || '',
                                    apartment: addr.apartment || '',
                                    city: addr.city || '',
                                    state: addr.state || '',
                                    postalCode: addr.postalCode || '',
                                    country: addr.country || 'India',
                                    isDefault: !!addr.isDefault,
                                  });
                                }}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-black hover:bg-stone-100 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteCustomerAddress(addr.id);
                                  if (selectedAddressId === addr.id) {
                                    setSelectedAddressId('new');
                                  }
                                  showToast('Address deleted.');
                                }}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-stone-600 space-y-0.5">
                            {addr.recipientName && (
                              <p className="font-semibold text-stone-900">{addr.recipientName} {addr.phone && `· ${addr.phone}`}</p>
                            )}
                            <p>{addr.address}</p>
                            {addr.apartment && <p>{addr.apartment}</p>}
                            <p className="text-stone-500 font-mono text-[11px]">{addr.city}, {addr.state} — {addr.postalCode}</p>
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-stone-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectAddress(addr);
                                setIsManageAddressesOpen(false);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-black hover:text-white text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Deliver to this address
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-stone-200 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageAddressesOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-black hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
