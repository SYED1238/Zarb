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

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
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
    shippingMethod: string;
  };
  items: OrderItemRecord[];
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: 'confirmed' | 'processing' | 'dispatched' | 'delivered';
  sync_status?: 'synced' | 'pending_sync';
  sync_error?: string;
  created_at: string;
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

  // Map Supabase User to UserProfile
  const mapUserProfile = (u: User): UserProfile => {
    const rawPhone = u.phone || u.user_metadata?.phone;
    const norm = normalizeIndianPhone(rawPhone);
    return {
      id: u.id,
      email: u.email || '',
      fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Client',
      avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
      phone: norm.e164 || rawPhone,
    };
  };

  // Fetch orders from Supabase (by customer ID) + Local Cache
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
          // Primary query by stable customer ID (no text-based phone search!)
          query = query.eq('user_id', user.id);
        } else if (user.email) {
          query = query.eq('customer_email', user.email);
        }

        const { data, error } = await query;
        if (!error && data) {
          const cloudOrders: OrderRecord[] = data.map((d: any) => ({
            ...d,
            sync_status: 'synced',
          }));
          const existingNumbers = new Set(cloudOrders.map(d => d.order_number));
          // Merge local pending orders that haven't reached the cloud yet
          const uniqueLocals = combinedOrders.filter(o => !existingNumbers.has(o.order_number));
          combinedOrders = [...cloudOrders, ...uniqueLocals];
        }
      } catch (e) {
        console.warn('Could not fetch cloud orders from Supabase', e);
      }
    }

    // Filter for current user by stable user_id or linked email
    if (user) {
      combinedOrders = combinedOrders.filter(o => {
        const matchUserId = user.id && o.user_id === user.id;
        const matchEmail = Boolean(
          user.email &&
          o.customer_email &&
          o.customer_email.toLowerCase() === user.email.toLowerCase()
        );
        return matchUserId || matchEmail;
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
      } else {
        // Fallback: check saved phone OTP session
        try {
          const savedPhoneSession = localStorage.getItem('zarb_phone_session');
          if (savedPhoneSession) {
            const parsed = JSON.parse(savedPhoneSession);
            if (parsed?.user) {
              setUser(parsed.user);
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
      } else {
        try {
          const savedPhoneSession = localStorage.getItem('zarb_phone_session');
          if (savedPhoneSession) {
            const parsed = JSON.parse(savedPhoneSession);
            if (parsed?.user) {
              setUser(parsed.user);
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
  }, []);

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
        error: 'Supabase credentials are not connected yet. Please enter your Project URL and Anon Key in the Admin Portal or .env file.'
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
    // 1. Stable client-generated UUID for idempotency
    const clientUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 2. E.164 phone normalization
    const normPhone = normalizeIndianPhone(orderData.customer_phone);
    const normalizedPhone = normPhone.e164 || orderData.customer_phone;

    // 3. Authenticated customer ID linking
    const isSupabaseUuid = Boolean(
      user?.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
    );
    const stableUserId = isSupabaseUuid ? user!.id : null;

    const fullOrder: OrderRecord = {
      ...orderData,
      id: clientUuid,
      user_id: stableUserId,
      customer_phone: normalizedPhone,
      created_at: new Date().toISOString(),
      sync_status: 'pending_sync',
    };

    let isSavedToSupabase = false;
    let syncErrorMsg: string | undefined;

    // 4. Attempt to save to Supabase FIRST with idempotency protection
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
            total_amount: fullOrder.total_amount,
            payment_method: fullOrder.payment_method,
            payment_status: fullOrder.payment_status,
            order_status: fullOrder.order_status,
          };

          const { error: insertErr } = await supabase.from('orders').insert(insertPayload);

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

    // 5. Store locally & update state
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

    // 6. Manage pending queue: if not confirmed, queue; otherwise mark synced
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
