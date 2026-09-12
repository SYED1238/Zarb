export interface GarmentLayer {
  id: string;
  layerNumber: string;
  name: string;
  shortRole: string;
  material: string;
  provenance: string;
  tailoringMethod: string;
  labMetric: { label: string; value: string };
  whyItMatters: string;
  macroImage: string;
  positionDescription: string;
  tag: string;
}

export const GARMENT_LAYERS: GarmentLayer[] = [
  {
    id: 'layer-01',
    layerNumber: '01',
    name: 'The Outer Shell',
    shortRole: 'Double-Faced Super 150s Virgin Wool & Grade-A Cashmere',
    material: '90% Super 150s Merino Wool (15.2μm), 10% Inner Mongolian Cashmere (14.5μm)',
    provenance: 'Lanificio Biellese, Piedmont Alps, Italy',
    tailoringMethod: 'Woven on slow vintage rapier looms, finished exclusively in glacial snowmelt runoff to protect natural lanolin.',
    labMetric: { label: 'Fiber Fineness', value: '14.5 Micron' },
    whyItMatters: 'Naturally sheds light rain without chemical fluorocarbon coatings. Drapes like a heavy liquid column while remaining exceptionally light upon the shoulders.',
    macroImage: '/images/layers/layer-01-wool-cashmere.jpg',
    positionDescription: 'Exterior silhouette draping from shoulder to calf',
    tag: 'SURFACE LAYER',
  },
  {
    id: 'layer-02',
    layerNumber: '02',
    name: 'The Floating Horsehair Canvas',
    shortRole: 'The Living Internal Skeleton (Zero Fused Adhesives)',
    material: 'Natural Siberian Mane Horsehair blended with soft Camel Hair',
    provenance: 'Atelier Sartoria Zarb, Milanese Guild, Italy',
    tailoringMethod: 'Suspended freely between the shell and the lining with loose silk baste stitches. Never fused or heat-glued.',
    labMetric: { label: 'Synthetic Glue', value: '0.0% (Pure Baste)' },
    whyItMatters: 'Unlike cheap glued suits that bubble and stiffen after dry cleaning, floating canvas breathes and gradually molds to the wearer’s unique body contour through natural body heat.',
    macroImage: '/images/layers/layer-02-horsehair-canvas.jpg',
    positionDescription: 'Full internal chest and body core',
    tag: 'STRUCTURAL CORE',
  },
  {
    id: 'layer-03',
    layerNumber: '03',
    name: 'The Hand-Padded Lapel & Chest Piece',
    shortRole: '180 Micro Blind-Stitches for Lifelong Three-Dimensional Roll',
    material: 'Crimped Wool Melton Felt with Irish Flax Linen Stay-Tape',
    provenance: 'Atelier Haute Couture, Paris, France',
    tailoringMethod: 'Curved by hand over the tailor’s palm using 180 graduated chevron stitches per lapel.',
    labMetric: { label: 'Hand Stitches', value: '180 Per Lapel' },
    whyItMatters: 'Produces a graceful, soft S-curve lapel roll that springs back when touched and will never crease flat over decades of wear.',
    macroImage: '/images/layers/layer-03-padded-lapel.jpg',
    positionDescription: 'Upper chest, gorge, and lapel curvature',
    tag: 'SCULPTURAL MEMORY',
  },
  {
    id: 'layer-04',
    layerNumber: '04',
    name: 'The Breathable Cupro Lining',
    shortRole: 'Pure Cotton Linter Bemberg (Thermal Micro-Climate Regulation)',
    material: '100% Regenerated Cellulose Cotton Linter (Bemberg Cupro)',
    provenance: 'Como Silk District, Lombardy, Italy',
    tailoringMethod: 'Cut generously with a center-back accordion pleat to permit complete range of arm movement without pulling.',
    labMetric: { label: 'Static Resistance', value: '100% Anti-Static' },
    whyItMatters: 'Unlike synthetic polyester linings that trap sweat and cause odor, Cupro wicks humidity rapidly, feels cool in summer, and glides effortlessly over knitwear.',
    macroImage: '/images/layers/layer-04-cupro-lining.jpg',
    positionDescription: 'Interior body and sleeve lining',
    tag: 'THERMAL INTERIOR',
  },
  {
    id: 'layer-05',
    layerNumber: '05',
    name: 'The Hardware & Hand-Sewn Gimp',
    shortRole: 'Hand-Turned Water Buffalo Horn with Silk Thread Stems',
    material: 'Natural Horn from ethically raised domestic water buffalo, hand-carved',
    provenance: 'Val Badia Horn Carvers, Dolomites, Italy',
    tailoringMethod: 'Cross-stitched with heavy silk thread and elevated on a 4mm hand-wrapped thread shank so fabric buttons flat without puckering.',
    labMetric: { label: 'Button Shank', value: '4mm Silk Wrap' },
    whyItMatters: 'Natural horn buttons never chip or melt during steam pressing. Each button possesses a unique organic grain pattern akin to a fingerprint.',
    macroImage: '/images/layers/layer-05-horn-buttons.jpg',
    positionDescription: 'Front closure and functional cuff buttonholes',
    tag: 'HAND FINISHING',
  },
];

export interface ComparisonPoint {
  feature: string;
  hauteCouture: string;
  fastFashion: string;
  explanation: string;
}

export const COMPARISON_POINTS: ComparisonPoint[] = [
  {
    feature: 'Internal Structure',
    hauteCouture: 'Full Floating Natural Horsehair Canvas',
    fastFashion: 'Synthetic Glue & Polyester Chemical Interfacing',
    explanation: 'Zarb garments use natural animal canvas that breathes and shapes to your body. Fast fashion glues sheets of synthetic plastic that delaminate and bubble permanently after 3 dry cleans.',
  },
  {
    feature: 'Structural Lifespan',
    hauteCouture: '30+ Years (Designed for Multi-Generational Wear)',
    fastFashion: '6 to 12 Months (Planned Obsolescence)',
    explanation: 'With generous internal seam allowances (up to 4cm) and un-glued fibers, our pieces can be altered, taken in, let out, or re-lined indefinitely.',
  },
  {
    feature: 'Thermal Comfort',
    hauteCouture: 'Self-Regulating Cupro & Glacial Lanolin',
    fastFashion: '100% Non-Porous Virgin Polyester Lining',
    explanation: 'Fast-fashion polyester acts like a sauna wrapper, trapping moisture and generating static. Pure Cupro and natural wool regulate personal micro-climate effortlessly.',
  },
  {
    feature: 'Tailoring Dedication',
    hauteCouture: '120 to 180 Dedicated Atelier Hours per Piece',
    fastFashion: '14 to 22 Minutes Assembly-Line Stitched',
    explanation: 'Each Zarb silhouette is draped on living forms, basted, steamed, and sculpted by master craftspeople with decades of guild heritage.',
  },
  {
    feature: 'Ecological Integrity',
    hauteCouture: '100% Biodegradable Renewable Fibers',
    fastFashion: 'Microplastic Synthetic Blends (Petroleum)',
    explanation: 'When a Zarb garment reaches the end of its decades-long lifecycle, its natural animal fibers return cleanly to the earth with zero synthetic petroleum residue.',
  },
];
