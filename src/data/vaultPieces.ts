export interface VaultPiece {
  id: string;
  serialCode: string;
  editionTotal: number;
  editionRemaining: number;
  availableSerials: string[];
  title: string;
  subtitle: string;
  category: 'outerwear' | 'evening' | 'suiting';
  gender: 'men' | 'women' | 'unisex';
  price: number;
  image: string;
  materials: string;
  originAtelier: string;
  artisanName: string;
  hoursCrafted: number;
  certificateNotes: string;
  linkedProductId: string;
  goldAccentText: string;
}

export const VAULT_PIECES: VaultPiece[] = [
  {
    id: 'vault-01',
    serialCode: 'VAULT-01 / 15',
    editionTotal: 15,
    editionRemaining: 3,
    availableSerials: ['#04 / 15', '#09 / 15', '#12 / 15'],
    title: 'The Obsidian Vicuña & Cashmere Cape-Coat',
    subtitle: 'Woven from wild Andean Vicuña fleece & 14.5-micron Mongolian cashmere',
    category: 'outerwear',
    gender: 'unisex',
    price: 6800,
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=85&w=1600&auto=format&fit=crop',
    materials: '80% Grade-A Mongolian Cashmere, 20% Certified Peruvian Vicuña',
    originAtelier: 'Atelier Zarb, Milan (Via Montenapoleone)',
    artisanName: 'Maestro Tailor Roberto V.',
    hoursCrafted: 140,
    certificateNotes: 'Individually numbered gold ingot bullion bar hand-sewn into the inner chest pocket. Certified harvest provenance by Andean fiber registry.',
    linkedProductId: 'm-01',
    goldAccentText: '24K Gold Ingot Inset',
  },
  {
    id: 'vault-02',
    serialCode: 'VAULT-02 / 18',
    editionTotal: 18,
    editionRemaining: 4,
    availableSerials: ['#03 / 18', '#07 / 18', '#14 / 18', '#16 / 18'],
    title: 'Sculptural Liquid Silk Column Gown',
    subtitle: '30-Momme Como Charmeuse silk draped on continuous bias grain',
    category: 'evening',
    gender: 'women',
    price: 4950,
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=85&w=1600&auto=format&fit=crop',
    materials: '100% Organic Como Mulberry Silk (30-Momme Weight)',
    originAtelier: 'Atelier Haute Couture, Paris (Place Vendôme)',
    artisanName: 'Première d’Atelier Hélène M.',
    hoursCrafted: 95,
    certificateNotes: 'Constructed without exterior seams. Internal floating silk-grosgrain waist stay with serialized palladium clasp.',
    linkedProductId: 'w-ku-01',
    goldAccentText: 'Palladium Clasp Certified',
  },
  {
    id: 'vault-03',
    serialCode: 'VAULT-03 / 20',
    editionTotal: 20,
    editionRemaining: 2,
    availableSerials: ['#06 / 20', '#18 / 20'],
    title: 'Double-Breasted Midnight Gabardine Tuxedo',
    subtitle: 'Super 160s worsted wool with hand-quilted silk faille peak lapels',
    category: 'suiting',
    gender: 'men',
    price: 5400,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=85&w=1600&auto=format&fit=crop',
    materials: 'Super 160s Biella Gabardine Wool & French Grosgrain Silk',
    originAtelier: 'Sartoria Zarb, Rome (Via Condotti)',
    artisanName: 'Master Cutter Luca Moretti',
    hoursCrafted: 120,
    certificateNotes: 'Floating horsehair canvas with full chest padding. Real buffalo horn buttons engraved with archival Roman crest.',
    linkedProductId: 'm-02',
    goldAccentText: 'Full Floating Canvas',
  },
  {
    id: 'vault-04',
    serialCode: 'VAULT-04 / 25',
    editionTotal: 25,
    editionRemaining: 5,
    availableSerials: ['#02 / 25', '#11 / 25', '#15 / 25', '#21 / 25', '#24 / 25'],
    title: 'Architectural Cashmere Cocoon Overcoat',
    subtitle: 'Double-faced cashmere with hand-split hidden seam tailoring',
    category: 'outerwear',
    gender: 'women',
    price: 5800,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=85&w=1600&auto=format&fit=crop',
    materials: '100% Double-Faced Baby Cashmere (380g/m²)',
    originAtelier: 'Atelier Zarb, Biella (Piedmont Alps)',
    artisanName: 'Artisan Modiste Francesca B.',
    hoursCrafted: 110,
    certificateNotes: 'Edge seams hand-split by razor and turned inward with invisible blind-stitching using pure silk monofilament.',
    linkedProductId: 'w-ku-04',
    goldAccentText: 'Hand-Split Edge Seams',
  },
];
