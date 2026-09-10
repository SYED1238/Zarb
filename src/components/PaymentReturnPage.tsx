import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { verifyCashfreePayment, type CashfreeVerifyResponse } from '../services/cashfreeService';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Lock,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, theme, setIsCheckoutOpen } = useStore();
  const { refreshOrders, setIsAccountDrawerOpen } = useAuth();

  const orderId = searchParams.get('order_id') || searchParams.get('cf_order_id') || '';

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CashfreeVerifyResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setErrorMsg('No order identifier was found in the return link.');
      return;
    }

    let isMounted = true;

    const performVerification = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await verifyCashfreePayment(orderId);
        if (!isMounted) return;

        setResult(res);

        if (res.verified && res.payment_status === 'paid') {
          // Clear cart on verified payment
          clearCart();
          // Refresh user orders in AuthContext
          refreshOrders();

          // Confetti celebration
          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.55 },
              colors: ['#ffffff', '#d4af37', '#e2e8f0', '#38bdf8'],
            });
          } catch {}
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg(err?.message || 'Failed to complete payment verification.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [orderId, clearCart, refreshOrders]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isDark = theme !== 'alabaster';
  const orderData = result?.order;

  return (
    <div
      className={`min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors duration-500 ${
        isDark ? 'bg-[#09090b] text-[#f5f5f3]' : 'bg-[#f6f5f0] text-[#141416]'
      }`}
    >
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 sm:p-10 relative overflow-hidden transition-all duration-300 animate-fade-in ${
          isDark
            ? 'bg-[#0e0e12]/95 border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-2xl'
            : 'bg-white/95 border-stone-200 shadow-[0_25px_70px_rgba(0,0,0,0.1)] backdrop-blur-2xl'
        }`}
      >
        {/* Top Branding Crest */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 border-white/10">
          <div className="flex items-center space-x-2.5">
            <span className="font-brand text-sm tracking-[0.3em] font-semibold text-white">
              ZARB
            </span>
            <span className="text-xs text-stone-500">|</span>
            <span className="text-[11px] font-mono tracking-widest uppercase text-stone-400">
              Payment Verification
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
            <Lock className="w-3 h-3" />
            <span>256-Bit Encrypted</span>
          </div>
        </div>

        {/* 1. LOADING STATE */}
        {loading && (
          <div className="py-14 text-center space-y-5">
            <div className="relative inline-block">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
              <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-xl -z-10" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-serif text-white tracking-wide">
                Securing Bank Confirmation...
              </h2>
              <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                Communicating with Cashfree and your banking institution to verify transaction provenance.
              </p>
            </div>
          </div>
        )}

        {/* 2. SUCCESS STATE */}
        {!loading && result?.verified && result?.payment_status === 'paid' && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-emerald-400 font-semibold block">
                Acquisition Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide">
                Thank You for Your Order
              </h1>
              <p className="text-xs text-stone-300 font-light">
                Your payment was verified and processed securely via Cashfree.
              </p>
            </div>

            {/* Order Receipt Box */}
            <div
              className={`p-5 rounded-2xl border text-left space-y-3 text-xs ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-stone-400 uppercase tracking-wider">Order Reference</span>
                <span className="font-mono font-semibold text-amber-400">
                  {orderData?.order_number || 'Confirmed'}
                </span>
              </div>

              {orderData?.cashfree_payment_id && (
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-stone-400 uppercase tracking-wider">Cashfree Payment ID</span>
                  <span className="font-mono text-stone-300">
                    {orderData.cashfree_payment_id}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-stone-400 uppercase tracking-wider">Destination</span>
                <span className="text-stone-200 font-medium">
                  {orderData?.shipping_address?.city || 'India'}, {orderData?.shipping_address?.state || ''}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-stone-400 uppercase tracking-wider">White-Glove Dispatch</span>
                <span className="text-emerald-400 font-medium">
                  24–48 Hours
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-stone-400 uppercase tracking-wider">Total Paid</span>
                <span className="text-lg font-sans font-semibold text-white">
                  {formatPrice(orderData?.total_amount || 0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed max-w-md mx-auto">
              A provenance certificate and dispatch notification have been forwarded to{' '}
              <strong className="text-stone-200">{orderData?.customer_email}</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAccountDrawerOpen(true);
                }}
                className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-sans tracking-[0.15em] uppercase font-medium border border-white/15 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Package className="w-3.5 h-3.5" />
                <span>View in My Orders</span>
              </button>

              <Link
                to="/"
                className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-white text-black hover:bg-stone-200 text-xs font-sans tracking-[0.15em] uppercase font-medium transition-all cursor-pointer text-center block"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {/* 3. FAILED / CANCELLED / DECLINED STATE */}
        {!loading && (!result?.verified || result?.payment_status === 'failed' || result?.payment_status === 'user_dropped') && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-xl">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-rose-400 font-semibold block">
                Payment Not Completed
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide">
                Transaction Incomplete
              </h1>
              <p className="text-xs text-stone-300 font-light max-w-md mx-auto leading-relaxed">
                {result?.message || errorMsg || 'The transaction was cancelled or declined by your bank.'}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="text-xs text-stone-300 font-medium">
                Your luxury bag items have been safely preserved.
              </div>
              <p className="text-[11px] text-stone-500">
                No amount was charged. You may retry payment with UPI, another card, or netbanking.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => setIsCheckoutOpen(true), 150);
                }}
                className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-white text-black hover:bg-stone-200 text-xs font-sans tracking-[0.15em] uppercase font-medium transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Checkout</span>
              </button>

              <Link
                to="/"
                className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-sans tracking-[0.15em] uppercase font-medium border border-white/15 transition-all text-center block"
              >
                Return to Store
              </Link>
            </div>
          </div>
        )}

        {/* 4. PENDING BANK CLEARANCE STATE */}
        {!loading && result?.payment_status === 'pending' && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-400 font-semibold block">
                Banking Confirmation Awaited
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide">
                Payment Under Processing
              </h1>
              <p className="text-xs text-stone-300 font-light max-w-md mx-auto leading-relaxed">
                Your bank is currently clearing this transaction. We will automatically confirm your acquisition as soon as Cashfree confirms settlement.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-sans tracking-[0.15em] uppercase font-medium border border-white/15 transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Status</span>
              </button>

              <Link
                to="/"
                className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-white text-black hover:bg-stone-200 text-xs font-sans tracking-[0.15em] uppercase font-medium transition-all text-center block"
              >
                Return to Store
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
