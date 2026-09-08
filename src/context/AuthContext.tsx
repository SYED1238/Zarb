import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  normalizeIndianPhone,
  resolvePhoneCustomerId,
  linkGoogleCustomerAccount,
  syncPendingOrders,
  queuePendingOrder,
  markOrderAsSynced,
  getPendingSyncOrders,
} from '../utils/customerSync';
import {
  fetchCustomerAddressFromSupabase,
  saveCustomerAddressToSupabase,
  getSavedAddress,
  saveAddressToStorage,
  clearSavedAddressStorage,
  type DetectedAddress,
} from '../utils/geolocation';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  shippingAddress?: Partial<DetectedAddress>;
}

export interface OrderItemRecord {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface OrderStatusHistoryItem {
  status: string;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: {
    address: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    shippingMethod?: string;
    order_meta?: any;
  };
  items: OrderItemRecord[];
  subtotal: number;
  shipping_cost: number;
  discount_amount?: number;
  coupon_code?: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled' | 'refunded';
  status_history?: OrderStatusHistoryItem[];
  sync_status?: 'synced' | 'pending_sync';
  sync_error?: string;
  created_at: string;
  updated_at?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  rawUser: User | null;
  isLoading: boolean;
  isAccountDrawerOpen: boolean;
  setIsAccountDrawerOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  userOrders: OrderRecord[];
  isLoadingOrders: boolean;
  refreshOrders: () => Promise<void>;
  saveOrder: (orderData: Omit<OrderRecord, 'id' | 'created_at'>) => Promise<{
    success: boolean;
    orderNumber: string;
    isPendingSync: boolean;
    error?: string;
  }>;
  loginWithPhoneOtp: (phone: string, tokenData?: any) => Promise<void>;
  pendingSyncCount: number;
  triggerPendingSync: () => Promise<void>;
  savedAddress: Partial<DetectedAddress> | null;
  updateCustomerAddress: (address: Partial<DetectedAddress>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingSyncOrders().length);

  // Customer Delivery Destination State — Supabase is permanent source of truth
  const [savedAddress, setSavedAddress] = useState<Partial<DetectedAddress> | null>(() => getSavedAddress());

  // Load customer's permanent address from Supabase cloud database
  const loadCustomerSavedAddress = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const cloudAddress = await fetchCustomerAddressFromSupabase(userId);
      if (cloudAddress && cloudAddress.address) {
        setSavedAddress(cloudAddress);
        saveAddressToStorage(cloudAddress);
      }
    } catch (e) {
      console.warn('Could not load address from Supabase:', e);
    }
  }, []);

  // Update customer's delivery destination permanently in Supabase Cloud & local state
  const updateCustomerAddress = useCallback(async (address: Partial<DetectedAddress>): Promise<boolean> => {
    setSavedAddress(address);
    saveAddressToStorage(address);

    if (user?.id) {
      const ok = await saveCustomerAddressToSupabase(user.id, address);
      return ok;
    }
    return true;
  }, [user]);

  // Map Supabase User to UserProfile
  const mapUserProfile = (u: User): UserProfile => {
    const rawPhone = u.phone || u.user_metadata?.phone;
    const norm = normalizeIndianPhone(rawPhone);
    const metaAddress = u.user_metadata?.shipping_address;
    return {
      id: u.id,
      email: u.email || '',
      fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Client',
      avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
      phone: norm.e164 || rawPhone,
      shippingAddress: metaAddress,
    };
  };

  // Fetch orders from Supabase (strictly by customer user_id) + Local Cache
  const refreshOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    let combinedOrders: OrderRecord[] = [];

    // 1. Read local cache
    try {
      const local = localStorage.getItem('atelier_local_orders');
      if (local) {
        combinedOrders = JSON.parse(local);
      }
    } catch (e) {
      console.warn('Error reading local orders cache', e);
    }

    // 2. Read from Supabase if configured & user is authenticated
    if (isSupabaseConfigured() && user) {
      try {
        const isUuid = Boolean(
          user.id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
        );

        let query = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (isUuid) {
          // Primary query strictly by stable customer ID (Requirement 5)
          query = query.eq('user_id', user.id);
        } else if (user.email) {
          query = query.eq('customer_email', user.email);
        }

        const { data, error } = await query;
        if (!error && data) {
          const cloudOrders: OrderRecord[] = data.map((d: any) => {
            // Unpack order_meta if present in shipping_address
            const meta = d.shipping_address?.order_meta || {};
            return {
              ...d,
              discount_amount: d.discount_amount ?? meta.discount_amount ?? 0,
              coupon_code: d.coupon_code ?? meta.coupon_code ?? '',
              status_history: d.status_history ?? meta.status_history ?? [
                {
                  status: d.order_status || 'confirmed',
                  timestamp: d.created_at,
                  note: 'Order recorded in cloud registry.',
                  updatedBy: 'Atelier System',
                }
              ],
              sync_status: 'synced',
            };
          });
          const existingNumbers = new Set(cloudOrders.map(d => d.order_number));
          // Merge local pending orders that haven't reached the cloud yet
          const uniqueLocals = combinedOrders.filter(o => !existingNumbers.has(o.order_number));
          combinedOrders = [...cloudOrders, ...uniqueLocals];
        }
      } catch (e) {
        console.warn('Could not fetch cloud orders from Supabase', e);
      }
    }

    // Strictly filter for current customer by stable user_id (never name or phone text!)
    if (user) {
      combinedOrders = combinedOrders.filter(o => {
        if (user.id && o.user_id) {
          return o.user_id === user.id;
        }
        return Boolean(
          user.email &&
          o.customer_email &&
          o.customer_email.toLowerCase() === user.email.toLowerCase()
        );
      });
    }

    setUserOrders(combinedOrders);
    setPendingSyncCount(getPendingSyncOrders().length);
    setIsLoadingOrders(false);
  }, [user]);

  // Trigger manual or automatic retry of pending sync orders
  const triggerPendingSync = useCallback(async () => {
    const res = await syncPendingOrders();
    setPendingSyncCount(res.remainingCount);
    if (res.syncedCount > 0) {
      await refreshOrders();
    }
  }, [refreshOrders]);

  // Auth state listener
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      refreshOrders();
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setRawUser(session.user);
        const profile = mapUserProfile(session.user);
        linkGoogleCustomerAccount(profile);
        setUser(profile);
        loadCustomerSavedAddress(session.user.id);
      } else {
        // Fallback: check saved phone OTP session
        try {
          const savedPhoneSession = localStorage.getItem('zarb_phone_session');
          if (savedPhoneSession) {
            const parsed = JSON.parse(savedPhoneSession);
            if (parsed?.user) {
              setUser(parsed.user);
              if (parsed.user.id) {
                loadCustomerSavedAddress(parsed.user.id);
              }
            }
          } else {
            setRawUser(null);
            setUser(null);
          }
        } catch {
          setRawUser(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setRawUser(session.user);
        const profile = mapUserProfile(session.user);
        linkGoogleCustomerAccount(profile);
        setUser(profile);
        loadCustomerSavedAddress(session.user.id);
      } else {
        try {
          const savedPhoneSession = localStorage.getItem('zarb_phone_session');
          if (savedPhoneSession) {
            const parsed = JSON.parse(savedPhoneSession);
            if (parsed?.user) {
              setUser(parsed.user);
              if (parsed.user.id) {
                loadCustomerSavedAddress(parsed.user.id);
              }
              return;
            }
          }
        } catch {}
        setRawUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCustomerSavedAddress]);

  // Refresh orders when user changes
  useEffect(() => {
    refreshOrders();
  }, [user, refreshOrders]);

  // Listen for network connectivity restored & retry pending orders
  useEffect(() => {
    const handleOnline = () => {
      triggerPendingSync();
    };

    window.addEventListener('online', handleOnline);

    // Initial background retry on app mount
    triggerPendingSync();

    // Periodic retry if pending orders remain
    const interval = setInterval(() => {
      if (getPendingSyncOrders().length > 0) {
        triggerPendingSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [triggerPendingSync]);

  // Google OAuth Sign In
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured()) {
      return {
        error: 'Sign-in is temporarily unavailable. Please try again in a moment or contact concierge.'
      };
    }

    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : '';
      const redirectUrl = currentOrigin ? `${currentOrigin}/` : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (e: any) {
      return { error: e.message || 'Google Auth initiation failed.' };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out error', e);
    } finally {
      setUser(null);
      setRawUser(null);
      setSavedAddress(null);
      clearSavedAddressStorage();
      localStorage.removeItem('atelier_last_checkout_email');
      localStorage.removeItem('zarb_phone_session');
      setUserOrders([]);
    }
  };

  // Phone OTP Sign In (MSG91) — Resolves stable Supabase Customer UUID
  const loginWithPhoneOtp = useCallback(async (phone: string, tokenData?: any) => {
    const resolved = await resolvePhoneCustomerId(phone);
    const phoneUser: UserProfile = {
      id: resolved.customerId,
      email: resolved.email,
      fullName: resolved.fullName,
      phone: resolved.phone,
    };

    setUser(phoneUser);

    try {
      localStorage.setItem('zarb_phone_session', JSON.stringify({
        user: phoneUser,
        tokenData,
        timestamp: Date.now(),
      }));
      localStorage.setItem('atelier_last_checkout_email', phoneUser.email);
    } catch (e) {
      console.warn('Error persisting phone session', e);
    }

    // Trigger retry for any pending offline orders
    triggerPendingSync();
  }, [triggerPendingSync]);

  // Save Order with Supabase Priority, Reliable Offline Queue & Idempotency
  const saveOrder = async (orderData: Omit<OrderRecord, 'id' | 'created_at'>): Promise<{
    success: boolean;
    orderNumber: string;
    isPendingSync: boolean;
    error?: string;
  }> => {
    // 1. Stable client-generated RFC4122 UUID v4 for PostgreSQL uuid column & idempotency
    const generateValidUuid = (): string => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try {
          return crypto.randomUUID();
        } catch {}
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    const clientUuid = generateValidUuid();

    // 2. E.164 phone normalization
    const normPhone = normalizeIndianPhone(orderData.customer_phone);
    const normalizedPhone = normPhone.e164 || orderData.customer_phone;

    // 3. Authenticated customer ID linking (stable auth.users UUID)
    const isSupabaseUuid = Boolean(
      (rawUser?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUser.id)) ||
      (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id))
    );
    const stableUserId = rawUser?.id || (isSupabaseUuid ? user!.id : null);

    // 4. Initial status history trail
    const initialHistory: OrderStatusHistoryItem[] = orderData.status_history && orderData.status_history.length > 0
      ? orderData.status_history
      : [
          {
            status: orderData.order_status || 'confirmed',
            timestamp: new Date().toISOString(),
            note: 'Order placed & recorded in permanent cloud registry.',
            updatedBy: 'Client Checkout',
          },
        ];

    const fullOrder: OrderRecord = {
      ...orderData,
      id: clientUuid,
      user_id: stableUserId,
      customer_phone: normalizedPhone,
      discount_amount: orderData.discount_amount ?? 0,
      coupon_code: orderData.coupon_code ?? '',
      status_history: initialHistory,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending_sync',
    };

    // Automatically update the customer's permanent delivery address in Supabase
    if (stableUserId && orderData.shipping_address) {
      updateCustomerAddress(orderData.shipping_address).catch(() => {});
    }

    let isSavedToSupabase = false;
    let syncErrorMsg: string | undefined;

    // 5. Attempt to save to Supabase FIRST with idempotency protection
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        // Check if order number already exists
        const { data: existing } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('order_number', fullOrder.order_number)
          .maybeSingle();

        if (existing) {
          isSavedToSupabase = true;
        } else {
          const insertPayload: Record<string, any> = {
            id: fullOrder.id,
            order_number: fullOrder.order_number,
            user_id: fullOrder.user_id,
            customer_email: fullOrder.customer_email,
            customer_name: fullOrder.customer_name,
            customer_phone: fullOrder.customer_phone,
            shipping_address: fullOrder.shipping_address,
            items: fullOrder.items,
            subtotal: fullOrder.subtotal,
            shipping_cost: fullOrder.shipping_cost,
            discount_amount: fullOrder.discount_amount,
            coupon_code: fullOrder.coupon_code,
            status_history: fullOrder.status_history,
            total_amount: fullOrder.total_amount,
            payment_method: fullOrder.payment_method,
            payment_status: fullOrder.payment_status,
            order_status: fullOrder.order_status,
            updated_at: fullOrder.updated_at,
          };

          let { error: insertErr } = await supabase.from('orders').insert(insertPayload);

          // If foreign key error (23503: user_id not yet committed to auth.users), retry with user_id: null
          if (insertErr && insertErr.code === '23503') {
            insertPayload.user_id = null;
            const fkRetry = await supabase.from('orders').insert(insertPayload);
            insertErr = fkRetry.error;
          }

          // If extra columns do not exist in Supabase yet (Postgres code 42703), encapsulate in shipping_address.order_meta
          if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('does not exist'))) {
            const fallbackPayload: Record<string, any> = {
              id: fullOrder.id,
              order_number: fullOrder.order_number,
              user_id: insertPayload.user_id,
              customer_email: fullOrder.customer_email,
              customer_name: fullOrder.customer_name,
              customer_phone: fullOrder.customer_phone,
              shipping_address: {
                ...fullOrder.shipping_address,
                order_meta: {
                  discount_amount: fullOrder.discount_amount,
                  coupon_code: fullOrder.coupon_code,
                  status_history: fullOrder.status_history,
                },
              },
              items: fullOrder.items,
              subtotal: fullOrder.subtotal,
              shipping_cost: fullOrder.shipping_cost,
              total_amount: fullOrder.total_amount,
              payment_method: fullOrder.payment_method,
              payment_status: fullOrder.payment_status,
              order_status: fullOrder.order_status,
              updated_at: fullOrder.updated_at,
            };
            const retryRes = await supabase.from('orders').insert(fallbackPayload);
            insertErr = retryRes.error;
          }

          if (!insertErr || insertErr.code === '23505') {
            isSavedToSupabase = true;
          } else {
            syncErrorMsg = insertErr.message;
            console.warn('Supabase order insert returned error, queuing for retry:', insertErr.message);
          }
        }
      } catch (e: any) {
        syncErrorMsg = e?.message || 'Network exception';
        console.warn('Supabase insert exception, queuing for retry:', e);
      }
    } else {
      syncErrorMsg = !isSupabaseConfigured() ? 'Supabase not configured' : 'Device offline';
    }

    // Set confirmed sync status
    fullOrder.sync_status = isSavedToSupabase ? 'synced' : 'pending_sync';
    if (syncErrorMsg && !isSavedToSupabase) {
      fullOrder.sync_error = syncErrorMsg;
    }

    // 6. Store locally & update state
    try {
      const existingRaw = localStorage.getItem('atelier_local_orders');
      const ordersList: OrderRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = ordersList.filter(o => o.order_number !== fullOrder.order_number);
      const updatedList = [fullOrder, ...filtered];
      localStorage.setItem('atelier_local_orders', JSON.stringify(updatedList));
      localStorage.setItem('atelier_last_checkout_email', fullOrder.customer_email);
      setUserOrders(prev => [fullOrder, ...prev.filter(o => o.order_number !== fullOrder.order_number)]);
    } catch (e) {
      console.error('Error saving order locally', e);
    }

    // 7. Manage pending queue: if not confirmed, queue; otherwise mark synced
    if (!isSavedToSupabase) {
      queuePendingOrder(fullOrder);
      setPendingSyncCount(getPendingSyncOrders().length);
    } else {
      markOrderAsSynced(fullOrder.order_number);
      setPendingSyncCount(getPendingSyncOrders().length);
    }

    return {
      success: true,
      orderNumber: fullOrder.order_number,
      isPendingSync: !isSavedToSupabase,
      error: syncErrorMsg,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
        isLoading,
        isAccountDrawerOpen,
        setIsAccountDrawerOpen,
        signInWithGoogle,
        signOut,
        userOrders,
        isLoadingOrders,
        refreshOrders,
        saveOrder,
        loginWithPhoneOtp,
        pendingSyncCount,
        triggerPendingSync,
        savedAddress,
        updateCustomerAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
