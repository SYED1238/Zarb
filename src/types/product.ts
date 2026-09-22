export type GenderType = 'men' | 'women' | 'all';

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
  images?: string[]; // Multiple photos specifically for this color variant
}

export interface PerfumeVolumeOption {
  ml: string; // e.g. "6ml", "12ml", "50ml", "100ml"
  price: number;
  compareAtPrice?: number;
  inStock?: boolean;
}

export interface PerfumeNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface Product {
  id: string;
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
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  details?: string[];
  materials?: string;
  fit?: string;
  season?: string;
  returnDays?: number; // Return window in days (undefined = follows store policy, 0 = final sale)

  // Haute Parfumerie & Attar Extensions
  isPerfume?: boolean;
  perfumeFamily?: string; // e.g. 'Royal Oud & Oriental', 'Floral & Taif Rose', 'Smoked Amber & Leather', 'Pure White Musk', 'Fresh Bergamot & Citrus'
  concentration?: string; // e.g. 'Pure Concentrated Attar Oil (100% Oil)', 'Extrait de Parfum (35%)', 'Eau de Parfum (20%)'
  perfumeNotes?: PerfumeNotes;
  longevity?: string; // e.g. '18+ Hours · Eternal'
  sillage?: string; // e.g. 'Majestic & Enveloping'
  volumeOptions?: PerfumeVolumeOption[]; // Specific pricing & stock for each ML size
  volumeMl?: string[]; // Quick list of active ML options
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string; // Will store the selected ML for perfumes (e.g. "50ml Extrait" or "12ml Attar")
  color: string;
  quantity: number;
  volumeMl?: string; // Optional dedicated ML property for perfumes
  isPerfume?: boolean;
}

export interface FilterState {
  gender: GenderType;
  category: string;
  searchQuery: string;
  sortBy: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
  priceRange: [number, number];
  color: string;
  size: string;
}

export interface CheckoutForm {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: 'standard' | 'express' | 'same-day';
  paymentMethod: 'card' | 'upi' | 'cod';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  upiId?: string;
  saveInfo?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string;
  authorName: string;
  authorLocation?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}
