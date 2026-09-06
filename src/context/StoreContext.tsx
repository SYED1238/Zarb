import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem, GenderType, ProductReview } from '../types/product';
import { PRODUCTS } from '../data/products';
import { WOMEN_CATEGORIES, MEN_CATEGORIES, type CategoryItem } from '../data/categories';
import { INITIAL_PRODUCT_REVIEWS, getDefaultReviewsForProduct } from '../data/reviews';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Mapping helpers for Supabase <-> Frontend Product model
export function mapSupabaseToProduct(d: any): Product {
  return {
    id: String(d.id),
    name: d.name || 'Untitled Piece',
    slug: d.slug || `piece-${d.id}`,
    gender: d.gender === 'men' ? 'men' : 'women',
    category: d.category || 'all',
    description: d.description || '',
    price: Number(d.price) || 0,
    compareAtPrice: d.compare_at_price ? Number(d.compare_at_price) : undefined,
    images: Array.isArray(d.images) ? d.images : (typeof d.images === 'string' ? JSON.parse(d.images) : []),
    colors: Array.isArray(d.colors) ? d.colors : (typeof d.colors === 'string' ? JSON.parse(d.colors) : [{ name: 'Obsidian Noir', hex: '#111113' }]),
    sizes: Array.isArray(d.sizes) ? d.sizes : (typeof d.sizes === 'string' ? JSON.parse(d.sizes) : ['One Size']),
    stock: Number(d.stock ?? 0),
    sku: d.sku || `AT-${String(d.id).slice(-4)}`,
    rating: Number(d.rating || 5.0),
    reviews: Number(d.reviews || 1),
    featured: Boolean(d.featured),
    newArrival: d.new_arrival !== undefined ? Boolean(d.new_arrival) : true,
    bestSeller: Boolean(d.best_seller),
    materials: d.materials || '',
    fit: d.fit || '',
    season: d.season || '',
  };
}

export function mapProductToSupabase(p: Product) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    gender: p.gender,
    category: p.category,
    description: p.description,
    price: p.price,
    compare_at_price: p.compareAtPrice || null,
    images: p.images || [],
    colors: p.colors || [],
    sizes: p.sizes || [],
    stock: p.stock ?? 0,
    sku: p.sku || '',
    rating: p.rating || 5.0,
    reviews: p.reviews || 1,
    featured: Boolean(p.featured),
    new_arrival: Boolean(p.newArrival),
    best_seller: Boolean(p.bestSeller),
    materials: p.materials || '',
    fit: p.fit || '',
    season: p.season || '',
    updated_at: new Date().toISOString(),
  };
}

interface StoreContextType {
  gender: GenderType;
  setGender: (g: GenderType) => void;
  hasSelectedGender: boolean;
  setHasSelectedGender: (v: boolean) => void;
  showEntryScreen: boolean;
  setShowEntryScreen: (v: boolean) => void;
  resetEntryScreen: () => void;
  
  // Dynamic Products & Catalog Control
  products: Product[];
  isProductsLoading: boolean;
  womenCategories: CategoryItem[];
  menCategories: CategoryItem[];
  addProduct: (product: Omit<Product, 'id'> | Product) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  eraseAllProducts: () => Promise<void>;
  refreshProductsFromCloud: () => Promise<void>;
  addCategory: (category: CategoryItem) => void;
  updateCategory: (category: CategoryItem, oldSlug?: string) => void;
  deleteCategory: (gender: 'men' | 'women', slug: string) => void;
  resetToDefaults: () => void;
  exportCatalogJson: () => string;
  importCatalogJson: (jsonStr: string) => { success: boolean; message: string };
  getCategories: (gender: 'men' | 'women') => CategoryItem[];
  getCategoryBySlug: (gender: 'men' | 'women', slug: string) => CategoryItem | undefined;
  getProductById: (id: string) => Product | undefined;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartSubtotal: number;
  cartCount: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  
  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  
  // Product Detail Modal
  activeProduct: Product | null;
  setActiveProduct: (product: Product | null) => void;
  
  // Size Guide Modal
  isSizeGuideOpen: boolean;
  setIsSizeGuideOpen: (open: boolean) => void;

  // Checkout
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  
  // Theme: 'noir' (Midnight Obsidian) vs 'alabaster' (Warm Ivory Haute Couture)
  theme: 'noir' | 'alabaster';
  setTheme: (theme: 'noir' | 'alabaster') => void;
  toggleTheme: () => void;

  // Notifications / Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Real Product Reviews
  reviews: Record<string, ProductReview[]>;
  getProductReviews: (productId: string, productName?: string) => ProductReview[];
  addReview: (review: Omit<ProductReview, 'id' | 'createdAt'>) => void;
  deleteReview: (productId: string, reviewId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 10000; // ₹10,000

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stored gender preference
  const [gender, setGenderState] = useState<GenderType>(() => {
    const saved = localStorage.getItem('atelier_gender_preference');
    if (saved === 'men' || saved === 'women' || saved === 'all') {
      return saved as GenderType;
    }
    return 'women'; // default fallback if already selected
  });

  const [hasSelectedGender, setHasSelectedGender] = useState<boolean>(() => {
    return !!localStorage.getItem('atelier_gender_preference');
  });

  const [showEntryScreen, setShowEntryScreen] = useState<boolean>(() => {
    return !localStorage.getItem('atelier_gender_preference');
  });

  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);

  // Dynamic Catalog State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const wasErased = localStorage.getItem('atelier_inventory_erased') === 'true';
      if (wasErased) return [];
      const saved = localStorage.getItem('atelier_products_v2');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load products from storage', e);
    }
    return [];
  });

  // Automatically load real catalog from Supabase cloud on initial mount
  const refreshProductsFromCloud = async () => {
    setIsProductsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped = data.map(mapSupabaseToProduct);
          setProducts(mapped);
          localStorage.setItem('atelier_products_v2', JSON.stringify(mapped));
          if (mapped.length === 0) {
            localStorage.setItem('atelier_inventory_erased', 'true');
          } else {
            localStorage.removeItem('atelier_inventory_erased');
          }
          return;
        } else if (error) {
          console.warn('Supabase product fetch warning:', error.message);
        }
      }

      // Offline / unconfigured fallback to localStorage
      const wasErased = localStorage.getItem('atelier_inventory_erased') === 'true';
      if (wasErased) {
        setProducts([]);
      } else {
        const saved = localStorage.getItem('atelier_products_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const hydrated = parsed.map(p => {
              const defaultP = PRODUCTS.find(dp => dp.id === p.id);
              if (!defaultP) return p;
              return {
                ...p,
                colors: (p.colors || []).map((col: any) => {
                  const defCol = defaultP.colors?.find(dc => dc.name === col.name);
                  return {
                    ...col,
                    images: (col.images && col.images.length > 0) ? col.images : (defCol?.images || (col.image ? [col.image] : [])),
                  };
                }),
              };
            });
            setProducts(hydrated);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load products from cloud:', e);
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    refreshProductsFromCloud();
  }, []);

  const [womenCategories, setWomenCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('atelier_women_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => {
            const defaultMatch = WOMEN_CATEGORIES.find(d => d.slug === c.slug);
            return {
              ...c,
              images: (c.images && c.images.length > 0) ? c.images : (defaultMatch?.images || [c.image].filter(Boolean)),
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load women categories', e);
    }
    return WOMEN_CATEGORIES;
  });

  const [menCategories, setMenCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('atelier_men_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => {
            const defaultMatch = MEN_CATEGORIES.find(d => d.slug === c.slug);
            return {
              ...c,
              images: (c.images && c.images.length > 0) ? c.images : (defaultMatch?.images || [c.image].filter(Boolean)),
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load men categories', e);
    }
    return MEN_CATEGORIES;
  });

  // Sync catalog updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('atelier_products_v2', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to persist products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('atelier_women_categories_v2', JSON.stringify(womenCategories));
    } catch (e) {
      console.error('Failed to persist women categories', e);
    }
  }, [womenCategories]);

  useEffect(() => {
    try {
      localStorage.setItem('atelier_men_categories_v2', JSON.stringify(menCategories));
    } catch (e) {
      console.error('Failed to persist men categories', e);
    }
  }, [menCategories]);

  // Theme: 'noir' (Midnight Obsidian) vs 'alabaster' (Warm Ivory Haute Couture)
  const [theme, setThemeState] = useState<'noir' | 'alabaster'>(() => {
    const saved = localStorage.getItem('atelier_theme');
    return saved === 'noir' ? 'noir' : 'alabaster';
  });

  const setTheme = (newTheme: 'noir' | 'alabaster') => {
    setThemeState(newTheme);
    localStorage.setItem('atelier_theme', newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'noir' ? 'alabaster' : 'noir';
    setTheme(nextTheme);
    showToast(
      nextTheme === 'alabaster'
        ? 'Theme: Alabaster & Warm Ivory Haute Couture'
        : 'Theme: Noir Midnight Obsidian'
    );
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'alabaster') {
      root.classList.add('theme-alabaster');
      root.classList.remove('theme-noir');
    } else {
      root.classList.add('theme-noir');
      root.classList.remove('theme-alabaster');
    }
  }, [theme]);

  const setGender = (g: GenderType) => {
    setGenderState(g);
    localStorage.setItem('atelier_gender_preference', g);
    setHasSelectedGender(true);
  };

  const resetEntryScreen = () => {
    setShowEntryScreen(true);
  };

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('atelier_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save cart
  useEffect(() => {
    localStorage.setItem('atelier_cart', JSON.stringify(cart));
  }, [cart]);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('atelier_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('atelier_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Real Product Reviews State & Persistence
  const [reviews, setReviews] = useState<Record<string, ProductReview[]>>(() => {
    try {
      const saved = localStorage.getItem('zarb_reviews_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load reviews from local storage', e);
    }
    return INITIAL_PRODUCT_REVIEWS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('zarb_reviews_v1', JSON.stringify(reviews));
    } catch (e) {
      console.error('Failed to persist reviews', e);
    }
  }, [reviews]);

  const getProductReviews = (productId: string, productName: string = 'Piece'): ProductReview[] => {
    if (reviews[productId] && reviews[productId].length > 0) {
      return reviews[productId];
    }
    return getDefaultReviewsForProduct(productId, productName);
  };

  const addReview = (reviewData: Omit<ProductReview, 'id' | 'createdAt'>) => {
    const newReview: ProductReview = {
      ...reviewData,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const currentList = reviews[reviewData.productId] || getDefaultReviewsForProduct(reviewData.productId, 'Piece');
    const updatedList = [newReview, ...currentList];

    setReviews(prev => ({
      ...prev,
      [reviewData.productId]: updatedList,
    }));

    // Recalculate average rating & reviews count for this product
    const totalRating = updatedList.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Number((totalRating / updatedList.length).toFixed(1));

    // Update product rating & count in products state
    setProducts(prev => prev.map(p => {
      if (p.id === reviewData.productId) {
        const updated = {
          ...p,
          rating: avgRating,
          reviews: updatedList.length,
        };
        if (activeProduct && activeProduct.id === p.id) {
          setActiveProduct(updated);
        }
        return updated;
      }
      return p;
    }));

    // Attempt Supabase sync if table exists
    if (isSupabaseConfigured()) {
      supabase.from('reviews').insert({
        product_id: newReview.productId,
        user_id: newReview.userId || null,
        author_name: newReview.authorName,
        author_location: newReview.authorLocation || null,
        rating: newReview.rating,
        title: newReview.title || null,
        comment: newReview.comment,
        verified_purchase: newReview.verifiedPurchase,
      }).then(({ error }) => {
        if (error) {
          console.log('Supabase reviews cloud sync notice:', error.message);
        }
      });
    }

    showToast(`Thank you! Your verified client review has been published.`);
  };

  const deleteReview = (productId: string, reviewId: string) => {
    const currentList = reviews[productId] || [];
    const updatedList = currentList.filter(r => r.id !== reviewId);

    setReviews(prev => ({
      ...prev,
      [productId]: updatedList,
    }));

    // Recalculate average rating & reviews count
    const totalRating = updatedList.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = updatedList.length > 0 ? Number((totalRating / updatedList.length).toFixed(1)) : 5.0;

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updated = {
          ...p,
          rating: avgRating,
          reviews: updatedList.length,
        };
        if (activeProduct && activeProduct.id === p.id) {
          setActiveProduct(updated);
        }
        return updated;
      }
      return p;
    }));

    if (isSupabaseConfigured()) {
      supabase.from('reviews').delete().eq('id', reviewId).then(({ error }) => {
        if (error) console.log('Supabase review delete notice:', error.message);
      });
    }

    showToast('Review removed.');
  };

  // CRUD Methods for Products (Real Cloud Sync + Local Fallback)
  const addProduct = async (productData: Omit<Product, 'id'> | Product): Promise<Product> => {
    const id = ('id' in productData && productData.id)
      ? productData.id
      : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const newProduct: Product = {
      ...productData,
      id,
      rating: productData.rating || 5.0,
      reviews: productData.reviews || 1,
    };
    
    setProducts(prev => [newProduct, ...prev.filter(p => p.id !== id)]);
    localStorage.removeItem('atelier_inventory_erased');
    showToast(`Created piece "${newProduct.name}"`);

    // Auto-sync to Supabase Cloud if connected
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('products')
          .upsert(mapProductToSupabase(newProduct), { onConflict: 'id' });
        
        if (error) {
          console.warn('Supabase product cloud sync warning:', error.message);
          showToast(`Cloud sync alert: ${error.message}`);
        } else {
          console.log(`Successfully synced "${newProduct.name}" to Supabase database.`);
        }
      } catch (err: any) {
        console.error('Supabase add error:', err);
      }
    }

    return newProduct;
  };

  const updateProduct = async (updatedProduct: Product): Promise<void> => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (activeProduct && activeProduct.id === updatedProduct.id) {
      setActiveProduct(updatedProduct);
    }
    showToast(`Updated "${updatedProduct.name}"`);

    // Auto-sync update to Supabase Cloud
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('products')
          .upsert(mapProductToSupabase(updatedProduct), { onConflict: 'id' });
        
        if (error) {
          console.warn('Supabase product update sync warning:', error.message);
          showToast(`Cloud update alert: ${error.message}`);
        }
      } catch (err: any) {
        console.error('Supabase update error:', err);
      }
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const target = products.find(p => p.id === id);
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      if (next.length === 0) {
        localStorage.setItem('atelier_inventory_erased', 'true');
      }
      return next;
    });
    setCart(prev => prev.filter(item => item.productId !== id));
    setWishlist(prev => prev.filter(item => item !== id));
    if (activeProduct && activeProduct.id === id) {
      setActiveProduct(null);
    }
    showToast(`Deleted "${target ? target.name : 'Piece'}"`);

    // Auto-sync delete to Supabase Cloud
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          console.warn('Supabase product delete sync warning:', error.message);
          showToast(`Cloud delete alert: ${error.message}`);
        }
      } catch (err: any) {
        console.error('Supabase delete error:', err);
      }
    }
  };

  // Permanently erase entire inventory from database and local storage
  const eraseAllProducts = async (): Promise<void> => {
    setProducts([]);
    setCart([]);
    setWishlist([]);
    if (activeProduct) {
      setActiveProduct(null);
    }
    localStorage.setItem('atelier_products_v2', JSON.stringify([]));
    localStorage.setItem('atelier_inventory_erased', 'true');

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .not('id', 'is', null);

        if (error) {
          console.error('Supabase erase error:', error);
          showToast(`Cloud erase alert: ${error.message}`);
        } else {
          showToast('Full inventory erased permanently from store and database.');
        }
      } catch (err: any) {
        console.error('Failed to erase products from database:', err);
        showToast('Local catalog cleared. Cloud connection error.');
      }
    } else {
      showToast('Full inventory erased.');
    }
  };

  // CRUD Methods for Categories
  const addCategory = (category: CategoryItem) => {
    if (category.gender === 'women') {
      setWomenCategories(prev => [...prev, category]);
    } else {
      setMenCategories(prev => [...prev, category]);
    }
    showToast(`Created category "${category.name}"`);
  };

  const updateCategory = (updatedCat: CategoryItem, oldSlug?: string) => {
    const effectiveOldSlug = oldSlug || updatedCat.slug;
    if (updatedCat.gender === 'women') {
      setWomenCategories(prev => prev.map(c => (c.slug === effectiveOldSlug || c.id === updatedCat.id) ? updatedCat : c));
    } else {
      setMenCategories(prev => prev.map(c => (c.slug === effectiveOldSlug || c.id === updatedCat.id) ? updatedCat : c));
    }

    // Auto-migrate products with the old category slug
    if (effectiveOldSlug && effectiveOldSlug !== updatedCat.slug) {
      setProducts(prev => prev.map(p => {
        if (p.gender === updatedCat.gender && (p.category === effectiveOldSlug || p.category === updatedCat.id)) {
          return { ...p, category: updatedCat.slug };
        }
        return p;
      }));
    }
    showToast(`Updated category "${updatedCat.name}"`);
  };

  const deleteCategory = (genderChoice: 'men' | 'women', slug: string) => {
    if (genderChoice === 'women') {
      setWomenCategories(prev => prev.filter(c => c.slug !== slug && c.id !== slug));
    } else {
      setMenCategories(prev => prev.filter(c => c.slug !== slug && c.id !== slug));
    }
    showToast(`Category removed from catalog`);
  };

  const resetToDefaults = () => {
    setProducts(PRODUCTS);
    setWomenCategories(WOMEN_CATEGORIES);
    setMenCategories(MEN_CATEGORIES);
    localStorage.removeItem('atelier_inventory_erased');
    localStorage.setItem('atelier_products_v2', JSON.stringify(PRODUCTS));
    localStorage.removeItem('atelier_women_categories_v2');
    localStorage.removeItem('atelier_men_categories_v2');
    showToast('Catalog restored to runway drop factory defaults');
  };

  const exportCatalogJson = (): string => {
    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      products,
      womenCategories,
      menCategories,
    }, null, 2);
  };

  const importCatalogJson = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON file format' };
      }
      if (Array.isArray(parsed.products)) {
        setProducts(parsed.products);
      }
      if (Array.isArray(parsed.womenCategories)) {
        setWomenCategories(parsed.womenCategories);
      }
      if (Array.isArray(parsed.menCategories)) {
        setMenCategories(parsed.menCategories);
      }
      showToast('Catalog imported successfully');
      return { success: true, message: 'Catalog imported successfully' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to parse JSON' };
    }
  };

  const getCategories = (g: 'men' | 'women'): CategoryItem[] => {
    return g === 'women' ? womenCategories : menCategories;
  };

  const getCategoryBySlug = (g: 'men' | 'women', slug: string): CategoryItem | undefined => {
    const list = g === 'women' ? womenCategories : menCategories;
    return list.find(c => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase());
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(p => p.id === id);
  };

  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    const existingIndex = cart.findIndex(
      item => item.productId === product.id && item.size === size && item.color === color
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${size}-${color}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0] || '',
        size,
        color,
        quantity,
      };
      setCart(prev => [newItem, ...prev]);
    }

    setIsCartOpen(true);
    showToast(`Added "${product.name}" to your bag.`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      const prod = products.find(p => p.id === productId);
      const name = prod ? prod.name : 'Item';
      if (exists) {
        showToast(`Removed "${name}" from your wishlist.`);
        return prev.filter(id => id !== productId);
      } else {
        showToast(`Added "${name}" to your wishlist.`);
        return [...prev, productId];
      }
    });
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);

  return (
    <StoreContext.Provider
      value={{
        gender,
        setGender,
        hasSelectedGender,
        setHasSelectedGender,
        showEntryScreen,
        setShowEntryScreen,
        resetEntryScreen,
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
        getCategories,
        getCategoryBySlug,
        getProductById,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartSubtotal,
        cartCount,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountToFreeShipping,
        wishlist,
        toggleWishlist,
        isWishlistOpen,
        setIsWishlistOpen,
        isSearchOpen,
        setIsSearchOpen,
        activeProduct,
        setActiveProduct,
        isSizeGuideOpen,
        setIsSizeGuideOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        theme,
        setTheme,
        toggleTheme,
        toastMessage,
        showToast,
        reviews,
        getProductReviews,
        addReview,
        deleteReview,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
