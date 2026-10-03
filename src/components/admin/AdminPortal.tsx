import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import type { Product, ProductColor, PerfumeVolumeOption } from '../../types/product';
import type { CategoryItem } from '../../data/categories';
import { HAUTE_PERFUMES_PRESETS } from '../../data/products';
import {
  Lock,
  Package,
  Layers,
  DollarSign,
  Database,
  Plus,
  Trash2,
  Edit3,
  Copy,
  ExternalLink,
  Sun,
  Moon,
  Search,
  X,
  AlertTriangle,
  Upload,
  Download,
  RotateCcw,
  ArrowRight,
  Eye,
  EyeOff,
  SlidersHorizontal,
  CloudUpload,
  CloudDownload,
  Key,
  ShoppingBag,
  Star,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Clock,
  ShieldCheck,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Truck,
  Save,
  CheckCircle2,
  Info,
  Loader2,
  Droplets,
  Bell,
} from 'lucide-react';
import type { RestockRequest } from '../../types/restock';
import {
  fetchAllRestockRequests,
  subscribeToRestockRequests,
  updateRestockRequestStatus,
  deleteRestockRequest,
} from '../../services/restockService';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  supabase
} from '../../lib/supabase';
import {
  convertGoogleDriveUrl,
  uploadImageToR2,
  deleteImageFromR2,
} from '../../utils/imageUpload';
import { getMediaUrl, isR2Url } from '../../utils/media';
import { emailService } from '../../services/emailService';
import { initiateCashfreeRefund } from '../../services/cashfreeService';
import {
  loadShippingConfig,
  fetchShippingConfig,
  saveShippingConfig,
  DEFAULT_SHIPPING_CONFIG,
  type ShippingConfig,
  type ShippingTier,
} from '../../utils/shippingConfig';

export const AUTHORIZED_ADMIN_EMAIL = 'syedhamza1238@gmail.com';

const LUXURY_COLOR_PRESETS = [
  { name: 'Obsidian Noir', hex: '#111113' },
  { name: 'Charcoal Melange', hex: '#2b2c30' },
  { name: 'Cashmere Cream', hex: '#f5f3ec' },
  { name: 'Camel Vicuña', hex: '#8a6e4b' },
  { name: 'Chalk Ivory', hex: '#f4efe6' },
  { name: 'Raw Ecru', hex: '#ded6c7' },
  { name: 'Espresso Brun', hex: '#2a1f1d' },
  { name: 'Midnight Navy', hex: '#161b26' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Crimson Scarlet', hex: '#8a1c14' },
  { name: 'Emerald Forest', hex: '#1c3b2b' },
  { name: 'Royal Sapphire', hex: '#1e325c' },
  { name: 'Dusty Rose', hex: '#c59b97' },
];

interface SizeCategoryDef {
  id: 'all' | 'alpha' | 'suit' | 'waist' | 'special' | 'perfume';
  label: string;
  sizes: string[];
}

const SIZE_CATEGORIES: SizeCategoryDef[] = [
  {
    id: 'perfume',
    label: 'Flacon Volume (ML)',
    sizes: ['6ml (Attar)', '12ml (1 Tola)', '30ml', '50ml (Extrait)', '100ml (Grand Flacon)', '200ml'],
  },
  {
    id: 'alpha',
    label: 'Standard (XS - 5XL)',
    sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', '5XL'],
  },
  {
    id: 'suit',
    label: 'European / Suit (EU)',
    sizes: ['44 (XS)', '46 (S)', '48 (M)', '50 (L)', '52 (XL)', '54 (XXL)', '56 (XXXL)', '58 (XXXXL)'],
  },
  {
    id: 'waist',
    label: 'Waist (Trousers)',
    sizes: ['26', '28', '30', '32', '34', '36', '38', '40', '42', '44'],
  },
  {
    id: 'special',
    label: 'Universal / Bespoke',
    sizes: ['One Size', 'Free Size', 'Custom Fit', 'Made-to-Measure', 'Petite', 'Plus Size'],
  },
];

const STANDARD_SIZES = [
  '6ml (Attar)', '12ml (1 Tola)', '30ml', '50ml (Extrait)', '100ml (Grand Flacon)', '200ml',
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', '5XL',
  '44 (XS)', '46 (S)', '48 (M)', '50 (L)', '52 (XL)', '54 (XXL)', '56 (XXXL)', '58 (XXXXL)',
  '26', '28', '30', '32', '34', '36', '38', '40', '42', '44',
  'One Size', 'Free Size', 'Custom Fit', 'Made-to-Measure'
];

export const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    isProductsLoading,
    womenCategories,
    menCategories,
    perfumeCategories,
    addProduct,
    updateProduct,
    deleteProduct,
    eraseAllProducts,
    refreshProductsFromCloud,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefaults,
    exportCatalogJson,
    importCatalogJson,
    theme,
    toggleTheme,
    showToast,
    reviews,
    deletedReviewIds,
    getProductReviews,
    deleteReview,
  } = useStore();

  // Authentication State (Google OAuth restricted to syedhamza1238@gmail.com)
  // Admin access requires verified Supabase Auth session — no client-side passwords
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Monitor Supabase Authentication & Enforce Single Email Restriction
  useEffect(() => {
    let isMounted = true;

    const verifyAdminSession = async () => {
      setIsCheckingAuth(true);

      // Check for any OAuth errors in URL hash or search params
      try {
        const rawHash = window.location.hash || '';
        const rawSearch = window.location.search || '';
        const params = new URLSearchParams(rawHash.startsWith('#') ? rawHash.slice(1) : rawSearch);
        const oauthError = params.get('error_description') || params.get('error');
        if (oauthError) {
          const cleanMsg = decodeURIComponent(oauthError.replace(/\+/g, ' '));
          setAuthError(cleanMsg);
          showToast(`Sign-in notice: ${cleanMsg}`);
          setIsCheckingAuth(false);
          return;
        }
      } catch (e) {
        console.warn('Could not parse URL auth params', e);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user?.email) {
          const email = session.user.email.toLowerCase().trim();
          if (email === AUTHORIZED_ADMIN_EMAIL.toLowerCase().trim()) {
            setIsAuthenticated(true);
            setAdminUser(session.user);
            setUnauthorizedEmail(null);
            setAuthError(null);
            // Clean up hash from browser address bar
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          } else {
            // Strictly reject any other account
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setAdminUser(null);
            setUnauthorizedEmail(session.user.email);
            setAuthError(`Access Denied: ${session.user.email} is not authorized.`);
          }
        }
      } catch (err: any) {
        console.error('Admin session verify error:', err);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    verifyAdminSession();

    // Listen for OAuth redirects & session updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user?.email) {
        const email = session.user.email.toLowerCase().trim();
        if (email === AUTHORIZED_ADMIN_EMAIL.toLowerCase().trim()) {
          setIsAuthenticated(true);
          setAdminUser(session.user);
          setUnauthorizedEmail(null);
          setAuthError(null);
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
          showToast(`Authorized: Welcome Syed Hamza (${session.user.email})`);
        } else {
          // Immediately boot out unauthorized users
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setAdminUser(null);
          setUnauthorizedEmail(session.user.email);
          setAuthError(`Access Denied: ${session.user.email} is not authorized.`);
          showToast(`Access Denied: Account ${session.user.email} is unauthorized. Only ${AUTHORIZED_ADMIN_EMAIL} can access this portal.`);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setAdminUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Active Management Tab
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'perfumes' | 'orders' | 'reviews' | 'pricing' | 'backup' | 'shipping' | 'waitlist'>('products');

  // Client Waitlist & Restock Requests State
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [isLoadingRestock, setIsLoadingRestock] = useState(false);
  const [restockSearch, setRestockSearch] = useState('');
  const [restockStatusFilter, setRestockStatusFilter] = useState<'all' | 'pending' | 'notified'>('all');

  const fetchRestock = async () => {
    setIsLoadingRestock(true);
    try {
      const data = await fetchAllRestockRequests();
      setRestockRequests(data);
    } finally {
      setIsLoadingRestock(false);
    }
  };

  useEffect(() => {
    fetchRestock();
    const unsub = subscribeToRestockRequests((reqs) => {
      setRestockRequests(reqs);
    });
    return unsub;
  }, []);

  const pendingRestockCount = useMemo(() => {
    return restockRequests.filter(r => r.status === 'pending').length;
  }, [restockRequests]);

  const filteredRestockRequests = useMemo(() => {
    return restockRequests.filter(r => {
      if (restockStatusFilter !== 'all' && r.status !== restockStatusFilter) return false;
      if (restockSearch.trim()) {
        const q = restockSearch.toLowerCase();
        const matchName = (r.customerName || '').toLowerCase().includes(q);
        const matchEmail = (r.customerEmail || '').toLowerCase().includes(q);
        const matchPhone = (r.customerPhone || '').toLowerCase().includes(q);
        const matchProduct = (r.productName || '').toLowerCase().includes(q);
        const matchSize = (r.size || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchProduct || matchSize;
      }
      return true;
    });
  }, [restockRequests, restockStatusFilter, restockSearch]);

  const handleUpdateRestockStatus = async (id: string, status: 'pending' | 'notified' | 'cancelled') => {
    await updateRestockRequestStatus(id, status);
    setRestockRequests(prev => prev.map(r => r.id === id ? { ...r, status, notifiedAt: status === 'notified' ? new Date().toISOString() : r.notifiedAt } : r));
    showToast(status === 'notified' ? 'Marked client as notified.' : 'Restock request status updated.');
  };

  const handleDeleteRestockRequest = async (id: string) => {
    if (!window.confirm('Delete this client restock notification request?')) return;
    await deleteRestockRequest(id);
    setRestockRequests(prev => prev.filter(r => r.id !== id));
    showToast('Waitlist request deleted.');
  };

  const handleQuickRestockProduct = async (productId: string, currentStock: number) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;
    const input = window.prompt(`Enter new inventory stock for "${targetProduct.name}":`, String(Math.max(10, currentStock + 10)));
    if (input === null) return;
    const newStock = Math.max(0, parseInt(input, 10) || 0);
    const updated = { ...targetProduct, stock: newStock };
    await updateProduct(updated);
    showToast(`Stock updated to ${newStock} units for ${targetProduct.name}`);
  };

  // Orders State & Handlers
  const [orders, setOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('atelier_local_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'processing' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled'>('all');

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    let combined: any[] = [];
    try {
      const local = localStorage.getItem('atelier_local_orders');
      if (local) combined = JSON.parse(local);
    } catch {}

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const cloudOrders = data.map((d: any) => {
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
            };
          });
          const numbers = new Set(cloudOrders.map((d: any) => d.order_number));
          const uniqueLocals = combined.filter((o: any) => !numbers.has(o.order_number));
          combined = [...cloudOrders, ...uniqueLocals];
        }
      } catch (e) {
        console.warn('Could not fetch cloud orders from Supabase', e);
      }
    }
    setOrders(combined);
    setIsLoadingOrders(false);
  };

  const handleUpdateOrderStatus = async (orderNumber: string, newStatus: string) => {
    const timestamp = new Date().toISOString();
    const existingOrder = orders.find(o => o.order_number === orderNumber);
    const existingHistory = Array.isArray(existingOrder?.status_history) ? existingOrder.status_history : [];
    const newHistoryEntry = {
      status: newStatus,
      timestamp,
      note: `Status updated to ${newStatus.toUpperCase()} via Admin Concierge Portal`,
      updatedBy: 'Admin Portal',
    };
    const updatedHistory = [...existingHistory, newHistoryEntry];

    // Optimistically update local state
    setOrders(prev => prev.map(o => o.order_number === orderNumber ? {
      ...o,
      order_status: newStatus,
      updated_at: timestamp,
      status_history: updatedHistory,
    } : o));

    // Update local cache
    try {
      const saved = localStorage.getItem('atelier_local_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((o: any) => o.order_number === orderNumber ? {
          ...o,
          order_status: newStatus,
          updated_at: timestamp,
          status_history: updatedHistory,
        } : o);
        localStorage.setItem('atelier_local_orders', JSON.stringify(updated));
      }
    } catch {}

    // Persist immediately to Supabase
    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, any> = {
          order_status: newStatus,
          updated_at: timestamp,
          status_history: updatedHistory,
        };

        let { error } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('order_number', orderNumber);

        // If status_history column does not exist in Supabase yet (code 42703), fallback to updating order_status and updated_at directly
        if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
          const currentShipping = existingOrder?.shipping_address || {};
          const fallbackPayload: Record<string, any> = {
            order_status: newStatus,
            updated_at: timestamp,
            shipping_address: {
              ...currentShipping,
              order_meta: {
                ...(currentShipping.order_meta || {}),
                status_history: updatedHistory,
              },
            },
          };
          const fallbackRes = await supabase
            .from('orders')
            .update(fallbackPayload)
            .eq('order_number', orderNumber);
          error = fallbackRes.error;
        }

        if (error) {
          console.warn('Supabase status update error:', error.message);
          showToast(`Order updated locally (Supabase note: ${error.message})`);
        } else {
          showToast(`Order ${orderNumber} updated to ${newStatus.toUpperCase()} (Cloud Persisted)`);
        }
      } catch (e: any) {
        console.warn('Exception updating order status in Supabase:', e);
        showToast(`Order ${orderNumber} updated to ${newStatus.toUpperCase()}`);
      }
    } else {
      showToast(`Order ${orderNumber} updated to ${newStatus.toUpperCase()}`);
    }

    // Trigger automatic transactional status email on legitimate transition (non-blocking)
    if (existingOrder && existingOrder.customer_email && existingOrder.order_status !== newStatus) {
      emailService.sendOrderStatusEmail(
        { ...existingOrder, order_status: newStatus },
        newStatus
      ).catch(err => {
        console.warn('[ADMIN] Background status email dispatch notice:', err);
      });
    }
  };

  const handleInitiateRefund = async (order: any) => {
    if (!order.cashfree_order_id) {
      showToast('This order does not have an active Cashfree Order ID.');
      return;
    }

    const maxRefund = Number(order.total_amount) || 0;
    const amountStr = window.prompt(
      `Enter refund amount for Order ${order.order_number} (Max: ₹${maxRefund}):`,
      String(maxRefund)
    );
    if (!amountStr) return;

    const refundAmount = Number(amountStr);
    if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > maxRefund) {
      showToast('Invalid refund amount entered.');
      return;
    }

    const refundNote = window.prompt('Reason for refund (optional):', 'Client return / concierge refund') || 'Client return';

    showToast(`Contacting Cashfree to process refund of ₹${refundAmount}...`);

    const res = await initiateCashfreeRefund({
      orderId: order.cashfree_order_id,
      refundAmount,
      refundNote,
      callerEmail: adminUser?.email || AUTHORIZED_ADMIN_EMAIL,
    });

    if (res.success) {
      showToast(`Refund of ₹${refundAmount} processed successfully via Cashfree.`);
      await handleUpdateOrderStatus(order.order_number, 'refunded');
      fetchOrders();
    } else {
      showToast(`Refund failed: ${res.error || 'Gateway error'}`);
    }
  };

  // Reviews State
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  // Flattened Reviews Across All Pieces
  const allReviewsList = useMemo(() => {
    const list: { review: any; product: Product | undefined }[] = [];
    const processedProductIds = new Set<string>();

    products.forEach(p => {
      processedProductIds.add(p.id);
      const pRevs = getProductReviews(p.id, p.name);
      pRevs.forEach(r => {
        list.push({ review: r, product: p });
      });
    });

    Object.keys(reviews).forEach(prodId => {
      if (!processedProductIds.has(prodId)) {
        const pRevs = getProductReviews(prodId);
        pRevs.forEach(r => {
          list.push({ review: r, product: products.find(p => p.id === prodId) });
        });
      }
    });

    return list;
  }, [products, reviews, deletedReviewIds, getProductReviews]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const orderStats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const pendingCount = orders.filter(o => o.order_status === 'processing' || o.order_status === 'pending').length;
    return {
      totalOrders: orders.length,
      totalRevenue: totalRev,
      pending: pendingCount,
    };
  }, [orders]);

  const reviewStats = useMemo(() => {
    const totalCount = allReviewsList.length;
    const avg = totalCount > 0
      ? (allReviewsList.reduce((sum, r) => sum + (r.review.rating || 5), 0) / totalCount).toFixed(1)
      : '5.0';
    return { totalCount, avg };
  }, [allReviewsList]);

  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      if (orderStatusFilter !== 'all' && (ord.order_status || 'processing') !== orderStatusFilter) {
        return false;
      }
      if (orderSearch.trim()) {
        const query = orderSearch.toLowerCase();
        const num = (ord.order_number || '').toLowerCase();
        const name = (ord.customer_name || '').toLowerCase();
        const email = (ord.customer_email || '').toLowerCase();
        const phone = (ord.customer_phone || '').toLowerCase();
        return num.includes(query) || name.includes(query) || email.includes(query) || phone.includes(query);
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const filteredReviews = useMemo(() => {
    return allReviewsList.filter(({ review: rev, product: prod }) => {
      if (reviewRatingFilter !== 'all' && rev.rating !== Number(reviewRatingFilter)) {
        return false;
      }
      if (reviewSearch.trim()) {
        const query = reviewSearch.toLowerCase();
        const author = (rev.authorName || '').toLowerCase();
        const title = (rev.title || '').toLowerCase();
        const comment = (rev.comment || '').toLowerCase();
        const pName = (prod?.name || '').toLowerCase();
        return author.includes(query) || title.includes(query) || comment.includes(query) || pName.includes(query);
      }
      return true;
    });
  }, [allReviewsList, reviewRatingFilter, reviewSearch]);

  // ── Shipping Configuration State ──────────────────────────────────────────
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(() => loadShippingConfig());
  const [shippingSaved, setShippingSaved] = useState(false);

  useEffect(() => {
    if (activeTab === 'shipping') {
      fetchShippingConfig().then(cfg => {
        setShippingConfig(cfg);
      });
    }
  }, [activeTab]);

  const handleSaveShipping = async () => {
    setShippingSaved(true);
    const res = await saveShippingConfig(shippingConfig);
    if (res.success) {
      showToast('Shipping configuration saved & synced to Supabase cloud!');
    } else {
      showToast(`Saved locally (Cloud warning: ${res.error})`);
    }
    setTimeout(() => setShippingSaved(false), 2500);
  };

  const handleAddTier = () => {
    const newTier: ShippingTier = {
      id: `tier_${Date.now()}`,
      label: 'New Tier',
      minOrderAmount: 0,
      cost: 99,
      estimatedDays: '3-5 business days',
    };
    setShippingConfig(prev => ({ ...prev, tiers: [...prev.tiers, newTier] }));
  };

  const handleUpdateTier = (id: string, field: keyof ShippingTier, value: string | number) => {
    setShippingConfig(prev => ({
      ...prev,
      tiers: prev.tiers.map(t => t.id === id ? { ...t, [field]: field === 'cost' || field === 'minOrderAmount' ? Number(value) : value } : t),
    }));
  };

  const handleDeleteTier = (id: string) => {
    setShippingConfig(prev => ({ ...prev, tiers: prev.tiers.filter(t => t.id !== id) }));
  };

  // Product Filtering & Search
  const [productSearch, setProductSearch] = useState('');
  const [productGenderFilter, setProductGenderFilter] = useState<'all' | 'men' | 'women' | 'perfumes'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'out'>('all');
  const [productVisibilityFilter, setProductVisibilityFilter] = useState<'all' | 'live' | 'hidden'>('all');

  // Product Edit/Create Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form State
  const [productForm, setProductForm] = useState<{
    id?: string;
    name: string;
    slug: string;
    gender: 'men' | 'women';
    category: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    colors: ProductColor[];
    sizes: string[];
    stock: number;
    sku: string;
    rating: number;
    reviews: number;
    featured: boolean;
    newArrival: boolean;
    bestSeller: boolean;
    hidden: boolean;
    materials: string;
    fit: string;
    season: string;
    returnDays?: number;
    // Haute Parfumerie extensions
    isPerfume: boolean;
    perfumeFamily: string;
    concentration: string;
    longevity: string;
    sillage: string;
    topNotes: string;
    heartNotes: string;
    baseNotes: string;
    volumeOptions: PerfumeVolumeOption[];
  }>({
    name: '',
    slug: '',
    gender: 'women',
    category: 'kurtis',
    description: '',
    price: 18000,
    compareAtPrice: 0,
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop'],
    colors: [{ name: 'Obsidian Noir', hex: '#111113' }],
    sizes: ['S', 'M', 'L'],
    stock: 10,
    sku: 'AT-WM-01',
    rating: 5.0,
    reviews: 1,
    featured: false,
    newArrival: true,
    bestSeller: false,
    hidden: false,
    materials: '100% Pure Mulberry Silk & Hand-Spun Wool',
    fit: 'Tailored Silhouette',
    season: 'Autumn / Winter 2026',
    returnDays: undefined,
    isPerfume: false,
    perfumeFamily: 'Royal Oud & Oriental',
    concentration: 'Pure Concentrated Attar & Extrait (100% Pure Oil)',
    longevity: '24+ Hours · Eternal',
    sillage: 'Majestic & Enveloping',
    topNotes: '',
    heartNotes: '',
    baseNotes: '',
    volumeOptions: [],
  });

  // Size Management in Product Drawer
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [sizeCategoryTab, setSizeCategoryTab] = useState<'all' | 'alpha' | 'suit' | 'waist' | 'special' | 'perfume' | 'custom'>('all');
  const [customSizesList, setCustomSizesList] = useState<string[]>(['XXXL', 'XXXXL', '5XL', 'Custom Fit']);

  // Product Image input URL temporary
  const [newImageUrl, setNewImageUrl] = useState('');

  // Color Specific Photos Sub-panel
  const [activeColorImageIndex, setActiveColorImageIndex] = useState<number | null>(null);
  const [newColorImageUrl, setNewColorImageUrl] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#8a1c14');

  // Multi-Image Drag & Drop and Upload States
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState({ current: 0, total: 0, percent: 0 });
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingColorPhotos, setIsDraggingColorPhotos] = useState(false);
  const [isUploadingColorPhotos, setIsUploadingColorPhotos] = useState(false);
  const [colorUploadProgress, setColorUploadProgress] = useState({ current: 0, total: 0, percent: 0 });
  const colorFileInputRef = useRef<HTMLInputElement>(null);

  // Upload multiple images to main gallery (from drop or file input)
  const handleUploadMultipleGalleryFiles = async (rawFiles: (File | Blob)[]) => {
    const validFiles = Array.from(rawFiles).filter(
      (f): f is File => f instanceof File && (f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    );
    if (validFiles.length === 0) return;

    setIsUploadingGallery(true);
    setGalleryUploadProgress({ current: 0, total: validFiles.length, percent: 0 });
    showToast(`Uploading ${validFiles.length} image(s) to Cloudflare R2...`);

    let completed = 0;
    const uploadedUrls: string[] = [];

    await Promise.all(
      validFiles.map(async (file) => {
        const res = await uploadImageToR2(file, 'products', productForm.id || 'draft');
        completed += 1;
        const percent = Math.round((completed / validFiles.length) * 100);
        setGalleryUploadProgress({ current: completed, total: validFiles.length, percent });
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      })
    );

    if (uploadedUrls.length > 0) {
      setProductForm((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      showToast(`✓ Successfully uploaded all ${uploadedUrls.length} image(s) to Cloudflare R2!`);
    }
    setIsUploadingGallery(false);
  };

  // Upload multiple images to active color shade
  const handleUploadMultipleColorFiles = async (rawFiles: (File | Blob)[], activeColorName: string, activeIdx: number) => {
    const validFiles = Array.from(rawFiles).filter(
      (f): f is File => f instanceof File && (f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name))
    );
    if (validFiles.length === 0) return;

    setIsUploadingColorPhotos(true);
    setColorUploadProgress({ current: 0, total: validFiles.length, percent: 0 });
    showToast(`Uploading ${validFiles.length} photos for ${activeColorName} to Cloudflare R2...`);

    const entityId = `${productForm.id || 'draft'}-${activeColorName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    let completed = 0;
    const uploadedUrls: string[] = [];

    await Promise.all(
      validFiles.map(async (file) => {
        const res = await uploadImageToR2(file, 'products', entityId);
        completed += 1;
        const percent = Math.round((completed / validFiles.length) * 100);
        setColorUploadProgress({ current: completed, total: validFiles.length, percent });
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      })
    );

    if (uploadedUrls.length > 0) {
      const updatedColors = productForm.colors.map((c, i) => {
        if (i !== activeIdx) return c;
        const currentImgs = c.images && c.images.length > 0 ? [...c.images] : (c.image ? [c.image] : []);
        const updated = [...currentImgs, ...uploadedUrls];
        return {
          ...c,
          image: updated[0] || uploadedUrls[0],
          images: updated,
        };
      });
      setProductForm((prev) => ({ ...prev, colors: updatedColors }));
      showToast(`✓ Uploaded all ${uploadedUrls.length} photo(s) for ${activeColorName}!`);
    }
    setIsUploadingColorPhotos(false);
  };

  // Change primary gallery cover photo (moves selected photo to index 0)
  const handleSetPrimaryCover = (idx: number) => {
    if (idx <= 0 || idx >= productForm.images.length) return;
    const target = productForm.images[idx];
    const remaining = productForm.images.filter((_, i) => i !== idx);
    const updated = [target, ...remaining];
    setProductForm((prev) => ({ ...prev, images: updated }));
    showToast(`✓ Photo #${idx + 1} is now the primary cover photo!`);
  };

  // Move primary gallery photo left or right
  const handleMoveGalleryImage = (fromIdx: number, direction: 'left' | 'right') => {
    const toIdx = direction === 'left' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= productForm.images.length) return;
    const updated = [...productForm.images];
    const temp = updated[fromIdx];
    updated[fromIdx] = updated[toIdx];
    updated[toIdx] = temp;
    setProductForm((prev) => ({ ...prev, images: updated }));
    showToast(toIdx === 0 ? '✓ Photo moved to position #1 (Cover Photo)!' : `Photo moved to position #${toIdx + 1}`);
  };

  // Change color shade cover photo (moves photo to index 0 of that color)
  const handleSetColorCover = (colorIdx: number | null, imgIdx: number) => {
    if (colorIdx === null || imgIdx <= 0) return;
    const colorName = productForm.colors[colorIdx]?.name || 'color';
    const updatedColors = productForm.colors.map((c, i) => {
      if (i !== colorIdx) return c;
      const currentImgs = c.images && c.images.length > 0 ? [...c.images] : (c.image ? [c.image] : []);
      if (imgIdx >= currentImgs.length) return c;
      const target = currentImgs[imgIdx];
      const remaining = currentImgs.filter((_, idx) => idx !== imgIdx);
      const updated = [target, ...remaining];
      return {
        ...c,
        image: updated[0],
        images: updated,
      };
    });
    setProductForm((prev) => ({ ...prev, colors: updatedColors }));
    showToast(`✓ Photo #${imgIdx + 1} is now the cover photo for ${colorName}!`);
  };

  // Move color shade photo left or right
  const handleMoveColorImage = (colorIdx: number | null, fromIdx: number, direction: 'left' | 'right') => {
    if (colorIdx === null) return;
    const toIdx = direction === 'left' ? fromIdx - 1 : fromIdx + 1;
    const updatedColors = productForm.colors.map((c, i) => {
      if (i !== colorIdx) return c;
      const currentImgs = c.images && c.images.length > 0 ? [...c.images] : (c.image ? [c.image] : []);
      if (toIdx < 0 || toIdx >= currentImgs.length) return c;
      const updated = [...currentImgs];
      const temp = updated[fromIdx];
      updated[fromIdx] = updated[toIdx];
      updated[toIdx] = temp;
      return {
        ...c,
        image: updated[0],
        images: updated,
      };
    });
    setProductForm((prev) => ({ ...prev, colors: updatedColors }));
    showToast(toIdx === 0 ? '✓ Photo moved to position #1 (Color Cover)!' : `Photo moved to position #${toIdx + 1}`);
  };

  // Category Edit/Create Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryOriginalSlug, setCategoryOriginalSlug] = useState('');
  const [categoryForm, setCategoryForm] = useState<CategoryItem>({
    id: '',
    slug: '',
    name: '',
    shortName: '',
    gender: 'women',
    eyebrow: '',
    description: '',
    image: '',
    images: [],
    metaDescription: '',
    hidden: false,
  });
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('');
  const [categoryPreviewIndex, setCategoryPreviewIndex] = useState(0);
  const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState(false);

  // Bulk pricing temporary edits
  const [bulkEdits, setBulkEdits] = useState<Record<string, { price: number; compareAtPrice?: number; stock: number }>>({});

  // Delete Confirmation Modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'product' | 'category' | 'erase_all';
    id: string;
    name: string;
    gender?: 'men' | 'women' | 'perfumes';
  } | null>(null);

  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Import JSON input
  const [importJsonText, setImportJsonText] = useState('');

  // Supabase Cloud State
  const [supabaseCreds, setSupabaseCreds] = useState(() => getSupabaseCredentials());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseCredentials().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseCredentials().anonKey);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Currency Formatter
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Google OAuth Sign-In Handler (Exclusive for syedhamza1238@gmail.com)
  const handleGoogleSignIn = async () => {
    setIsSigningInWithGoogle(true);
    setAuthError(null);
    setUnauthorizedEmail(null);

    try {
      const redirectUrl = `${window.location.origin}/admin`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('Google Sign-In Error:', error);
        setAuthError(error.message);
        showToast(`Google Sign-In Error: ${error.message}`);
        setIsSigningInWithGoogle(false);
      }
    } catch (err: any) {
      console.error('Google Sign-In Exception:', err);
      setAuthError(err.message || 'Failed to initialize Google Sign-In');
      setIsSigningInWithGoogle(false);
    }
  };

  // Admin authentication is exclusively through Google OAuth
  // No client-side passwords, passkeys, or emergency overrides

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Signout error:', e);
    }
    setIsAuthenticated(false);
    setAdminUser(null);
    setUnauthorizedEmail(null);
    setAuthError(null);
    showToast('Logged out of Admin Portal');
  };

  // All Categories Combined
  const allCategories = useMemo(() => {
    return [...womenCategories, ...menCategories, ...perfumeCategories];
  }, [womenCategories, menCategories, perfumeCategories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (productSearch) {
        const query = productSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesCategory) return false;
      }

      // Gender / Department
      if (productGenderFilter === 'perfumes') {
        if (!p.isPerfume && p.category !== 'perfumes' && (p.gender as any) !== 'perfumes') return false;
      } else if (productGenderFilter !== 'all') {
        if (p.isPerfume || p.category === 'perfumes') return false;
        if (p.gender !== productGenderFilter) return false;
      }

      // Category
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;

      // Stock
      if (productStockFilter === 'instock' && p.stock <= 0) return false;
      if (productStockFilter === 'lowstock' && (p.stock <= 0 || p.stock > 3)) return false;
      if (productStockFilter === 'out' && p.stock > 0) return false;

      // Storefront Visibility
      if (productVisibilityFilter === 'live' && p.hidden) return false;
      if (productVisibilityFilter === 'hidden' && !p.hidden) return false;

      return true;
    });
  }, [products, productSearch, productGenderFilter, productCategoryFilter, productStockFilter, productVisibilityFilter]);

  // Live Statistics
  const stats = useMemo(() => {
    const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= 3 && p.stock > 0).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;
    const womenCount = products.filter((p) => p.gender === 'women').length;
    const menCount = products.filter((p) => p.gender === 'men').length;
    const hiddenCount = products.filter((p) => p.hidden).length;

    return {
      totalItems: products.length,
      womenItems: womenCount,
      menItems: menCount,
      totalCategories: allCategories.length,
      inventoryValue: totalInventoryValue,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      hiddenCount,
    };
  }, [products, allCategories]);

  // Perfume Filtering & Live State
  const [perfumeSearch, setPerfumeSearch] = useState('');
  const [perfumeFamilyFilter, setPerfumeFamilyFilter] = useState('all');
  const [perfumeVisibilityFilter, setPerfumeVisibilityFilter] = useState<'all' | 'live' | 'hidden'>('all');

  const perfumeProducts = useMemo(() => {
    return products.filter(p => p.isPerfume || p.category === 'perfumes');
  }, [products]);

  const filteredPerfumeProducts = useMemo(() => {
    return perfumeProducts.filter((p) => {
      if (perfumeSearch) {
        const q = perfumeSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesFamily = p.perfumeFamily?.toLowerCase().includes(q);
        const matchesNotes =
          (Array.isArray(p.perfumeNotes?.top) && p.perfumeNotes.top.some(n => String(n).toLowerCase().includes(q))) ||
          (Array.isArray(p.perfumeNotes?.heart) && p.perfumeNotes.heart.some(n => String(n).toLowerCase().includes(q))) ||
          (Array.isArray(p.perfumeNotes?.base) && p.perfumeNotes.base.some(n => String(n).toLowerCase().includes(q)));
        if (!matchesName && !matchesSku && !matchesFamily && !matchesNotes) return false;
      }
      if (perfumeFamilyFilter !== 'all' && p.perfumeFamily !== perfumeFamilyFilter) return false;

      // Visibility Filter
      if (perfumeVisibilityFilter === 'live' && p.hidden) return false;
      if (perfumeVisibilityFilter === 'hidden' && !p.hidden) return false;

      return true;
    });
  }, [perfumeProducts, perfumeSearch, perfumeFamilyFilter, perfumeVisibilityFilter]);

  const [isSeedingPerfumes, setIsSeedingPerfumes] = useState(false);

  const handleSeedPerfumes = async () => {
    setIsSeedingPerfumes(true);
    try {
      let count = 0;
      for (const p of HAUTE_PERFUMES_PRESETS) {
        if (!products.some(existing => existing.id === p.id || existing.slug === p.slug)) {
          await addProduct(p);
          count++;
        }
      }
      showToast(`Royal Haute Parfumerie collection seeded successfully (${count} pieces added)!`);
    } catch (err: any) {
      console.error('Failed to seed perfumes', err);
      showToast(`Seeding notice: ${err.message || 'Error occurred'}`);
    } finally {
      setIsSeedingPerfumes(false);
    }
  };

  const handleOpenCreatePerfume = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      slug: '',
      gender: 'men',
      category: 'perfumes',
      description: '',
      price: 4500,
      compareAtPrice: 5500,
      images: ['https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1200&auto=format&fit=crop'],
      colors: [],
      sizes: ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'],
      stock: 15,
      sku: `AT-PARF-${Date.now().toString().slice(-4)}`,
      rating: 5.0,
      reviews: 1,
      featured: true,
      newArrival: true,
      bestSeller: false,
      hidden: false,
      materials: 'Pure Aged Agarwood, Ambergris, Mysore Sandalwood',
      fit: 'Concentrated Elixir · Apply to pulse points',
      season: 'HAUTE PARFUMERIE',
      returnDays: 0,
      isPerfume: true,
      perfumeFamily: 'Royal Oud & Oriental',
      concentration: 'Pure Concentrated Attar & Extrait (100% Pure Oil)',
      longevity: '24+ Hours · Eternal',
      sillage: 'Majestic & Enveloping',
      topNotes: 'Wild Bergamot, Saffron, Pink Pepper',
      heartNotes: 'Smoky Cedar, Frankincense',
      baseNotes: 'Aged Dehn Al Oud, Ambergris, Sandalwood',
      volumeOptions: [
        { ml: '6ml (Attar)', price: 4500, compareAtPrice: 5500, inStock: true },
        { ml: '12ml (1 Tola)', price: 8500, compareAtPrice: 10500, inStock: true },
        { ml: '50ml (Extrait)', price: 18500, compareAtPrice: 22000, inStock: true },
        { ml: '100ml (Grand Flacon)', price: 29000, compareAtPrice: 35000, inStock: true },
      ],
    });
    setCustomSizeInput('');
    setSizeCategoryTab('perfume');
    setNewImageUrl('');
    setActiveColorImageIndex(null);
    setNewColorImageUrl('');
    setIsProductModalOpen(true);
  };

  // Open Create Product Modal
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    const defaultGender = 'women';
    const firstCat = womenCategories[0]?.slug || 'kurtis';
    setProductForm({
      name: '',
      slug: '',
      gender: defaultGender,
      category: firstCat,
      description: '',
      price: 19500,
      compareAtPrice: 0,
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop'],
      colors: [{ name: 'Obsidian Noir', hex: '#111113', images: [] }],
      sizes: ['S', 'M', 'L'],
      stock: 8,
      sku: `AT-${Date.now().toString().slice(-4)}`,
      rating: 5.0,
      reviews: 1,
      featured: false,
      newArrival: true,
      bestSeller: false,
      hidden: false,
      materials: 'Pure Mulberry Silk & Italian Wool',
      fit: 'Relaxed Architectural Silhouette',
      season: 'Autumn / Winter 2026',
      returnDays: undefined,
      isPerfume: false,
      perfumeFamily: 'Royal Oud & Oriental',
      concentration: 'Extrait de Parfum',
      longevity: '18+ Hours · Eternal',
      sillage: 'Majestic & Enveloping',
      topNotes: '',
      heartNotes: '',
      baseNotes: '',
      volumeOptions: [],
    });
    setCustomSizeInput('');
    setSizeCategoryTab('all');
    setNewImageUrl('');
    setActiveColorImageIndex(null);
    setNewColorImageUrl('');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    const isPerf = Boolean(p.isPerfume || p.category === 'perfumes');
    setProductForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      gender: p.gender,
      category: p.category,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice || 0,
      images: [...p.images],
      colors: isPerf
        ? []
        : (p.colors || []).map(c => ({
            name: c.name,
            hex: c.hex,
            image: c.image,
            images: c.images ? [...c.images] : (c.image ? [c.image] : []),
          })),
      sizes: [...p.sizes],
      stock: p.stock,
      sku: p.sku,
      rating: p.rating,
      reviews: p.reviews,
      featured: !!p.featured,
      newArrival: !!p.newArrival,
      bestSeller: !!p.bestSeller,
      hidden: Boolean(p.hidden),
      materials: p.materials || '',
      fit: p.fit || '',
      season: p.season || 'Autumn / Winter 2026',
      returnDays: p.returnDays,
      isPerfume: isPerf,
      perfumeFamily: p.perfumeFamily || 'Royal Oud & Oriental',
      concentration: p.concentration || 'Extrait de Parfum',
      longevity: p.longevity || '18+ Hours · Eternal',
      sillage: p.sillage || 'Majestic & Enveloping',
      topNotes: Array.isArray(p.perfumeNotes?.top) ? p.perfumeNotes.top.join(', ') : (typeof p.perfumeNotes?.top === 'string' ? p.perfumeNotes.top : ''),
      heartNotes: Array.isArray(p.perfumeNotes?.heart) ? p.perfumeNotes.heart.join(', ') : (typeof p.perfumeNotes?.heart === 'string' ? p.perfumeNotes.heart : ''),
      baseNotes: Array.isArray(p.perfumeNotes?.base) ? p.perfumeNotes.base.join(', ') : (typeof p.perfumeNotes?.base === 'string' ? p.perfumeNotes.base : ''),
      volumeOptions: Array.isArray(p.volumeOptions) && p.volumeOptions.length > 0
        ? [...p.volumeOptions]
        : (Array.isArray(p.sizes) ? p.sizes : []).map(sz => ({ ml: sz, price: p.price, compareAtPrice: p.compareAtPrice, inStock: true })),
    });
    setCustomSizeInput('');
    setSizeCategoryTab(isPerf ? 'perfume' : 'all');
    // Ensure any sizes on the product not in STANDARD_SIZES appear in customSizesList
    const extra = (Array.isArray(p.sizes) ? p.sizes : []).filter(s => !STANDARD_SIZES.includes(s));
    if (extra.length > 0) {
      setCustomSizesList(prev => Array.from(new Set([...prev, ...extra])));
    }
    setNewImageUrl('');
    setActiveColorImageIndex(null);
    setNewColorImageUrl('');
    setIsProductModalOpen(true);
  };

  // Duplicate Product
  const handleDuplicateProduct = async (p: Product) => {
    const duplicated: Omit<Product, 'id'> = {
      ...p,
      name: `${p.name} (Copy)`,
      slug: `${p.slug}-copy-${Date.now().toString().slice(-3)}`,
      sku: `${p.sku}-CP`,
      returnDays: p.returnDays,
    };
    try {
      await addProduct(duplicated);
    } catch (err: any) {
      console.error('Failed to duplicate product', err);
      showToast(`Duplication failed: ${err.message || 'Database error'}`);
    }
  };

  // Save Product Form
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showToast('Product title is required');
      return;
    }
    if (productForm.images.length === 0) {
      showToast('At least one image URL is required');
      return;
    }

    const slug = productForm.slug.trim() || productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const isPerfumeItem = Boolean(productForm.isPerfume || productForm.category === 'perfumes');
    const topArr = productForm.topNotes ? productForm.topNotes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const heartArr = productForm.heartNotes ? productForm.heartNotes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const baseArr = productForm.baseNotes ? productForm.baseNotes.split(',').map(s => s.trim()).filter(Boolean) : [];

    const validVolumeOptions: PerfumeVolumeOption[] = isPerfumeItem
      ? productForm.sizes.map(sz => {
          const existing = productForm.volumeOptions.find(vo => vo.ml === sz);
          return {
            ml: sz,
            price: existing && existing.price > 0 ? Number(existing.price) : Number(productForm.price),
            compareAtPrice: existing?.compareAtPrice ? Number(existing.compareAtPrice) : undefined,
            inStock: existing?.inStock !== undefined ? existing.inStock : true,
          };
        })
      : [];

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: productForm.name.trim(),
      slug,
      gender: productForm.gender,
      category: productForm.category,
      description: productForm.description.trim(),
      price: Number(productForm.price),
      compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : undefined,
      images: productForm.images.filter(img => !!img.trim()),
      colors: isPerfumeItem
        ? []
        : (productForm.colors.length > 0
            ? productForm.colors.map(c => ({
                name: c.name,
                hex: c.hex,
                image: (c.images && c.images.length > 0) ? c.images[0] : c.image,
                images: (c.images && c.images.length > 0) ? c.images : (c.image ? [c.image] : []),
              }))
            : [{ name: 'Standard', hex: '#111113', images: [] }]),
      sizes: productForm.sizes.length > 0 ? productForm.sizes : ['One Size'],
      stock: Math.max(0, Number(productForm.stock)),
      sku: productForm.sku.trim() || `AT-${Date.now().toString().slice(-4)}`,
      rating: productForm.rating || 5.0,
      reviews: productForm.reviews || 1,
      featured: productForm.featured,
      newArrival: productForm.newArrival,
      bestSeller: productForm.bestSeller,
      hidden: Boolean(productForm.hidden),
      materials: productForm.materials.trim(),
      fit: productForm.fit.trim(),
      season: productForm.season.trim(),
      returnDays: productForm.returnDays !== undefined && productForm.returnDays !== null ? Number(productForm.returnDays) : undefined,
      isPerfume: isPerfumeItem,
      perfumeFamily: isPerfumeItem ? productForm.perfumeFamily : undefined,
      concentration: isPerfumeItem ? productForm.concentration : undefined,
      longevity: isPerfumeItem ? productForm.longevity : undefined,
      sillage: isPerfumeItem ? productForm.sillage : undefined,
      perfumeNotes: isPerfumeItem && (topArr.length || heartArr.length || baseArr.length) ? {
        top: topArr,
        heart: heartArr,
        base: baseArr,
      } : undefined,
      volumeOptions: isPerfumeItem && validVolumeOptions.length > 0 ? validVolumeOptions : undefined,
      volumeMl: isPerfumeItem ? productForm.sizes : undefined,
    };

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        await updateProduct(productPayload);
      } else {
        await addProduct(productPayload);
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save product', err);
      showToast(`Save failed: ${err.message || 'Database error'}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Open Category Edit/Create
  const handleOpenCreateCategory = (genderChoice: 'women' | 'men' | 'perfumes') => {
    setEditingCategory(null);
    setCategoryOriginalSlug('');
    const defaultEyebrow = genderChoice === 'perfumes'
      ? 'HAUTE PARFUMERIE · '
      : `${genderChoice.toUpperCase()}'S WARDROBE · `;
    setCategoryForm({
      id: '',
      slug: '',
      name: '',
      shortName: '',
      gender: genderChoice,
      eyebrow: defaultEyebrow,
      description: '',
      image: '',
      images: [],
      metaDescription: '',
      hidden: false,
    });
    setNewCategoryImageUrl('');
    setCategoryPreviewIndex(0);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryOriginalSlug(cat.slug);
    const catImages = (cat.images && cat.images.length > 0)
      ? cat.images.filter(img => Boolean(img && !img.includes('images.unsplash.com')))
      : (cat.image && !cat.image.includes('images.unsplash.com') ? [cat.image] : []);
    const catCover = (cat.image && !cat.image.includes('images.unsplash.com')) ? cat.image : (catImages[0] || '');
    setCategoryForm({
      ...cat,
      image: catCover,
      images: catImages,
      hidden: Boolean(cat.hidden),
    });
    setNewCategoryImageUrl('');
    setCategoryPreviewIndex(0);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast('Category name is required');
      return;
    }

    const slug = categoryForm.slug.trim() || categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const shortName = categoryForm.shortName.trim() || categoryForm.name.trim();
    const id = editingCategory ? editingCategory.id : slug;

    // Filter valid images (only what admin uploaded/added)
    const rawImages = categoryForm.images || [];
    const validImages = rawImages.filter(img => Boolean(img && img.trim() && !img.includes('images.unsplash.com')));
    if (categoryForm.image && !categoryForm.image.includes('images.unsplash.com') && !validImages.includes(categoryForm.image.trim())) {
      validImages.unshift(categoryForm.image.trim());
    }
    const primaryCover = validImages[0] || (categoryForm.image && !categoryForm.image.includes('images.unsplash.com') ? categoryForm.image.trim() : '');

    const defaultEyebrow = categoryForm.gender === 'perfumes'
      ? `HAUTE PARFUMERIE · ${shortName.toUpperCase()}`
      : `${categoryForm.gender.toUpperCase()}'S WARDROBE · ${shortName.toUpperCase()}`;
    const defaultMeta = categoryForm.gender === 'perfumes'
      ? `Explore luxury ${shortName} artisanal perfumes and pure attars from Zarb.`
      : `Explore luxury ${shortName} collection from Zarb.`;

    const payload: CategoryItem = {
      ...categoryForm,
      id,
      slug,
      shortName,
      name: categoryForm.name.trim(),
      eyebrow: categoryForm.eyebrow.trim() || defaultEyebrow,
      description: categoryForm.description.trim(),
      image: primaryCover,
      images: validImages,
      metaDescription: categoryForm.metaDescription.trim() || defaultMeta,
      hidden: Boolean(categoryForm.hidden),
    };

    if (editingCategory) {
      updateCategory(payload, categoryOriginalSlug);
    } else {
      addCategory(payload);
    }

    setIsCategoryModalOpen(false);
  };

  // Confirm Delete Action
  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;

    try {
      if (deleteConfirmTarget.type === 'product') {
        await deleteProduct(deleteConfirmTarget.id);
      } else if (deleteConfirmTarget.type === 'erase_all') {
        await eraseAllProducts();
      } else if (deleteConfirmTarget.type === 'category' && deleteConfirmTarget.gender) {
        deleteCategory(deleteConfirmTarget.gender, deleteConfirmTarget.id);
      }
    } catch (err: any) {
      console.error('Delete execution error:', err);
      showToast(`Delete failed: ${err.message || 'Database error'}`);
    }

    setDeleteConfirmTarget(null);
  };

  // Quick Visibility Toggles (Storefront live vs hidden)
  const handleToggleCategoryVisibility = (cat: CategoryItem) => {
    const updated = { ...cat, hidden: !cat.hidden };
    updateCategory(updated, cat.slug);
    showToast(
      updated.hidden
        ? `Category "${cat.name}" is now hidden from the front store`
        : `Category "${cat.name}" is now live on the front store`
    );
  };

  const handleToggleProductVisibility = async (p: Product) => {
    const updated = { ...p, hidden: !p.hidden };
    try {
      await updateProduct(updated);
      showToast(
        updated.hidden
          ? `"${p.name}" is now hidden from the front store`
          : `"${p.name}" is now live on the front store`
      );
    } catch (err: any) {
      showToast(`Visibility update failed: ${err.message || 'Error'}`);
    }
  };

  // Bulk Price & Stock Edit Handlers
  const handleBulkChange = (id: string, field: 'price' | 'compareAtPrice' | 'stock', value: number) => {
    setBulkEdits(prev => {
      const existing = prev[id] || {
        price: products.find(p => p.id === id)?.price || 0,
        compareAtPrice: products.find(p => p.id === id)?.compareAtPrice,
        stock: products.find(p => p.id === id)?.stock || 0,
      };
      return {
        ...prev,
        [id]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleSaveBulkRow = async (p: Product) => {
    const edit = bulkEdits[p.id];
    if (!edit) return;
    const updated: Product = {
      ...p,
      price: edit.price,
      compareAtPrice: edit.compareAtPrice,
      stock: edit.stock,
    };
    try {
      await updateProduct(updated);
      setBulkEdits(prev => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
    } catch (err: any) {
      console.error('Failed to save bulk row', err);
      showToast(`Save failed: ${err.message || 'Database error'}`);
    }
  };

  // Export File Download
  const handleExportDownload = () => {
    const json = exportCatalogJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atelier-noir-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Catalog exported to JSON file');
  };

  // Import JSON action
  const handleImportSubmit = () => {
    if (!importJsonText.trim()) {
      showToast('Please paste valid JSON text');
      return;
    }
    const res = importCatalogJson(importJsonText);
    if (res.success) {
      setImportJsonText('');
    } else {
      showToast(`Import Error: ${res.message}`);
    }
  };

  // Save Supabase Configuration
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      showToast('Both URL and Anon key are required');
      return;
    }
    const ok = saveSupabaseCredentials(supabaseUrlInput.trim(), supabaseKeyInput.trim());
    if (ok) {
      setSupabaseCreds(getSupabaseCredentials());
      showToast('Supabase credentials successfully updated!');
    } else {
      showToast('Invalid URL. Must begin with https://');
    }
  };

  // Push Local Catalog to Supabase Cloud Tables
  const handlePushCatalogToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      showToast('Please enter your Supabase Project URL and Anon Key first');
      return;
    }
    setIsSyncingCloud(true);
    try {
      // 1. Categories
      const allCats = [...womenCategories, ...menCategories].map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        short_name: c.shortName,
        gender: c.gender,
        eyebrow: c.eyebrow,
        description: c.description,
        image: c.image,
        meta_description: c.metaDescription,
      }));

      const { error: catErr } = await supabase
        .from('categories')
        .upsert(allCats, { onConflict: 'id' });

      if (catErr) throw catErr;

      // 2. Products
      const allProds = products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        gender: p.gender,
        category: p.category,
        description: p.description,
        price: p.price,
        compare_at_price: p.compareAtPrice || null,
        images: p.images,
        colors: p.colors,
        sizes: p.sizes,
        stock: p.stock,
        sku: p.sku,
        rating: p.rating,
        reviews: p.reviews,
        featured: p.featured || false,
        new_arrival: p.newArrival || false,
        best_seller: p.bestSeller || false,
        materials: p.materials || '',
        fit: p.fit || '',
        season: p.season || '',
      }));

      const { error: prodErr } = await supabase
        .from('products')
        .upsert(allProds, { onConflict: 'id' });

      if (prodErr) throw prodErr;

      showToast(`Successfully uploaded ${allProds.length} products & ${allCats.length} categories to Supabase cloud!`);
    } catch (e: any) {
      console.error('Supabase Push Error', e);
      showToast(`Push failed: ${e.message || 'Check database tables'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Pull Catalog from Supabase Cloud Tables
  const handlePullCatalogFromSupabase = async () => {
    if (!isSupabaseConfigured()) {
      showToast('Please enter your Supabase Project URL and Anon Key first');
      return;
    }
    setIsSyncingCloud(true);
    try {
      const { data: catData, error: catErr } = await supabase.from('categories').select('*');
      if (catErr) throw catErr;

      const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
      if (prodErr) throw prodErr;

      if (prodData && prodData.length > 0) {
        const mappedProducts: Product[] = prodData.map((d: any) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          gender: d.gender,
          category: d.category,
          description: d.description,
          price: Number(d.price),
          compareAtPrice: d.compare_at_price ? Number(d.compare_at_price) : undefined,
          images: d.images || [],
          colors: d.colors || [],
          sizes: d.sizes || [],
          stock: Number(d.stock),
          sku: d.sku,
          rating: Number(d.rating || 5),
          reviews: Number(d.reviews || 1),
          featured: Boolean(d.featured),
          newArrival: Boolean(d.new_arrival),
          bestSeller: Boolean(d.best_seller),
          materials: d.materials,
          fit: d.fit,
          season: d.season,
        }));

        localStorage.setItem('atelier_products_v2', JSON.stringify(mappedProducts));
      }

      if (catData && catData.length > 0) {
        const womenCats = catData
          .filter((c: any) => c.gender === 'women')
          .map((c: any) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            shortName: c.short_name || c.shortName,
            gender: 'women' as const,
            eyebrow: c.eyebrow,
            description: c.description,
            image: c.image,
            metaDescription: c.meta_description || c.metaDescription,
          }));

        const menCats = catData
          .filter((c: any) => c.gender === 'men')
          .map((c: any) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            shortName: c.short_name || c.shortName,
            gender: 'men' as const,
            eyebrow: c.eyebrow,
            description: c.description,
            image: c.image,
            metaDescription: c.meta_description || c.metaDescription,
          }));

        if (womenCats.length > 0) {
          localStorage.setItem('atelier_women_categories_v2', JSON.stringify(womenCats));
        }
        if (menCats.length > 0) {
          localStorage.setItem('atelier_men_categories_v2', JSON.stringify(menCats));
        }
      }

      showToast('Successfully synchronized catalog from Supabase cloud!');
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      console.error('Supabase Pull Error', e);
      showToast(`Pull failed: ${e.message}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // =========================================================================
  // RENDER: PASSCODE LOCK GATEWAY
  // =========================================================================
  // =========================================================================
  // RENDER: GOOGLE SIGN-IN GATEWAY (EXCLUSIVE FOR syedhamza1238@gmail.com)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center p-4 selection:bg-amber-500/30">
        <div className="w-full max-w-md bg-[#101014] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Subtle gold specular beam */}
          <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-6 relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-xl">
              <ShieldCheck className="w-8 h-8 stroke-[1.5]" />
            </div>
            <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-amber-400/90 block mb-1">
              Atelier Archive Security
            </span>
            <h1 className="text-2xl font-serif tracking-widest text-white">
              HAUTE PORTAL GATE
            </h1>
            <p className="text-xs text-stone-400 font-light mt-2 leading-relaxed">
              Administrative authorization required. Access is strictly restricted to the authorized master administrator.
            </p>
          </div>

          {/* Designated Authorized Email Badge */}
          <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center space-x-3 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-stone-400 block">
                Exclusive Authorized Account
              </span>
              <span className="text-xs font-mono font-semibold text-amber-300 truncate block">
                {AUTHORIZED_ADMIN_EMAIL}
              </span>
            </div>
          </div>

          {/* Unauthorized Access Denied Alert Banner */}
          {unauthorizedEmail && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/35 text-left relative z-10 animate-fade-in shadow-xl">
              <div className="flex items-center space-x-2 text-red-400 font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>ACCESS DENIED (UNAUTHORIZED)</span>
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed">
                The account <strong className="font-mono text-white underline">{unauthorizedEmail}</strong> is not authorized to access this portal. Only <strong className="font-mono text-amber-300">{AUTHORIZED_ADMIN_EMAIL}</strong> has administrative permissions.
              </p>
            </div>
          )}

          {/* Error Message */}
          {authError && !unauthorizedEmail && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300 flex items-center space-x-2 relative z-10">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-4 relative z-10">
            {/* PRIMARY ACTION: SIGN IN WITH GOOGLE */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningInWithGoogle || isCheckingAuth}
              className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-stone-100 text-stone-950 text-xs font-sans tracking-[0.15em] uppercase font-bold transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(255,255,255,0.15)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-3 border border-white/80 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSigningInWithGoogle ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-stone-900" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google 'G' Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign In with Google</span>
                </>
              )}
            </button>

            <div className="text-center text-xs text-stone-400 pt-2">
              <p className="text-[10px] tracking-wider uppercase text-stone-500">
                Admin access requires authorized Google account
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-stone-400 hover:text-white transition-colors tracking-wider uppercase flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
            >
              <span>Return to Public Storefront</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className={`min-h-screen ${theme === 'alabaster' ? 'bg-[#faf9f5] text-[#121214]' : 'bg-[#09090c] text-stone-100'} transition-colors duration-300 selection:bg-amber-500/25`}>
      {/* Admin Top Navigation Bar */}
      <header className={`sticky top-0 z-40 px-4 sm:px-8 py-3.5 border-b backdrop-blur-xl transition-colors ${
        theme === 'alabaster'
          ? 'bg-white/90 border-stone-200/80 shadow-sm'
          : 'bg-[#0e0e12]/90 border-white/10 shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Monogram & Portal Indicator */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2.5 cursor-pointer focus:outline-none group"
              title="View Storefront"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm">
                Z
              </div>
              <div className="text-left">
                <span className="font-brand tracking-[0.25em] text-xs font-semibold uppercase block leading-none">
                  ZARB
                </span>
                <span className="text-[9px] font-mono tracking-[0.2em] text-amber-500 uppercase">
                  MASTER PORTAL
                </span>
              </div>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Authenticated Master Admin Badge */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-stone-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-stone-300 text-[11px] tracking-wider">
                {adminUser?.email || AUTHORIZED_ADMIN_EMAIL}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 uppercase tracking-widest font-semibold">
                Super Admin
              </span>
            </div>

            {/* Storefront Link */}
            <button
              onClick={() => navigate('/')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase border transition-colors cursor-pointer ${
                theme === 'alabaster'
                  ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                  : 'bg-white/5 hover:bg-white/10 text-stone-200 border-white/10'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                theme === 'alabaster'
                  ? 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                  : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Theme"
            >
              {theme === 'alabaster' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-mono"
              title="Lock Admin Portal & Sign Out"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Header Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Pieces */}
          <div className={`card-neumorphic p-4 sm:p-5 transition-all ${
            theme === 'alabaster' ? 'bg-[#f4f3ec]' : 'bg-[#121216]'
          }`}>
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em]">Total Pieces</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-light">
              {stats.totalItems}
            </div>
            <span className="text-[10px] text-stone-400 tracking-wider">
              {stats.womenItems} Women · {stats.menItems} Men
            </span>
          </div>

          {/* Client Orders */}
          <div className={`card-neumorphic p-4 sm:p-5 transition-all ${
            theme === 'alabaster' ? 'bg-[#f4f3ec]' : 'bg-[#121216]'
          }`}>
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em]">Client Orders</span>
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-light text-emerald-400">
              {orderStats.totalOrders}
            </div>
            <span className="text-[10px] text-stone-400 tracking-wider">
              {orderStats.pending} Pending · {formatINR(orderStats.totalRevenue)}
            </span>
          </div>

          {/* Reviews Moderation */}
          <div className={`card-neumorphic p-4 sm:p-5 transition-all ${
            theme === 'alabaster' ? 'bg-[#f4f3ec]' : 'bg-[#121216]'
          }`}>
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em]">Client Reviews</span>
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-light text-amber-400">
              ★ {reviewStats.avg}
            </div>
            <span className="text-[10px] text-stone-400 tracking-wider">
              {reviewStats.totalCount} Verified Appraisals
            </span>
          </div>

          {/* Categories */}
          <div className={`card-neumorphic p-4 sm:p-5 transition-all ${
            theme === 'alabaster' ? 'bg-[#f4f3ec]' : 'bg-[#121216]'
          }`}>
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em]">Categories</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-light">
              {stats.totalCategories}
            </div>
            <span className="text-[10px] text-stone-400 tracking-wider">
              {womenCategories.length} Women · {menCategories.length} Men
            </span>
          </div>

          {/* Inventory Valuation */}
          <div className={`card-neumorphic p-4 sm:p-5 transition-all ${
            theme === 'alabaster' ? 'bg-[#f4f3ec]' : 'bg-[#121216]'
          }`}>
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em]">Inventory Value</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-serif font-light text-blue-400">
              {formatINR(stats.inventoryValue)}
            </div>
            <span className="text-[10px] text-stone-400 tracking-wider">
              {stats.lowStock} Low Stock Alert
            </span>
          </div>
        </section>

        {/* Portal Management Tabs */}
        <section className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          {/* Tab 1: Products */}
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'products'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-white text-black font-semibold shadow-lg')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Master ({products.length})</span>
          </button>

          {/* Tab 2: Categories */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'categories'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-white text-black font-semibold shadow-lg')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories & Silhouettes ({allCategories.length})</span>
          </button>

          {/* Tab: Haute Parfumerie & Royal Attar */}
          <button
            onClick={() => setActiveTab('perfumes')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'perfumes'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-white text-black font-semibold shadow-lg')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Haute Parfumerie & Perfumes ({perfumeProducts.length})</span>
          </button>

          {/* Tab 3: Client Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'orders'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-white text-black font-semibold shadow-lg')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Client Orders ({orders.length})</span>
          </button>

          {/* Tab 4: Reviews Moderation */}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-white text-black font-semibold shadow-lg')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span>Reviews Moderation ({allReviewsList.length})</span>
          </button>

          {/* Tab 5: Quick Pricing */}
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'pricing'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-white text-black font-semibold shadow-lg')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Quick Pricing & Stock</span>
          </button>

          {/* Tab 6: Backup & Reset */}
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'backup'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-white text-black font-semibold shadow-lg')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup & Reset</span>
          </button>

          {/* Tab 7: Shipping Management */}
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'shipping'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-white text-black font-semibold shadow-lg')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <Truck className="w-4 h-4 text-sky-400" />
            <span>Shipping & Returns</span>
          </button>

          {/* Tab 8: Client Waitlist Requests */}
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-sans tracking-[0.15em] uppercase transition-all cursor-pointer ${
              activeTab === 'waitlist'
                ? (theme === 'alabaster' ? 'bg-[#121214] text-white shadow-md' : 'bg-amber-400 text-black font-semibold shadow-lg shadow-amber-400/20')
                : (theme === 'alabaster' ? 'text-stone-600 hover:text-black hover:bg-stone-100' : 'text-stone-400 hover:text-white hover:bg-white/5')
            }`}
          >
            <Bell className={`w-4 h-4 ${pendingRestockCount > 0 ? (activeTab === 'waitlist' ? 'text-black' : 'text-amber-400') : ''}`} />
            <span>Waitlist Requests</span>
            {pendingRestockCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'waitlist' ? 'bg-black text-amber-300' : 'bg-amber-400 text-black'
              }`}>
                {pendingRestockCount}
              </span>
            )}
          </button>
        </section>

        {/* =================================================================== */}
        {/* TAB 1: PRODUCTS MASTER                                              */}
        {/* =================================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter & Action Controls */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search pieces by title, SKU, or category..."
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs tracking-wider focus:outline-none border ${
                    theme === 'alabaster'
                      ? 'bg-stone-100 border-stone-300 text-stone-900 placeholder:text-stone-400'
                      : 'bg-black/50 border-white/10 text-white placeholder:text-stone-500'
                  }`}
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Gender / Department Filter */}
                <select
                  value={productGenderFilter}
                  onChange={(e) => setProductGenderFilter(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">All Departments</option>
                  <option value="women">Women's Collection</option>
                  <option value="men">Men's Collection</option>
                  <option value="perfumes">✨ Haute Parfumerie (Perfumes)</option>
                </select>

                {/* Category */}
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((c) => (
                    <option key={`${c.gender}-${c.slug}`} value={c.slug}>
                      {c.gender.toUpperCase()} · {c.shortName}
                    </option>
                  ))}
                </select>

                {/* Stock Status */}
                <select
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">Stock: All</option>
                  <option value="instock">In Stock</option>
                  <option value="lowstock">Low Stock (≤3)</option>
                  <option value="out">Out of Stock</option>
                </select>

                {/* Storefront Visibility */}
                <select
                  value={productVisibilityFilter}
                  onChange={(e) => setProductVisibilityFilter(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">Visibility: All</option>
                  <option value="live">Live on Store</option>
                  <option value="hidden">Hidden from Store</option>
                </select>

                {/* Cloud Refresh Button */}
                <button
                  type="button"
                  onClick={async () => {
                    await refreshProductsFromCloud();
                    showToast('Catalog refreshed directly from cloud database.');
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs tracking-wider uppercase border transition-all cursor-pointer ${
                    theme === 'alabaster'
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                      : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/15'
                  }`}
                  title="Synchronize and fetch latest catalog from Supabase cloud database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProductsLoading ? 'animate-spin text-amber-400' : ''}`} />
                  <span className="hidden sm:inline">Sync Cloud</span>
                </button>

                {/* Add New Perfume Button */}
                <button
                  type="button"
                  onClick={handleOpenCreatePerfume}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-semibold text-xs tracking-[0.12em] uppercase transition-all shadow-sm cursor-pointer"
                  title="Create and publish a new Haute Parfumerie flacon or pure attar"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>+ Add Perfume</span>
                </button>

                {/* Add New Piece Button */}
                <button
                  type="button"
                  onClick={handleOpenCreateProduct}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-[0.15em] uppercase transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Piece</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className={`rounded-2xl border overflow-hidden ${
              theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#101014] border-white/10'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b text-[10px] tracking-[0.2em] uppercase ${
                      theme === 'alabaster' ? 'bg-stone-100 text-stone-600 border-stone-200' : 'bg-white/[0.02] text-stone-400 border-white/10'
                    }`}>
                      <th className="py-3 px-4">Item & SKU</th>
                      <th className="py-3 px-4">Gender & Category</th>
                      <th className="py-3 px-4">Pricing</th>
                      <th className="py-3 px-4">Inventory</th>
                      <th className="py-3 px-4">Badges & Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => {
                        const isLowStock = product.stock <= 3 && product.stock > 0;
                        const isOut = product.stock <= 0;
                        return (
                          <tr
                            key={product.id}
                            className={`transition-colors ${
                              product.hidden ? 'opacity-75 bg-amber-500/[0.02]' : ''
                            } ${
                              theme === 'alabaster' ? 'hover:bg-stone-50' : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            {/* Product Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={product.images[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=200'}
                                  alt={product.name}
                                  className="w-11 h-14 object-cover rounded-lg bg-stone-900 shrink-0 border border-white/10"
                                />
                                <div className="min-w-0">
                                  <div className="font-medium truncate max-w-xs sm:max-w-sm">
                                    {product.name}
                                  </div>
                                  <div className="text-[10px] font-mono text-stone-400 tracking-wider">
                                    SKU: {product.sku}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Gender & Category */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase tracking-wider mr-2 font-medium ${
                                product.gender === 'women'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {product.gender}
                              </span>
                              <span className="capitalize text-stone-300">
                                {product.category.replace('-', ' ')}
                              </span>
                            </td>

                            {/* Pricing */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-medium text-amber-400">
                                {formatINR(product.price)}
                              </div>
                              {product.compareAtPrice && (
                                <div className="text-[10px] text-stone-500 line-through">
                                  {formatINR(product.compareAtPrice)}
                                </div>
                              )}
                            </td>

                            {/* Inventory */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex flex-col items-start gap-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                                  isOut
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : isLowStock
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {isOut ? 'Out of Stock' : `${product.stock} units`}
                                </span>
                                {(() => {
                                  const reqCount = restockRequests.filter(r => r.productId === product.id && r.status === 'pending').length;
                                  if (reqCount === 0) return null;
                                  return (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRestockSearch(product.name);
                                        setActiveTab('waitlist');
                                      }}
                                      className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 transition-colors cursor-pointer"
                                      title="View client waitlist requests for this piece"
                                    >
                                      <Bell className="w-2.5 h-2.5 text-amber-400" />
                                      <span>{reqCount} Waitlist</span>
                                    </button>
                                  );
                                })()}
                              </div>
                            </td>

                            {/* Editorial & Visibility Badges */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1">
                                <div>
                                  {product.hidden ? (
                                    <span
                                      className="inline-flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-medium"
                                      title="Hidden from storefront (Draft / Archived)"
                                    >
                                      <EyeOff className="w-2.5 h-2.5 text-amber-400" />
                                      HIDDEN
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-mono font-medium"
                                      title="Live on storefront"
                                    >
                                      <Eye className="w-2.5 h-2.5 text-emerald-400" />
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1">
                                  {product.newArrival && (
                                    <span className="text-[8px] bg-white text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" title="New Arrival">
                                      NEW
                                    </span>
                                  )}
                                  {product.bestSeller && (
                                    <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" title="Best Seller">
                                      BEST
                                    </span>
                                  )}
                                  {product.featured && (
                                    <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" title="Featured">
                                      STAR
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductVisibility(product)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    product.hidden
                                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                                      : theme === 'alabaster'
                                        ? 'hover:bg-stone-200 text-stone-600 border-stone-300'
                                        : 'hover:bg-white/10 text-stone-400 border-white/10'
                                  }`}
                                  title={product.hidden ? 'Show piece on storefront (currently hidden)' : 'Hide piece from storefront without deleting'}
                                >
                                  {product.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleOpenEditProduct(product)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    theme === 'alabaster'
                                      ? 'hover:bg-stone-200 text-stone-700 border-stone-300'
                                      : 'hover:bg-white/10 text-stone-300 border-white/10'
                                  }`}
                                  title="Edit Piece"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateProduct(product)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    theme === 'alabaster'
                                      ? 'hover:bg-stone-200 text-stone-700 border-stone-300'
                                      : 'hover:bg-white/10 text-stone-300 border-white/10'
                                  }`}
                                  title="Duplicate Piece"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmTarget({
                                    type: 'product',
                                    id: product.id,
                                    name: product.name,
                                  })}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                                  title="Delete Piece"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                              <Package className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-serif">
                              {products.length === 0 ? 'Catalog is currently empty' : 'No matching pieces found'}
                            </h4>
                            <p className="text-xs text-stone-400 leading-relaxed">
                              {products.length === 0
                                ? 'All previous products have been erased. You have a clean slate to add your real collection to the store and database.'
                                : 'Try changing your search query or adjusting your category and stock filters.'}
                            </p>
                            {products.length === 0 && (
                              <button
                                onClick={handleOpenCreateProduct}
                                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs uppercase tracking-wider transition-colors shadow cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add First Atelier Piece</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: CATEGORIES & SILHOUETTES                                     */}
        {/* =================================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-8 animate-fade-in">
            {/* Women's Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif">Women's Wardrobe Categories</h2>
                  <p className="text-xs text-stone-400">Silhouettes, editorial descriptions, and homepage collection cards.</p>
                </div>
                <button
                  onClick={() => handleOpenCreateCategory('women')}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Women's Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {womenCategories.map((cat) => {
                  const itemCount = products.filter(p => p.gender === 'women' && p.category === cat.slug).length;
                  const catSlides = (cat.images && cat.images.length > 0) ? cat.images : (cat.image ? [cat.image] : []);
                  return (
                    <div
                      key={cat.slug}
                      className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-all ${
                        cat.hidden
                          ? 'opacity-80 border-amber-500/40 bg-amber-500/[0.02]'
                          : theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-16 h-20 object-cover rounded-xl bg-stone-900 border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-20 rounded-xl bg-stone-900/80 border border-white/10 flex flex-col items-center justify-center text-stone-500 shrink-0 p-1">
                            <Sparkles className="w-4 h-4 text-amber-500/60 mb-1" />
                            <span className="text-[8px] font-mono uppercase text-center leading-tight">No Image</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase block truncate">
                              /{cat.slug}
                            </span>
                            {cat.hidden ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                <EyeOff className="w-2.5 h-2.5 text-amber-400" /> Hidden
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">
                                <Eye className="w-2.5 h-2.5 text-emerald-400" /> Live
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-base font-normal truncate mt-0.5">
                            {cat.name}
                          </h3>
                          <span className="text-[10px] text-stone-400 block mb-1">
                            Pill Label: <strong className="text-stone-300">{cat.shortName}</strong>
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-stone-300">
                              {itemCount} {itemCount === 1 ? 'Piece' : 'Pieces'}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                              catSlides.length > 1
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                : 'bg-white/5 border-white/10 text-stone-400'
                            }`}>
                              {catSlides.length} {catSlides.length === 1 ? 'Card Slide' : 'Card Slides'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Preview of Slides if Multiple */}
                      {catSlides.length > 1 && (
                        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 px-2 rounded-xl bg-black/30 border border-white/5 scrollbar-none">
                          <span className="text-[9px] font-mono uppercase text-stone-500 shrink-0 pr-1">Slides:</span>
                          {catSlides.map((sImg, sIdx) => (
                            <img
                              key={sIdx}
                              src={sImg}
                              alt={`Slide ${sIdx + 1}`}
                              className="w-6 h-8 object-cover rounded border border-white/20 shrink-0"
                              title={`Slide #${sIdx + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-stone-400 font-light line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <button
                          onClick={() => navigate(`/shop/women/${cat.slug}`)}
                          className="text-[11px] text-stone-400 hover:text-white flex items-center space-x-1"
                        >
                          <span>View Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryVisibility(cat)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              cat.hidden
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                                : theme === 'alabaster'
                                  ? 'hover:bg-stone-200 text-stone-600 border-stone-300'
                                  : 'hover:bg-white/10 text-stone-400 border-white/10'
                            }`}
                            title={cat.hidden ? 'Show category on storefront (currently hidden)' : 'Hide category from storefront without deleting'}
                          >
                            {cat.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              theme === 'alabaster' ? 'hover:bg-stone-200 text-stone-700 border-stone-300' : 'hover:bg-white/10 text-stone-300 border-white/10'
                            }`}
                            title="Edit Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTarget({
                              type: 'category',
                              id: cat.slug,
                              name: cat.name,
                              gender: 'women',
                            })}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Men's Categories */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif">Men's Wardrobe Categories</h2>
                  <p className="text-xs text-stone-400">Tailoring, outerwear, denim, and accessory collections.</p>
                </div>
                <button
                  onClick={() => handleOpenCreateCategory('men')}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Men's Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menCategories.map((cat) => {
                  const itemCount = products.filter(p => p.gender === 'men' && p.category === cat.slug).length;
                  const catSlides = (cat.images && cat.images.length > 0) ? cat.images : (cat.image ? [cat.image] : []);
                  return (
                    <div
                      key={cat.slug}
                      className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-all ${
                        cat.hidden
                          ? 'opacity-80 border-amber-500/40 bg-amber-500/[0.02]'
                          : theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-16 h-20 object-cover rounded-xl bg-stone-900 border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-20 rounded-xl bg-stone-900/80 border border-white/10 flex flex-col items-center justify-center text-stone-500 shrink-0 p-1">
                            <Sparkles className="w-4 h-4 text-amber-500/60 mb-1" />
                            <span className="text-[8px] font-mono uppercase text-center leading-tight">No Image</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase block truncate">
                              /{cat.slug}
                            </span>
                            {cat.hidden ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                <EyeOff className="w-2.5 h-2.5 text-amber-400" /> Hidden
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">
                                <Eye className="w-2.5 h-2.5 text-emerald-400" /> Live
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-base font-normal truncate mt-0.5">
                            {cat.name}
                          </h3>
                          <span className="text-[10px] text-stone-400 block mb-1">
                            Pill Label: <strong className="text-stone-300">{cat.shortName}</strong>
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-stone-300">
                              {itemCount} {itemCount === 1 ? 'Piece' : 'Pieces'}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                              catSlides.length > 1
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                : 'bg-white/5 border-white/10 text-stone-400'
                            }`}>
                              {catSlides.length} {catSlides.length === 1 ? 'Card Slide' : 'Card Slides'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Preview of Slides if Multiple */}
                      {catSlides.length > 1 && (
                        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 px-2 rounded-xl bg-black/30 border border-white/5 scrollbar-none">
                          <span className="text-[9px] font-mono uppercase text-stone-500 shrink-0 pr-1">Slides:</span>
                          {catSlides.map((sImg, sIdx) => (
                            <img
                              key={sIdx}
                              src={sImg}
                              alt={`Slide ${sIdx + 1}`}
                              className="w-6 h-8 object-cover rounded border border-white/20 shrink-0"
                              title={`Slide #${sIdx + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-stone-400 font-light line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <button
                          onClick={() => navigate(`/shop/men/${cat.slug}`)}
                          className="text-[11px] text-stone-400 hover:text-white flex items-center space-x-1"
                        >
                          <span>View Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryVisibility(cat)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              cat.hidden
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                                : theme === 'alabaster'
                                  ? 'hover:bg-stone-200 text-stone-600 border-stone-300'
                                  : 'hover:bg-white/10 text-stone-400 border-white/10'
                            }`}
                            title={cat.hidden ? 'Show category on storefront (currently hidden)' : 'Hide category from storefront without deleting'}
                          >
                            {cat.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              theme === 'alabaster' ? 'hover:bg-stone-200 text-stone-700 border-stone-300' : 'hover:bg-white/10 text-stone-300 border-white/10'
                            }`}
                            title="Edit Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTarget({
                              type: 'category',
                              id: cat.slug,
                              name: cat.name,
                              gender: 'men',
                            })}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Haute Parfumerie & Royal Attar Categories */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-serif">Haute Parfumerie & Royal Attar Categories</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold">
                      {perfumeCategories.length} Families
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">Sacred distillations, olfactory classifications, and pure attar notes pyramids.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleOpenCreatePerfume}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase cursor-pointer transition-transform active:scale-95 shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>+ Add Perfume</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateCategory('perfumes')}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border font-semibold text-xs tracking-wider uppercase cursor-pointer transition-transform active:scale-95 ${
                      theme === 'alabaster'
                        ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 shadow-sm'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Fragrance Category</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {perfumeCategories.map((cat) => {
                  const itemCount = products.filter(p => (p.isPerfume || p.category === 'perfumes') && (p.perfumeFamily === cat.name || p.category === cat.slug)).length;
                  const catSlides = (cat.images && cat.images.length > 0) ? cat.images : (cat.image ? [cat.image] : []);
                  return (
                    <div
                      key={cat.slug}
                      className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 transition-all ${
                        cat.hidden
                          ? 'opacity-80 border-amber-500/40 bg-amber-500/[0.02]'
                          : theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-16 h-20 object-cover rounded-xl bg-stone-900 border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-20 rounded-xl bg-stone-900/80 border border-white/10 flex flex-col items-center justify-center text-stone-500 shrink-0 p-1">
                            <Droplets className="w-4 h-4 text-amber-500/60 mb-1" />
                            <span className="text-[8px] font-mono uppercase text-center leading-tight">Attar Vault</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase block truncate">
                              /{cat.slug}
                            </span>
                            {cat.hidden ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                <EyeOff className="w-2.5 h-2.5 text-amber-400" /> Hidden
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">
                                <Eye className="w-2.5 h-2.5 text-emerald-400" /> Live
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-base font-normal truncate mt-0.5">
                            {cat.name}
                          </h3>
                          <span className="text-[10px] text-stone-400 block mb-1">
                            Pill Label: <strong className="text-stone-300">{cat.shortName}</strong>
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-300">
                              {itemCount} {itemCount === 1 ? 'Creation' : 'Creations'}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                              catSlides.length > 1
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                : 'bg-white/5 border-white/10 text-stone-400'
                            }`}>
                              {catSlides.length} {catSlides.length === 1 ? 'Card Slide' : 'Card Slides'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Preview of Slides if Multiple */}
                      {catSlides.length > 1 && (
                        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 px-2 rounded-xl bg-black/30 border border-white/5 scrollbar-none">
                          <span className="text-[9px] font-mono uppercase text-stone-500 shrink-0 pr-1">Slides:</span>
                          {catSlides.map((sImg, sIdx) => (
                            <img
                              key={sIdx}
                              src={sImg}
                              alt={`Slide ${sIdx + 1}`}
                              className="w-6 h-8 object-cover rounded border border-white/20 shrink-0"
                              title={`Slide #${sIdx + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-stone-400 font-light line-clamp-2 leading-relaxed">
                        {cat.description || 'Artisanal sacred distillation from the Royal Vault.'}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenCreatePerfume();
                              setProductForm(prev => ({
                                ...prev,
                                perfumeFamily: cat.name,
                              }));
                            }}
                            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer transition-colors"
                            title={`Create and add a new perfume under ${cat.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Perfume</span>
                          </button>
                          <span className="text-stone-600">·</span>
                          <button
                            type="button"
                            onClick={() => navigate('/haute-parfumerie')}
                            className="text-[11px] text-stone-400 hover:text-white flex items-center space-x-1"
                          >
                            <span>Vault</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryVisibility(cat)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              cat.hidden
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                                : theme === 'alabaster'
                                  ? 'hover:bg-stone-200 text-stone-600 border-stone-300'
                                  : 'hover:bg-white/10 text-stone-400 border-white/10'
                            }`}
                            title={cat.hidden ? 'Show category on storefront (currently hidden)' : 'Hide category from storefront without deleting'}
                          >
                            {cat.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              theme === 'alabaster' ? 'hover:bg-stone-200 text-stone-700 border-stone-300' : 'hover:bg-white/10 text-stone-300 border-white/10'
                            }`}
                            title="Edit Fragrance Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTarget({
                              type: 'category',
                              id: cat.slug,
                              name: cat.name,
                              gender: 'perfumes',
                            })}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                            title="Delete Fragrance Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: HAUTE PARFUMERIE & ROYAL ATTAR                                 */}
        {/* =================================================================== */}
        {activeTab === 'perfumes' && (
          <div className="space-y-6 animate-fade-in">
            {/* Parfumerie Atelier Banner & Actions */}
            <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${
              theme === 'alabaster'
                ? 'bg-gradient-to-br from-amber-50/80 via-white to-stone-50 border-amber-200/80 shadow-sm'
                : 'bg-gradient-to-br from-amber-950/20 via-[#121216] to-black border-amber-500/20 shadow-2xl'
            }`}>
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-mono uppercase tracking-[0.25em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Royal Atelier Olfactory Control</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif tracking-tight">
                  Haute Parfumerie & Royal Attar
                </h2>
                <p className={`text-xs sm:text-sm max-w-xl font-light leading-relaxed ${
                  theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  Control the royal fragrance vault: configure multi-volume ML pricing (6ml, 12ml, 50ml, 100ml), olfactory notes pyramids (Top, Heart, Base), concentration, longevity, and sillage.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 relative z-10">
                <button
                  type="button"
                  onClick={handleOpenCreatePerfume}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Fragrance</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateCategory('perfumes')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    theme === 'alabaster'
                      ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 shadow-sm'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                  }`}
                  title="Add or configure a new Olfactory Family or Fragrance Category"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>+ Add Fragrance Category</span>
                </button>

                <button
                  type="button"
                  onClick={handleSeedPerfumes}
                  disabled={isSeedingPerfumes}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 ${
                    theme === 'alabaster'
                      ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-200 hover:text-white'
                  }`}
                  title="Seed pre-formulated royal fragrances (Kalakassi Oud, Taif Rose, Midnight Ambergris, etc.)"
                >
                  <Sparkles className={`w-4 h-4 text-amber-400 ${isSeedingPerfumes ? 'animate-spin' : ''}`} />
                  <span>{isSeedingPerfumes ? 'Seeding Vault...' : 'Seed Collection'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/haute-parfumerie')}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                    theme === 'alabaster'
                      ? 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      : 'bg-black/40 border-white/10 text-stone-300 hover:text-white'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Storefront View</span>
                </button>
              </div>
            </div>

            {/* Quick Fragrance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className={`p-4 rounded-2xl border transition-all ${
                theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
              }`}>
                <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 block mb-1">
                  Vault Collection
                </span>
                <div className="text-2xl font-serif text-amber-400">
                  {perfumeProducts.length}
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Active Royal Fragrances
                </span>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
              }`}>
                <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 block mb-1">
                  In Stock Vault
                </span>
                <div className="text-2xl font-serif text-emerald-400">
                  {perfumeProducts.filter(p => p.stock > 0).length}
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Available for Immediate Dispatch
                </span>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
              }`}>
                <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 block mb-1">
                  Pure Concentrates
                </span>
                <div className="text-2xl font-serif text-amber-500">
                  {perfumeProducts.filter(p => p.concentration?.toLowerCase().includes('attar') || p.category === 'perfumes').length}
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  100% Oil & Extrait Formulations
                </span>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
              }`}>
                <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 block mb-1">
                  Flacon Sizes Configured
                </span>
                <div className="text-2xl font-serif text-sky-400">
                  {perfumeProducts.reduce((sum, p) => sum + (p.volumeOptions?.length || p.sizes?.length || 0), 0)}
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Active Multi-ML Price Tiers
                </span>
              </div>
            </div>

            {/* Fragrance Categories & Olfactory Families Manager */}
            <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-serif">Fragrance Categories & Olfactory Families</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold">
                      {perfumeCategories.length} Active Families
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Configure olfactory classifications, notes profiles, and storefront fragrance showcases.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateCategory('perfumes')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase cursor-pointer transition-transform active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Fragrance Category</span>
                  </button>
                </div>
              </div>

              {/* Grid of Fragrance Categories */}
              {perfumeCategories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {perfumeCategories.map((cat) => {
                    const itemCount = perfumeProducts.filter(p => p.perfumeFamily === cat.name || p.category === cat.slug).length;
                    const catSlides = (cat.images && cat.images.length > 0) ? cat.images : (cat.image ? [cat.image] : []);
                    const isFilteringThis = perfumeFamilyFilter === cat.name;

                    return (
                      <div
                        key={cat.slug}
                        className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3.5 transition-all ${
                          cat.hidden ? 'opacity-80 border-amber-500/40 bg-amber-500/[0.02]' : ''
                        } ${
                          isFilteringThis
                            ? 'border-amber-500/60 ring-1 ring-amber-500/30 shadow-md'
                            : theme === 'alabaster' ? 'bg-stone-50 border-stone-200' : 'bg-black/30 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-16 h-20 object-cover rounded-xl bg-stone-900 border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-20 rounded-xl bg-stone-900/80 border border-white/10 flex flex-col items-center justify-center text-stone-500 shrink-0 p-1">
                              <Droplets className="w-4 h-4 text-amber-500/60 mb-1" />
                              <span className="text-[8px] font-mono uppercase text-center leading-tight">Attar Vault</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase block truncate">
                                /{cat.slug}
                              </span>
                              {cat.hidden ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                  <EyeOff className="w-2.5 h-2.5 text-amber-400" /> Hidden
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">
                                  <Eye className="w-2.5 h-2.5 text-emerald-400" /> Live
                                </span>
                              )}
                            </div>
                            <h4 className="font-serif text-base font-normal truncate mt-0.5" title={cat.name}>
                              {cat.name}
                            </h4>
                            <span className="text-[10px] text-stone-400 block mb-1">
                              Pill: <strong className="text-stone-300">{cat.shortName}</strong>
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                {itemCount} {itemCount === 1 ? 'Fragrance' : 'Fragrances'}
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                                catSlides.length > 1
                                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                  : 'bg-white/5 border-white/10 text-stone-400'
                              }`}>
                                {catSlides.length} {catSlides.length === 1 ? 'Slide' : 'Slides'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Slide thumbnails */}
                        {catSlides.length > 1 && (
                          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 px-2 rounded-xl bg-black/40 border border-white/5 scrollbar-none">
                            <span className="text-[9px] font-mono uppercase text-stone-500 shrink-0 pr-1">Slides:</span>
                            {catSlides.map((sImg, sIdx) => (
                              <img
                                key={sIdx}
                                src={sImg}
                                alt={`Slide ${sIdx + 1}`}
                                className="w-6 h-8 object-cover rounded border border-white/20 shrink-0"
                                title={`Slide #${sIdx + 1}`}
                              />
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-stone-400 font-light line-clamp-2 leading-relaxed">
                          {cat.description || 'Artisanal sacred distillation from the Royal Vault.'}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isFilteringThis) {
                                setPerfumeFamilyFilter('all');
                              } else {
                                setPerfumeFamilyFilter(cat.name);
                              }
                            }}
                            className={`text-[11px] flex items-center space-x-1 font-mono uppercase transition-colors cursor-pointer ${
                              isFilteringThis ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-white'
                            }`}
                          >
                            <span>{isFilteringThis ? '✓ Active Filter' : 'Filter Vault'}</span>
                          </button>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryVisibility(cat)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                cat.hidden
                                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                                  : theme === 'alabaster'
                                    ? 'hover:bg-stone-200 text-stone-600 border-stone-300'
                                    : 'hover:bg-white/10 text-stone-400 border-white/10'
                              }`}
                              title={cat.hidden ? 'Show category on storefront (currently hidden)' : 'Hide category from storefront without deleting'}
                            >
                              {cat.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditCategory(cat)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                theme === 'alabaster' ? 'hover:bg-stone-200 text-stone-700 border-stone-300' : 'hover:bg-white/10 text-stone-300 border-white/10'
                              }`}
                              title="Edit Fragrance Category"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmTarget({
                                type: 'category',
                                id: cat.slug,
                                name: cat.name,
                                gender: 'perfumes',
                              })}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-colors"
                              title="Remove Fragrance Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl my-3">
                  <Droplets className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                  <p className="text-sm font-serif text-stone-300">No Fragrance Categories Configured</p>
                  <p className="text-xs text-stone-500 mt-1">Create your first olfactory family or attar category to organize creations.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateCategory('perfumes')}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-semibold uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Fragrance Category</span>
                  </button>
                </div>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={perfumeSearch}
                  onChange={(e) => setPerfumeSearch(e.target.value)}
                  placeholder="Search perfumes by name, notes (Oud, Rose, Saffron), SKU, or family..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs tracking-wider focus:outline-none border ${
                    theme === 'alabaster'
                      ? 'bg-stone-100 border-stone-300 text-stone-900 placeholder:text-stone-400'
                      : 'bg-black/50 border-white/10 text-white placeholder:text-stone-500'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={perfumeFamilyFilter}
                  onChange={(e) => setPerfumeFamilyFilter(e.target.value)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">All Olfactory Families ({perfumeProducts.length})</option>
                  {perfumeCategories.map((fc) => {
                    const count = perfumeProducts.filter(p => p.perfumeFamily === fc.name || p.category === fc.slug).length;
                    return (
                      <option key={fc.slug} value={fc.name}>
                        {fc.name} ({count})
                      </option>
                    );
                  })}
                </select>

                {/* Storefront Visibility Filter for Fragrances */}
                <select
                  value={perfumeVisibilityFilter}
                  onChange={(e) => setPerfumeVisibilityFilter(e.target.value as any)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">Visibility: All</option>
                  <option value="live">Live on Store</option>
                  <option value="hidden">Hidden from Store</option>
                </select>

                {(perfumeSearch || perfumeFamilyFilter !== 'all' || perfumeVisibilityFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setPerfumeSearch('');
                      setPerfumeFamilyFilter('all');
                      setPerfumeVisibilityFilter('all');
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-amber-500 hover:text-amber-400 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Fragrances Showcase Grid */}
            {filteredPerfumeProducts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredPerfumeProducts.map((p) => {
                  const isOut = p.stock <= 0;
                  const isLow = p.stock <= 3 && p.stock > 0;
                  const volOptions = p.volumeOptions && p.volumeOptions.length > 0
                    ? p.volumeOptions
                    : (p.sizes || []).map(sz => ({ ml: sz, price: p.price, compareAtPrice: p.compareAtPrice, inStock: true }));

                  return (
                    <div
                      key={p.id}
                      className={`rounded-3xl border p-5 flex flex-col justify-between space-y-4 transition-all hover:border-amber-500/40 ${
                        p.hidden ? 'opacity-80 border-amber-500/30 bg-amber-500/[0.02]' : ''
                      } ${
                        theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
                      }`}
                    >
                      {/* Top: Flacon Photo & Metadata */}
                      <div className="flex items-start space-x-4">
                        <div className="relative shrink-0 w-24 h-32 rounded-2xl overflow-hidden bg-stone-900 border border-white/10 shadow-md">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=300'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono text-amber-300 font-bold border border-amber-500/30">
                              {p.stock} pcs
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-mono uppercase tracking-widest font-semibold">
                              {p.perfumeFamily || 'Haute Parfumerie'}
                            </span>
                            {p.hidden ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30 font-medium">
                                <EyeOff className="w-2.5 h-2.5 text-amber-400" /> Hidden
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/25 font-medium">
                                <Eye className="w-2.5 h-2.5 text-emerald-400" /> Live
                              </span>
                            )}
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                              isOut
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : isLow
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {isOut ? 'Sold Out' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-serif tracking-tight truncate" title={p.name}>
                            {p.name}
                          </h3>

                          <div className="flex items-center space-x-3 text-[11px] font-mono text-stone-400">
                            <span>SKU: {p.sku}</span>
                            <span>·</span>
                            <span className="text-amber-400 font-semibold">{formatINR(p.price)}</span>
                            {p.compareAtPrice && (
                              <span className="line-through text-stone-500">{formatINR(p.compareAtPrice)}</span>
                            )}
                          </div>

                          <p className={`text-xs line-clamp-2 leading-relaxed ${
                            theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                          }`}>
                            {p.description}
                          </p>
                        </div>
                      </div>

                      {/* Olfactory Notes Badges */}
                      {p.perfumeNotes && (
                        <div className={`p-3 rounded-2xl border space-y-1.5 text-xs ${
                          theme === 'alabaster' ? 'bg-stone-50 border-stone-200' : 'bg-black/30 border-white/5'
                        }`}>
                          {Array.isArray(p.perfumeNotes.top) && p.perfumeNotes.top.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 shrink-0 w-12">Top:</span>
                              <div className="flex flex-wrap gap-1">
                                {p.perfumeNotes.top.map((n, i) => (
                                  <span key={i} className={`px-2 py-0.5 rounded text-[10px] ${
                                    theme === 'alabaster' ? 'bg-white text-stone-800 border border-stone-200' : 'bg-white/5 text-stone-300'
                                  }`}>{n}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {Array.isArray(p.perfumeNotes.heart) && p.perfumeNotes.heart.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 shrink-0 w-12">Heart:</span>
                              <div className="flex flex-wrap gap-1">
                                {p.perfumeNotes.heart.map((n, i) => (
                                  <span key={i} className={`px-2 py-0.5 rounded text-[10px] ${
                                    theme === 'alabaster' ? 'bg-white text-stone-800 border border-stone-200' : 'bg-white/5 text-stone-300'
                                  }`}>{n}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {Array.isArray(p.perfumeNotes.base) && p.perfumeNotes.base.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 shrink-0 w-12">Base:</span>
                              <div className="flex flex-wrap gap-1">
                                {p.perfumeNotes.base.map((n, i) => (
                                  <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    theme === 'alabaster' ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                  }`}>{n}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Configured Flacon ML Volume Prices List */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400 block">
                          Configured Flacon ML Options ({volOptions.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {volOptions.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono flex items-center space-x-1.5 ${
                                theme === 'alabaster'
                                  ? 'bg-white border-stone-200 text-stone-800 shadow-sm'
                                  : 'bg-white/5 border-white/10 text-stone-300'
                              }`}
                            >
                              <Droplets className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="font-semibold">{v.ml}</span>
                              <span className="text-amber-500 font-bold">{formatINR(v.price)}</span>
                              {v.compareAtPrice && (
                                <span className="line-through text-stone-500 text-[10px]">{formatINR(v.compareAtPrice)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Longevity & Sillage specs */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400 font-mono border-t border-white/5 pt-3">
                        {p.concentration && (
                          <span className="truncate max-w-[200px]" title={p.concentration}>
                            ✨ {p.concentration}
                          </span>
                        )}
                        {p.longevity && (
                          <span>⏳ {p.longevity}</span>
                        )}
                        {p.sillage && (
                          <span>💨 {p.sillage}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => window.open(`/product/${p.slug}`, '_blank')}
                            className="text-xs text-stone-400 hover:text-white flex items-center space-x-1 transition-colors cursor-pointer"
                          >
                            <span>Live Page</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(p)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs flex items-center space-x-1 ${
                              theme === 'alabaster' ? 'hover:bg-stone-200 text-stone-700 border-stone-300' : 'hover:bg-white/10 text-stone-300 border-white/10'
                            }`}
                            title="Duplicate Fragrance"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleProductVisibility(p)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs flex items-center space-x-1.5 ${
                              p.hidden
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                                : theme === 'alabaster'
                                  ? 'hover:bg-stone-200 text-stone-700 border-stone-300'
                                  : 'hover:bg-white/10 text-stone-300 border-white/10'
                            }`}
                            title={p.hidden ? 'Show perfume on storefront (currently hidden)' : 'Hide perfume from storefront without deleting'}
                          >
                            {p.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                            <span className="text-[11px] font-mono uppercase">{p.hidden ? 'Hidden' : 'Live'}</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer shadow-md"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Formula & ML</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmTarget({
                              type: 'product',
                              id: p.id,
                              name: p.name,
                            })}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-colors"
                            title="Delete Fragrance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`p-12 text-center rounded-3xl border space-y-4 ${
                theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
              }`}>
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Sparkles className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-serif">No Fragrances Match Your Filter</h3>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    Try clearing your search or seed the store with the official Royal Haute Parfumerie collection.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSeedPerfumes}
                    disabled={isSeedingPerfumes}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Sparkles className={`w-4 h-4 ${isSeedingPerfumes ? 'animate-spin' : ''}`} />
                    <span>{isSeedingPerfumes ? 'Seeding...' : 'Seed Royal Collection'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreatePerfume}
                    className="px-4 py-2 rounded-xl border border-white/20 text-xs font-mono uppercase tracking-wider text-stone-300 hover:text-white cursor-pointer"
                  >
                    + Create First Piece
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: CLIENT ORDERS & ACQUISITIONS                                 */}
        {/* =================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Controls */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-serif">Client Acquisitions & Orders</h2>
                  <p className="text-xs text-stone-400">
                    {orders.length} total orders · {formatINR(orderStats.totalRevenue)} gross revenue
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={fetchOrders}
                  disabled={isLoadingOrders}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider border transition-colors cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800' : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-200'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                  <span>{isLoadingOrders ? 'Refreshing...' : 'Refresh Cloud Orders'}</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by Order #, Client Name, Email, or Phone..."
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs tracking-wider focus:outline-none border ${
                    theme === 'alabaster'
                      ? 'bg-stone-100 border-stone-300 text-stone-900 placeholder:text-stone-400'
                      : 'bg-black/50 border-white/10 text-white placeholder:text-stone-500'
                  }`}
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">All Statuses ({orders.length})</option>
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Stream / Table */}
            {filteredOrders.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border ${
                theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
              }`}>
                <ShoppingBag className="w-10 h-10 text-stone-500 mx-auto mb-3 opacity-40" />
                <h3 className="font-serif text-lg mb-1">No Orders Found</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  {orderSearch ? 'Try clearing your search query' : 'Customer purchases will appear here in real-time as acquisitions are confirmed.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord: any) => {
                  const addr = typeof ord.shipping_address === 'string' ? JSON.parse(ord.shipping_address) : ord.shipping_address;
                  const itemsList = Array.isArray(ord.items) ? ord.items : (typeof ord.items === 'string' ? JSON.parse(ord.items) : []);
                  return (
                    <div
                      key={ord.order_number || ord.id}
                      className={`p-5 rounded-2xl border transition-all space-y-4 ${
                        theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
                      }`}
                    >
                      {/* Order Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-xs font-semibold tracking-wider text-amber-500">
                            {ord.order_number}
                          </span>
                          <span className="text-stone-500">&middot;</span>
                          <span className="text-[11px] text-stone-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {ord.created_at
                                ? new Date(ord.created_at).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Just now'}
                            </span>
                          </span>
                        </div>

                        {/* Status Changer & Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${
                            ord.payment_status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : ord.payment_status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : ord.payment_status === 'refunded'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            Payment: {ord.payment_method?.toUpperCase()} · {ord.payment_status?.toUpperCase() || 'PENDING'}
                          </span>

                          {ord.cashfree_order_id && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" title={`Cashfree Order ID: ${ord.cashfree_order_id}`}>
                              CF: {ord.cashfree_order_id.length > 22 ? `${ord.cashfree_order_id.slice(0, 10)}...${ord.cashfree_order_id.slice(-8)}` : ord.cashfree_order_id}
                            </span>
                          )}

                          {ord.cashfree_payment_id && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title={`Cashfree Payment ID: ${ord.cashfree_payment_id}`}>
                              Txn: {ord.cashfree_payment_id}
                            </span>
                          )}

                          {ord.cashfree_order_id && ord.payment_status === 'paid' && ord.order_status !== 'refunded' && (
                            <button
                              type="button"
                              onClick={() => handleInitiateRefund(ord)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                              title="Initiate official Cashfree refund"
                            >
                              Refund
                            </button>
                          )}

                          <select
                            value={ord.order_status || 'processing'}
                            onChange={(e) => handleUpdateOrderStatus(ord.order_number, e.target.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wider uppercase border focus:outline-none cursor-pointer ${
                              ord.order_status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : ord.order_status === 'dispatched'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : ord.order_status === 'cancelled'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : ord.order_status === 'refunded'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            <option value="processing">● Processing</option>
                            <option value="confirmed">● Confirmed</option>
                            <option value="dispatched">● Dispatched / Shipped</option>
                            <option value="out_for_delivery">● Out For Delivery</option>
                            <option value="delivered">● Delivered</option>
                            <option value="cancelled">● Cancelled</option>
                            <option value="refunded">● Refunded</option>
                          </select>
                        </div>
                      </div>

                      {/* Client Info & Delivery Address */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Client Identity */}
                        <div className={`p-3 rounded-xl ${theme === 'alabaster' ? 'bg-stone-50' : 'bg-white/[0.02]'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                              Client Details
                            </span>
                            {ord.user_id ? (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title={`Supabase User UUID: ${ord.user_id}`}>
                                Auth ID Linked
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-500/10 text-stone-400 border border-stone-500/20">
                                Guest
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-stone-200">{ord.customer_name}</div>
                          <div className="text-stone-400 flex items-center space-x-1 mt-0.5">
                            <Mail className="w-3 h-3 text-stone-500 shrink-0" />
                            <span className="truncate">{ord.customer_email}</span>
                          </div>
                          <div className="text-stone-300 font-mono flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{ord.customer_phone || 'N/A'}</span>
                          </div>
                          {ord.user_id && (
                            <div className="text-[10px] text-stone-400 font-mono mt-1 pt-1 border-t border-white/5 truncate" title={ord.user_id}>
                              ID: {ord.user_id}
                            </div>
                          )}
                        </div>

                        {/* Delivery Destination */}
                        <div className={`p-3 rounded-xl md:col-span-2 ${theme === 'alabaster' ? 'bg-stone-50' : 'bg-white/[0.02]'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                              Concierge Delivery Destination
                            </span>
                            {ord.updated_at && (
                              <span className="text-[9px] font-mono text-stone-400">
                                Synced: {new Date(ord.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="text-stone-300 flex items-start space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                            <span>
                              {addr ? `${addr.address || ''}${addr.apartment ? `, ${addr.apartment}` : ''}, ${addr.city || ''}, ${addr.state || ''} — ${addr.postalCode || ''}, ${addr.country || 'India'}` : 'Direct Acquisition'}
                            </span>
                          </div>
                          {Array.isArray(ord.status_history) && ord.status_history.length > 1 && (
                            <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[9px] font-mono text-stone-400">
                              <span className="text-amber-400/80 uppercase">History:</span>
                              {ord.status_history.map((h: any, hIdx: number) => (
                                <span key={hIdx} className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                  {h.status} ({new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Items Purchased */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">
                          Acquired Pieces ({itemsList.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {itemsList.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-lg bg-stone-900 border border-white/10 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-serif truncate text-stone-200">{item.name}</h4>
                                <div className="text-[10px] text-stone-400 space-x-1.5 font-mono">
                                  <span>Size: {item.size}</span>
                                  <span>&middot;</span>
                                  <span>Qty: {item.quantity}</span>
                                </div>
                                <div className="text-xs font-medium text-amber-400 font-mono mt-0.5">
                                  {formatINR(item.price * item.quantity)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Total */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                        <span className="text-stone-400 font-light">Subtotal: {formatINR(ord.subtotal || ord.total_amount)} · Shipping: {ord.shipping_cost === 0 ? 'Complimentary' : formatINR(ord.shipping_cost || 0)}</span>
                        <div className="text-right">
                          <span className="text-stone-400 text-[11px] mr-2">Grand Total:</span>
                          <span className="font-serif text-base font-semibold text-emerald-400">{formatINR(ord.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: CLIENT REVIEWS MODERATION                                    */}
        {/* =================================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fade-in">
            {/* Reviews Header */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-serif">Client Provenance Reviews Moderation</h2>
                  <p className="text-xs text-stone-400">
                    {allReviewsList.length} total client reviews · ★ {reviewStats.avg} Store Average Rating
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  placeholder="Search reviews by client name, piece title, or feedback text..."
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs tracking-wider focus:outline-none border ${
                    theme === 'alabaster'
                      ? 'bg-stone-100 border-stone-300 text-stone-900 placeholder:text-stone-400'
                      : 'bg-black/50 border-white/10 text-white placeholder:text-stone-500'
                  }`}
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Rating:</span>
                <select
                  value={reviewRatingFilter}
                  onChange={(e) => setReviewRatingFilter(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">All Ratings ({allReviewsList.length})</option>
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★ (4 Stars)</option>
                  <option value="3">★★★ (3 Stars)</option>
                  <option value="2">★★ (2 Stars)</option>
                  <option value="1">★ (1 Star)</option>
                </select>
              </div>
            </div>

            {/* Reviews Stream */}
            {filteredReviews.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border ${
                theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
              }`}>
                <Star className="w-10 h-10 text-stone-500 mx-auto mb-3 opacity-40" />
                <h3 className="font-serif text-lg mb-1">No Reviews Found</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  {reviewSearch ? 'Try a different search term' : 'Client appraisals will appear here as reviews are submitted on product pages.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReviews.map(({ review: rev, product: prod }) => (
                  <div
                    key={rev.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
                      theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
                    }`}
                  >
                    {/* Piece Context Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {prod?.images?.[0] && (
                          <img src={prod.images[0]} alt={prod.name} className="w-9 h-11 object-cover rounded-lg bg-stone-900 border border-white/10 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-mono tracking-wider text-amber-500 block">
                            Piece Appraisal
                          </span>
                          <h4 className="text-xs font-serif font-medium truncate text-stone-200">{prod?.name || 'Zarb Piece'}</h4>
                        </div>
                      </div>

                      {/* Delete Review Button */}
                      <button
                        type="button"
                        onClick={() => deleteReview(rev.productId || prod?.id || '', rev.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-colors shrink-0"
                        title="Delete Review (Spam/Inappropriate)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Reviewer Details & Rating */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-medium text-xs text-stone-200">{rev.authorName}</span>
                            {rev.authorLocation && (
                              <span className="text-[10px] text-stone-500">&middot; {rev.authorLocation}</span>
                            )}
                          </div>
                          <div className="flex text-amber-400 text-xs mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < rev.rating ? 'text-amber-400' : 'text-stone-700'}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>

                        {rev.verifiedPurchase && (
                          <span className="flex items-center space-x-1 text-[9px] font-mono uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Client</span>
                          </span>
                        )}
                      </div>

                      {rev.title && (
                        <div className="text-xs font-serif font-semibold text-white">
                          "{rev.title}"
                        </div>
                      )}

                      <p className="text-xs text-stone-300 font-light leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Footer Date */}
                    <div className="text-[10px] text-stone-500 pt-2 border-t border-white/5 flex items-center justify-between font-mono">
                      <span>
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-stone-500">ID: {rev.id.slice(-6)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: QUICK PRICING & STOCK SPREADSHEET                            */}
        {/* =================================================================== */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div>
                <h2 className="text-base font-serif">Rapid Bulk Pricing & Stock Editor</h2>
                <p className="text-xs text-stone-400">Edit prices, compare-at discounts, and inventory counts in-line.</p>
              </div>
              <div className="text-xs text-stone-400">
                Auto-syncs live to database
              </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${
              theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#101014] border-white/10'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] tracking-[0.2em] uppercase ${
                      theme === 'alabaster' ? 'bg-stone-100 text-stone-600 border-stone-200' : 'bg-white/[0.02] text-stone-400 border-white/10'
                    }`}>
                      <th className="py-3 px-4">Piece</th>
                      <th className="py-3 px-4">Price (₹ INR)</th>
                      <th className="py-3 px-4">Compare Price (₹)</th>
                      <th className="py-3 px-4">Stock Units</th>
                      <th className="py-3 px-4 text-right">Quick Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((p) => {
                      const currentPrice = bulkEdits[p.id]?.price !== undefined ? bulkEdits[p.id].price : p.price;
                      const currentCompare = bulkEdits[p.id]?.compareAtPrice !== undefined ? bulkEdits[p.id].compareAtPrice : (p.compareAtPrice || 0);
                      const currentStock = bulkEdits[p.id]?.stock !== undefined ? bulkEdits[p.id].stock : p.stock;
                      const hasChanged = bulkEdits[p.id] !== undefined;

                      return (
                        <tr key={p.id} className={hasChanged ? 'bg-amber-500/5' : ''}>
                          <td className="py-3 px-4 flex items-center space-x-3">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-9 h-11 object-cover rounded bg-stone-900 shrink-0 border border-white/10"
                            />
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-[10px] font-mono text-stone-400">{p.sku} · {p.gender}</div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) => handleBulkChange(p.id, 'price', Number(e.target.value))}
                              className={`w-32 px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:outline-none ${
                                theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                              }`}
                            />
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={currentCompare || ''}
                              placeholder="None"
                              onChange={(e) => handleBulkChange(p.id, 'compareAtPrice', Number(e.target.value) || 0)}
                              className={`w-32 px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:outline-none ${
                                theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                              }`}
                            />
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={currentStock}
                              onChange={(e) => handleBulkChange(p.id, 'stock', Number(e.target.value))}
                              className={`w-24 px-2.5 py-1.5 rounded-lg border font-mono text-xs focus:outline-none ${
                                theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                              }`}
                            />
                          </td>

                          <td className="py-3 px-4 text-right">
                            {hasChanged ? (
                              <button
                                onClick={() => handleSaveBulkRow(p)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Save Changes
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-500">Up to date</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: BACKUP & DATA MAINTENANCE                                    */}
        {/* =================================================================== */}
        {activeTab === 'backup' && (
          <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
            {/* Supabase Cloud Database & Storage */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-serif">Supabase Cloud Database & Storage</h3>
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        supabaseCreds.isConfigured
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {supabaseCreds.isConfigured ? 'Live Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Sync orders, authentication (Google OAuth), and cloud catalog with your Supabase backend.
                    </p>
                  </div>
                </div>
              </div>

              {/* Credentials Config Form */}
              <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyz.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                      theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                    Supabase Project Anon Key (Public)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                      theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                    }`}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-stone-200 transition-colors shadow cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Save Credentials</span>
                  </button>
                </div>
              </form>

              {/* Cloud Synchronization Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs text-stone-400">
                  <span>Cloud Catalog Operations:</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isSyncingCloud}
                    onClick={handlePushCatalogToSupabase}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-colors shadow disabled:opacity-50 cursor-pointer"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>{isSyncingCloud ? 'Syncing...' : 'Push to Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSyncingCloud}
                    onClick={handlePullCatalogFromSupabase}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-medium text-xs tracking-wider uppercase transition-colors border border-white/15 shadow disabled:opacity-50 cursor-pointer"
                  >
                    <CloudDownload className="w-3.5 h-3.5" />
                    <span>Pull from Cloud</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-serif">Export Catalog Archive</h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Download a full snapshot of all products, categories, pricing, and images in JSON format.
                  </p>
                </div>
                <button
                  onClick={handleExportDownload}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-stone-200 transition-colors shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup</span>
                </button>
              </div>
            </div>

            {/* Import */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <h3 className="text-lg font-serif">Import Catalog Archive</h3>
              <p className="text-xs text-stone-400 mt-1 mb-4 leading-relaxed">
                Paste a previously exported JSON backup to update or restore products and categories.
              </p>

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                rows={5}
                placeholder="Paste JSON archive payload here..."
                className={`w-full p-3 rounded-xl font-mono text-xs border focus:outline-none ${
                  theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                }`}
              />

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleImportSubmit}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase transition-colors shadow-md cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Load JSON Data</span>
                </button>
              </div>
            </div>

            {/* Factory Reset */}
            <div className={`p-6 rounded-2xl border border-red-500/20 bg-red-500/5`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-serif text-red-400">Restore Factory Runway Drop</h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Reset all products, pricing, and category structures back to the original Autumn / Winter 2026 atelier launch collection.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all products and categories to original factory defaults? All custom changes will be overwritten.')) {
                      resetToDefaults();
                    }
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to Default</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 7: SHIPPING COST MANAGEMENT                                     */}
        {/* =================================================================== */}
        {activeTab === 'shipping' && (
          <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">

            {/* Header */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif">Shipping Cost Management</h3>
                    <p className={`text-xs mt-0.5 ${
                      theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                    }`}>Configure delivery charges for customer checkout</p>
                  </div>
                </div>
                <button
                  onClick={handleSaveShipping}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase font-semibold shadow-md transition-all cursor-pointer ${
                    shippingSaved
                      ? 'bg-emerald-500 text-white'
                      : 'bg-sky-500 hover:bg-sky-400 text-white'
                  }`}
                >
                  {shippingSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{shippingSaved ? 'Saved!' : 'Save Config'}</span>
                </button>
              </div>

              {/* Shipping Mode Selector */}
              <div className="space-y-3 mb-6">
                <label className={`text-[10px] font-mono tracking-[0.2em] uppercase block ${
                  theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                }`}>Shipping Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['free', 'flat', 'tiered'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setShippingConfig(prev => ({ ...prev, mode }))}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        shippingConfig.mode === mode
                          ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                          : (theme === 'alabaster' ? 'border-stone-200 text-stone-600 hover:border-stone-400' : 'border-white/10 text-stone-400 hover:border-white/30')
                      }`}
                    >
                      <div className="text-lg mb-1">
                        {mode === 'free' ? '🎁' : mode === 'flat' ? '📦' : '📊'}
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wider">
                        {mode === 'free' ? 'Always Free' : mode === 'flat' ? 'Flat Rate' : 'Tiered'}
                      </div>
                      <div className={`text-[10px] mt-1 ${
                        theme === 'alabaster' ? 'text-stone-400' : 'text-stone-500'
                      }`}>
                        {mode === 'free' ? 'No charges ever' : mode === 'flat' ? 'One fixed rate' : 'Amount-based'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── FREE MODE ──────────────────────────────────── */}
              {shippingConfig.mode === 'free' && (
                <div className={`p-4 rounded-xl border ${
                  theme === 'alabaster' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Free Shipping for All Orders</span>
                  </div>
                  <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                    theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                  }`}>Customer-facing message</label>
                  <input
                    type="text"
                    value={shippingConfig.freeShippingMessage}
                    onChange={e => setShippingConfig(prev => ({ ...prev, freeShippingMessage: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                      theme === 'alabaster'
                        ? 'bg-white border-stone-200 text-stone-900'
                        : 'bg-black/30 border-white/10 text-white'
                    }`}
                    placeholder="e.g. Complimentary White-Glove Delivery on all orders"
                  />
                </div>
              )}

              {/* ── FLAT RATE MODE ─────────────────────────────── */}
              {shippingConfig.mode === 'flat' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                        theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                      }`}>Flat Shipping Cost (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={shippingConfig.flatRate}
                        onChange={e => setShippingConfig(prev => ({ ...prev, flatRate: Number(e.target.value) }))}
                        className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none ${
                          theme === 'alabaster'
                            ? 'bg-white border-stone-200 text-stone-900'
                            : 'bg-black/30 border-white/10 text-white'
                        }`}
                        placeholder="e.g. 99"
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                        theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                      }`}>Free Above Cart Amount (₹, 0 = never)</label>
                      <input
                        type="number"
                        min={0}
                        value={shippingConfig.freeAbove}
                        onChange={e => setShippingConfig(prev => ({ ...prev, freeAbove: Number(e.target.value) }))}
                        className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none ${
                          theme === 'alabaster'
                            ? 'bg-white border-stone-200 text-stone-900'
                            : 'bg-black/30 border-white/10 text-white'
                        }`}
                        placeholder="e.g. 2000 (free if cart ≥ ₹2000)"
                      />
                    </div>
                  </div>
                  {shippingConfig.freeAbove > 0 && (
                    <div className={`flex items-start space-x-2 p-3 rounded-lg text-xs ${
                      theme === 'alabaster' ? 'bg-sky-50 text-sky-700' : 'bg-sky-500/10 text-sky-400'
                    }`}>
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Customers with cart ≥ ₹{shippingConfig.freeAbove.toLocaleString('en-IN')} will get free shipping. Others pay ₹{shippingConfig.flatRate}.</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── TIERED MODE ────────────────────────────────── */}
              {shippingConfig.mode === 'tiered' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-mono tracking-wider uppercase ${
                      theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                    }`}>Shipping Tiers</label>
                    <button
                      onClick={handleAddTier}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs hover:bg-sky-500/20 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tier</span>
                    </button>
                  </div>

                  <div className={`flex items-start space-x-2 p-3 rounded-lg text-xs ${
                    theme === 'alabaster' ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>The tier with the highest <strong>Min Order Amount</strong> that is still ≤ cart value will be applied. Set Min = 0 for the default/lowest tier.</span>
                  </div>

                  <div className="space-y-3">
                    {shippingConfig.tiers.map((tier, idx) => (
                      <div key={tier.id} className={`p-4 rounded-xl border ${
                        theme === 'alabaster' ? 'bg-stone-50 border-stone-200' : 'bg-white/[0.03] border-white/10'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-mono tracking-widest uppercase ${
                            theme === 'alabaster' ? 'text-stone-400' : 'text-stone-500'
                          }`}>Tier {idx + 1}</span>
                          <button
                            onClick={() => handleDeleteTier(tier.id)}
                            className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`text-[10px] font-mono uppercase block mb-1 ${
                              theme === 'alabaster' ? 'text-stone-400' : 'text-stone-500'
                            }`}>Label</label>
                            <input
                              type="text"
                              value={tier.label}
                              onChange={e => handleUpdateTier(tier.id, 'label', e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                                theme === 'alabaster'
                                  ? 'bg-white border-stone-200 text-stone-900'
                                  : 'bg-black/30 border-white/10 text-white'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`text-[10px] font-mono uppercase block mb-1 ${
                              theme === 'alabaster' ? 'text-stone-400' : 'text-stone-500'
                            }`}>Estimated Delivery</label>
                            <input
                              type="text"
                              value={tier.estimatedDays}
                              onChange={e => handleUpdateTier(tier.id, 'estimatedDays', e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                                theme === 'alabaster'
                                  ? 'bg-white border-stone-200 text-stone-900'
                                  : 'bg-black/30 border-white/10 text-white'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`text-[10px] font-mono uppercase block mb-1 ${
                              theme === 'alabaster' ? 'text-stone-400' : 'text-stone-500'
                            }`}>Min Order Amount (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={tier.minOrderAmount}
                              onChange={e => handleUpdateTier(tier.id, 'minOrderAmount', e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                                theme === 'alabaster'
                                  ? 'bg-white border-stone-200 text-stone-900'
                                  : 'bg-black/30 border-white/10 text-white'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`text-[10px] font-mono uppercase block mb-1 ${
                              theme === 'alabaster' ? 'text-stone-400' : 'text-stone-500'
                            }`}>Shipping Cost (₹, 0 = free)</label>
                            <input
                              type="number"
                              min={0}
                              value={tier.cost}
                              onChange={e => handleUpdateTier(tier.id, 'cost', e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                                theme === 'alabaster'
                                  ? 'bg-white border-stone-200 text-stone-900'
                                  : 'bg-black/30 border-white/10 text-white'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview Panel */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-serif">Live Preview — Checkout Display</h4>
              </div>

              <div className="space-y-2">
                {[299, 999, 1999, 4999].map(amount => {
                  const shippingCost = (() => {
                    switch (shippingConfig.mode) {
                      case 'free': return 0;
                      case 'flat':
                        if (shippingConfig.freeAbove > 0 && amount >= shippingConfig.freeAbove) return 0;
                        return shippingConfig.flatRate;
                      case 'tiered': {
                        const sorted = [...shippingConfig.tiers].sort((a, b) => b.minOrderAmount - a.minOrderAmount);
                        for (const t of sorted) {
                          if (amount >= t.minOrderAmount) return t.cost;
                        }
                        return shippingConfig.tiers[0]?.cost ?? 0;
                      }
                      default: return 0;
                    }
                  })();
                  return (
                    <div key={amount} className={`flex items-center justify-between p-3 rounded-lg ${
                      theme === 'alabaster' ? 'bg-stone-50' : 'bg-white/[0.03]'
                    }`}>
                      <span className={`text-xs ${
                        theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'
                      }`}>
                        Cart subtotal: <strong className={theme === 'alabaster' ? 'text-black' : 'text-white'}>₹{amount.toLocaleString('en-IN')}</strong>
                      </span>
                      <span className={`text-xs font-semibold ${
                        shippingCost === 0 ? 'text-emerald-400' : (theme === 'alabaster' ? 'text-stone-900' : 'text-white')
                      }`}>
                        {shippingCost === 0 ? '✓ FREE' : `₹${shippingCost} shipping`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setShippingConfig({ ...DEFAULT_SHIPPING_CONFIG });
                    showToast('Reset to default (free shipping & 30-day returns). Click Save to apply.');
                  }}
                  className={`text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    theme === 'alabaster' ? 'text-stone-400 hover:text-stone-700' : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to defaults</span>
                </button>
              </div>
            </div>

            {/* Returns & Exchange Policy Management Card */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif">Customer Returns & Exchange Window</h3>
                    <p className={`text-xs mt-0.5 ${
                      theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                    }`}>Configure how many days customers have to request returns & exchanges</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveShipping}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase font-semibold shadow-md transition-all cursor-pointer ${
                    shippingSaved
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-black'
                  }`}
                >
                  {shippingSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{shippingSaved ? 'Saved!' : 'Save Return Policy'}</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-3 mb-6">
                <label className={`text-[10px] font-mono tracking-[0.2em] uppercase block ${
                  theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                }`}>Select Standard Return Window</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { days: 7, label: '7 Days', desc: 'Fast Return' },
                    { days: 10, label: '10 Days', desc: 'Short Window' },
                    { days: 14, label: '14 Days', desc: 'Fortnight' },
                    { days: 15, label: '15 Days', desc: 'Mid Window' },
                    { days: 30, label: '30 Days', desc: 'Standard Luxury' },
                    { days: 0, label: '0 Days', desc: 'Final Sale (None)' },
                  ].map(preset => {
                    const isSelected = (shippingConfig.returnDays ?? 30) === preset.days;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setShippingConfig(prev => ({ ...prev, returnDays: preset.days }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? (theme === 'alabaster' ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-amber-400 bg-amber-500/10 shadow-sm')
                            : (theme === 'alabaster' ? 'border-stone-200 hover:border-stone-300 bg-stone-50/50' : 'border-white/10 hover:border-white/20 bg-white/[0.02]')
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${
                            isSelected ? (theme === 'alabaster' ? 'text-amber-800' : 'text-amber-400') : (theme === 'alabaster' ? 'text-stone-800' : 'text-stone-200')
                          }`}>
                            {preset.label}
                          </span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                        </div>
                        <span className={`text-[10px] block mt-0.5 ${
                          isSelected ? (theme === 'alabaster' ? 'text-amber-700' : 'text-amber-300/80') : (theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400')
                        }`}>{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Return Days Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={`text-[10px] font-mono tracking-[0.2em] uppercase block mb-1.5 ${
                    theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                  }`}>Return Window Duration (Days)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={shippingConfig.returnDays ?? 30}
                      onChange={e => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setShippingConfig(prev => ({ ...prev, returnDays: val }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none ${
                        theme === 'alabaster'
                          ? 'bg-stone-50 border-stone-300 text-black'
                          : 'bg-black/40 border-white/15 text-white'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">
                      Days
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1.5 ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                    Enter <strong className="text-amber-400">0</strong> to mark all store pieces as Final Sale (no returns accepted).
                  </p>
                </div>

                <div>
                  <label className={`text-[10px] font-mono tracking-[0.2em] uppercase block mb-1.5 ${
                    theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                  }`}>Current Policy Status</label>
                  <div className={`p-3 rounded-xl border flex items-center space-x-3 ${
                    (shippingConfig.returnDays ?? 30) > 0
                      ? (theme === 'alabaster' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30')
                      : (theme === 'alabaster' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30')
                  }`}>
                    <ShieldCheck className={`w-5 h-5 shrink-0 ${
                      (shippingConfig.returnDays ?? 30) > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`} />
                    <div>
                      <p className={`text-xs font-semibold ${
                        (shippingConfig.returnDays ?? 30) > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {(shippingConfig.returnDays ?? 30) > 0
                          ? `${shippingConfig.returnDays ?? 30}-Day Return Guarantee Active`
                          : 'Final Sale Mode Active (No Returns)'}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {(shippingConfig.returnDays ?? 30) > 0
                          ? 'Badges will show hassle-free return window on product pages.'
                          : 'Customers will be notified that all purchases are final.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Editorial Note */}
              <div className="space-y-2 mb-6">
                <label className={`text-[10px] font-mono tracking-[0.2em] uppercase block ${
                  theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'
                }`}>Return Policy Editorial Copy (Customer Facing)</label>
                <textarea
                  rows={3}
                  value={shippingConfig.returnPolicyNote ?? DEFAULT_SHIPPING_CONFIG.returnPolicyNote}
                  onChange={e => setShippingConfig(prev => ({ ...prev, returnPolicyNote: e.target.value }))}
                  placeholder="Enter details about courier pickup, tag conditions, packaging requirements..."
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none ${
                    theme === 'alabaster' ? 'bg-stone-50 border-stone-300 text-black' : 'bg-black/40 border-white/15 text-white'
                  }`}
                />
                <p className={`text-[11px] ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                  Displayed inside the collapsible Shipping & Returns accordion on product view modals.
                </p>
              </div>

              {/* Live Preview of Customer Experience */}
              <div className={`p-4 rounded-xl border ${
                theme === 'alabaster' ? 'bg-stone-50 border-stone-200' : 'bg-white/[0.02] border-white/10'
              }`}>
                <span className="text-[10px] font-mono tracking-[0.2em] text-amber-400 uppercase block mb-2">
                  Customer Storefront Live Preview
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                    (shippingConfig.returnDays ?? 30) > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {(shippingConfig.returnDays ?? 30) > 0
                        ? `${shippingConfig.returnDays ?? 30}-Day Returns`
                        : 'Final Sale'}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">
                    {(shippingConfig.returnDays ?? 30) > 0
                      ? `${shippingConfig.returnDays ?? 30}-day complimentary return & exchange window across India`
                      : 'This piece is final sale and cannot be returned or exchanged.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 8: CLIENT WAITLIST & RESTOCK DEMAND                             */}
        {/* =================================================================== */}
        {activeTab === 'waitlist' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              theme === 'alabaster' ? 'bg-white border-stone-200 shadow-xs' : 'bg-[#121216] border-white/10'
            }`}>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </span>
                  <h2 className="text-xl font-serif">Client Waitlist & Restock Requests</h2>
                </div>
                <p className={`text-xs mt-1.5 ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                  Verified client inquiries for sold-out pieces. Restock inventory directly or notify clients when replenishment arrives.
                </p>
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={fetchRestock}
                  disabled={isLoadingRestock}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                    theme === 'alabaster'
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-900 border-stone-300'
                      : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRestock ? 'animate-spin' : ''}`} />
                  <span>Refresh Requests</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${theme === 'alabaster' ? 'bg-white border-stone-200 shadow-xs' : 'bg-[#121216] border-white/10'}`}>
                <div className="text-[10px] font-mono tracking-wider text-amber-500 uppercase">Total Demand</div>
                <div className="text-2xl font-serif mt-1">{restockRequests.length}</div>
                <div className="text-[11px] text-stone-400 mt-1">Total requests recorded</div>
              </div>

              <div className={`p-5 rounded-2xl border ${theme === 'alabaster' ? 'bg-white border-stone-200 shadow-xs' : 'bg-[#121216] border-white/10'}`}>
                <div className="text-[10px] font-mono tracking-wider text-amber-400 uppercase">Pending Restock</div>
                <div className="text-2xl font-serif mt-1 text-amber-400">{pendingRestockCount}</div>
                <div className="text-[11px] text-stone-400 mt-1">Awaiting inventory & alert</div>
              </div>

              <div className={`p-5 rounded-2xl border ${theme === 'alabaster' ? 'bg-white border-stone-200 shadow-xs' : 'bg-[#121216] border-white/10'}`}>
                <div className="text-[10px] font-mono tracking-wider text-purple-400 uppercase">Pieces In Demand</div>
                <div className="text-2xl font-serif mt-1">
                  {new Set(restockRequests.map(r => r.productId)).size}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">Unique catalog pieces requested</div>
              </div>

              <div className={`p-5 rounded-2xl border ${theme === 'alabaster' ? 'bg-white border-stone-200 shadow-xs' : 'bg-[#121216] border-white/10'}`}>
                <div className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase">Resolved & Notified</div>
                <div className="text-2xl font-serif mt-1 text-emerald-400">
                  {restockRequests.filter(r => r.status === 'notified').length}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">Clients alerted of restock</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
              theme === 'alabaster' ? 'bg-white border-stone-200 shadow-xs' : 'bg-[#121216] border-white/10'
            }`}>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search client, email, phone, product..."
                  value={restockSearch}
                  onChange={e => setRestockSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none ${
                    theme === 'alabaster'
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-black'
                      : 'bg-black/30 border-white/15 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                {(['all', 'pending', 'notified'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRestockStatusFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      restockStatusFilter === tab
                        ? 'bg-amber-400 text-black shadow-sm font-bold'
                        : theme === 'alabaster'
                        ? 'bg-stone-100 text-stone-600 hover:text-black'
                        : 'bg-white/5 text-stone-400 hover:text-white'
                    }`}
                  >
                    {tab === 'all' ? `All Requests (${restockRequests.length})` : tab === 'pending' ? `Pending (${pendingRestockCount})` : `Notified (${restockRequests.length - pendingRestockCount})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Table / Cards */}
            <div className={`rounded-2xl border overflow-hidden ${
              theme === 'alabaster' ? 'bg-white border-stone-200 shadow-xs' : 'bg-[#121216] border-white/10'
            }`}>
              {filteredRestockRequests.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-serif">No Restock Requests Found</h3>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    {restockSearch
                      ? `No inquiries match "${restockSearch}". Try adjusting your search query.`
                      : 'When clients request notifications on sold-out pieces, their contact details and requested sizes will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b text-[10px] tracking-[0.18em] uppercase ${
                        theme === 'alabaster' ? 'bg-stone-100 text-stone-600 border-stone-200' : 'bg-white/[0.02] text-stone-400 border-white/10'
                      }`}>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Requested Piece & Size</th>
                        <th className="py-3 px-4">Current Stock</th>
                        <th className="py-3 px-4">Requested On</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRestockRequests.map((req) => {
                        const matchedProduct = products.find(p => p.id === req.productId);
                        const currentStock = matchedProduct?.stock ?? 0;
                        const isNowRestocked = currentStock > 0;
                        const cleanPhone = req.customerPhone ? req.customerPhone.replace(/\D/g, '') : '';
                        const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                        const waMessage = encodeURIComponent(
                          `Hello ${req.customerName || 'Valued Client'}, good news from ZARB Haute Couture! The piece "${req.productName}"${req.size ? ` (Size: ${req.size})` : ''} that you requested is now restocked and available for order: ${window.location.origin}/?product=${matchedProduct?.slug || req.productId}`
                        );

                        return (
                          <tr
                            key={req.id}
                            className={`transition-colors ${
                              theme === 'alabaster' ? 'hover:bg-stone-50' : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            {/* Client Column */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-sm">
                                {req.customerName || 'Valued Client'}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-stone-400 mt-0.5">
                                <span className="font-mono">{req.customerEmail}</span>
                              </div>
                              {req.customerPhone && (
                                <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                                  Tel: {req.customerPhone}
                                </div>
                              )}
                            </td>

                            {/* Piece & Size Column */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                {req.productImage && (
                                  <img
                                    src={req.productImage}
                                    alt={req.productName}
                                    className="w-10 h-12 object-cover rounded-lg border border-white/10 shrink-0"
                                  />
                                )}
                                <div>
                                  <div className="font-medium line-clamp-1">{req.productName}</div>
                                  <div className="flex items-center space-x-2 mt-0.5">
                                    {req.size && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/10 text-stone-300">
                                        Size: {req.size}
                                      </span>
                                    )}
                                    {req.color && (
                                      <span className="text-[10px] text-stone-400">
                                        Color: {req.color}
                                      </span>
                                    )}
                                    <span className="text-[11px] font-mono text-amber-400">
                                      ₹{req.productPrice.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Current Stock Status Column */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isNowRestocked ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    ✓ Restocked ({currentStock} in stock)
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                                    0 in stock (Sold Out)
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleQuickRestockProduct(req.productId, currentStock)}
                                className="block mt-1 text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                              >
                                + Set New Stock
                              </button>
                            </td>

                            {/* Requested Date */}
                            <td className="py-3.5 px-4 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                              {new Date(req.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>

                            {/* Status Column */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {req.status === 'notified' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ✓ Notified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Pending Restock
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-2">
                                {waPhone && (
                                  <a
                                    href={`https://wa.me/${waPhone}?text=${waMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] flex items-center space-x-1 shadow-sm transition-colors"
                                    title="Open WhatsApp chat with prefilled restock notification"
                                    onClick={() => handleUpdateRestockStatus(req.id, 'notified')}
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>WhatsApp Alert</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleUpdateRestockStatus(req.id, req.status === 'notified' ? 'pending' : 'notified')}
                                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors cursor-pointer ${
                                    req.status === 'notified'
                                      ? 'border-white/10 hover:bg-white/5 text-stone-400'
                                      : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                  }`}
                                  title="Toggle status"
                                >
                                  {req.status === 'notified' ? 'Mark Pending' : 'Mark Notified'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRestockRequest(req.id)}
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Delete request"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT PRODUCT DRAWER                                 */}
      {/* =================================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className={`w-full max-w-2xl h-full sm:h-[94vh] sm:rounded-3xl border flex flex-col shadow-2xl overflow-hidden ${
            theme === 'alabaster' ? 'bg-[#faf9f5] border-stone-300 text-black' : 'bg-[#0f0f13] border-white/15 text-white'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              theme === 'alabaster' ? 'border-stone-200 bg-white' : 'border-white/10 bg-white/[0.02]'
            }`}>
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-amber-500 uppercase block">
                  {editingProduct
                    ? ((productForm.isPerfume || productForm.category === 'perfumes') ? 'Update Haute Parfumerie Creation' : 'Update Zarb Piece')
                    : ((productForm.isPerfume || productForm.category === 'perfumes') ? 'New Haute Parfumerie Fragrance' : 'Create New Zarb Piece')}
                </span>
                <h2 className="text-lg font-serif">
                  {editingProduct
                    ? editingProduct.name
                    : ((productForm.isPerfume || productForm.category === 'perfumes') ? 'New Fragrance / Attar Flacon' : 'New Catalogue Addition')}
                </h2>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 text-stone-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block border-b border-white/10 pb-2">
                  1. Silhouette & Classification
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      Piece Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g. Double-Faced Cashmere Overcoat"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none ${
                        theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      SKU Identifier
                    </label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="e.g. AT-MN-CT01"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                        theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      Department / Collection *
                    </label>
                    <select
                      value={(productForm.isPerfume || productForm.category === 'perfumes') ? 'perfumes' : productForm.gender}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'perfumes') {
                          const firstPerfFam = perfumeCategories[0]?.name || 'Royal Oud & Oriental';
                          setProductForm(prev => ({
                            ...prev,
                            category: 'perfumes',
                            isPerfume: true,
                            perfumeFamily: prev.perfumeFamily || firstPerfFam,
                            sizes: prev.sizes.length === 0 || !prev.isPerfume ? ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'] : prev.sizes,
                            season: 'HAUTE PARFUMERIE',
                          }));
                          setSizeCategoryTab('perfume');
                        } else {
                          const newGender = val as 'women' | 'men';
                          const firstCategoryForGender = (newGender === 'women' ? womenCategories : menCategories)[0]?.slug || 'kurtis';
                          setProductForm(prev => ({
                            ...prev,
                            gender: newGender,
                            category: firstCategoryForGender,
                            isPerfume: false,
                            sizes: prev.isPerfume ? ['S', 'M', 'L'] : prev.sizes,
                            season: prev.season === 'HAUTE PARFUMERIE' ? 'Autumn / Winter 2026' : prev.season,
                          }));
                          setSizeCategoryTab('all');
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs uppercase border focus:outline-none cursor-pointer ${
                        (productForm.isPerfume || productForm.category === 'perfumes')
                          ? (theme === 'alabaster' ? 'bg-amber-50 border-amber-300 text-black font-semibold' : 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold')
                          : (theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white')
                      }`}
                    >
                      <option value="women">Women's Collection</option>
                      <option value="men">Men's Collection</option>
                      <option value="perfumes">✨ Haute Parfumerie (Perfumes & Attars)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      {(productForm.isPerfume || productForm.category === 'perfumes') ? 'Olfactory Fragrance Family *' : 'Category Silhouette *'}
                    </label>
                    {(productForm.isPerfume || productForm.category === 'perfumes') ? (
                      <select
                        value={productForm.perfumeFamily || (perfumeCategories[0]?.name ?? '')}
                        onChange={(e) => setProductForm(prev => ({
                          ...prev,
                          perfumeFamily: e.target.value,
                          category: 'perfumes',
                          isPerfume: true,
                        }))}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs uppercase border focus:outline-none cursor-pointer ${
                          theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                        }`}
                      >
                        {perfumeCategories.map((c) => (
                          <option key={c.slug} value={c.name}>
                            {c.name} ({c.shortName})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={productForm.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          const isPerf = newCat === 'perfumes' || productForm.isPerfume;
                          setProductForm(prev => ({
                            ...prev,
                            category: newCat,
                            isPerfume: isPerf,
                            sizes: isPerf && prev.sizes.length === 0 ? ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'] : prev.sizes,
                          }));
                          if (isPerf) setSizeCategoryTab('perfume');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs uppercase border focus:outline-none cursor-pointer ${
                          theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                        }`}
                      >
                        {(productForm.gender === 'women' ? womenCategories : menCategories).map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name} ({c.shortName})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Haute Parfumerie & Pure Attar Activation Toggle */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  (productForm.isPerfume || productForm.category === 'perfumes')
                    ? (theme === 'alabaster' ? 'bg-amber-50/80 border-amber-300' : 'bg-amber-500/10 border-amber-500/30')
                    : (theme === 'alabaster' ? 'bg-stone-50 border-stone-200' : 'bg-white/[0.02] border-white/10')
                }`}>
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        (productForm.isPerfume || productForm.category === 'perfumes')
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-stone-400'
                      }`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider block">
                          Haute Parfumerie & Pure Attar Formula
                        </span>
                        <span className={`text-[11px] ${theme === 'alabaster' ? 'text-stone-500' : 'text-stone-400'}`}>
                          Enable olfactory pyramid, pure oil concentration, and multi-volume ML pricing
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={productForm.isPerfume || productForm.category === 'perfumes'}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProductForm(prev => ({
                          ...prev,
                          isPerfume: checked,
                          category: checked ? 'perfumes' : (prev.category === 'perfumes' ? 'kurtis' : prev.category),
                          sizes: checked && prev.sizes.length === 0 ? ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'] : prev.sizes,
                        }));
                        if (checked) setSizeCategoryTab('perfume');
                      }}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  {/* Olfactory Formula Details when Active */}
                  {(productForm.isPerfume || productForm.category === 'perfumes') && (
                    <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-500">
                              Olfactory Family
                            </label>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateCategory('perfumes')}
                              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer font-mono"
                              title="Create and configure a new olfactory category"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ New Category</span>
                            </button>
                          </div>
                          <select
                            value={productForm.perfumeFamily}
                            onChange={(e) => setProductForm(prev => ({ ...prev, perfumeFamily: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                              theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                            }`}
                          >
                            {perfumeCategories.map((cat) => (
                              <option key={cat.slug} value={cat.name}>{cat.name}</option>
                            ))}
                            {productForm.perfumeFamily && !perfumeCategories.some(c => c.name === productForm.perfumeFamily) && (
                              <option value={productForm.perfumeFamily}>{productForm.perfumeFamily}</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-500 mb-1">
                            Concentration Grade
                          </label>
                          <input
                            type="text"
                            value={productForm.concentration}
                            onChange={(e) => setProductForm(prev => ({ ...prev, concentration: e.target.value }))}
                            placeholder="e.g. Pure Concentrated Attar & Extrait (100% Pure Oil)"
                            className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                              theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-500 mb-1">
                            Longevity Rating
                          </label>
                          <input
                            type="text"
                            value={productForm.longevity}
                            onChange={(e) => setProductForm(prev => ({ ...prev, longevity: e.target.value }))}
                            placeholder="e.g. 24+ Hours · Eternal"
                            className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                              theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-500 mb-1">
                            Sillage & Projection
                          </label>
                          <input
                            type="text"
                            value={productForm.sillage}
                            onChange={(e) => setProductForm(prev => ({ ...prev, sillage: e.target.value }))}
                            placeholder="e.g. Majestic & Enveloping"
                            className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                              theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Olfactory Notes Pyramid Inputs */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                          Olfactory Pyramid Notes (Comma-separated)
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-mono text-amber-400 uppercase mb-1">
                              Top Notes (First 15 mins)
                            </label>
                            <input
                              type="text"
                              value={productForm.topNotes}
                              onChange={(e) => setProductForm(prev => ({ ...prev, topNotes: e.target.value }))}
                              placeholder="Wild Bergamot, Saffron..."
                              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                                theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-rose-400 uppercase mb-1">
                              Heart Notes (1 to 4 hrs)
                            </label>
                            <input
                              type="text"
                              value={productForm.heartNotes}
                              onChange={(e) => setProductForm(prev => ({ ...prev, heartNotes: e.target.value }))}
                              placeholder="Taif Rose, Frankincense..."
                              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                                theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-amber-600 uppercase mb-1">
                              Base Notes (Drydown 24h)
                            </label>
                            <input
                              type="text"
                              value={productForm.baseNotes}
                              onChange={(e) => setProductForm(prev => ({ ...prev, baseNotes: e.target.value }))}
                              placeholder="Kalakassi Oud, Sandalwood..."
                              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                                theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block border-b border-white/10 pb-2">
                  2. Pricing (INR) & Inventory
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      Retail Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                        theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      Compare Price (₹, Strikethrough)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={productForm.compareAtPrice || ''}
                      placeholder="Optional"
                      onChange={(e) => setProductForm({ ...productForm, compareAtPrice: Number(e.target.value) || undefined })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                        theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      Inventory Stock Count *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                        theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Editorial Flags */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.newArrival}
                      onChange={(e) => setProductForm({ ...productForm, newArrival: e.target.checked })}
                      className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-0"
                    />
                    <span>New Arrival Badge</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.bestSeller}
                      onChange={(e) => setProductForm({ ...productForm, bestSeller: e.target.checked })}
                      className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-0"
                    />
                    <span>Best Seller Badge</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                      className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-0"
                    />
                    <span>Featured Runway Item</span>
                  </label>
                </div>

                {/* Storefront Visibility Status Card */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  productForm.hidden
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/25'
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        productForm.hidden
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {productForm.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold tracking-wide flex items-center gap-2">
                          <span>{productForm.hidden ? 'Storefront Status: Hidden (Draft / Archived)' : 'Storefront Status: Live on Store'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                            productForm.hidden
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {productForm.hidden ? 'Hidden' : 'Live'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                          {productForm.hidden
                            ? 'Hidden from storefront grids, category pages, search, and recommendations. All pricing, inventory, and images remain preserved.'
                            : 'Visible to all customers and visitors across category pages, search, and product details.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setProductForm(prev => ({ ...prev, hidden: !prev.hidden }))}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono uppercase tracking-wider shrink-0 transition-all cursor-pointer font-semibold ${
                        productForm.hidden
                          ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400 shadow-md'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-white/20'
                      }`}
                    >
                      {productForm.hidden ? 'Make Live' : 'Hide Item'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block">
                    3. Imagery & Visual Assets
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {productForm.images.length} {productForm.images.length === 1 ? 'photo' : 'photos'} &middot; Click "Set as Cover" to choose main photo
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Images list */}
                  {productForm.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {productForm.images.map((img, idx) => {
                        const isCover = idx === 0;
                        return (
                          <div
                            key={idx}
                            className={`relative group rounded-2xl overflow-hidden border transition-all aspect-[3/4] bg-stone-900 ${
                              isCover
                                ? 'border-amber-500 ring-2 ring-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                                : 'border-white/10 hover:border-amber-400/50'
                            }`}
                          >
                            <img
                              src={getMediaUrl(img)}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Top Badge: Primary Cover Indicator */}
                            {isCover && (
                              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-mono font-bold text-[9px] tracking-wider uppercase shadow-md">
                                  <Star className="w-2.5 h-2.5 fill-stone-950 text-stone-950" />
                                  <span>Cover</span>
                                </span>
                              </div>
                            )}

                            {/* Position Index Badge at Bottom-Left */}
                            <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold tracking-wider uppercase backdrop-blur-md ${
                                isCover
                                  ? 'bg-amber-500 text-stone-950 shadow-xs font-bold'
                                  : 'bg-black/80 text-stone-300 border border-white/10'
                              }`}>
                                #{idx + 1}
                              </span>
                            </div>

                            {/* Refined Luxury Floating Center Toolbar on Hover */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center p-2 z-20 space-y-2">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryCover(idx)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-sans font-bold text-[10px] tracking-wider uppercase shadow-[0_2px_10px_rgba(245,158,11,0.35)] cursor-pointer transition-all active:scale-95 hover:scale-105"
                                >
                                  <Star className="w-3 h-3 fill-stone-950 text-stone-950" />
                                  <span>Set as Cover</span>
                                </button>
                              )}

                              {/* Compact Reorder & Delete Toolbar */}
                              <div className="flex items-center space-x-1 p-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 shadow-lg">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveGalleryImage(idx, 'left')}
                                    className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-white/20 cursor-pointer transition-colors"
                                    title="Move earlier in gallery"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {idx < productForm.images.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveGalleryImage(idx, 'right')}
                                    className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-white/20 cursor-pointer transition-colors"
                                    title="Move later in gallery"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const target = productForm.images[idx];
                                    if (isR2Url(target)) {
                                      deleteImageFromR2(target);
                                    }
                                    const updated = productForm.images.filter((_, i) => i !== idx);
                                    setProductForm({ ...productForm, images: updated });
                                    showToast('Image removed from gallery.');
                                  }}
                                  className="p-1 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-500/20 cursor-pointer transition-colors"
                                  title="Remove image from gallery"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Multi-Image Drag & Drop Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingGallery(true);
                    }}
                    onDragLeave={() => setIsDraggingGallery(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDraggingGallery(false);
                      const files = Array.from(e.dataTransfer.files || []);
                      await handleUploadMultipleGalleryFiles(files);
                    }}
                    onClick={() => galleryFileInputRef.current?.click()}
                    className={`relative p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                      isDraggingGallery
                        ? 'border-amber-500 bg-amber-500/15 scale-[1.01]'
                        : theme === 'alabaster'
                        ? 'border-stone-300 bg-stone-100/60 hover:bg-stone-100 hover:border-amber-500/60'
                        : 'border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/60'
                    }`}
                  >
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/*,image/jpeg,image/png,image/webp,image/gif,image/avif"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        await handleUploadMultipleGalleryFiles(files);
                        e.target.value = '';
                      }}
                    />

                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                          Drop Multiple Images Here or Click to Browse
                        </div>
                        <div className={`text-[11px] mt-0.5 ${theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'}`}>
                          Select 5, 10, 20+ dress photos all at once from your computer
                        </div>
                      </div>

                      {/* Keyboard Shortcut & Multi-Select Helper Badge */}
                      <div className={`inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-mono ${
                        theme === 'alabaster'
                          ? 'bg-amber-500/10 border-amber-500/30 text-stone-900'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}>
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                        <span><strong>How to select all at once:</strong> In file window, press <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-amber-400 font-bold border border-amber-500/30">Ctrl + A</kbd> to select all, or hold <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-amber-400 font-bold border border-amber-500/30">Ctrl</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-amber-400 font-bold border border-amber-500/30">Shift</kbd> while clicking</span>
                      </div>
                    </div>
                  </div>

                  {/* Uploading Progress Indicator */}
                  {isUploadingGallery && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 animate-pulse">
                      <div className="flex justify-between text-xs font-mono text-amber-400">
                        <span className="flex items-center space-x-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading {galleryUploadProgress.current} of {galleryUploadProgress.total} images directly to Cloudflare R2...</span>
                        </span>
                        <span className="font-bold">{galleryUploadProgress.percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                          style={{ width: `${galleryUploadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Add Image URL or Local Upload Action Bar */}
                  <div className="space-y-2.5">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Paste web image URL or Google Drive link..."
                        className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none font-mono ${
                          theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const urls = newImageUrl
                            .split(/[\n,]+/)
                            .map((u) => u.trim())
                            .filter((u) => u.length > 0)
                            .map(convertGoogleDriveUrl);
                          if (urls.length > 0) {
                            setProductForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
                            setNewImageUrl('');
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-stone-200 cursor-pointer shadow-md transition-all shrink-0"
                      >
                        Add URL
                      </button>

                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black border border-amber-500 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shrink-0 shadow-md"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Multiple Files</span>
                      </button>
                    </div>

                    {/* Quick Preset Luxury Photo Buttons */}
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1.5">
                        Or click a high-resolution luxury photo preset:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '🧥 Trench Coat', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop' },
                          { label: '👗 Silk Kurti/Dress', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop' },
                          { label: '👔 Tailored Blazer', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop' },
                          { label: '👕 Luxury Knit', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop' },
                          { label: '👜 Leather Bag', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop' },
                          { label: '👢 Chelsea Boots', url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=1000&auto=format&fit=crop' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setProductForm({ ...productForm, images: [...productForm.images, preset.url] });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                              theme === 'alabaster'
                                ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                                : 'bg-white/[0.04] hover:bg-white/[0.1] text-stone-300 border-white/10 hover:border-white/20'
                            }`}
                          >
                            + {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colors & Swatches (Apparel Only — Completely Omitted for Fragrances) */}
              {!(productForm.isPerfume || productForm.category === 'perfumes') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-stone-400">
                      4. Color Shades & Color-Specific Imagery
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">
                      {productForm.colors.length} {productForm.colors.length === 1 ? 'shade' : 'shades'} configured
                    </span>
                  </div>

                <div className="space-y-4">
                  {/* Swatch Pills with Dedicated Photo Count */}
                  <div className="flex flex-wrap gap-2">
                    {productForm.colors.map((c, idx) => {
                      const photoCount = c.images?.length || (c.image ? 1 : 0);
                      const isPanelOpen = activeColorImageIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                            isPanelOpen
                              ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                              : 'border-white/15 bg-white/5 hover:border-white/30'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: c.hex }} />
                          <span className="font-medium">{c.name}</span>

                          {/* Manage Photos Button */}
                          <button
                            type="button"
                            onClick={() => setActiveColorImageIndex(isPanelOpen ? null : idx)}
                            className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                              photoCount > 0
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                            title={`Manage dedicated photos for ${c.name}`}
                          >
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>{photoCount > 0 ? `${photoCount} photos` : '+ Photos'}</span>
                          </button>

                          {/* Delete Color */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productForm.colors.filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, colors: updated });
                              if (activeColorImageIndex === idx) setActiveColorImageIndex(null);
                            }}
                            className="text-stone-400 hover:text-red-400 ml-0.5 cursor-pointer"
                            title="Remove color"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dedicated Photos Sub-Panel for Active Color */}
                  {activeColorImageIndex !== null && productForm.colors[activeColorImageIndex] && (() => {
                    const activeColor = productForm.colors[activeColorImageIndex];
                    const colorImages = activeColor.images || (activeColor.image ? [activeColor.image] : []);

                    const handleAddImageToColor = (imgUrl: string) => {
                      if (!imgUrl.trim()) return;
                      const formatted = convertGoogleDriveUrl(imgUrl);
                      const updatedColors = productForm.colors.map((c, i) => {
                        if (i !== activeColorImageIndex) return c;
                        const currentImgs = c.images || (c.image ? [c.image] : []);
                        return {
                          ...c,
                          image: currentImgs[0] || formatted,
                          images: [...currentImgs, formatted],
                        };
                      });
                      setProductForm({ ...productForm, colors: updatedColors });
                      setNewColorImageUrl('');
                    };

                    const handleRemoveImageFromColor = (imgIdx: number) => {
                      const updatedColors = productForm.colors.map((c, i) => {
                        if (i !== activeColorImageIndex) return c;
                        const currentImgs = c.images || (c.image ? [c.image] : []);
                        const target = currentImgs[imgIdx];
                        if (isR2Url(target)) {
                          deleteImageFromR2(target);
                        }
                        const filtered = currentImgs.filter((_, idx) => idx !== imgIdx);
                        return {
                          ...c,
                          image: filtered[0] || '',
                          images: filtered,
                        };
                      });
                      setProductForm({ ...productForm, colors: updatedColors });
                    };

                    return (
                      <div className={`p-4 rounded-2xl border space-y-3.5 transition-all ${
                        theme === 'alabaster' ? 'bg-stone-50 border-stone-300' : 'bg-black/60 border-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.06)]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-4 h-4 rounded-full border border-white/40 shadow-sm" style={{ backgroundColor: activeColor.hex }} />
                            <h4 className="text-xs font-serif tracking-wider uppercase text-amber-400 font-medium">
                              Dedicated Photos for {activeColor.name}
                            </h4>
                            <span className="text-[10px] font-mono text-stone-400">
                              ({colorImages.length} {colorImages.length === 1 ? 'photo' : 'photos'})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveColorImageIndex(null)}
                            className="text-[10px] uppercase font-mono tracking-wider px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-stone-300 cursor-pointer"
                          >
                            Close Panel
                          </button>
                        </div>

                        <p className="text-[11px] text-stone-400 leading-relaxed font-light">
                          When shoppers select <strong className="text-white font-medium">{activeColor.name}</strong> on the storefront product page or hover on the card swatch, these dedicated photos will be displayed.
                        </p>

                        {/* Gallery Grid for this Color */}
                        {colorImages.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {colorImages.map((img, imgIdx) => {
                              const isCover = imgIdx === 0;
                              return (
                                <div
                                  key={imgIdx}
                                  className={`relative group rounded-xl overflow-hidden border aspect-[3/4] bg-stone-900 shadow-sm transition-all ${
                                    isCover
                                      ? 'border-amber-500 ring-2 ring-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                      : 'border-white/15 hover:border-amber-400/50'
                                  }`}
                                >
                                  <img
                                    src={getMediaUrl(img)}
                                    alt={`${activeColor.name} preview ${imgIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />

                                  {/* Top Cover Status Badge on Color Cover Photo */}
                                  {isCover && (
                                    <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-sans font-bold text-[9px] tracking-wider uppercase shadow border border-amber-300/40">
                                        <Star className="w-2.5 h-2.5 fill-stone-950 text-stone-950" />
                                        <span>Cover</span>
                                      </span>
                                    </div>
                                  )}

                                  {/* Position Index Badge */}
                                  <div className="absolute bottom-1 left-1 z-10 pointer-events-none">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase backdrop-blur-md ${
                                      isCover ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-black/80 text-stone-300 border border-white/10'
                                    }`}>
                                      #{imgIdx + 1}
                                    </span>
                                  </div>

                                  {/* Full Interactive Hover Overlay */}
                                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center p-2 z-20 space-y-2">
                                    {!isCover && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetColorCover(activeColorImageIndex, imgIdx)}
                                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-sans font-bold text-[10px] tracking-wider uppercase shadow-[0_2px_10px_rgba(245,158,11,0.35)] cursor-pointer transition-all active:scale-95 hover:scale-105"
                                      >
                                        <Star className="w-3 h-3 fill-stone-950 text-stone-950" />
                                        <span>Set as Cover</span>
                                      </button>
                                    )}

                                    {/* Compact Reorder & Delete Toolbar */}
                                    <div className="flex items-center space-x-1 p-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 shadow-lg">
                                      {imgIdx > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleMoveColorImage(activeColorImageIndex, imgIdx, 'left')}
                                          className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-white/20 cursor-pointer transition-colors"
                                          title="Move earlier"
                                        >
                                          <ChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {imgIdx < colorImages.length - 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleMoveColorImage(activeColorImageIndex, imgIdx, 'right')}
                                          className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-white/20 cursor-pointer transition-colors"
                                          title="Move later"
                                        >
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveImageFromColor(imgIdx)}
                                        className="p-1 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-500/20 cursor-pointer transition-colors"
                                        title="Remove photo from this color"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 text-center border border-dashed border-white/15 rounded-xl text-stone-500 text-xs">
                            No dedicated photos yet. Product falls back to primary gallery photos. Add photos below.
                          </div>
                        )}

                        {/* Input to add photo to this color */}
                        <div className="flex items-center space-x-2 pt-1">
                          <input
                            type="url"
                            value={newColorImageUrl}
                            onChange={(e) => setNewColorImageUrl(e.target.value)}
                            placeholder={`Paste photo URL for ${activeColor.name}...`}
                            className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                              theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddImageToColor(newColorImageUrl)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase shadow cursor-pointer shrink-0"
                          >
                            Add Photo
                          </button>
                          {/* File Upload for this Color directly to Cloudflare R2 */}
                          <input
                            ref={colorFileInputRef}
                            type="file"
                            accept="image/*,image/jpeg,image/png,image/webp,image/gif,image/avif"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (activeColor) {
                                await handleUploadMultipleColorFiles(files, activeColor.name, activeColorImageIndex);
                              }
                              e.target.value = '';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => colorFileInputRef.current?.click()}
                            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                            <span>Select Multiple Photos</span>
                          </button>
                        </div>

                        {/* Drag & Drop Zone for Color Photos */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingColorPhotos(true);
                          }}
                          onDragLeave={() => setIsDraggingColorPhotos(false)}
                          onDrop={async (e) => {
                            e.preventDefault();
                            setIsDraggingColorPhotos(false);
                            const files = Array.from(e.dataTransfer.files || []);
                            if (activeColor) {
                              await handleUploadMultipleColorFiles(files, activeColor.name, activeColorImageIndex);
                            }
                          }}
                          onClick={() => colorFileInputRef.current?.click()}
                          className={`p-3 rounded-xl border border-dashed transition-all cursor-pointer text-center text-xs ${
                            isDraggingColorPhotos
                              ? 'border-amber-500 bg-amber-500/15'
                              : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="text-stone-300">
                            Drop multiple photos for <strong>{activeColor.name}</strong> here, or click to select multiple (Press <strong>Ctrl + A</strong> to select all)
                          </span>
                        </div>

                        {/* Color Photos Upload Progress */}
                        {isUploadingColorPhotos && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                            <div className="flex justify-between text-[11px] font-mono text-amber-400">
                              <span className="flex items-center space-x-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Uploading {colorUploadProgress.current} of {colorUploadProgress.total} photos for {activeColor.name}...</span>
                              </span>
                              <span>{colorUploadProgress.percent}%</span>
                            </div>
                            <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 transition-all duration-300"
                                style={{ width: `${colorUploadProgress.percent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Quick Presets for Color Photos */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 mr-1">
                            Quick Presets:
                          </span>
                          {[
                            { label: 'Obsidian Noir', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop' },
                            { label: 'Cashmere Cream', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop' },
                            { label: 'Crimson Scarlet', url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop' },
                            { label: 'Emerald Tailoring', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop' },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleAddImageToColor(preset.url)}
                              className="px-2 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] text-stone-300 cursor-pointer"
                            >
                              + {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Color Presets */}
                  <div className="text-[11px] text-stone-400 pt-1">
                    <span className="block mb-1.5 font-medium">Add from luxury swatch presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {LUXURY_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            if (!productForm.colors.some(c => c.name === preset.name)) {
                              setProductForm({
                                ...productForm,
                                colors: [...productForm.colors, { name: preset.name, hex: preset.hex, images: [] }],
                              });
                            }
                          }}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/10 text-[10px] cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: preset.hex }} />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Color Creator */}
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[11px] text-stone-400 block mb-1.5">Or create custom shade:</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer shrink-0"
                        title="Choose color shade"
                      />
                      <input
                        type="text"
                        value={customColorName}
                        onChange={(e) => setCustomColorName(e.target.value)}
                        placeholder="Color name (e.g. Royal Ruby, Champagne Silk)"
                        className={`flex-1 px-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                          theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customColorName.trim()) {
                            setProductForm({
                              ...productForm,
                              colors: [...productForm.colors, { name: customColorName.trim(), hex: customColorHex, images: [] }],
                            });
                            setCustomColorName('');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium cursor-pointer shrink-0"
                      >
                        + Add Custom Shade
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sizes & Size Management */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-400">
                  {(productForm.isPerfume || productForm.category === 'perfumes')
                    ? `4. Flacon Volumes & ML Pricing (${productForm.sizes.length} selected)`
                    : `5. Available Sizes & Size Management (${productForm.sizes.length} selected)`}
                </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const std = ['S', 'M', 'L', 'XL'];
                        setProductForm(prev => ({ ...prev, sizes: Array.from(new Set([...prev.sizes, ...std])) }));
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] uppercase font-mono bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 cursor-pointer"
                    >
                      + S to XL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const inclusive = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
                        setProductForm(prev => ({ ...prev, sizes: Array.from(new Set([...prev.sizes, ...inclusive])) }));
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] uppercase font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer"
                    >
                      + XS to XXXXL (4XL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm(prev => ({ ...prev, sizes: [] }))}
                      className="px-2 py-1 rounded-lg text-[10px] uppercase font-mono text-stone-400 hover:text-red-400 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Selected Sizes Chips Bar */}
                {productForm.sizes.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
                    <span className="text-[10px] font-mono tracking-wider text-amber-400 uppercase mr-1">
                      Active Sizes:
                    </span>
                    {productForm.sizes.map((sz) => (
                      <span
                        key={sz}
                        className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-amber-500 text-black font-semibold text-xs font-mono"
                      >
                        <span>{sz}</span>
                        <button
                          type="button"
                          onClick={() => setProductForm(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== sz) }))}
                          className="hover:text-red-900 cursor-pointer ml-1 text-sm leading-none"
                          title={`Remove ${sz}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 italic">
                    No sizes selected yet. If left empty, it will default to &ldquo;One Size&rdquo;.
                  </p>
                )}

                {/* Add Custom Size Input (e.g. XXXXL, 5XL, 38R, Made-to-Measure) */}
                <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${
                  theme === 'alabaster' ? 'bg-stone-50 border-stone-200' : 'bg-white/[0.03] border-white/10'
                }`}>
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = customSizeInput.trim().toUpperCase();
                        if (trimmed) {
                          if (!productForm.sizes.includes(trimmed)) {
                            setProductForm(prev => ({ ...prev, sizes: [...prev.sizes, trimmed] }));
                          }
                          if (!customSizesList.includes(trimmed)) {
                            setCustomSizesList(prev => [...prev, trimmed]);
                          }
                          setCustomSizeInput('');
                          showToast(`Size "${trimmed}" added!`);
                        }
                      }
                    }}
                    placeholder="Type custom size (e.g. XXXXL, 4XL, 5XL, 38R, Made-to-Measure)..."
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono border focus:outline-none ${
                      theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customSizeInput.trim().toUpperCase();
                      if (trimmed) {
                        if (!productForm.sizes.includes(trimmed)) {
                          setProductForm(prev => ({ ...prev, sizes: [...prev.sizes, trimmed] }));
                        }
                        if (!customSizesList.includes(trimmed)) {
                          setCustomSizesList(prev => [...prev, trimmed]);
                        }
                        setCustomSizeInput('');
                        showToast(`Size "${trimmed}" added!`);
                      }
                    }}
                    disabled={!customSizeInput.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    + Add Size
                  </button>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
                  {[
                    { id: 'all', label: 'All Sizing' },
                    { id: 'perfume', label: 'Flacon Volume (ML)' },
                    { id: 'alpha', label: 'Standard (XS - 5XL)' },
                    { id: 'suit', label: 'European / Suit' },
                    { id: 'waist', label: 'Waist (26-44)' },
                    { id: 'special', label: 'Universal / Bespoke' },
                    { id: 'custom', label: `Custom (${customSizesList.length})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSizeCategoryTab(tab.id as any)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-sans tracking-wider uppercase transition-all cursor-pointer ${
                        sizeCategoryTab === tab.id
                          ? 'bg-white/15 text-amber-400 font-semibold'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Size Selection Grid */}
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {(() => {
                    let pool: string[] = [];
                    if (sizeCategoryTab === 'all') {
                      pool = Array.from(new Set([...STANDARD_SIZES, ...customSizesList]));
                    } else if (sizeCategoryTab === 'custom') {
                      pool = customSizesList;
                    } else {
                      const matched = SIZE_CATEGORIES.find(c => c.id === sizeCategoryTab);
                      pool = matched ? matched.sizes : [];
                    }

                    return pool.map((sz) => {
                      const isSelected = productForm.sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setProductForm(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== sz) }));
                            } else {
                              setProductForm(prev => ({ ...prev, sizes: [...prev.sizes, sz] }));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-black font-semibold ring-2 ring-amber-400/40 shadow-sm'
                              : 'bg-white/5 text-stone-400 border border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {isSelected && '✓ '}{sz}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Haute Parfumerie ML Individual Volume Pricing Manager */}
                {(productForm.isPerfume || productForm.category === 'perfumes') && (
                  <div className={`p-4 rounded-2xl border space-y-3.5 mt-4 ${
                    theme === 'alabaster' ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-500/[0.04] border-amber-500/25'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 text-amber-500">
                        <Droplets className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                          Flacon ML Individual Volume Pricing Manager
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const attarSizes = ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'];
                          const attarOptions: PerfumeVolumeOption[] = [
                            { ml: '6ml (Attar)', price: 4500, compareAtPrice: 5500, inStock: true },
                            { ml: '12ml (1 Tola)', price: 8500, compareAtPrice: 10500, inStock: true },
                            { ml: '50ml (Extrait)', price: 18500, compareAtPrice: 22000, inStock: true },
                            { ml: '100ml (Grand Flacon)', price: 29000, compareAtPrice: 35000, inStock: true },
                          ];
                          setProductForm(prev => ({
                            ...prev,
                            sizes: Array.from(new Set([...prev.sizes, ...attarSizes])),
                            volumeOptions: attarOptions,
                          }));
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer transition-colors"
                      >
                        + Reset Attar ML Presets
                      </button>
                    </div>

                    <p className={`text-[11px] leading-relaxed ${theme === 'alabaster' ? 'text-stone-600' : 'text-stone-400'}`}>
                      Set distinct prices and inventory status for each flacon volume. When clients switch between 6ml, 12ml, 50ml, and 100ml on the storefront, the price automatically adjusts in real-time.
                    </p>

                    {productForm.sizes.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {productForm.sizes.map((sz) => {
                          const existingVo = productForm.volumeOptions.find(v => v.ml === sz) || {
                            ml: sz,
                            price: productForm.price,
                            compareAtPrice: productForm.compareAtPrice,
                            inStock: true,
                          };

                          return (
                            <div
                              key={sz}
                              className={`p-3 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                                theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-black/40 border-white/10'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-[130px]">
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                <span className="font-mono text-xs font-semibold">{sz}</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
                                <div className="flex items-center space-x-1.5">
                                  <label className="text-[10px] font-mono text-stone-400 uppercase">Price (₹):</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={existingVo.price}
                                    onChange={(e) => {
                                      const val = Math.max(0, Number(e.target.value) || 0);
                                      setProductForm(prev => {
                                        const other = prev.volumeOptions.filter(v => v.ml !== sz);
                                        return {
                                          ...prev,
                                          volumeOptions: [...other, { ...existingVo, price: val }],
                                        };
                                      });
                                    }}
                                    className={`w-24 px-2 py-1 rounded-lg text-xs font-mono border focus:outline-none ${
                                      theme === 'alabaster' ? 'bg-stone-50 border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                                    }`}
                                  />
                                </div>

                                <div className="flex items-center space-x-1.5">
                                  <label className="text-[10px] font-mono text-stone-400 uppercase">Compare (₹):</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={existingVo.compareAtPrice || ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = e.target.value ? Math.max(0, Number(e.target.value)) : undefined;
                                      setProductForm(prev => {
                                        const other = prev.volumeOptions.filter(v => v.ml !== sz);
                                        return {
                                          ...prev,
                                          volumeOptions: [...other, { ...existingVo, compareAtPrice: val }],
                                        };
                                      });
                                    }}
                                    className={`w-20 px-2 py-1 rounded-lg text-xs font-mono border focus:outline-none ${
                                      theme === 'alabaster' ? 'bg-stone-50 border-stone-300 text-black' : 'bg-black/60 border-white/15 text-white'
                                    }`}
                                  />
                                </div>

                                <label className="flex items-center space-x-1.5 text-xs font-mono cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={existingVo.inStock !== false}
                                    onChange={(e) => {
                                      const inStock = e.target.checked;
                                      setProductForm(prev => {
                                        const other = prev.volumeOptions.filter(v => v.ml !== sz);
                                        return {
                                          ...prev,
                                          volumeOptions: [...other, { ...existingVo, inStock }],
                                        };
                                      });
                                    }}
                                    className="rounded border-white/20 text-amber-500 focus:ring-0"
                                  />
                                  <span className={existingVo.inStock !== false ? 'text-emerald-400' : 'text-stone-500'}>
                                    {existingVo.inStock !== false ? 'In Stock' : 'Out'}
                                  </span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-500/80 italic">
                        Select one or more volume sizes above to configure individual ML prices.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Editorial Copy */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block border-b border-white/10 pb-2">
                  {(productForm.isPerfume || productForm.category === 'perfumes')
                    ? '5. Editorial Story & Scent Specifications'
                    : '6. Editorial Copy & Fabric Specifications'}
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      Story & Description
                    </label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Write an architectural luxury description..."
                      className={`w-full p-3 rounded-xl text-xs border focus:outline-none ${
                        theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                        Materials & Fabric
                      </label>
                      <input
                        type="text"
                        value={productForm.materials}
                        onChange={(e) => setProductForm({ ...productForm, materials: e.target.value })}
                        placeholder="e.g. 100% Cashmere & Mulberry Silk"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                        Fit & Silhouette
                      </label>
                      <input
                        type="text"
                        value={productForm.fit}
                        onChange={(e) => setProductForm({ ...productForm, fit: e.target.value })}
                        placeholder="e.g. Architectural Oversized Cut"
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                          theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Per-piece Return Policy Window Override */}
                  <div className={`p-4 rounded-xl border mt-3 ${
                    theme === 'alabaster' ? 'bg-stone-50 border-stone-200' : 'bg-white/[0.02] border-white/10'
                  }`}>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Return Policy Window (Per-Piece Policy)</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-400/80 lowercase">
                        store default: {shippingConfig.returnDays ?? 30} days
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <select
                          value={productForm.returnDays === undefined ? 'default' : String(productForm.returnDays)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'default') {
                              setProductForm(prev => ({ ...prev, returnDays: undefined }));
                            } else {
                              setProductForm(prev => ({ ...prev, returnDays: parseInt(val) }));
                            }
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                            theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                          }`}
                        >
                          <option value="default">Use Global Store Policy ({shippingConfig.returnDays ?? 30} Days)</option>
                          <option value="7">7 Days Return</option>
                          <option value="10">10 Days Return</option>
                          <option value="14">14 Days Return</option>
                          <option value="15">15 Days Return</option>
                          <option value="30">30 Days Return</option>
                          <option value="0">0 Days — Final Sale (Non-Returnable)</option>
                        </select>
                      </div>
                      <div className="flex items-center text-[11px] text-stone-400">
                        {productForm.returnDays === undefined ? (
                          <span>Inheriting global return policy ({shippingConfig.returnDays ?? 30} days).</span>
                        ) : productForm.returnDays === 0 ? (
                          <span className="text-amber-400">Marked as Final Sale (no returns or exchanges allowed).</span>
                        ) : (
                          <span className="text-emerald-400">Custom {productForm.returnDays}-day return window for this piece.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-xs tracking-wider uppercase text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSavingProduct
                    ? 'Saving to Database...'
                    : (editingProduct
                        ? ((productForm.isPerfume || productForm.category === 'perfumes') ? 'Save Fragrance Changes' : 'Save Piece Changes')
                        : ((productForm.isPerfume || productForm.category === 'perfumes') ? 'Publish Fragrance to Vault' : 'Publish New Piece'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT CATEGORY DRAWER                                */}
      {/* =================================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
          <div className={`w-full max-w-lg h-full sm:h-[92vh] sm:max-h-[92vh] sm:rounded-3xl border flex flex-col shadow-2xl overflow-hidden ${
            theme === 'alabaster' ? 'bg-[#faf9f5] border-stone-300 text-black' : 'bg-[#0f0f13] border-white/15 text-white'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
              theme === 'alabaster' ? 'border-stone-200 bg-white' : 'border-white/10 bg-white/[0.02]'
            }`}>
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-amber-500 uppercase block">
                  {editingCategory
                    ? (editingCategory.gender === 'perfumes' ? 'Update Fragrance Category' : 'Update Category')
                    : (categoryForm.gender === 'perfumes' ? 'Create Fragrance Category' : 'Create Category')}
                </span>
                <h2 className="text-lg font-serif">
                  {editingCategory
                    ? editingCategory.name
                    : (categoryForm.gender === 'perfumes' ? 'New Olfactory Family / Fragrance Category' : 'New Silhouette Category')}
                </h2>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Department / Category Type Selector */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5 font-medium">
                    Department / Category Domain *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'women' as const, label: "Women's Wardrobe" },
                      { id: 'men' as const, label: "Men's Wardrobe" },
                      { id: 'perfumes' as const, label: "Haute Parfumerie" },
                    ].map((dept) => {
                      const isSel = categoryForm.gender === dept.id;
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => {
                            const newEyebrow = dept.id === 'perfumes'
                              ? 'HAUTE PARFUMERIE · '
                              : `${dept.id.toUpperCase()}'S WARDROBE · `;
                            setCategoryForm(prev => ({
                              ...prev,
                              gender: dept.id,
                              eyebrow: (prev.eyebrow.startsWith("WOMEN'S") || prev.eyebrow.startsWith("MEN'S") || prev.eyebrow.startsWith("HAUTE"))
                                ? newEyebrow
                                : prev.eyebrow,
                            }));
                          }}
                          className={`py-2 px-2 rounded-xl text-[11px] font-mono uppercase tracking-wider text-center border transition-all cursor-pointer ${
                            isSel
                              ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-sm'
                              : theme === 'alabaster'
                              ? 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                              : 'bg-black/40 border-white/10 text-stone-400 hover:text-white'
                          }`}
                        >
                          {dept.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Storefront Visibility Toggle Card */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  categoryForm.hidden
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/25'
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        categoryForm.hidden
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {categoryForm.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold tracking-wide flex items-center gap-2">
                          <span>{categoryForm.hidden ? 'Storefront Status: Hidden from Store' : 'Storefront Status: Live on Store'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                            categoryForm.hidden
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {categoryForm.hidden ? 'Hidden' : 'Live'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                          {categoryForm.hidden
                            ? 'Hidden from navigation pills, storefront categories, and collections. All assigned products and images remain 100% saved.'
                            : 'Visible across the storefront header, navigation pills, homepage collections, and filters.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCategoryForm(prev => ({ ...prev, hidden: !prev.hidden }))}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono uppercase tracking-wider shrink-0 transition-all cursor-pointer font-semibold ${
                        categoryForm.hidden
                          ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400 shadow-md'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-white/20'
                      }`}
                    >
                      {categoryForm.hidden ? 'Make Live' : 'Hide Category'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    {categoryForm.gender === 'perfumes' ? 'Olfactory Family / Category Full Name *' : 'Category Full Name *'}
                  </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder={categoryForm.gender === 'perfumes' ? 'e.g. Royal Oud & Oriental' : 'e.g. Kurtis & Tunics'}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none ${
                    theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    Short Name (Pill Label) *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.shortName}
                    onChange={(e) => setCategoryForm({ ...categoryForm, shortName: e.target.value })}
                    placeholder={categoryForm.gender === 'perfumes' ? 'e.g. Royal Oud' : 'e.g. Kurtis'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none ${
                      theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder={categoryForm.gender === 'perfumes' ? 'e.g. royal-oud' : 'e.g. kurtis'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                      theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Multi-Image Card Manager & Transition Preview */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                    Card Imagery & Portals
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-amber-400">
                      {categoryForm.images?.length || (categoryForm.image ? 1 : 0)} {(categoryForm.images?.length || (categoryForm.image ? 1 : 0)) === 1 ? 'slide' : 'slides'} configured
                    </span>
                    {((categoryForm.images && categoryForm.images.length > 0) || categoryForm.image) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryForm({ ...categoryForm, image: '', images: [] });
                          setCategoryPreviewIndex(0);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer pl-2 border-l border-white/15"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                  Upload images from your device or paste links. Only visuals you configure here will be stored and displayed on the card.
                </p>

                {/* Slides Thumbnail Grid */}
                {((categoryForm.images && categoryForm.images.length > 0) || categoryForm.image) && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {((categoryForm.images && categoryForm.images.length > 0) ? categoryForm.images : [categoryForm.image]).map((imgUrl, sIdx) => (
                      <div
                        key={sIdx}
                        className={`relative group rounded-xl overflow-hidden border aspect-[3/4] bg-stone-900 shadow-md transition-all ${
                          categoryPreviewIndex === sIdx ? 'border-amber-400 ring-1 ring-amber-400' : 'border-white/15'
                        }`}
                        onClick={() => setCategoryPreviewIndex(sIdx)}
                      >
                        <img src={imgUrl} alt={`Slide ${sIdx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 space-y-1">
                          {sIdx !== 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentImgs = categoryForm.images && categoryForm.images.length > 0 ? [...categoryForm.images] : [categoryForm.image];
                                const target = currentImgs.splice(sIdx, 1)[0];
                                currentImgs.unshift(target);
                                setCategoryForm({ ...categoryForm, image: currentImgs[0], images: currentImgs });
                                setCategoryPreviewIndex(0);
                              }}
                              className="px-2 py-0.5 rounded bg-amber-500 text-black text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                              title="Set as card cover slide"
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentImgs = categoryForm.images && categoryForm.images.length > 0 ? [...categoryForm.images] : [categoryForm.image];
                              const updated = currentImgs.filter((_, idx) => idx !== sIdx);
                              setCategoryForm({
                                ...categoryForm,
                                image: updated[0] || '',
                                images: updated,
                              });
                              setCategoryPreviewIndex(0);
                            }}
                            className="p-1 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                            title="Remove slide"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-stone-200 pointer-events-none">
                          #{sIdx + 1} {sIdx === 0 ? '(Cover)' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Slide Input & Upload */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={newCategoryImageUrl}
                      onChange={(e) => setNewCategoryImageUrl(e.target.value)}
                      placeholder="Paste image URL or Google Drive link..."
                      className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none ${
                        theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const urls = newCategoryImageUrl
                          .split(/[\n,]+/)
                          .map((u) => u.trim())
                          .filter((u) => u.length > 0 && !u.includes('images.unsplash.com'))
                          .map(convertGoogleDriveUrl);
                        if (urls.length > 0) {
                          const currentImgs = categoryForm.images && categoryForm.images.length > 0 ? [...categoryForm.images] : (categoryForm.image ? [categoryForm.image] : []);
                          const updated = [...currentImgs, ...urls];
                          setCategoryForm({
                            ...categoryForm,
                            image: updated[0] || urls[0],
                            images: updated,
                          });
                          setNewCategoryImageUrl('');
                          setCategoryPreviewIndex(updated.length - 1);
                        }
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer shrink-0"
                    >
                      Add URL
                    </button>
                    <label className={`flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shrink-0 border ${
                      isUploadingCategoryImage
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 animate-pulse cursor-wait'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingCategoryImage ? 'Uploading to Cloudflare R2...' : 'Upload Device Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isUploadingCategoryImage}
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            setIsUploadingCategoryImage(true);
                            showToast('Uploading visual to Cloudflare R2...');
                            try {
                              const uploadResults = await Promise.all(
                                files.map((f) => uploadImageToR2(f, 'categories', categoryForm.slug || 'general'))
                              );
                              const valid = uploadResults.map((r) => r.url).filter(Boolean);
                              if (valid.length > 0) {
                                const currentImgs = categoryForm.images && categoryForm.images.length > 0 ? [...categoryForm.images] : (categoryForm.image ? [categoryForm.image] : []);
                                const updated = [...currentImgs, ...valid];
                                setCategoryForm({
                                  ...categoryForm,
                                  image: updated[0] || valid[0],
                                  images: updated,
                                });
                                setCategoryPreviewIndex(updated.length - 1);
                                showToast(`Uploaded ${valid.length} visual(s) to Cloudflare R2 for ${categoryForm.name || 'Category'}!`);
                              }
                            } catch (err: any) {
                              console.error('Upload to Cloudflare R2 failed:', err);
                              showToast(`Upload failed: ${err.message}`);
                            } finally {
                              setIsUploadingCategoryImage(false);
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Interactive Live Card Preview with Jaw-Dropping Transition */}
                {(() => {
                  const previewSlides = (categoryForm.images && categoryForm.images.length > 0)
                    ? categoryForm.images
                    : (categoryForm.image ? [categoryForm.image] : []);
                  if (previewSlides.length === 0) return null;

                  const safeIdx = Math.min(categoryPreviewIndex, previewSlides.length - 1);

                  return (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Live Card Transition Preview</span>
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          Slide {safeIdx + 1} of {previewSlides.length}
                        </span>
                      </div>

                      <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-white/20 bg-[#09090b] shadow-xl group">
                        {/* Render all slides with cinematic crossfade & Ken Burns zoom */}
                        {previewSlides.map((slideUrl, sIdx) => {
                          const isActive = safeIdx === sIdx;
                          return (
                            <div
                              key={sIdx}
                              className={`absolute inset-0 transition-all duration-1000 ease-out ${
                                isActive ? 'opacity-100 scale-105 z-0' : 'opacity-0 scale-100 z-[-1] pointer-events-none'
                              }`}
                            >
                              <div
                                className="w-full h-full bg-cover bg-center"
                                style={{
                                  backgroundImage: `url(${getMediaUrl(slideUrl)})`,
                                  filter: 'brightness(0.72) contrast(1.05)',
                                }}
                              />
                            </div>
                          );
                        })}

                        {/* Gradient Shadow Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent z-10 pointer-events-none" />

                        {/* Prev / Next Chevrons on Hover */}
                        {previewSlides.length > 1 && (
                          <div className="absolute inset-y-0 inset-x-2 z-20 flex items-center justify-between pointer-events-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCategoryPreviewIndex((prev) => (prev - 1 + previewSlides.length) % previewSlides.length);
                              }}
                              className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md pointer-events-auto transition-all cursor-pointer shadow-lg active:scale-95"
                              aria-label="Previous slide"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCategoryPreviewIndex((prev) => (prev + 1) % previewSlides.length);
                              }}
                              className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md pointer-events-auto transition-all cursor-pointer shadow-lg active:scale-95"
                              aria-label="Next slide"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Live Overlay Badges & Title */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-between z-20 pointer-events-none">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] tracking-[0.25em] uppercase text-stone-200 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                              /{categoryForm.slug || 'category'}
                            </span>
                            <span className="text-[9px] font-mono tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                              {previewSlides.length} {previewSlides.length === 1 ? 'Photo' : 'Photos'}
                            </span>
                          </div>

                          <div>
                            {/* Glowing Progress Pills */}
                            {previewSlides.length > 1 && (
                              <div className="flex items-center space-x-1.5 mb-2 pointer-events-auto">
                                {previewSlides.map((_, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setCategoryPreviewIndex(pIdx)}
                                    className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${
                                      safeIdx === pIdx
                                        ? 'w-6 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                                        : 'w-2 bg-white/30 hover:bg-white/60'
                                    }`}
                                    aria-label={`Go to slide ${pIdx + 1}`}
                                  />
                                ))}
                              </div>
                            )}

                            <h3 className="text-base sm:text-lg font-serif tracking-[0.03em] text-white">
                              {categoryForm.name || 'Category Full Name'}
                            </h3>
                            <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-stone-300 block">
                              {categoryForm.shortName ? `Explore ${categoryForm.shortName}` : 'Explore Silhouettes'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                  Eyebrow Tagline
                </label>
                <input
                  type="text"
                  value={categoryForm.eyebrow}
                  onChange={(e) => setCategoryForm({ ...categoryForm, eyebrow: e.target.value })}
                  placeholder={categoryForm.gender === 'perfumes' ? "e.g. HAUTE PARFUMERIE · OUD & AMBER" : "e.g. WOMEN'S WARDROBE · KURTIS"}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none ${
                    theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                  Editorial Description
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder={categoryForm.gender === 'perfumes' ? "Rare aged Cambodian and Kalakassi Dehn Al Oud, frankincense resins, and sacred oriental woods." : "Atmospheric summary of this silhouette..."}
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none ${
                    theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                  }`}
                />
              </div>

              </div>

              {/* Sticky Action Footer */}
              <div className={`p-4 px-6 border-t flex items-center justify-end space-x-3 shrink-0 ${
                theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#0b0b0f] border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-xs tracking-wider uppercase text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                          */}
      {/* =================================================================== */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-[#121216] border-white/15 text-white'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-serif">
              {deleteConfirmTarget.type === 'erase_all'
                ? 'Erase Entire Inventory & Database?'
                : `Delete ${deleteConfirmTarget.type === 'product' ? 'Piece' : (deleteConfirmTarget.gender === 'perfumes' ? 'Fragrance Category' : 'Category')}?`}
            </h3>

            <p className="text-xs text-stone-400 leading-relaxed">
              {deleteConfirmTarget.type === 'erase_all' ? (
                <>
                  This will permanently delete all <strong className="text-white font-medium">{products.length} products</strong> from both your live store and the Supabase database. Your catalog will be completely reset to a clean empty slate.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete <strong className="text-white font-medium">"{deleteConfirmTarget.name}"</strong>?
                  {deleteConfirmTarget.type === 'category' && (deleteConfirmTarget.gender === 'perfumes' ? ' Any creations in this olfactory family will remain in the vault, but this category classification will be removed.' : ' Any pieces currently in this category will remain, but the category page will no longer be navigable.')}
                </>
              )}
            </p>

            <div className="pt-3 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs tracking-wider uppercase text-stone-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer"
              >
                {deleteConfirmTarget.type === 'erase_all' ? 'Erase All Permanently' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
