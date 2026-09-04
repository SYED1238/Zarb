export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  gender: 'men' | 'women';
  eyebrow: string;
  description: string;
  image: string;
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
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=1000&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
    metaDescription: "Zarb luxury men's leather accessories, bags, and travel goods.",
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
