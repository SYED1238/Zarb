import type { Product } from '../types/product';
import { WOMEN_CATEGORIES, MEN_CATEGORIES } from './categories';

export { WOMEN_CATEGORIES, MEN_CATEGORIES };

export const CATEGORIES_MEN = [
  { id: 'all', name: 'All Pieces' },
  ...MEN_CATEGORIES.map((c) => ({ id: c.slug, name: c.name })),
];

export const CATEGORIES_WOMEN = [
  { id: 'all', name: 'All Pieces' },
  ...WOMEN_CATEGORIES.map((c) => ({ id: c.slug, name: c.name })),
];

export const EDITORIAL_COLLECTIONS = [
  {
    id: 'men-campaign',
    gender: 'men',
    title: 'THE ARCHITECTURAL MAN',
    subtitle: 'Autumn / Winter 2026 Collection No. 08',
    description: 'Precision tailoring meets unyielding minimal forms. Sculpted shoulders and Italian cashmere designed for discerning restraint.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop',
    linkCategory: 'jackets'
  },
  {
    id: 'women-campaign',
    gender: 'women',
    title: 'THE CONTEMPORARY SILHOUETTE',
    subtitle: 'Autumn / Winter 2026 Collection No. 08',
    description: 'Fluid drapery contrasted with razor-sharp suiting. Raw mulberry silks and virgin wool celebrating architectural poise.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
    linkCategory: 'dresses-gowns'
  }
];

export const PRODUCTS: Product[] = [
  // ==================== MEN'S COLLECTION ====================
  {
    id: 'm-01',
    name: 'Chesterfield Double-Faced Cashmere Overcoat',
    slug: 'chesterfield-cashmere-overcoat',
    gender: 'men',
    category: 'jackets',
    description: 'A monument to understated tailoring. Cut from unlined, double-faced Italian cashmere and virgin wool blend with hand-finished pick stitching.',
    price: 38500,
    compareAtPrice: 46000,
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Obsidian Noir', hex: '#111113' },
      { name: 'Charcoal Melange', hex: '#2b2c30' },
      { name: 'Camel Vicuña', hex: '#8a6e4b' }
    ],
    sizes: ['46 (S)', '48 (M)', '50 (L)', '52 (XL)'],
    stock: 7,
    sku: 'AT-MN-CT01',
    rating: 4.95,
    reviews: 42,
    featured: true,
    newArrival: true,
    bestSeller: true,
    details: [
      'Handcrafted in Biella, Italy',
      '100% Mongolian Grade-A Cashmere blend',
      'Concealed horn button front closure',
      'Interior passport and discreet card pockets'
    ],
    materials: '85% Virgin Wool, 15% Cashmere. Lining: 100% Cupro.',
    fit: 'Relaxed tailored silhouette designed to layer seamlessly over knitwear.',
    season: 'AW26'
  },
  {
    id: 'm-02',
    name: 'Structured Architectural Wool Blazer',
    slug: 'structured-architectural-blazer',
    gender: 'men',
    category: 'jackets',
    description: 'Clean single-breasted silhouette featuring lightly padded roped shoulders, floating canvas chest piece, and unvented hem for a razor-sharp modern profile.',
    price: 28900,
    compareAtPrice: 34500,
    images: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Deep Black', hex: '#0a0a0c' },
      { name: 'Midnight Navy', hex: '#111827' }
    ],
    sizes: ['46 (S)', '48 (M)', '50 (L)', '52 (XL)'],
    stock: 12,
    sku: 'AT-MN-BL02',
    rating: 4.88,
    reviews: 29,
    featured: true,
    newArrival: false,
    bestSeller: true,
    details: [
      'Half-canvas construction for natural drape',
      'Genuine corozo nut buttons',
      'Welt chest pocket & jet hip pockets'
    ],
    materials: '100% Super 130s Merino Wool from Vitale Barberis Canonico.',
    fit: 'Modern tailored fit with athletic taper at waist.',
    season: 'AW26'
  },
  {
    id: 'm-03',
    name: 'Sculpted Band Collar Draped Poplin Shirt',
    slug: 'sculpted-band-collar-shirt',
    gender: 'men',
    category: 'shirts',
    description: 'Minimalist dress shirt engineered with a continuous French placket, clean mandarin stand collar, and mother-of-pearl hardware.',
    price: 9800,
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Alabaster White', hex: '#f8f8f6' },
      { name: 'Onyx Black', hex: '#0d0d0f' }
    ],
    sizes: ['38 (S)', '39 (M)', '41 (L)', '42 (XL)'],
    stock: 18,
    sku: 'AT-MN-SH03',
    rating: 4.82,
    reviews: 19,
    featured: false,
    newArrival: true,
    bestSeller: false,
    details: [
      'Woven from 120/2 double-twist Egyptian cotton',
      'Seamless band collar contour',
      'Split back yoke for mobility'
    ],
    materials: '100% Giza Long-Staple Cotton.',
    fit: 'Tailored regular drape with clean shoulder line.',
    season: 'AW26'
  },
  {
    id: 'm-04',
    name: 'Double-Pleated Wide-Leg Wool Trousers',
    slug: 'double-pleated-wide-trousers',
    gender: 'men',
    category: 'trousers',
    description: 'Dramatic architectural trousers with forward double pleats, high-rise waistband, side adjusters, and a sweeping fluid break.',
    price: 16500,
    compareAtPrice: 19000,
    images: [
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Shadow Charcoal', hex: '#262629' },
      { name: 'Pecan Melange', hex: '#4f443b' }
    ],
    sizes: ['30', '32', '34', '36'],
    stock: 9,
    sku: 'AT-MN-TR04',
    rating: 4.91,
    reviews: 31,
    featured: true,
    newArrival: false,
    bestSeller: true,
    details: [
      'Extended tab waistband with concealed hook & bar',
      'Brass side adjusters (no belt loops for pristine line)',
      'Unfinished hem for bespoke tailoring'
    ],
    materials: '98% High-Twist Tropical Wool, 2% Elastane.',
    fit: 'High-waisted with generous relaxed thigh tapering slightly at cuff.',
    season: 'AW26'
  },
  {
    id: 'm-05',
    name: 'Raw Japanese Kuroki Selvedge Denim',
    slug: 'raw-japanese-selvedge-denim',
    gender: 'men',
    category: 'jeans',
    description: 'Shuttle-loom 14.5oz untreated indigo denim from Okayama, Japan. Features custom matte black hardware and iconic red selvedge ID.',
    price: 14200,
    images: [
      'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Raw Deep Indigo', hex: '#161c2e' },
      { name: 'Washed Charcoal', hex: '#232325' }
    ],
    sizes: ['30', '31', '32', '33', '34', '36'],
    stock: 15,
    sku: 'AT-MN-DN05',
    rating: 4.86,
    reviews: 24,
    featured: false,
    newArrival: true,
    bestSeller: false,
    details: [
      '14.5oz Kuroki Mills rope-dyed denim',
      'Hidden back pocket copper rivets',
      'Deerskin leather waistband patch with debossed logo'
    ],
    materials: '100% Long-Staple Zimbabwe Cotton.',
    fit: 'Straight leg silhouette with medium rise.',
    season: 'AW26'
  },
  {
    id: 'm-06',
    name: 'Heavyweight Mercerized Pima Minimalist Tee',
    slug: 'mercerized-pima-minimalist-tee',
    gender: 'men',
    category: 't-shirts',
    description: 'Dense 280 GSM Peruvian Pima cotton with double mercerized finish providing a subtle silk-like luster, zero shrinkage, and flawless drape.',
    price: 4900,
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Jet Noir', hex: '#0e0e10' },
      { name: 'Chalk Bone', hex: '#eeebe2' },
      { name: 'Concrete Gray', hex: '#636569' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 35,
    sku: 'AT-MN-TE06',
    rating: 4.93,
    reviews: 87,
    featured: false,
    newArrival: false,
    bestSeller: true,
    details: [
      '280 GSM double-mercerized Pima jersey',
      'Reinforced collar ribbing that never barrows',
      'Flatlocked luxury internal seams'
    ],
    materials: '100% Organic Peruvian Long-Staple Pima Cotton.',
    fit: 'Boxy, slightly dropped shoulder with relaxed chest.',
    season: 'CORE'
  },
  {
    id: 'm-07',
    name: 'Artisanal Calfskin Minimalist Chelsea Boots',
    slug: 'artisanal-calfskin-chelsea-boots',
    gender: 'men',
    category: 'sneakers',
    description: 'Hand-lasted wholecut boots sculpted from French box calfskin. Goodyear welted construction with low-profile Vibram half-rubber soles.',
    price: 24500,
    compareAtPrice: 29000,
    images: [
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Matte Onyx', hex: '#141416' },
      { name: 'Espresso Glaze', hex: '#2f1f17' }
    ],
    sizes: ['40 (UK 6)', '41 (UK 7)', '42 (UK 8)', '43 (UK 9)', '44 (UK 10)'],
    stock: 8,
    sku: 'AT-MN-BT07',
    rating: 4.97,
    reviews: 53,
    featured: true,
    newArrival: true,
    bestSeller: true,
    details: [
      'Goodyear welted in Porto, Portugal',
      'Full-grain French box calf leather',
      'Tonal elastic side gusset and leather pull tabs'
    ],
    materials: 'Upper: 100% French Calfskin. Sole: Stacked leather with Vibram.',
    fit: 'True to size with structured European toe box.',
    season: 'AW26'
  },
  {
    id: 'm-08',
    name: 'Atelier Granular Saffiano Leather Duffle',
    slug: 'atelier-saffiano-leather-duffle',
    gender: 'men',
    category: 'accessories',
    description: 'Engineered for seamless weekend transit. Italian vegetable-tanned full grain leather with gunmetal Raccagni zippers and suede interior.',
    price: 32000,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Pitch Black', hex: '#111113' },
      { name: 'Dark Cognac', hex: '#3d2516' }
    ],
    sizes: ['45L Carry-On Spec'],
    stock: 5,
    sku: 'AT-MN-BG08',
    rating: 4.96,
    reviews: 17,
    featured: true,
    newArrival: false,
    bestSeller: false,
    details: [
      'TSA-approved carry-on dimensions',
      'Padded interior 16" laptop sleeve',
      'Reinforced rolled leather handles & detachable shoulder strap'
    ],
    materials: '100% Full Grain Italian Calfskin, Micro-suede lining.',
    fit: '45 Liters. 52cm x 28cm x 26cm.',
    season: 'CORE'
  },

  // ==================== WOMEN'S COLLECTION ====================
  // 1. KURTIS & TUNICS (Dedicated featured collection)
  {
    id: 'w-ku-01',
    name: 'Chanderi Silk Hand-Pleated Kalidar Kurti',
    slug: 'chanderi-silk-hand-pleated-kalidar-kurti',
    gender: 'women',
    category: 'kurtis',
    description: 'Sculpted from hand-spun Chanderi silk with delicate micro-knife pleating along the empire line. Finished with concealed mother-of-pearl buttons and deep side vents.',
    price: 24500,
    compareAtPrice: 29000,
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      {
        name: 'Ivory Chanderi',
        hex: '#f7f5ed',
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      {
        name: 'Basalt Obsidian',
        hex: '#161619',
        images: [
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      {
        name: 'Burnt Ochre',
        hex: '#7a4220',
        images: [
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop'
        ]
      }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 9,
    sku: 'AT-WN-KU01',
    rating: 4.97,
    reviews: 48,
    featured: true,
    newArrival: true,
    bestSeller: true,
    details: [
      'Woven by master weavers in Chanderi, Madhya Pradesh',
      'Pure Mulberry silk warp with fine organza weft',
      'Concealed French placket with hand-sewn button loops',
      'Side seam discreet pockets'
    ],
    materials: '70% Pure Silk, 30% Fine Cotton Chanderi. Lining: 100% Mulmul.',
    fit: 'Relaxed A-line silhouette with architectural floor drape.',
    season: 'AW26'
  },
  {
    id: 'w-ku-02',
    name: 'Minimalist Angrakha Draped Mulberry Silk Kurti',
    slug: 'minimalist-angrakha-mulberry-silk-kurti',
    gender: 'women',
    category: 'kurtis',
    description: 'Contemporary asymmetric crossover neckline inspired by royal heritage angrakha cuts. Minimalist tie closure with weighted brass beads and clean straight hem.',
    price: 26800,
    compareAtPrice: 32000,
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Raven Black', hex: '#111113' },
      { name: 'Oatmeal Taupe', hex: '#877c71' }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 14,
    sku: 'AT-WN-KU02',
    rating: 4.92,
    reviews: 36,
    featured: true,
    newArrival: true,
    bestSeller: false,
    details: [
      'Diagonal wrap closure with reinforced grosgrain stay',
      'Turned-back clean cuff detailing',
      'Fluid heavy 24-momme silk crepe'
    ],
    materials: '100% Grade-A Mulberry Silk Crepe.',
    fit: 'Fluid tailored fit that gently contours waistline.',
    season: 'AW26'
  },
  {
    id: 'w-ku-03',
    name: 'Hand-Embroidered Zardozi Tussar Silk Kurti',
    slug: 'hand-embroidered-zardozi-tussar-silk-kurti',
    gender: 'women',
    category: 'kurtis',
    description: 'Raw textured wild Tussar silk highlighted with tonal metallic bullion and French knot micro-embroidery along the mandarin stand collar and sleeve cuffs.',
    price: 31500,
    compareAtPrice: 38000,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Smoked Basalt', hex: '#1d1d21' },
      { name: 'Champagne Alabaster', hex: '#eae3d2' }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 7,
    sku: 'AT-WN-KU03',
    rating: 4.98,
    reviews: 52,
    featured: true,
    newArrival: false,
    bestSeller: true,
    details: [
      '40 hours of hand-guided atelier embroidery',
      'Organic wild forest Tussar silk with rich natural slub',
      'Full silk habotai lining'
    ],
    materials: '100% Handloom Tussar Silk.',
    fit: 'Structured straight silhouette with tailored shoulders.',
    season: 'AW26'
  },
  {
    id: 'w-ku-04',
    name: 'Asymmetrical High-Slit Raw Silk Tunic Kurti',
    slug: 'asymmetrical-high-slit-raw-silk-kurti',
    gender: 'women',
    category: 'kurtis',
    description: 'Clean architectural tunic featuring a dramatic one-sided thigh-high slit, concealed zipper fastening, and razor-sharp jewel neck.',
    price: 21900,
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Pitch Noir', hex: '#0f0f12' },
      { name: 'Sand Dune', hex: '#baa892' }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 12,
    sku: 'AT-WN-KU04',
    rating: 4.88,
    reviews: 27,
    featured: false,
    newArrival: true,
    bestSeller: false,
    details: [
      'High-tension raw Matka silk with crisp fall',
      'Invisible side seam zipper closure',
      'Designed to pair with tailored wide-leg trousers'
    ],
    materials: '100% Organic Raw Silk.',
    fit: 'Contemporary elongated tunic fit.',
    season: 'AW26'
  },

  // 2. DRESSES & EVENING GOWNS
  {
    id: 'w-01',
    name: 'Bias-Cut Mulberry Silk Charmeuse Evening Gown',
    slug: 'bias-cut-silk-evening-gown',
    gender: 'women',
    category: 'dresses-gowns',
    description: 'Fluid drape cut entirely on the bias from 22-momme Mulberry silk. Features a low cowl back, delicate micro-rouleau straps, and a floor-skimming pool hem.',
    price: 34500,
    compareAtPrice: 42000,
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Obsidian Midnight', hex: '#0e0e11' },
      { name: 'Champagne Alabaster', hex: '#eae3d2' },
      { name: 'Oxblood Rouge', hex: '#381318' }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 6,
    sku: 'AT-WN-DR01',
    rating: 4.98,
    reviews: 64,
    featured: true,
    newArrival: true,
    bestSeller: true,
    details: [
      'Cut on true 45-degree bias for liquid body contour',
      'French rolled seams with invisible zip side closure',
      'Draped sculptural open-back finish'
    ],
    materials: '100% Grade 6A Pure Mulberry Silk Charmeuse.',
    fit: 'Fluid body-skimming silhouette that gently follows curve without cling.',
    season: 'AW26'
  },

  // 3. BLAZERS & OUTERWEAR
  {
    id: 'w-02',
    name: 'Sculpted Cinch Double-Breasted Wool Blazer',
    slug: 'sculpted-cinch-double-breasted-blazer',
    gender: 'women',
    category: 'blazers-outerwear',
    description: 'An ode to contemporary feminine power tailoring. Sharp, architectural shoulders offset by a sculpted hour-glass waist and elongated lapels.',
    price: 29500,
    compareAtPrice: 35000,
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Raven Black', hex: '#121215' },
      { name: 'Flint Gray', hex: '#383a3f' }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 11,
    sku: 'AT-WN-BL02',
    rating: 4.92,
    reviews: 38,
    featured: true,
    newArrival: false,
    bestSeller: true,
    details: [
      'Padded architectural shoulders',
      'Internal grosgrain stay ribbon to anchor waist',
      'Bespoke horn crest buttons'
    ],
    materials: '100% Virgin Wool Gabardine. Cupro Bemberg lining.',
    fit: 'Tailored hour-glass fit with strong shoulder architecture.',
    season: 'AW26'
  },
  {
    id: 'w-08',
    name: 'Double-Breasted Cashmere Cocoon Trench Coat',
    slug: 'cashmere-cocoon-trench-coat',
    gender: 'women',
    category: 'blazers-outerwear',
    description: 'An architectural reinterpretation of the classic trench. Voluminous raglan sleeves, exaggerated storm flap, and matching leather-buckled belt.',
    price: 44000,
    compareAtPrice: 52000,
    images: [
      'https://images.unsplash.com/photo-1548624149-f9b1859aa9d0?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Smoked Basalt', hex: '#1d1d21' },
      { name: 'Oatmeal Taupe', hex: '#877c71' }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 4,
    sku: 'AT-WN-CT08',
    rating: 4.99,
    reviews: 58,
    featured: true,
    newArrival: true,
    bestSeller: true,
    details: [
      'Cut from heavy 650 GSM Italian wool-cashmere blend',
      'Real horn double-breasted buttons',
      'Hand-stitched leather belt buckle with silver eyelets'
    ],
    materials: '80% Virgin Wool, 20% Mongolian Cashmere.',
    fit: 'Cocoon relaxed volume. Designed to be cinched with belt.',
    season: 'AW26'
  },

  // 4. TOPS & KNITWEAR
  {
    id: 'w-03',
    name: 'Fine Ribbed Cashmere-Silk Mock Neck Top',
    slug: 'cashmere-silk-mock-neck-top',
    gender: 'women',
    category: 'tops-knitwear',
    description: 'Whisper-light 70% cashmere and 30% silk blend knitted with micro-ribbing. Second-skin hand feel with supreme warmth and breathability.',
    price: 11800,
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Pure Noir', hex: '#0f0f11' },
      { name: 'Raw Ivory', hex: '#f0ece1' },
      { name: 'Taupe Moka', hex: '#635349' }
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 22,
    sku: 'AT-WN-TP03',
    rating: 4.89,
    reviews: 47,
    featured: false,
    newArrival: true,
    bestSeller: true,
    details: [
      'Spun from 2/48 ultra-fine worsted yarn',
      'Seamless tubular knit collar and cuffs',
      'Elongated sleeve length with delicate knuckle cuff'
    ],
    materials: '70% Mongolian Cashmere, 30% Mulberry Silk.',
    fit: 'Close-to-body second-skin silhouette.',
    season: 'AW26'
  },

  // 5. SHIRTS & BLOUSES
  {
    id: 'w-sh-01',
    name: 'Sculptural French Placket Silk Georgette Blouse',
    slug: 'sculptural-silk-georgette-blouse',
    gender: 'women',
    category: 'shirts-blouses',
    description: 'Refined semi-sheer silk georgette blouse with hidden mother-of-pearl button placket, exaggerated cuffs, and soft back pleats.',
    price: 16500,
    images: [
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Porcelain White', hex: '#fbfaf7' },
      { name: 'Midnight Onyx', hex: '#111114' }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 15,
    sku: 'AT-WN-SH01',
    rating: 4.89,
    reviews: 31,
    featured: false,
    newArrival: true,
    bestSeller: false,
    details: [
      '100% Silk Georgette from Como, Italy',
      'Mitered double French cuffs',
      'Curved hem for effortless tucking'
    ],
    materials: '100% Mulberry Silk Georgette.',
    fit: 'Relaxed fluid silhouette.',
    season: 'AW26'
  },

  // 6. TROUSERS
  {
    id: 'w-04',
    name: 'High-Waist Pleated Wide-Leg Wool Trousers',
    slug: 'high-waist-pleated-wide-trousers',
    gender: 'women',
    category: 'trousers',
    description: 'Elegantly proportioned trousers with high-rise waist, deep forward knife pleats, slanted pockets, and a wide fluid leg with 6cm turn-up cuff.',
    price: 18200,
    compareAtPrice: 22000,
    images: [
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Shadow Black', hex: '#141416' },
      { name: 'Sand Crepe', hex: '#b5a593' }
    ],
    sizes: ['34 (XS)', '36 (S)', '38 (M)', '40 (L)'],
    stock: 14,
    sku: 'AT-WN-TR04',
    rating: 4.94,
    reviews: 51,
    featured: true,
    newArrival: false,
    bestSeller: true,
    details: [
      'Contoured high-rise waistband for no-gap fit',
      'Deep architectural front pleats',
      'Heavy drape Italian crepe wool that resists creasing'
    ],
    materials: '96% Virgin Wool, 4% Lycra. Half-lined in silk touch.',
    fit: 'High-waisted, sweeping wide leg with floor-grazing length.',
    season: 'AW26'
  },

  // 7. DENIM
  {
    id: 'w-05',
    name: 'Curved Barrel Sculpted Raw Denim',
    slug: 'curved-barrel-sculpted-denim',
    gender: 'women',
    category: 'denim',
    description: 'Sculptural horseshoe silhouette cut from unwashed 13.5oz Kurabo Japanese denim. Distinctive outseam curve that creates an editorial profile.',
    price: 13900,
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Dark Indigo Rinse', hex: '#171d2b' },
      { name: 'Bleached Bone', hex: '#dedad2' }
    ],
    sizes: ['25', '26', '27', '28', '29', '30'],
    stock: 16,
    sku: 'AT-WN-DN05',
    rating: 4.87,
    reviews: 28,
    featured: false,
    newArrival: true,
    bestSeller: false,
    details: [
      'Ergonomic curved seam paneling',
      'Matte palladium shanks and rivets',
      'Cropped ankle length to showcase footwear'
    ],
    materials: '100% Cotton from Kurabo Mills, Japan.',
    fit: 'High rise, curved barrel silhouette through leg.',
    season: 'AW26'
  },

  // 8. LEATHER BAGS
  {
    id: 'w-06',
    name: 'Sculptural Box Calfskin Saddle Crossbody Bag',
    slug: 'box-calfskin-saddle-crossbody',
    gender: 'women',
    category: 'leather-bags',
    description: 'Flawlessly molded structured leather bag with magnetic geometric clasp in brushed palladium. Lined with velvety lambskin suede with internal mirror.',
    price: 28500,
    compareAtPrice: 34000,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Polished Noir', hex: '#0f0f11' },
      { name: 'Warm Terracotta', hex: '#633827' }
    ],
    sizes: ['One Size (24cm x 17cm x 8cm)'],
    stock: 9,
    sku: 'AT-WN-BG06',
    rating: 4.97,
    reviews: 41,
    featured: true,
    newArrival: true,
    bestSeller: true,
    details: [
      'Hand-burnished edges painted with five coats',
      'Solid brass custom buckle with brushed platinum finish',
      'Adjustable strap for shoulder or crossbody carry'
    ],
    materials: '100% French Box Calfskin. Suede interior.',
    fit: 'Accommodates iPhone Pro Max, wallet, and essentials.',
    season: 'AW26'
  },

  // 9. FOOTWEAR
  {
    id: 'w-07',
    name: 'Minimalist Square-Toe Leather Mule',
    slug: 'minimalist-square-toe-leather-mule',
    gender: 'women',
    category: 'footwear',
    description: 'Purist silhouette with wide padded glove-leather strap, refined architectural flared heel (65mm), and memory-foam cushioned footbed.',
    price: 19800,
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Onyx Nappa', hex: '#111113' },
      { name: 'Chalk Bone', hex: '#ede8dd' }
    ],
    sizes: ['36 (EU)', '37 (EU)', '38 (EU)', '39 (EU)', '40 (EU)'],
    stock: 12,
    sku: 'AT-WN-SH07',
    rating: 4.85,
    reviews: 33,
    featured: false,
    newArrival: false,
    bestSeller: true,
    details: [
      '65mm sculpted architectural heel',
      'Buttery soft lamb nappa upper that molds to foot',
      'Hand-buffed Italian leather sole with injected rubber grip'
    ],
    materials: 'Upper & Insole: 100% Lambskin Nappa. Sole: Leather & Rubber.',
    fit: 'True to European size. Half sizes should size up.',
    season: 'CORE'
  },

  // ==================== HAUTE PARFUMERIE & ROYAL ATTAR ====================
  {
    id: 'perfume-01',
    name: 'Royal Dehn Al Oud Kalakassi',
    slug: 'royal-dehn-al-oud-kalakassi',
    gender: 'men',
    category: 'perfumes',
    description: 'A sovereign distillation of 30-year aged wild Cambodian agarwood and celestial ambergris. Dark, resinous, honeyed wood with an opulent royal trail revered across royal courts.',
    price: 4500,
    compareAtPrice: 5500,
    images: [
      '/images/perfumes/royal_oud_flacon.jpg'
    ],
    colors: [
      { name: 'Crystal Gold Flacon', hex: '#d4af37' },
      { name: 'Obsidian Noir Edition', hex: '#111113' }
    ],
    sizes: ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'],
    stock: 18,
    sku: 'AT-PARF-01',
    rating: 5.0,
    reviews: 48,
    featured: true,
    newArrival: true,
    bestSeller: true,
    details: [
      'Hand-distilled 100% pure organic wild agarwood (Aquilaria crassna)',
      'Aged for three decades in French glass demijohns',
      'Non-alcoholic pure attar concentration; safe for sensitive skin',
      'Housed in heavy hand-cut facet crystal flacon with gold-plated rod wand'
    ],
    materials: 'Pure Aged Cambodian Dehn Al Oud, Golden Ambergris, Mysore Santalum Album',
    fit: 'Concentrated Elixir · Apply 1-2 droplets to pulse points',
    season: 'HAUTE PARFUMERIE',
    returnDays: 0,
    isPerfume: true,
    perfumeFamily: 'Royal Oud & Oriental',
    concentration: 'Pure Concentrated Attar & Extrait (100% Pure Oil)',
    longevity: '24+ Hours · Eternal',
    sillage: 'Majestic & Enveloping',
    volumeMl: ['6ml', '12ml', '50ml', '100ml'],
    volumeOptions: [
      { ml: '6ml', price: 4500, compareAtPrice: 5500, inStock: true },
      { ml: '12ml', price: 8500, compareAtPrice: 10500, inStock: true },
      { ml: '50ml', price: 18500, compareAtPrice: 22000, inStock: true },
      { ml: '100ml', price: 29000, compareAtPrice: 35000, inStock: true }
    ],
    perfumeNotes: {
      top: ['Wild Bergamot', 'Kashmiri Saffron', 'Pink Pepper'],
      heart: ['Smoky Cedar', 'Cambodian Frankincense', 'Nutmeg Blossom'],
      base: ['30-Year Aged Dehn Al Oud', 'Black Ambergris', 'Mysore Sandalwood']
    }
  },
  {
    id: 'perfume-02',
    name: 'Rose Taif & Damascena Imperial',
    slug: 'rose-taif-damascena-imperial',
    gender: 'women',
    category: 'perfumes',
    description: 'An ethereal crown jewel of Saudi Arabian Taif rose petals harvested before sunrise, blended with Turkish Damascena absolute and creamy Mysore sandalwood.',
    price: 3200,
    compareAtPrice: 4000,
    images: [
      '/images/perfumes/taif_rose_flacon.jpg'
    ],
    colors: [
      { name: 'Rose Gold Flacon', hex: '#b76e79' },
      { name: 'Pure Crystal', hex: '#fdfbf7' }
    ],
    sizes: ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'],
    stock: 24,
    sku: 'AT-PARF-02',
    rating: 4.96,
    reviews: 62,
    featured: true,
    newArrival: true,
    bestSeller: true,
    details: [
      'Single-estate 3,000 Taif roses required per tola flacon',
      'Cold hydro-distillation in copper alembics for crystalline floral purity',
      'Alcohol-free silky oil matrix that blooms with natural body temperature',
      'Finished with satin ribbon and embossed Atelier monogram wax seal'
    ],
    materials: 'Taif Rose Otto, Damascena Absolute, Bourbon Vanilla Pods, White Musk',
    fit: 'Velvet Floral Veil · Apply to wrist, collarbone, and neckline',
    season: 'HAUTE PARFUMERIE',
    returnDays: 0,
    isPerfume: true,
    perfumeFamily: 'Floral & Taif Rose',
    concentration: 'Extrait de Parfum (35% Fragrance Concentration)',
    longevity: '18+ Hours · Enduring',
    sillage: 'Intoxicating & Radiating',
    volumeMl: ['6ml', '12ml', '50ml', '100ml'],
    volumeOptions: [
      { ml: '6ml', price: 3200, compareAtPrice: 4000, inStock: true },
      { ml: '12ml', price: 5900, compareAtPrice: 7200, inStock: true },
      { ml: '50ml', price: 12500, compareAtPrice: 15000, inStock: true },
      { ml: '100ml', price: 19500, compareAtPrice: 24000, inStock: true }
    ],
    perfumeNotes: {
      top: ['Morning Taif Rosewater', 'Sparkling Mandora', 'Pink Pepper'],
      heart: ['Taif Rose Petals', 'Damascena Absolute', 'Royal Jasmine Sambac'],
      base: ['Cashmere Wood', 'White Golden Amber', 'Bourbon Vanilla']
    }
  },
  {
    id: 'perfume-03',
    name: 'Midnight Ambergris & Smoked Leather',
    slug: 'midnight-ambergris-smoked-leather',
    gender: 'men',
    category: 'perfumes',
    description: 'Nocturnal mystery in liquid form. Rich Tuscan leather steeped in aged golden marine ambergris, dark tonka bean, and spiced Indonesian patchouli leaves.',
    price: 3800,
    compareAtPrice: 4600,
    images: [
      '/images/perfumes/bleu_flacon.jpg'
    ],
    colors: [
      { name: 'Smoked Obsidian Flacon', hex: '#1c1b1a' },
      { name: 'Cognac Bronze', hex: '#8a4b2a' }
    ],
    sizes: ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'],
    stock: 15,
    sku: 'AT-PARF-03',
    rating: 4.93,
    reviews: 37,
    featured: true,
    newArrival: false,
    bestSeller: true,
    details: [
      'Authentic certified ethical marine ambergris from Oman coastlines',
      'Tuscan saddle leather accord crafted via botanical birch tar distillation',
      'Deep, velvety projection with magnetic evening presence',
      'Heavy magnetic zamak cap with brass engraving'
    ],
    materials: 'Marine Ambergris, Birch Tar Leather, Bourbon Tonka, Aged Patchouli',
    fit: 'Commanding Evening Scent · Spray or dab on chest and lapels',
    season: 'HAUTE PARFUMERIE',
    returnDays: 0,
    isPerfume: true,
    perfumeFamily: 'Smoked Amber & Leather',
    concentration: 'Extrait de Parfum (32% Fragrance Concentration)',
    longevity: '20+ Hours · Persistent',
    sillage: 'Commanding & Enveloping',
    volumeMl: ['6ml', '12ml', '50ml', '100ml'],
    volumeOptions: [
      { ml: '6ml', price: 3800, compareAtPrice: 4600, inStock: true },
      { ml: '12ml', price: 6800, compareAtPrice: 8200, inStock: true },
      { ml: '50ml', price: 15000, compareAtPrice: 18000, inStock: true },
      { ml: '100ml', price: 23500, compareAtPrice: 28000, inStock: true }
    ],
    perfumeNotes: {
      top: ['Green Cardamom', 'Bitter Orange Peel', 'Nutmeg'],
      heart: ['Tuscan Saddle Leather', 'Smoked Frankincense', 'Tobacco Blossom'],
      base: ['Natural Ambergris', 'Sumatran Patchouli', 'Smoked Labdanum']
    }
  },
  {
    id: 'perfume-04',
    name: 'Musk Al Ghazal & White Lotus',
    slug: 'musk-al-ghazal-white-lotus',
    gender: 'women',
    category: 'perfumes',
    description: 'The epitome of purity and serenity. A sublime blend of cruelty-free crystalline white musk, sacred morning lotus petals, powdery Florentine orris, and clean linen.',
    price: 2800,
    compareAtPrice: 3500,
    images: [
      '/images/perfumes/white_musk_flacon.jpg'
    ],
    colors: [
      { name: 'Opal White Crystal', hex: '#f4f4f4' },
      { name: 'Chalk Ivory', hex: '#ede8dd' }
    ],
    sizes: ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'],
    stock: 22,
    sku: 'AT-PARF-04',
    rating: 4.97,
    reviews: 51,
    featured: false,
    newArrival: true,
    bestSeller: false,
    details: [
      'Cruelty-free botanical and macrocyclic musk synthesis of peerless clarity',
      'Infused with rare Florentine Iris Pallida rhizome extract aged 3 years',
      'Clean, intimate second-skin aura that lasts all day without overwhelming',
      'Faceted frosted glass flacon with brushed platinum collar'
    ],
    materials: 'Botanical White Musk, Egyptian White Lotus, Florentine Orris, Ambrette',
    fit: 'Intimate Second-Skin · Ideal for daily prayers, meditation, and daily wear',
    season: 'HAUTE PARFUMERIE',
    returnDays: 0,
    isPerfume: true,
    perfumeFamily: 'Pure White Musk',
    concentration: 'Pure Attar Oil & Eau de Parfum (100% Non-Alcoholic)',
    longevity: '16+ Hours · Subtle & Lingering',
    sillage: 'Intimate & Sensual',
    volumeMl: ['6ml', '12ml', '50ml', '100ml'],
    volumeOptions: [
      { ml: '6ml', price: 2800, compareAtPrice: 3500, inStock: true },
      { ml: '12ml', price: 4900, compareAtPrice: 6000, inStock: true },
      { ml: '50ml', price: 9800, compareAtPrice: 12000, inStock: true },
      { ml: '100ml', price: 15500, compareAtPrice: 19000, inStock: true }
    ],
    perfumeNotes: {
      top: ['Egyptian White Lotus', 'Morning Aldehydes', 'Ambrette Seed'],
      heart: ['Florentine Orris', 'Lily of the Valley', 'White Peach Skin'],
      base: ['Royal White Musk', 'Soft Cashmere Silk', 'Dry Sandalwood']
    }
  },
  {
    id: 'perfume-05',
    name: 'Santal Imperial & Spiced Saffron',
    slug: 'santal-imperial-spiced-saffron',
    gender: 'men',
    category: 'perfumes',
    description: 'Ancient royal luxury distilled. Vintage creamy Mysore sandalwood blended with precious Kashmiri red gold saffron threads, cedarwood, and balsamic amber.',
    price: 3600,
    compareAtPrice: 4400,
    images: [
      '/images/perfumes/santal_flacon.jpg'
    ],
    colors: [
      { name: 'Amber Gold Flacon', hex: '#d99036' },
      { name: 'Sandalwood Brun', hex: '#634427' }
    ],
    sizes: ['6ml (Attar)', '12ml (1 Tola)', '50ml (Extrait)', '100ml (Grand Flacon)'],
    stock: 20,
    sku: 'AT-PARF-05',
    rating: 4.91,
    reviews: 29,
    featured: false,
    newArrival: true,
    bestSeller: false,
    details: [
      'Government-certified mature Mysore Sandalwood heartwood oil',
      'Pampore Grade-1 Kashmiri saffron threads macerated for 90 days',
      'Creamy, buttery wood depth with hypnotic spicy sweetness',
      'Heavy octagonal crystal flacon in silk-lined presentation coffret'
    ],
    materials: 'Mysore Sandalwood Heartwood, Kashmiri Saffron, Gurjum Balsam, Amber',
    fit: 'Warm Regal Presence · Apply to neck, palms, and beard',
    season: 'HAUTE PARFUMERIE',
    returnDays: 0,
    isPerfume: true,
    perfumeFamily: 'Woody & Smoky',
    concentration: 'Extrait de Parfum (30% Fragrance Concentration)',
    longevity: '18+ Hours · Enduring',
    sillage: 'Warm & Aristocratic',
    volumeMl: ['6ml', '12ml', '50ml', '100ml'],
    volumeOptions: [
      { ml: '6ml', price: 3600, compareAtPrice: 4400, inStock: true },
      { ml: '12ml', price: 6500, compareAtPrice: 7800, inStock: true },
      { ml: '50ml', price: 14000, compareAtPrice: 17000, inStock: true },
      { ml: '100ml', price: 21500, compareAtPrice: 26000, inStock: true }
    ],
    perfumeNotes: {
      top: ['Kashmiri Saffron Threads', 'Nutmeg', 'Cardamom Pods'],
      heart: ['Atlas Cedarwood', 'Gurjum Balsam', 'Cinnamon Bark'],
      base: ['Aged Mysore Sandalwood', 'Tonka Bean', 'Golden Amber Resins']
    }
  }
];

export const HAUTE_PERFUMES_PRESETS: Product[] = PRODUCTS.filter(p => p.isPerfume || p.category === 'perfumes');

