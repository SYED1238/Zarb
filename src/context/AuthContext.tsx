import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

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
  saveOrder: (orderData: Omit<OrderRecord, 'id' | 'created_at'>) => Promise<{ success: boolean; orderNumber: string; error?: string }>;
  loginWithPhoneOtp: (phone: string, tokenData?: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Map Supabase User to UserProfile
  const mapUserProfile = (u: User): UserProfile => {
    return {
      id: u.id,
      email: u.email || '',
      fullName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Client',
      avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture,
      phone: u.phone,
    };
  };

  // Fetch orders from Supabase + Local Cache
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

    // 2. Read from Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (user) {
          query = query.or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);
        } else {
          // If guest, fetch by recent local email if any
          const guestEmail = localStorage.getItem('atelier_last_checkout_email');
          if (guestEmail) {
            query = query.eq('customer_email', guestEmail);
          }
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          // Merge avoiding duplicates by order_number
          const existingNumbers = new Set(data.map((d: any) => d.order_number));
          const uniqueLocals = combinedOrders.filter(o => !existingNumbers.has(o.order_number));
          combinedOrders = [...data, ...uniqueLocals];
        }
      } catch (e) {
        console.warn('Could not fetch cloud orders from Supabase', e);
      }
    }

    // Filter for current user if logged in
    if (user) {
      combinedOrders = combinedOrders.filter(o => 
        o.user_id === user.id || o.customer_email?.toLowerCase() === user.email?.toLowerCase()
      );
    }

    setUserOrders(combinedOrders);
    setIsLoadingOrders(false);
  }, [user]);

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
        setUser(mapUserProfile(session.user));
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
        setUser(mapUserProfile(session.user));
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

  // Refresh orders when user logs in or out
  useEffect(() => {
    refreshOrders();
  }, [user, refreshOrders]);

  // Google OAuth Sign In
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured()) {
      return {
        error: 'Supabase credentials are not connected yet. Please enter your Project URL and Anon Key in the Admin Portal or .env file.'
      };
    }

    try {
      // Ensure redirect points directly to active deployed origin with trailing slash
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

  // Phone OTP Sign In (MSG91)
  const loginWithPhoneOtp = useCallback((phone: string, tokenData?: any) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const phoneUser: UserProfile = {
      id: `phone_${cleanPhone}`,
      email: `${cleanPhone}@phone.zarb.shop`,
      fullName: `Client (+91 ${cleanPhone})`,
      phone: `+91 ${cleanPhone}`,
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
  }, []);

  // Save Order to Supabase & Local Cache
  const saveOrder = async (orderData: Omit<OrderRecord, 'id' | 'created_at'>): Promise<{ success: boolean; orderNumber: string; error?: string }> => {
    const fullOrder: OrderRecord = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: user ? user.id : null,
      created_at: new Date().toISOString(),
    };

    // 1. Immediately save to local storage
    try {
      const existing = localStorage.getItem('atelier_local_orders');
      const ordersList: OrderRecord[] = existing ? JSON.parse(existing) : [];
      const updatedList = [fullOrder, ...ordersList];
      localStorage.setItem('atelier_local_orders', JSON.stringify(updatedList));
      localStorage.setItem('atelier_last_checkout_email', orderData.customer_email);
      setUserOrders(prev => [fullOrder, ...prev]);
    } catch (e) {
      console.error('Error saving order locally', e);
    }

    // 2. Save to Supabase Cloud Database if configured
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('orders')
          .insert({
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
          });

        if (error) {
          console.warn('Supabase cloud order insertion returned error, order preserved locally:', error.message);
        }
      } catch (e: any) {
        console.warn('Failed to insert order into Supabase cloud table, order preserved locally:', e);
      }
    }

    return { success: true, orderNumber: fullOrder.order_number };
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
