import type { ProductReview } from '../types/product';

export const INITIAL_PRODUCT_REVIEWS: Record<string, ProductReview[]> = {
  'prod-1': [
    {
      id: 'rev-p1-1',
      productId: 'prod-1',
      authorName: 'Aarav M.',
      authorLocation: 'Mumbai, India',
      rating: 5,
      title: 'Savile Row quality, breathtaking drape',
      comment: 'The weight of the Mongolian cashmere and the hand-finished lapels are extraordinary. It wears like a second skin while holding razor-sharp architectural structure.',
      verifiedPurchase: true,
      createdAt: '2026-08-14T10:30:00Z',
    },
    {
      id: 'rev-p1-2',
      productId: 'prod-1',
      authorName: 'Devansh K.',
      authorLocation: 'New Delhi, India',
      rating: 5,
      title: 'Worth every rupee',
      comment: 'Ordered for an evening gala in South Delhi. Received countless compliments on the midnight noir tone and Italian horn buttons.',
      verifiedPurchase: true,
      createdAt: '2026-08-20T14:15:00Z',
    },
  ],
  'prod-2': [
    {
      id: 'rev-p2-1',
      productId: 'prod-2',
      authorName: 'Ananya S.',
      authorLocation: 'Bengaluru, India',
      rating: 5,
      title: 'Liquid silk perfection',
      comment: 'The bias-cut charmeuse drapes like water. Floor-skimming length is exact. Wearing this to an international art biennale opening.',
      verifiedPurchase: true,
      createdAt: '2026-08-18T18:00:00Z',
    },
    {
      id: 'rev-p2-2',
      productId: 'prod-2',
      authorName: 'Tara V.',
      authorLocation: 'Dubai, UAE',
      rating: 5,
      title: 'Couture grade finish',
      comment: 'The concealed side zip and French seams are executed to perfection. The fabric has an ethereal luster under warm lighting.',
      verifiedPurchase: true,
      createdAt: '2026-08-25T11:20:00Z',
    },
  ],
  'prod-3': [
    {
      id: 'rev-p3-1',
      productId: 'prod-3',
      authorName: 'Rohan P.',
      authorLocation: 'London, UK',
      rating: 5,
      title: 'Heavyweight Pima cotton marvel',
      comment: 'Double-mercerized Pima jersey that maintains its crisp silhouette even after dry cleaning. Will be acquiring the other colors.',
      verifiedPurchase: true,
      createdAt: '2026-08-22T09:45:00Z',
    },
  ],
};

// Generates default realistic reviews for any piece that has none yet
export function getDefaultReviewsForProduct(productId: string, productName: string): ProductReview[] {
  return [
    {
      id: `rev-${productId}-def1`,
      productId,
      authorName: 'Rhea S.',
      authorLocation: 'Mumbai, India',
      rating: 5,
      title: `Uncompromising craftsmanship — ${productName}`,
      comment: 'The tactile quality of the fibers and the proportion of the silhouette exceed expectations. Truly a centerpiece for the modern discerning wardrobe.',
      verifiedPurchase: true,
      createdAt: '2026-08-15T12:00:00Z',
    },
    {
      id: `rev-${productId}-def2`,
      productId,
      authorName: 'Kabir N.',
      authorLocation: 'New Delhi, India',
      rating: 5,
      title: 'Flawless fit and finish',
      comment: 'Delivered in signature Zarb obsidian garment box. The attention to interior seams and balance is of the highest echelon.',
      verifiedPurchase: true,
      createdAt: '2026-08-28T16:30:00Z',
    },
  ];
}
