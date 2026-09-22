import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem, GenderType, ProductReview } from '../types/product';
import { PRODUCTS } from '../data/products';
import { WOMEN_CATEGORIES, MEN_CATEGORIES, PERFUME_CATEGORIES, type CategoryItem } from '../data/categories';
import { INITIAL_PRODUCT_REVIEWS, getDefaultReviewsForProduct } from '../data/reviews';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Safe parsing helpers for Supabase <-> Frontend Product model
function safeParseJson<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val as T;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function safeParseArray(val: any, fallback: string[] = ['One Size']): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      const split = val.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (split.length > 0) return split;
    }
  }
  return fallback;
}

function safeParsePerfumeNotes(val: any) {
  if (!val) return undefined;
  let parsed = val;
  if (typeof val === 'string') {
    try {
      parsed = JSON.parse(val);
    } catch {
      return { top: [val], heart: [], base: [] };
    }
  }
  if (typeof parsed === 'object' && parsed !== null) {
    const normalize = (n: any): string[] => {
      if (!n) return [];
      if (Array.isArray(n)) return n.map(String).map((s: string) => s.trim()).filter(Boolean);
      if (typeof n === 'string') return n.split(',').map((s: string) => s.trim()).filter(Boolean);
      return [];
    };
    return {
      top: normalize(parsed.top),
      heart: normalize(parsed.heart),
      base: normalize(parsed.base),
    };
  }
  return undefined;
}

export function mapSupabaseToProduct(d: any): Product {
  const isPerfume = Boolean(d.is_perfume || d.isPerfume || d.category === 'perfumes');
  return {
    id: String(d.id),
    name: d.name || 'Untitled Piece',
    slug: d.slug || `piece-${d.id}`,
    gender: d.gender === 'men' ? 'men' : 'women',
    category: d.category || 'all',
    description: d.description || '',
    price: Number(d.price) || 0,
    compareAtPrice: d.compare_at_price ? Number(d.compare_at_price) : undefined,
    images: Array.isArray(d.images) ? d.images : safeParseJson(d.images, []),
    colors: Array.isArray(d.colors) ? d.colors : safeParseJson(d.colors, [{ name: 'Obsidian Noir', hex: '#111113' }]),
    sizes: safeParseArray(d.sizes, ['One Size']),
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
    returnDays: d.return_days !== undefined && d.return_days !== null
      ? Number(d.return_days)
      : (d.returnDays !== undefined && d.returnDays !== null ? Number(d.returnDays) : undefined),
    isPerfume,
    perfumeFamily: d.perfume_family || d.perfumeFamily,
    concentration: d.concentration,
    longevity: d.longevity,
    sillage: d.sillage,
    perfumeNotes: safeParsePerfumeNotes(d.perfume_notes || d.perfumeNotes),
    volumeOptions: Array.isArray(d.volume_options) ? d.volume_options : safeParseJson(d.volume_options || d.volumeOptions, undefined),
    volumeMl: Array.isArray(d.volume_ml) ? d.volume_ml : (Array.isArray(d.volumeMl) ? d.volumeMl : undefined),
  };
}

export function mapProductToSupabase(p: Product) {
  const payload: Record<string, any> = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    gender: p.gender,
    category: p.category,
    description: p.description || '',
    price: Number(p.price),
    compare_at_price: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    images: Array.isArray(p.images) ? p.images : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    stock: p.stock !== undefined ? Math.max(0, Number(p.stock)) : 0,
    sku: p.sku || '',
    rating: p.rating ? Number(p.rating) : 5.0,
    reviews: p.reviews ? Number(p.reviews) : 1,
    featured: Boolean(p.featured),
    new_arrival: Boolean(p.newArrival),
    best_seller: Boolean(p.bestSeller),
    materials: p.materials || '',
    fit: p.fit || '',
    season: p.season || '',
    updated_at: new Date().toISOString(),
  };

  return payload;
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
  perfumeCategories: CategoryItem[];
  addProduct: (product: Omit<Product, 'id'> | Product) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  eraseAllProducts: () => Promise<void>;
  refreshProductsFromCloud: () => Promise<void>;
  addCategory: (category: CategoryItem) => void;
  updateCategory: (category: CategoryItem, oldSlug?: string) => void;
  deleteCategory: (gender: 'men' | 'women' | 'perfumes', slug: string) => void;
  resetToDefaults: () => void;
  exportCatalogJson: () => string;
  importCatalogJson: (jsonStr: string) => { success: boolean; message: string };
  getCategories: (gender: 'men' | 'women' | 'perfumes') => CategoryItem[];
  getCategoryBySlug: (gender: 'men' | 'women' | 'perfumes', slug: string) => CategoryItem | undefined;
  getProductById: (id: string) => Product | undefined;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number, customPrice?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartSubtotal: number;
  cartCount: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;

  // Coupons & Privileges
  appliedCoupon: { code: string; percent: number } | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  discountPercent: number;
  discountAmount: number;
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

  const [hasSelectedGender, setHasSelectedGender] = useState<boolean>(true);

  const [showEntryScreen, setShowEntryScreen] = useState<boolean>(false);

  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);

  // Dynamic Catalog State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const wasErased = localStorage.getItem('atelier_inventory_erased') === 'true';
      if (wasErased) return [];
      const defaultPerfumes = PRODUCTS.filter(p => p.category === 'perfumes' || p.isPerfume);
      const saved = localStorage.getItem('atelier_products_v4');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const nonPerfumes = parsed.filter(p => !p.isPerfume && p.category !== 'perfumes');
          return [...defaultPerfumes, ...nonPerfumes];
        }
      }
      return PRODUCTS;
    } catch (e) {
      console.error('Failed to load products from storage', e);
    }
    return PRODUCTS;
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
          const existingLocalProducts: Product[] = [];
          try {
            const saved = localStorage.getItem('atelier_products_v4');
            if (saved) existingLocalProducts.push(...JSON.parse(saved));
          } catch {}

          let mapped = data.map(row => {
            const prod = mapSupabaseToProduct(row);
            const local = existingLocalProducts.find(lp => lp.id === prod.id);
            if (local && local.returnDays !== undefined && prod.returnDays === undefined) {
              prod.returnDays = local.returnDays;
            }
            return prod;
          });

          // Always merge latest flagship perfumes with latest flacon assets
          const defaultPerfumes = PRODUCTS.filter(p => p.category === 'perfumes' || p.isPerfume);
          const nonPerfumes = mapped.filter(p => !p.isPerfume && p.category !== 'perfumes');
          mapped = [...defaultPerfumes, ...nonPerfumes];

          setProducts(mapped);
          localStorage.setItem('atelier_products_v4', JSON.stringify(mapped));
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
        const defaultPerfumes = PRODUCTS.filter(p => p.category === 'perfumes' || p.isPerfume);
        const saved = localStorage.getItem('atelier_products_v4');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const nonPerfumes = parsed.filter(p => !p.isPerfume && p.category !== 'perfumes');
            const merged = [...defaultPerfumes, ...nonPerfumes];
            setProducts(merged);
            localStorage.setItem('atelier_products_v4', JSON.stringify(merged));
            return;
          }
        }
        setProducts(PRODUCTS);
        localStorage.setItem('atelier_products_v4', JSON.stringify(PRODUCTS));
      }
    } catch (e) {
      console.error('Failed to load products from cloud:', e);
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Automatically load categories from Supabase cloud on initial mount
  const refreshCategoriesFromCloud = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data && data.length > 0) {
        const cloudWomen: CategoryItem[] = [];
        const cloudMen: CategoryItem[] = [];
        const cloudPerfumes: CategoryItem[] = [];

        for (const row of data) {
          if ((row.id === 'perfumes' || row.slug === 'perfumes') && row.name === 'Haute Parfumerie & Royal Attar') continue;
          const gender: 'men' | 'women' | 'perfumes' = row.gender === 'perfumes' ? 'perfumes' : (row.gender === 'men' ? 'men' : 'women');
          const item: CategoryItem = {
            id: row.id,
            slug: row.slug,
            name: row.name,
            shortName: row.short_name || row.name,
            gender,
            eyebrow: row.eyebrow || '',
            description: row.description || '',
            image: row.image || '',
            images: row.image ? [row.image] : [],
            metaDescription: row.meta_description || '',
          };
          if (item.gender === 'women') {
            cloudWomen.push(item);
          } else if (item.gender === 'men') {
            cloudMen.push(item);
          } else {
            cloudPerfumes.push(item);
          }
        }

        if (cloudWomen.length > 0) {
          setWomenCategories(prev => {
            const merged = [...prev];
            for (const cw of cloudWomen) {
              const idx = merged.findIndex(c => c.id === cw.id || c.slug === cw.slug);
              if (idx >= 0) {
                merged[idx] = {
                  ...merged[idx],
                  ...cw,
                  image: cw.image || merged[idx].image,
                  images: (cw.images && cw.images.length > 0) ? cw.images : merged[idx].images,
                };
              } else {
                merged.push(cw);
              }
            }
            return merged.filter(c => c.slug !== 'perfumes' && c.id !== 'perfumes');
          });
        }

        if (cloudMen.length > 0) {
          setMenCategories(prev => {
            const merged = [...prev];
            for (const cm of cloudMen) {
              const idx = merged.findIndex(c => c.id === cm.id || c.slug === cm.slug);
              if (idx >= 0) {
                merged[idx] = {
                  ...merged[idx],
                  ...cm,
                  image: cm.image || merged[idx].image,
                  images: (cm.images && cm.images.length > 0) ? cm.images : merged[idx].images,
                };
              } else {
                merged.push(cm);
              }
            }
            return merged.filter(c => c.slug !== 'perfumes' && c.id !== 'perfumes');
          });
        }

        if (cloudPerfumes.length > 0) {
          setPerfumeCategories(prev => {
            const merged = [...prev];
            for (const cp of cloudPerfumes) {
              const idx = merged.findIndex(c => c.id === cp.id || c.slug === cp.slug);
              if (idx >= 0) {
                merged[idx] = {
                  ...merged[idx],
                  ...cp,
                  image: cp.image || merged[idx].image,
                  images: (cp.images && cp.images.length > 0) ? cp.images : merged[idx].images,
                };
              } else {
                merged.push(cp);
              }
            }
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn('Could not refresh categories from Supabase:', e);
    }
  };

  useEffect(() => {
    refreshProductsFromCloud();
    refreshCategoriesFromCloud();
  }, []);

  const cleanCategoryImages = (cat: CategoryItem): CategoryItem => {
    // Keep valid images, filtering out any legacy stock Unsplash URLs
    const validSlides = (cat.images || []).filter(
      (img) => typeof img === 'string' && img.trim().length > 0 && !img.includes('images.unsplash.com')
    );
    const hasExplicitCover = typeof cat.image === 'string' && cat.image.trim().length > 0 && !cat.image.includes('images.unsplash.com');
    const defaultImg = `/images/categories/${cat.gender}/${cat.slug}.png`;
    const validCover = hasExplicitCover ? cat.image.trim() : (validSlides[0] || defaultImg);
    const finalSlides = validSlides.length > 0 ? [...validSlides] : [validCover];
    if (validCover && !finalSlides.includes(validCover)) {
      finalSlides.unshift(validCover);
    }

    return {
      ...cat,
      image: validCover,
      images: finalSlides,
    };
  };

  const [womenCategories, setWomenCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('atelier_women_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((c: CategoryItem) => c.slug !== 'perfumes' && c.id !== 'perfumes');
          return filtered.map((c) => cleanCategoryImages(c));
        }
      }
    } catch (e) {
      console.error('Failed to load women categories', e);
    }
    return WOMEN_CATEGORIES.map(cleanCategoryImages);
  });

  const [menCategories, setMenCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('atelier_men_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((c: CategoryItem) => c.slug !== 'perfumes' && c.id !== 'perfumes');
          return filtered.map((c) => cleanCategoryImages(c));
        }
      }
    } catch (e) {
      console.error('Failed to load men categories', e);
    }
    return MEN_CATEGORIES.map(cleanCategoryImages);
  });

  const [perfumeCategories, setPerfumeCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('atelier_perfume_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => cleanCategoryImages(c));
        }
      }
    } catch (e) {
      console.error('Failed to load perfume categories', e);
    }
    return PERFUME_CATEGORIES.map(cleanCategoryImages);
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

  useEffect(() => {
    try {
      localStorage.setItem('atelier_perfume_categories_v2', JSON.stringify(perfumeCategories));
    } catch (e) {
      console.error('Failed to persist perfume categories', e);
    }
  }, [perfumeCategories]);

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
    setShowEntryScreen(false);
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
    
    let newProduct: Product = {
      ...productData,
      id,
      rating: productData.rating || 5.0,
      reviews: productData.reviews || 1,
    };

    // Auto-sync to Supabase Cloud if connected
    if (isSupabaseConfigured()) {
      const payload = mapProductToSupabase(newProduct);
      let { data, error } = await supabase
        .from('products')
        .upsert(payload, { onConflict: 'id' })
        .select();

      // Gracefully retry if an unmapped column triggered PGRST204 schema cache error
      if (error && error.code === 'PGRST204') {
        const colMatch = error.message.match(/Could not find the '([^']+)' column/i);
        if (colMatch && colMatch[1]) {
          console.warn(`Stripping unknown column "${colMatch[1]}" and retrying add...`);
          delete payload[colMatch[1]];
          const retry = await supabase
            .from('products')
            .upsert(payload, { onConflict: 'id' })
            .select();
          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        console.error('Supabase add error:', error);
        throw new Error(`Database error adding piece: ${error.message}`);
      }

      if (data && data.length > 0) {
        const dbProduct = mapSupabaseToProduct(data[0]);
        newProduct = {
          ...newProduct,
          ...dbProduct,
          returnDays: newProduct.returnDays !== undefined ? newProduct.returnDays : dbProduct.returnDays,
        };
      }
    }
    
    setProducts(prev => {
      const next = [newProduct, ...prev.filter(p => p.id !== id)];
      try {
        localStorage.setItem('atelier_products_v2', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to sync products to localStorage:', e);
      }
      return next;
    });
    localStorage.removeItem('atelier_inventory_erased');
    showToast(`Created piece "${newProduct.name}"`);

    return newProduct;
  };

  const updateProduct = async (updatedProduct: Product): Promise<void> => {
    let finalProduct: Product = { ...updatedProduct };

    // Auto-sync update to Supabase Cloud
    if (isSupabaseConfigured()) {
      const payload = mapProductToSupabase(updatedProduct);

      // Perform explicit UPDATE targeting the exact product ID
      let { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', updatedProduct.id)
        .select();

      // Gracefully retry if an unmapped column triggered PGRST204 schema cache error
      if (error && error.code === 'PGRST204') {
        const colMatch = error.message.match(/Could not find the '([^']+)' column/i);
        if (colMatch && colMatch[1]) {
          console.warn(`Stripping unknown column "${colMatch[1]}" and retrying update...`);
          delete payload[colMatch[1]];
          const retry = await supabase
            .from('products')
            .update(payload)
            .eq('id', updatedProduct.id)
            .select();
          data = retry.data;
          error = retry.error;
        }
      }

      // If the row didn't exist yet, fallback to upsert
      if (!error && (!data || data.length === 0)) {
        const upsertRes = await supabase
          .from('products')
          .upsert(payload, { onConflict: 'id' })
          .select();
        data = upsertRes.data;
        error = upsertRes.error;
      }

      if (error) {
        console.error('Supabase product update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Merge verified database data with local-only metadata (e.g. returnDays)
      if (data && data.length > 0) {
        const dbProduct = mapSupabaseToProduct(data[0]);
        finalProduct = {
          ...finalProduct,
          ...dbProduct,
          returnDays: finalProduct.returnDays !== undefined ? finalProduct.returnDays : dbProduct.returnDays,
        };
      }
    }

    setProducts(prev => {
      const next = prev.map(p => (p.id === finalProduct.id ? finalProduct : p));
      try {
        localStorage.setItem('atelier_products_v2', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to sync products to localStorage:', e);
      }
      return next;
    });

    if (activeProduct && activeProduct.id === finalProduct.id) {
      setActiveProduct(finalProduct);
    }

    showToast(`Updated "${finalProduct.name}"`);
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const target = products.find(p => p.id === id);

    // Auto-sync delete to Supabase Cloud
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Database error deleting piece: ${error.message}`);
      }
    }

    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      if (next.length === 0) {
        localStorage.setItem('atelier_inventory_erased', 'true');
      }
      try {
        localStorage.setItem('atelier_products_v2', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to sync products to localStorage:', e);
      }
      return next;
    });
    setCart(prev => prev.filter(item => item.productId !== id));
    setWishlist(prev => prev.filter(item => item !== id));
    if (activeProduct && activeProduct.id === id) {
      setActiveProduct(null);
    }
    showToast(`Deleted "${target ? target.name : 'Piece'}"`);
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
  const addCategory = async (category: CategoryItem) => {
    if (category.gender === 'women') {
      setWomenCategories(prev => [...prev, category]);
    } else if (category.gender === 'men') {
      setMenCategories(prev => [...prev, category]);
    } else {
      setPerfumeCategories(prev => [...prev, category]);
    }
    showToast(`Created category "${category.name}"`);

    // Auto-sync to Supabase cloud
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('categories').upsert({
          id: category.id,
          slug: category.slug,
          name: category.name,
          short_name: category.shortName || category.name,
          gender: category.gender,
          eyebrow: category.eyebrow,
          description: category.description,
          image: category.image,
          meta_description: category.metaDescription,
        }, { onConflict: 'id' });
      } catch (err: any) {
        console.warn('Supabase category insert sync notice:', err.message);
      }
    }
  };

  const updateCategory = async (updatedCat: CategoryItem, oldSlug?: string) => {
    const effectiveOldSlug = oldSlug || updatedCat.slug;
    if (updatedCat.gender === 'women') {
      setWomenCategories(prev => prev.map(c => (c.slug === effectiveOldSlug || c.id === updatedCat.id) ? updatedCat : c));
    } else if (updatedCat.gender === 'men') {
      setMenCategories(prev => prev.map(c => (c.slug === effectiveOldSlug || c.id === updatedCat.id) ? updatedCat : c));
    } else {
      setPerfumeCategories(prev => prev.map(c => (c.slug === effectiveOldSlug || c.id === updatedCat.id) ? updatedCat : c));
    }

    // Auto-migrate products with the old category slug
    if (effectiveOldSlug && effectiveOldSlug !== updatedCat.slug) {
      setProducts(prev => prev.map(p => {
        if (updatedCat.gender === 'perfumes' && (p.isPerfume || p.category === 'perfumes')) {
          if (p.perfumeFamily === effectiveOldSlug || p.category === effectiveOldSlug) {
            return { ...p, perfumeFamily: updatedCat.name };
          }
        } else if (p.gender === updatedCat.gender && (p.category === effectiveOldSlug || p.category === updatedCat.id)) {
          return { ...p, category: updatedCat.slug };
        }
        return p;
      }));
    }
    showToast(`Updated category "${updatedCat.name}"`);

    // Auto-sync to Supabase cloud
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('categories').upsert({
          id: updatedCat.id,
          slug: updatedCat.slug,
          name: updatedCat.name,
          short_name: updatedCat.shortName || updatedCat.name,
          gender: updatedCat.gender,
          eyebrow: updatedCat.eyebrow,
          description: updatedCat.description,
          image: updatedCat.image,
          meta_description: updatedCat.metaDescription,
        }, { onConflict: 'id' });
      } catch (err: any) {
        console.warn('Supabase category update sync notice:', err.message);
      }
    }
  };

  const deleteCategory = async (genderChoice: 'men' | 'women' | 'perfumes', slug: string) => {
    if (genderChoice === 'women') {
      setWomenCategories(prev => prev.filter(c => c.slug !== slug && c.id !== slug));
    } else if (genderChoice === 'men') {
      setMenCategories(prev => prev.filter(c => c.slug !== slug && c.id !== slug));
    } else {
      setPerfumeCategories(prev => prev.filter(c => c.slug !== slug && c.id !== slug));
    }
    showToast(`Category removed from catalog`);

    // Auto-sync delete to Supabase cloud
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('categories').delete().or(`slug.eq.${slug},id.eq.${slug}`);
      } catch (err: any) {
        console.warn('Supabase category delete sync notice:', err.message);
      }
    }
  };

  const resetToDefaults = () => {
    setProducts(PRODUCTS);
    setWomenCategories(WOMEN_CATEGORIES);
    setMenCategories(MEN_CATEGORIES);
    setPerfumeCategories(PERFUME_CATEGORIES);
    localStorage.removeItem('atelier_inventory_erased');
    localStorage.setItem('atelier_products_v2', JSON.stringify(PRODUCTS));
    localStorage.removeItem('atelier_women_categories_v2');
    localStorage.removeItem('atelier_men_categories_v2');
    localStorage.removeItem('atelier_perfume_categories_v2');
    showToast('Catalog restored to runway drop factory defaults');
  };

  const exportCatalogJson = (): string => {
    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      products,
      womenCategories,
      menCategories,
      perfumeCategories,
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
      if (Array.isArray(parsed.perfumeCategories)) {
        setPerfumeCategories(parsed.perfumeCategories);
      }
      showToast('Catalog imported successfully');
      return { success: true, message: 'Catalog imported successfully' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to parse JSON' };
    }
  };

  const getCategories = (g: 'men' | 'women' | 'perfumes'): CategoryItem[] => {
    if (g === 'women') return womenCategories;
    if (g === 'men') return menCategories;
    return perfumeCategories;
  };

  const getCategoryBySlug = (g: 'men' | 'women' | 'perfumes', slug: string): CategoryItem | undefined => {
    const list = g === 'women' ? womenCategories : g === 'men' ? menCategories : perfumeCategories;
    return list.find(c => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase());
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(p => p.id === id);
  };

  const addToCart = (product: Product, size: string, color: string, quantity = 1, customPrice?: number) => {
    // Resolve dynamic price for perfume volume option if configured
    let effectivePrice = customPrice !== undefined ? customPrice : product.price;
    if (customPrice === undefined && product.volumeOptions && product.volumeOptions.length > 0) {
      const match = product.volumeOptions.find(v => v.ml === size || size.startsWith(v.ml));
      if (match && match.price > 0) {
        effectivePrice = match.price;
      }
    }

    const existingIndex = cart.findIndex(
      item => item.productId === product.id && item.size === size && item.color === color
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      const isPerfume = Boolean(product.isPerfume || product.category === 'perfumes');
      const newItem: CartItem = {
        id: `${product.id}-${size}-${color}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: effectivePrice,
        image: product.images[0] || '',
        size,
        color,
        quantity,
        isPerfume,
        volumeMl: isPerfume ? size : undefined,
      };
      setCart(prev => [newItem, ...prev]);
    }

    setIsCartOpen(true);
    showToast(`Added "${product.name} (${size})" to your bag.`);
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

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(() => {
    try {
      const saved = sessionStorage.getItem('atelier_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const clean = code.trim().toUpperCase();
    if (clean === 'ATELIER10') {
      const coupon = { code: 'ATELIER10', percent: 10 };
      setAppliedCoupon(coupon);
      try {
        sessionStorage.setItem('atelier_applied_coupon', JSON.stringify(coupon));
      } catch {}
      return { success: true, message: '10% VIP Atelier privilege applied.' };
    } else if (clean === 'FIRST15') {
      const coupon = { code: 'FIRST15', percent: 15 };
      setAppliedCoupon(coupon);
      try {
        sessionStorage.setItem('atelier_applied_coupon', JSON.stringify(coupon));
      } catch {}
      return { success: true, message: '15% First Haute Order privilege applied.' };
    }
    return { success: false, message: 'Invalid coupon code. Try "ATELIER10".' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    try {
      sessionStorage.removeItem('atelier_applied_coupon');
    } catch {}
  };

  const discountPercent = appliedCoupon?.percent || 0;
  const discountAmount = Math.round((cartSubtotal * discountPercent) / 100);

  return (
    <StoreContext.Provider
      value={{
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        discountPercent,
        discountAmount,
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
