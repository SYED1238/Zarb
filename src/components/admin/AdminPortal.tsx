import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import type { Product, ProductColor } from '../../types/product';
import type { CategoryItem } from '../../data/categories';
import {
  Lock,
  Unlock,
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
  Sparkles
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  supabase
} from '../../lib/supabase';

const MASTER_PASSCODE = 'atelier2026';

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

const STANDARD_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '46 (S)', '48 (M)', '50 (L)', '52 (XL)', '54 (XXL)',
  '28', '30', '32', '34', '36',
  'One Size'
];

// Automatically convert Google Drive sharing links into direct CDN image URLs
export function convertGoogleDriveUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    // 1. Format: https://drive.google.com/file/d/FILE_ID/view...
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1600`;
    }
    // 2. Format: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${idParamMatch[1]}&sz=w1600`;
    }
  }
  return trimmed;
}

export const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    isProductsLoading,
    womenCategories,
    menCategories,
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
    getProductReviews,
    deleteReview,
  } = useStore();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('atelier_admin_auth') === 'true' ||
           localStorage.getItem('atelier_admin_auth') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Active Management Tab
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'reviews' | 'pricing' | 'backup'>('products');

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
        if (!error && data && data.length > 0) {
          const numbers = new Set(data.map((d: any) => d.order_number));
          const uniqueLocals = combined.filter((o: any) => !numbers.has(o.order_number));
          combined = [...data, ...uniqueLocals];
        }
      } catch (e) {
        console.warn('Could not fetch cloud orders', e);
      }
    }
    setOrders(combined);
    setIsLoadingOrders(false);
  };

  const handleUpdateOrderStatus = async (orderNumber: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.order_number === orderNumber ? { ...o, order_status: newStatus } : o));
    try {
      const saved = localStorage.getItem('atelier_local_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((o: any) => o.order_number === orderNumber ? { ...o, order_status: newStatus } : o);
        localStorage.setItem('atelier_local_orders', JSON.stringify(updated));
      }
    } catch {}

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').update({ order_status: newStatus }).eq('order_number', orderNumber);
      } catch (e) {
        console.warn('Could not update order status in Supabase', e);
      }
    }
    showToast(`Order ${orderNumber} updated to ${newStatus.toUpperCase()}`);
  };

  // Reviews State
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  // Flattened Reviews Across All Pieces
  const allReviewsList = useMemo(() => {
    const list: { review: any; product: Product | undefined }[] = [];
    products.forEach(p => {
      const pRevs = getProductReviews(p.id, p.name);
      pRevs.forEach(r => {
        list.push({ review: r, product: p });
      });
    });
    return list;
  }, [products, reviews, getProductReviews]);

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

  // Product Filtering & Search
  const [productSearch, setProductSearch] = useState('');
  const [productGenderFilter, setProductGenderFilter] = useState<'all' | 'men' | 'women'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'out'>('all');

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
    materials: string;
    fit: string;
    season: string;
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
    materials: '100% Pure Mulberry Silk & Hand-Spun Wool',
    fit: 'Tailored Silhouette',
    season: 'Autumn / Winter 2026',
  });

  // Product Image input URL temporary
  const [newImageUrl, setNewImageUrl] = useState('');

  // Color Specific Photos Sub-panel
  const [activeColorImageIndex, setActiveColorImageIndex] = useState<number | null>(null);
  const [newColorImageUrl, setNewColorImageUrl] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#8a1c14');

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
  });
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('');
  const [categoryPreviewIndex, setCategoryPreviewIndex] = useState(0);

  // Bulk pricing temporary edits
  const [bulkEdits, setBulkEdits] = useState<Record<string, { price: number; compareAtPrice?: number; stock: number }>>({});

  // Delete Confirmation Modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'product' | 'category' | 'erase_all';
    id: string;
    name: string;
    gender?: 'men' | 'women';
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

  // Auth Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === MASTER_PASSCODE) {
      setIsAuthenticated(true);
      setAuthError(false);
      sessionStorage.setItem('atelier_admin_auth', 'true');
      if (rememberDevice) {
        localStorage.setItem('atelier_admin_auth', 'true');
      }
      showToast('Welcome to Zarb Master Portal');
    } else {
      setAuthError(true);
      showToast('Invalid Access Passkey');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('atelier_admin_auth');
    localStorage.removeItem('atelier_admin_auth');
    showToast('Logged out of Admin Portal');
  };

  // All Categories Combined
  const allCategories = useMemo(() => {
    return [...womenCategories, ...menCategories];
  }, [womenCategories, menCategories]);

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

      // Gender
      if (productGenderFilter !== 'all' && p.gender !== productGenderFilter) return false;

      // Category
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;

      // Stock
      if (productStockFilter === 'instock' && p.stock <= 0) return false;
      if (productStockFilter === 'lowstock' && (p.stock <= 0 || p.stock > 3)) return false;
      if (productStockFilter === 'out' && p.stock > 0) return false;

      return true;
    });
  }, [products, productSearch, productGenderFilter, productCategoryFilter, productStockFilter]);

  // Live Statistics
  const stats = useMemo(() => {
    const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= 3 && p.stock > 0).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;
    const womenCount = products.filter((p) => p.gender === 'women').length;
    const menCount = products.filter((p) => p.gender === 'men').length;

    return {
      totalItems: products.length,
      womenItems: womenCount,
      menItems: menCount,
      totalCategories: allCategories.length,
      inventoryValue: totalInventoryValue,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    };
  }, [products, allCategories]);

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
      materials: 'Pure Mulberry Silk & Italian Wool',
      fit: 'Relaxed Architectural Silhouette',
      season: 'Autumn / Winter 2026',
    });
    setNewImageUrl('');
    setActiveColorImageIndex(null);
    setNewColorImageUrl('');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
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
      colors: p.colors.map(c => ({
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
      materials: p.materials || '',
      fit: p.fit || '',
      season: p.season || 'Autumn / Winter 2026',
    });
    setNewImageUrl('');
    setActiveColorImageIndex(null);
    setNewColorImageUrl('');
    setIsProductModalOpen(true);
  };

  // Duplicate Product
  const handleDuplicateProduct = (p: Product) => {
    const duplicated: Omit<Product, 'id'> = {
      ...p,
      name: `${p.name} (Copy)`,
      slug: `${p.slug}-copy-${Date.now().toString().slice(-3)}`,
      sku: `${p.sku}-CP`,
    };
    addProduct(duplicated);
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
      colors: productForm.colors.length > 0
        ? productForm.colors.map(c => ({
            name: c.name,
            hex: c.hex,
            image: (c.images && c.images.length > 0) ? c.images[0] : c.image,
            images: (c.images && c.images.length > 0) ? c.images : (c.image ? [c.image] : []),
          }))
        : [{ name: 'Standard', hex: '#111113', images: [] }],
      sizes: productForm.sizes.length > 0 ? productForm.sizes : ['One Size'],
      stock: Math.max(0, Number(productForm.stock)),
      sku: productForm.sku.trim() || `AT-${Date.now().toString().slice(-4)}`,
      rating: productForm.rating || 5.0,
      reviews: productForm.reviews || 1,
      featured: productForm.featured,
      newArrival: productForm.newArrival,
      bestSeller: productForm.bestSeller,
      materials: productForm.materials.trim(),
      fit: productForm.fit.trim(),
      season: productForm.season.trim(),
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
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Open Category Edit/Create
  const handleOpenCreateCategory = (genderChoice: 'women' | 'men') => {
    setEditingCategory(null);
    setCategoryOriginalSlug('');
    const defaultCover = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop';
    setCategoryForm({
      id: '',
      slug: '',
      name: '',
      shortName: '',
      gender: genderChoice,
      eyebrow: `${genderChoice.toUpperCase()}'S WARDROBE · `,
      description: '',
      image: defaultCover,
      images: [defaultCover],
      metaDescription: '',
    });
    setNewCategoryImageUrl('');
    setCategoryPreviewIndex(0);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryOriginalSlug(cat.slug);
    const catImages = (cat.images && cat.images.length > 0)
      ? cat.images
      : (cat.image ? [cat.image] : []);
    setCategoryForm({
      ...cat,
      image: cat.image || catImages[0] || '',
      images: catImages.length > 0 ? [...catImages] : (cat.image ? [cat.image] : []),
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

    // Filter valid images
    const rawImages = categoryForm.images || [];
    const validImages = rawImages.filter(img => Boolean(img && img.trim()));
    if (categoryForm.image && !validImages.includes(categoryForm.image.trim())) {
      validImages.unshift(categoryForm.image.trim());
    }
    const primaryCover = validImages[0] || categoryForm.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop';

    const payload: CategoryItem = {
      ...categoryForm,
      id,
      slug,
      shortName,
      name: categoryForm.name.trim(),
      eyebrow: categoryForm.eyebrow.trim() || `${categoryForm.gender.toUpperCase()}'S WARDROBE · ${shortName.toUpperCase()}`,
      description: categoryForm.description.trim(),
      image: primaryCover,
      images: validImages.length > 0 ? validImages : [primaryCover],
      metaDescription: categoryForm.metaDescription.trim() || `Explore luxury ${shortName} collection from Atelier Nōir.`,
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
    }

    setDeleteConfirmTarget(null);
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

  const handleSaveBulkRow = (p: Product) => {
    const edit = bulkEdits[p.id];
    if (!edit) return;
    const updated: Product = {
      ...p,
      price: edit.price,
      compareAtPrice: edit.compareAtPrice,
      stock: edit.stock,
    };
    updateProduct(updated);
    setBulkEdits(prev => {
      const next = { ...prev };
      delete next[p.id];
      return next;
    });
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
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center p-4 selection:bg-amber-500/30">
        <div className="w-full max-w-md bg-[#101014] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Subtle gold specular beam */}
          <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-amber-300 shadow-inner">
              <Lock className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-stone-400 block mb-1">
              Atelier Archive Security
            </span>
            <h1 className="text-2xl font-serif tracking-widest text-white">
              HAUTE PORTAL GATE
            </h1>
            <p className="text-xs text-stone-400 font-light mt-2 leading-relaxed">
              Administrative authorization required to configure inventory, pricing, imagery, and silhouette collections.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-sans tracking-[0.2em] uppercase text-stone-300 mb-2">
                Master Passkey
              </label>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter access code..."
                autoFocus
                className="w-full px-4 py-3.5 bg-black/50 border border-white/15 focus:border-amber-400/80 rounded-xl text-sm font-mono text-white tracking-widest focus:outline-none transition-all placeholder:text-stone-600 shadow-inner"
              />
              {authError && (
                <p className="text-xs text-red-400 mt-2 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Invalid passkey. (Hint: default is <code>atelier2026</code>)</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px] tracking-wider uppercase">Remember device</span>
              </label>
              <button
                type="button"
                onClick={() => setPasscodeInput(MASTER_PASSCODE)}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors"
              >
                Auto-fill Key
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-white hover:bg-stone-200 text-black text-xs font-sans tracking-[0.25em] uppercase font-semibold transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Gateway</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-stone-400 hover:text-white transition-colors tracking-wider uppercase flex items-center justify-center space-x-1.5 mx-auto"
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
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
              title="Lock Admin Portal"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Header Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Pieces */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
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
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
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
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
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
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
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
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
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
                {/* Gender */}
                <select
                  value={productGenderFilter}
                  onChange={(e) => setProductGenderFilter(e.target.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs tracking-wider uppercase border focus:outline-none cursor-pointer ${
                    theme === 'alabaster' ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/50 border-white/10 text-stone-200'
                  }`}
                >
                  <option value="all">All Genders</option>
                  <option value="women">Women's Collection</option>
                  <option value="men">Men's Collection</option>
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

                {/* Erase Full Inventory Button */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget({
                    type: 'erase_all',
                    id: 'all',
                    name: 'All Inventory Pieces',
                  })}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 text-xs tracking-wider uppercase transition-all shadow-xs cursor-pointer font-medium"
                  title="Permanently erase all products from the store and database"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Erase Full Inventory</span>
                </button>

                {/* Add New Piece Button */}
                <button
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
                      <th className="py-3 px-4">Badges</th>
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
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                                isOut
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : isLowStock
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {isOut ? 'Out of Stock' : `${product.stock} units`}
                              </span>
                            </td>

                            {/* Editorial Badges */}
                            <td className="py-3.5 px-4">
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
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1.5">
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
                        theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-16 h-20 object-cover rounded-xl bg-stone-900 border border-white/10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase block">
                            /{cat.slug}
                          </span>
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
                        theme === 'alabaster' ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121216] border-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-16 h-20 object-cover rounded-xl bg-stone-900 border border-white/10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase block">
                            /{cat.slug}
                          </span>
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
                        <div className="flex items-center space-x-2.5">
                          <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${
                            ord.payment_status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            Payment: {ord.payment_method?.toUpperCase()} · {ord.payment_status?.toUpperCase() || 'PAID'}
                          </span>

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
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            <option value="processing">● Processing</option>
                            <option value="confirmed">● Confirmed</option>
                            <option value="dispatched">● Dispatched</option>
                            <option value="delivered">● Delivered</option>
                            <option value="cancelled">● Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Client Info & Delivery Address */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Client Identity */}
                        <div className={`p-3 rounded-xl ${theme === 'alabaster' ? 'bg-stone-50' : 'bg-white/[0.02]'}`}>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">
                            Client Details
                          </span>
                          <div className="font-semibold text-stone-200">{ord.customer_name}</div>
                          <div className="text-stone-400 flex items-center space-x-1 mt-0.5">
                            <Mail className="w-3 h-3 text-stone-500" />
                            <span>{ord.customer_email}</span>
                          </div>
                          <div className="text-stone-300 font-mono flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3 h-3 text-amber-400" />
                            <span>{ord.customer_phone || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Delivery Destination */}
                        <div className={`p-3 rounded-xl md:col-span-2 ${theme === 'alabaster' ? 'bg-stone-50' : 'bg-white/[0.02]'}`}>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block mb-1">
                            Concierge Delivery Destination
                          </span>
                          <div className="text-stone-300 flex items-start space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                            <span>
                              {addr ? `${addr.address || ''}${addr.apartment ? `, ${addr.apartment}` : ''}, ${addr.city || ''}, ${addr.state || ''} — ${addr.postalCode || ''}, ${addr.country || 'India'}` : 'Direct Acquisition'}
                            </span>
                          </div>
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
                        onClick={() => deleteReview(rev.productId, rev.id)}
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
                  {editingProduct ? 'Update Zarb Piece' : 'Create New Zarb Piece'}
                </span>
                <h2 className="text-lg font-serif">
                  {editingProduct ? editingProduct.name : 'New Catalogue Addition'}
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
                      Gender Collection *
                    </label>
                    <select
                      value={productForm.gender}
                      onChange={(e) => {
                        const newGender = e.target.value as 'women' | 'men';
                        const firstCategoryForGender = (newGender === 'women' ? womenCategories : menCategories)[0]?.slug || 'kurtis';
                        setProductForm({
                          ...productForm,
                          gender: newGender,
                          category: firstCategoryForGender,
                        });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs uppercase border focus:outline-none cursor-pointer ${
                        theme === 'alabaster' ? 'bg-white border-stone-300 text-black' : 'bg-black/50 border-white/15 text-white'
                      }`}
                    >
                      <option value="women">Women's Collection</option>
                      <option value="men">Men's Collection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                      Category Silhouette *
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
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
                  </div>
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
              </div>

              {/* Gallery Images */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block border-b border-white/10 pb-2">
                  3. Imagery & Visual Assets
                </span>

                <div className="space-y-3">
                  {/* Images list */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-[3/4] bg-stone-900">
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productForm.images.filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, images: updated });
                            }}
                            className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-500"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                          #{idx + 1} {idx === 0 ? '(Cover)' : ''}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add Image URL or Local Upload */}
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2">
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
                          if (newImageUrl.trim()) {
                            const formatted = convertGoogleDriveUrl(newImageUrl);
                            setProductForm({ ...productForm, images: [...productForm.images, formatted] });
                            setNewImageUrl('');
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-stone-200 cursor-pointer shadow-md transition-all shrink-0"
                      >
                        Add Image
                      </button>

                      {/* Local File Upload Button */}
                      <label className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const rawUrl = ev.target?.result as string;
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 1200;
                                  const MAX_HEIGHT = 1600;
                                  let width = img.width;
                                  let height = img.height;
                                  if (width > MAX_WIDTH) {
                                    height = Math.round((height * MAX_WIDTH) / width);
                                    width = MAX_WIDTH;
                                  }
                                  if (height > MAX_HEIGHT) {
                                    width = Math.round((width * MAX_HEIGHT) / height);
                                    height = MAX_HEIGHT;
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  const optimized = canvas.toDataURL('image/jpeg', 0.86);
                                  setProductForm((prev) => ({ ...prev, images: [...prev.images, optimized] }));
                                };
                                img.src = rawUrl;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
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

              {/* Colors & Swatches */}
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
                            {colorImages.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative group rounded-xl overflow-hidden border border-white/15 aspect-[3/4] bg-stone-900 shadow-sm">
                                <img src={img} alt={`${activeColor.name} preview ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImageFromColor(imgIdx)}
                                    className="p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                                    title="Remove photo from this color"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-stone-200">
                                  #{imgIdx + 1} {imgIdx === 0 ? '(Cover)' : ''}
                                </span>
                              </div>
                            ))}
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
                          {/* File Upload for this Color */}
                          <label className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer shrink-0">
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const rawUrl = ev.target?.result as string;
                                    const img = new Image();
                                    img.onload = () => {
                                      const canvas = document.createElement('canvas');
                                      const MAX_WIDTH = 1200;
                                      const MAX_HEIGHT = 1600;
                                      let width = img.width;
                                      let height = img.height;
                                      if (width > MAX_WIDTH) {
                                        height = Math.round((height * MAX_WIDTH) / width);
                                        width = MAX_WIDTH;
                                      }
                                      if (height > MAX_HEIGHT) {
                                        width = Math.round((width * MAX_HEIGHT) / height);
                                        height = MAX_HEIGHT;
                                      }
                                      canvas.width = width;
                                      canvas.height = height;
                                      const ctx = canvas.getContext('2d');
                                      ctx?.drawImage(img, 0, 0, width, height);
                                      const optimized = canvas.toDataURL('image/jpeg', 0.86);
                                      handleAddImageToColor(optimized);
                                    };
                                    img.src = rawUrl;
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>

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

              {/* Sizes */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block border-b border-white/10 pb-2">
                  5. Available Sizes
                </span>

                <div className="flex flex-wrap gap-2">
                  {STANDARD_SIZES.map((sz) => {
                    const isSelected = productForm.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setProductForm({ ...productForm, sizes: productForm.sizes.filter(s => s !== sz) });
                          } else {
                            setProductForm({ ...productForm, sizes: [...productForm.sizes, sz] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-black font-semibold'
                            : 'bg-white/5 text-stone-400 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editorial Copy */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-stone-400 block border-b border-white/10 pb-2">
                  6. Editorial Copy & Fabric Specifications
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
                    : (editingProduct ? 'Save Piece Changes' : 'Publish New Piece')}
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
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </span>
                <h2 className="text-lg font-serif">
                  {editingCategory ? editingCategory.name : 'New Silhouette Category'}
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
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 mb-1.5">
                    Category Full Name *
                  </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Kurtis & Tunics"
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
                    placeholder="e.g. Kurtis"
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
                    placeholder="e.g. kurtis"
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
                    Card Imagery & Jaw-Dropping Transitions *
                  </label>
                  <span className="text-[10px] font-mono text-amber-400">
                    {categoryForm.images?.length || (categoryForm.image ? 1 : 0)} {(categoryForm.images?.length || (categoryForm.image ? 1 : 0)) === 1 ? 'slide' : 'slides'} configured
                  </span>
                </div>

                <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                  Add multiple photos to enable the cinematic crossfade dissolve and Ken Burns zoom effect on this silhouette's homepage card.
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
                        if (newCategoryImageUrl.trim()) {
                          const formatted = convertGoogleDriveUrl(newCategoryImageUrl);
                          const currentImgs = categoryForm.images && categoryForm.images.length > 0 ? [...categoryForm.images] : (categoryForm.image ? [categoryForm.image] : []);
                          const updated = [...currentImgs, formatted];
                          setCategoryForm({
                            ...categoryForm,
                            image: updated[0] || formatted,
                            images: updated,
                          });
                          setNewCategoryImageUrl('');
                          setCategoryPreviewIndex(updated.length - 1);
                        }
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase shadow-md cursor-pointer shrink-0"
                    >
                      Add Slide
                    </button>
                    <label className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const rawUrl = ev.target?.result as string;
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const MAX_WIDTH = 1200;
                                const MAX_HEIGHT = 1600;
                                let width = img.width;
                                let height = img.height;
                                if (width > MAX_WIDTH) {
                                  height = Math.round((height * MAX_WIDTH) / width);
                                  width = MAX_WIDTH;
                                }
                                if (height > MAX_HEIGHT) {
                                  width = Math.round((width * MAX_HEIGHT) / height);
                                  height = MAX_HEIGHT;
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, width, height);
                                const optimized = canvas.toDataURL('image/jpeg', 0.86);
                                const currentImgs = categoryForm.images && categoryForm.images.length > 0 ? [...categoryForm.images] : (categoryForm.image ? [categoryForm.image] : []);
                                const updated = [...currentImgs, optimized];
                                setCategoryForm({
                                  ...categoryForm,
                                  image: updated[0] || optimized,
                                  images: updated,
                                });
                                setCategoryPreviewIndex(updated.length - 1);
                              };
                              img.src = rawUrl;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Quick Luxury Presets for Category Slides */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 mr-1">
                      Quick Presets:
                    </span>
                    {[
                      { label: '🧥 Outerwear', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop' },
                      { label: '👗 Silk Kurti', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop' },
                      { label: '💃 Evening Gown', url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop' },
                      { label: '👔 Blazer', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop' },
                      { label: '🧶 Knitwear', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop' },
                      { label: '👜 Leather Bag', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const currentImgs = categoryForm.images && categoryForm.images.length > 0 ? [...categoryForm.images] : (categoryForm.image ? [categoryForm.image] : []);
                          const updated = [...currentImgs, preset.url];
                          setCategoryForm({
                            ...categoryForm,
                            image: updated[0] || preset.url,
                            images: updated,
                          });
                          setCategoryPreviewIndex(updated.length - 1);
                        }}
                        className="px-2 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] text-stone-300 cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
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
                                  backgroundImage: `url(${slideUrl})`,
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
                  placeholder="e.g. WOMEN'S WARDROBE · KURTIS"
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
                  placeholder="Atmospheric summary of this silhouette..."
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
                : `Delete ${deleteConfirmTarget.type === 'product' ? 'Piece' : 'Category'}?`}
            </h3>

            <p className="text-xs text-stone-400 leading-relaxed">
              {deleteConfirmTarget.type === 'erase_all' ? (
                <>
                  This will permanently delete all <strong className="text-white font-medium">{products.length} products</strong> from both your live store and the Supabase database. Your catalog will be completely reset to a clean empty slate.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete <strong className="text-white font-medium">"{deleteConfirmTarget.name}"</strong>?
                  {deleteConfirmTarget.type === 'category' && ' Any pieces currently in this category will remain, but the category page will no longer be navigable.'}
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
