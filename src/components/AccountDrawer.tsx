import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { isSupabaseConfigured, saveSupabaseCredentials } from '../lib/supabase';
import {
  X,
  Lock,
  LogOut,
  Package,
  ShieldCheck,
  Sparkles,
  Database
} from 'lucide-react';

export const AccountDrawer: React.FC = () => {
  const {
    user,
    isAccountDrawerOpen,
    setIsAccountDrawerOpen,
    signInWithGoogle,
    signOut,
    userOrders,
    isLoadingOrders,
  } = useAuth();

  const { theme, showToast } = useStore();

  useModalBackHandler(isAccountDrawerOpen, () => setIsAccountDrawerOpen(false), 'account-drawer');

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Connection modal if user wants to enter credentials directly
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');

  if (!isAccountDrawerOpen) return null;

  const isConfigured = isSupabaseConfigured();

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

  const handleGoogleClick = async () => {
    if (!isConfigured) {
      setShowConnectModal(true);
      return;
    }

    const res = await signInWithGoogle();
    if (res.error) {
      showToast(`Sign In Error: ${res.error}`);
    }
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      showToast('Both Project URL and Anon Key are required');
      return;
    }

    const ok = saveSupabaseCredentials(inputUrl.trim(), inputKey.trim());
    if (ok) {
      showToast('Supabase successfully connected!');
      setShowConnectModal(false);
      window.location.reload();
    } else {
      showToast('Invalid URL. Must start with https://');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Account Drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsAccountDrawerOpen(false)}
      />

      {/* Drawer Container */}
      <div className={`relative w-full max-w-md h-full flex flex-col z-10 shadow-2xl overflow-hidden animate-slide-right ${
        theme === 'alabaster'
          ? 'bg-[#faf9f5] text-[#121214] border-l border-stone-200'
          : 'bg-[#0e0e12] text-stone-100 border-l border-white/10'
      }`}>
        {/* Drawer Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${
          theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#09090c] border-white/10'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-brand tracking-[0.25em] text-xs font-semibold uppercase block">
                ZARB CLIENT
              </span>
              <span className="text-[9px] font-mono tracking-wider text-stone-400 uppercase">
                {user ? 'Verified Profile & Orders' : 'Haute Membership'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsAccountDrawerOpen(false)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close Account"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase Status Banner (if not connected yet) */}
        {!isConfigured && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-amber-300">
              <Database className="w-4 h-4 shrink-0" />
              <span>Connect Supabase Project</span>
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded bg-amber-500 text-black hover:bg-amber-400 cursor-pointer"
            >
              Enter Keys
            </button>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* =============================================================== */}
          {/* STATE A: NOT SIGNED IN                                          */}
          {/* =============================================================== */}
          {!user ? (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border text-center space-y-4 ${
                theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-white/[0.02] border-white/10'
              }`}>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Lock className="w-6 h-6 stroke-[1.5]" />
                </div>

                <div>
                  <h3 className="text-xl font-serif">Sign in to Zarb</h3>
                  <p className="text-xs text-stone-400 font-light mt-1.5 leading-relaxed">
                    Access your permanent order provenance, white-glove dispatch updates, and personalized atelier concierge.
                  </p>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-sans font-medium tracking-wide flex items-center justify-center space-x-3 shadow-md transition-all cursor-pointer border border-stone-300"
                >
                  {/* Official Google Icon SVG */}
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
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* STATE B: AUTHENTICATED WITH GOOGLE                              */
            /* =============================================================== */
            <div className="space-y-6">
              {/* User Profile Card */}
              <div className={`p-4 rounded-2xl border flex items-center space-x-3.5 ${
                theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-white/[0.02] border-white/10'
              }`}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-full border border-amber-500/40 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-base">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif text-sm font-medium truncate">
                      {user.fullName}
                    </h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs text-stone-400 truncate">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-mono tracking-wider text-amber-500 uppercase">
                    Haute Member
                  </span>
                </div>
              </div>

              {/* Sub-Tabs: Orders vs Details */}
              <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-colors cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-white text-black'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Order History ({userOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-colors cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-white text-black'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Preferences
                </button>
              </div>

              {/* Orders List */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {isLoadingOrders ? (
                    <div className="text-center py-8 text-xs text-stone-400">
                      Loading orders from Supabase...
                    </div>
                  ) : userOrders.length > 0 ? (
                    <div className="space-y-3">
                      {userOrders.map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrder(ord)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-amber-400/50 ${
                            theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-mono text-xs font-semibold text-amber-400">
                                {ord.order_number}
                              </div>
                              <div className="text-[10px] text-stone-400 mt-0.5">
                                {formatDate(ord.created_at)}
                              </div>
                            </div>
                            <span className="text-[9px] uppercase px-2 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {ord.order_status}
                            </span>
                          </div>

                          {/* Items Preview */}
                          <div className="mt-3 flex items-center space-x-2 overflow-x-auto py-1">
                            {ord.items.slice(0, 3).map((item, idx) => (
                              <img
                                key={idx}
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-13 object-cover rounded bg-stone-900 border border-white/10 shrink-0"
                              />
                            ))}
                            {ord.items.length > 3 && (
                              <span className="text-[10px] text-stone-400 pl-1 font-mono">
                                +{ord.items.length - 3} more
                              </span>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-stone-400 text-[11px]">Total Paid:</span>
                            <span className="font-medium text-white">
                              {formatPrice(ord.total_amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl p-6 text-stone-400 space-y-2">
                      <Package className="w-8 h-8 mx-auto text-stone-500" />
                      <h4 className="text-sm font-serif text-white">No Orders Placed Yet</h4>
                      <p className="text-xs font-light">
                        Acquisitions made under {user.email} will permanently display here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Details Tab */}
              {activeTab === 'profile' && (
                <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                  theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-white/[0.02] border-white/10'
                }`}>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-stone-400">Authenticated via</span>
                    <span className="font-medium text-emerald-400">Google OAuth 2.0</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-stone-400">Account ID</span>
                    <span className="font-mono text-stone-300 text-[11px] truncate max-w-[180px]">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Member Status</span>
                    <span className="text-white font-medium">Active Haute Patron</span>
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs tracking-wider uppercase font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Zarb</span>
                </button>
              </div>
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
                  <img src={it.image} alt={it.name} className="w-10 h-13 object-cover rounded bg-stone-900 shrink-0" />
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

            {/* Summary */}
            <div className="bg-white/[0.03] p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between text-stone-400">
                <span>Destination</span>
                <span className="text-white">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Dispatch Status</span>
                <span className="text-emerald-400 font-mono uppercase">{selectedOrder.order_status}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t border-white/10 text-sm">
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

      {/* =============================================================== */}
      {/* MODAL: DIRECT SUPABASE CREDENTIALS CONNECTION                   */}
      {/* =============================================================== */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 ${
            theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-[#121216] border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-base">Connect Supabase Cloud</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1.5 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              From your open Supabase dashboard tab, go to <strong>Project Settings &rarr; API</strong> and paste your Project URL and Anon public key below.
            </p>

            <form onSubmit={handleSaveConnection} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1">
                  Project URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs border focus:outline-none ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1">
                  Project API Anon Key *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs border focus:outline-none ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/20 text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold uppercase tracking-wider shadow-lg"
                >
                  Connect & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
