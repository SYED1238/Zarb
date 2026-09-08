export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  gender: 'men' | 'women';
  eyebrow: string;
  description: string;
  image: string;
  images?: string[]; // Multiple photos configured from admin page
  metaDescription: string;
}

export const WOMEN_CATEGORIES: CategoryItem[] = [
  {
    id: 'kurtis',
    slug: 'kurtis',
    name: 'Kurtis & Tunics',
    shortName: 'Kurtis',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · KURTIS",
    description: 'Contemporary silhouettes crafted for effortless everyday elegance. Pure Mulberry silks, hand-spun Chanderi, and architectural draping.',
    image: '/images/categories/women/kurtis.png',
    images: ['/images/categories/women/kurtis.png'],
    metaDescription: "Explore contemporary women's luxury kurtis and tunics from Zarb.",
  },
  {
    id: 'dresses-gowns',
    slug: 'dresses-gowns',
    name: 'Dresses & Evening Gowns',
    shortName: 'Dresses & Gowns',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · DRESSES & GOWNS",
    description: 'Liquid bias-cut charmeuse, sculptural floor-skimming pool hems, and architectural evening gowns.',
    image: '/images/categories/women/dresses-gowns.png',
    images: ['/images/categories/women/dresses-gowns.png'],
    metaDescription: "Discover luxury women's evening dresses and gowns from Zarb.",
  },
  {
    id: 'blazers-outerwear',
    slug: 'blazers-outerwear',
    name: 'Blazers & Outerwear',
    shortName: 'Blazers & Outerwear',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · BLAZERS & OUTERWEAR",
    description: 'Structured hour-glass tailoring, Italian wool gabardine, and cocoon cashmere trench silhouettes.',
    image: '/images/categories/women/blazers-outerwear.png',
    images: ['/images/categories/women/blazers-outerwear.png'],
    metaDescription: "Shop women's luxury tailored blazers and overcoats from Zarb.",
  },
  {
    id: 'tops-knitwear',
    slug: 'tops-knitwear',
    name: 'Tops & Knitwear',
    shortName: 'Tops & Knits',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · TOPS & KNITWEAR",
    description: 'Fine ribbed Mongolian cashmere, second-skin Mulberry silk knits, and minimal modern layers.',
    image: '/images/categories/women/tops-knitwear.png',
    images: ['/images/categories/women/tops-knitwear.png'],
    metaDescription: "Explore luxury cashmere tops and knitwear for women by Zarb.",
  },
  {
    id: 'shirts-blouses',
    slug: 'shirts-blouses',
    name: 'Shirts & Blouses',
    shortName: 'Shirts & Blouses',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · SHIRTS & BLOUSES",
    description: 'Sculptural band collars, Italian double-twist cotton poplin, and relaxed tailoring.',
    image: '/images/categories/women/shirts-blouses.png',
    images: ['/images/categories/women/shirts-blouses.png'],
    metaDescription: "Discover atelier-crafted silk blouses and minimalist shirts for women.",
  },
  {
    id: 'trousers',
    slug: 'trousers',
    name: 'Tailored Trousers',
    shortName: 'Trousers',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · TROUSERS",
    description: 'High-rise architectural trousers, deep forward knife pleats, and sweeping fluid drape.',
    image: '/images/categories/women/trousers.png',
    images: ['/images/categories/women/trousers.png'],
    metaDescription: "Luxury women's high-waisted tailored trousers from Zarb.",
  },
  {
    id: 'denim',
    slug: 'denim',
    name: 'Sculpted Denim',
    shortName: 'Denim',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · DENIM",
    description: 'Unwashed Japanese Kurabo denim crafted in distinct curved barrel and relaxed straight fits.',
    image: '/images/categories/women/denim.png',
    images: ['/images/categories/women/denim.png'],
    metaDescription: "Explore Japanese selvedge and sculpted women's denim from Zarb.",
  },
  {
    id: 'leather-bags',
    slug: 'leather-bags',
    name: 'Leather Bags & Clutches',
    shortName: 'Leather Bags',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · LEATHER BAGS",
    description: 'Full-grain French box calfskin saddle bags, hand-burnished edges, and solid palladium hardware.',
    image: '/images/categories/women/leather-bags.png',
    images: ['/images/categories/women/leather-bags.png'],
    metaDescription: "Luxury handcrafted leather bags and accessories from Zarb.",
  },
  {
    id: 'footwear',
    slug: 'footwear',
    name: 'Footwear & Mules',
    shortName: 'Footwear',
    gender: 'women',
    eyebrow: "WOMEN'S WARDROBE · FOOTWEAR",
    description: 'Purist square-toe mules, glove-soft lambskin nappa, and architectural sculpted flared heels.',
    image: '/images/categories/women/footwear.png',
    images: ['/images/categories/women/footwear.png'],
    metaDescription: "Shop women's luxury leather footwear, boots, and mules from Zarb.",
  },
];

export const MEN_CATEGORIES: CategoryItem[] = [
  {
    id: 't-shirts',
    slug: 't-shirts',
    name: 'T-Shirts & Knitwear',
    shortName: 'T-Shirts',
    gender: 'men',
    eyebrow: "MEN'S WARDROBE · T-SHIRTS & KNITS",
    description: 'Heavyweight double-mercerized Peruvian Pima jersey tees and ultra-fine cashmere knitwear.',
    image: '/images/categories/men/t-shirts.png',
    images: ['/images/categories/men/t-shirts.png'],
    metaDescription: "Discover luxury Peruvian Pima t-shirts and knitwear for men from Zarb.",
  },
  {
    id: 'shirts',
    slug: 'shirts',
    name: 'Shirts & Overshirts',
    shortName: 'Shirts',
    gender: 'men',
    eyebrow: "MEN'S WARDROBE · SHIRTS",
    description: 'Mandarin stand collar shirts, double-twist Egyptian cotton poplin, and tailored overshirts.',
    image: '/images/categories/men/shirts.png',
    images: ['/images/categories/men/shirts.png'],
    metaDescription: "Shop men's tailored dress shirts and minimalist overshirts from Zarb.",
  },
  {
    id: 'trousers',
    slug: 'trousers',
    name: 'Tailored Trousers',
    shortName: 'Trousers',
    gender: 'men',
    eyebrow: "MEN'S WARDROBE · TROUSERS",
    description: 'Forward double pleats, high-rise tab waistbands, brass side adjusters, and sweeping drape.',
    image: '/images/categories/men/trousers.png',
    images: ['/images/categories/men/trousers.png'],
    metaDescription: "Luxury men's double-pleated wool trousers crafted for modern distinction.",
  },
  {
    id: 'jeans',
    slug: 'jeans',
    name: 'Selvedge Denim',
    shortName: 'Jeans',
    gender: 'men',
    eyebrow: "MEN'S WARDROBE · JEANS",
    description: 'Shuttle-loom 14.5oz untreated raw denim from Kuroki Mills, Okayama, Japan with custom hardware.',
    image: '/images/categories/men/jeans.png',
    images: ['/images/categories/men/jeans.png'],
    metaDescription: "Authentic Japanese selvedge denim for men by Zarb.",
  },
  {
    id: 'jackets',
    slug: 'jackets',
    name: 'Jackets & Coats',
    shortName: 'Jackets',
    gender: 'men',
    eyebrow: "MEN'S WARDROBE · JACKETS & COATS",
    description: 'Double-faced cashmere Chesterfield overcoats, roped-shoulder blazers, and sharp outerwear.',
    image: '/images/categories/men/jackets.png',
    images: ['/images/categories/men/jackets.png'],
    metaDescription: "Explore men's luxury tailoring, cashmere overcoats, and architectural jackets.",
  },
  {
    id: 'sneakers',
    slug: 'sneakers',
    name: 'Footwear & Boots',
    shortName: 'Sneakers',
    gender: 'men',
    eyebrow: "MEN'S WARDROBE · SNEAKERS & BOOTS",
    description: 'Goodyear-welted French box calfskin Chelsea boots and minimalist leather luxury sneakers.',
    image: '/images/categories/men/sneakers.png',
    images: ['/images/categories/men/sneakers.png'],
    metaDescription: "Handcrafted European leather boots and sneakers for men from Zarb.",
  },
  {
    id: 'accessories',
    slug: 'accessories',
    name: 'Leather Bags & Accessories',
    shortName: 'Accessories',
    gender: 'men',
    eyebrow: "MEN'S WARDROBE · ACCESSORIES",
    description: 'Full-grain Italian Saffiano duffles, minimalist cardholders, and luxury leather goods.',
    image: '/images/categories/men/accessories.png',
    images: ['/images/categories/men/accessories.png'],
    metaDescription: "Luxury Italian leather accessories and goods for men from Zarb.",
  },
];

export const ALL_CATEGORIES = [...WOMEN_CATEGORIES, ...MEN_CATEGORIES];

export function getCategoryBySlug(gender: 'men' | 'women', slug: string): CategoryItem | undefined {
  const list = gender === 'women' ? WOMEN_CATEGORIES : MEN_CATEGORIES;
  return list.find((c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase());
}

export function getCategoriesByGender(gender: 'men' | 'women'): CategoryItem[] {
  return gender === 'women' ? WOMEN_CATEGORIES : MEN_CATEGORIES;
}
