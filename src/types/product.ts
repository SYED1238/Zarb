export type GenderType = 'men' | 'women' | 'all';

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
  images?: string[]; // Multiple photos specifically for this color variant
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
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
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
