export interface GarmentHotspot {
  id: string;
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  title: string;
  detail: string;
  provenance: string;
  metric?: string;
}

export interface RunwayLook {
  id: string;
  lookNumber: string;
  title: string;
  gender: 'men' | 'women';
  category: string;
  image: string;
  silhouetteStory: string;
  productId?: string;
  productSlug?: string;
  hotspots: GarmentHotspot[];
  materialsSummary: string;
  runwayLocation: string;
}

export const RUNWAY_LOOKS: RunwayLook[] = [
  {
    id: 'runway-01',
    lookNumber: 'LOOK 01 / AW26',
    title: 'The Chesterfield Double-Faced Cashmere Overcoat',
    gender: 'men',
    category: 'jackets',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=85&w=1600&auto=format&fit=crop',
    silhouetteStory: 'Architectural shoulder line draped directly on live models in Milan, structured with a floating horsehair canvas that molds to the wearer over time.',
    productId: 'm-01',
    productSlug: 'chesterfield-cashmere-overcoat',
    materialsSummary: 'Super 150s Virgin Wool & Grade-A Mongolian Cashmere',
    runwayLocation: 'Palazzo del Senato, Milan',
    hotspots: [
      {
        id: 'hs-01-1',
        x: 48,
        y: 28,
        title: 'Floating Chest Canvas',
        detail: 'Hand-sewn natural horsehair canvas that breathes and shapes organically.',
        provenance: 'Biella Mills, Italy',
        metric: '180 Hours Tailoring'
      },
      {
        id: 'hs-01-2',
        x: 32,
        y: 42,
        title: 'Roped Pagoda Shoulder',
        detail: 'Subtly elevated crown with bespoke wadding for architectural presence.',
        provenance: 'Milanese Atelier',
        metric: 'Hand-Padded Crown'
      },
      {
        id: 'hs-01-3',
        x: 62,
        y: 65,
        title: 'Double-Faced Cashmere Weave',
        detail: 'Split-edge seam technique stitched invisibly with silk filament thread.',
        provenance: 'Inner Mongolia Steppes',
        metric: 'Grade-A 14.5 Micron'
      }
    ]
  },
  {
    id: 'runway-02',
    lookNumber: 'LOOK 02 / AW26',
    title: 'Fluid 45° Bias-Cut Mulberry Silk Silhouette',
    gender: 'women',
    category: 'kurtis',
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=85&w=1600&auto=format&fit=crop',
    silhouetteStory: 'Pure organic fluidity engineered on a true 45-degree geometric bias, cascading into a liquid sculpture that moves with kinetic grace.',
    productId: 'w-ku-01',
    productSlug: 'hand-woven-chanderi-mulberry-silk-kurti',
    materialsSummary: '24-Momme Pure Charmeuse Silk Crepe',
    runwayLocation: 'Grand Palais Éphémère, Paris',
    hotspots: [
      {
        id: 'hs-02-1',
        x: 52,
        y: 24,
        title: 'Mandarin Jewel Neckline',
        detail: 'Seamless architectural collar with hidden mother-of-pearl hook closure.',
        provenance: 'Como, Northern Italy',
        metric: 'Concealed French Seams'
      },
      {
        id: 'hs-02-2',
        x: 42,
        y: 54,
        title: 'True Bias Draping',
        detail: 'Cut at a 45° angle across the warp and weft for maximum liquid elongation.',
        provenance: 'Lyon Heritage Loom',
        metric: '24-Momme Density'
      },
      {
        id: 'hs-02-3',
        x: 65,
        y: 82,
        title: 'Weighted Hemline Cord',
        detail: 'Micro lead-free weighted cord enclosed in silk to ensure perpetual drape balance.',
        provenance: 'Chanderi Atelier',
        metric: 'Zero-Static Finishing'
      }
    ]
  },
  {
    id: 'runway-03',
    lookNumber: 'LOOK 03 / AW26',
    title: 'Sartorial Double-Breasted Midnight Wool Suit',
    gender: 'men',
    category: 'jackets',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=85&w=1600&auto=format&fit=crop',
    silhouetteStory: 'Low-gorge peak lapels paired with suppressed waist suppression, cut from high-twist tropical wool that resists creasing throughout transcontinental transit.',
    productId: 'm-02',
    productSlug: 'structured-architectural-blazer',
    materialsSummary: 'Super 130s High-Twist Gabardine Wool',
    runwayLocation: 'Pinacoteca di Brera, Milan',
    hotspots: [
      {
        id: 'hs-03-1',
        x: 46,
        y: 30,
        title: 'Wide Milanese Lapel Buttonhole',
        detail: 'Hand-worked buttonhole using pure gimp thread, taking 45 minutes per hole.',
        provenance: 'Piedmont, Italy',
        metric: 'Pure Silk Gimp Thread'
      },
      {
        id: 'hs-03-2',
        x: 58,
        y: 48,
        title: 'Horn Button Anchoring',
        detail: 'Carved natural buffalo horn buttons with hand-wrapped thread stems.',
        provenance: 'Florence, Italy',
        metric: 'Crown Cross-Stitch'
      },
      {
        id: 'hs-03-3',
        x: 35,
        y: 72,
        title: 'Suppressed Hourglass Waist',
        detail: 'Iron-pressed chest fullness achieving sculptural posture without tightness.',
        provenance: 'Biella Wool Guild',
        metric: 'Steam-Molded Wool'
      }
    ]
  },
  {
    id: 'runway-04',
    lookNumber: 'LOOK 04 / AW26',
    title: 'Asymmetrical High-Slit Sculptural Tunic',
    gender: 'women',
    category: 'kurtis',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=85&w=1600&auto=format&fit=crop',
    silhouetteStory: 'A dramatic high-fashion statement fusing contemporary avant-garde lines with centuries-old royal Indian angrakha tailoring.',
    productId: 'w-ku-04',
    productSlug: 'asymmetrical-high-slit-raw-silk-kurti',
    materialsSummary: 'Heavy Wild Tussar Silk with Raw Slub Texture',
    runwayLocation: 'Cour Carrée du Louvre, Paris',
    hotspots: [
      {
        id: 'hs-04-1',
        x: 50,
        y: 20,
        title: 'Geometric Slit Aperture',
        detail: 'Clean, reinforced slit tailored to allow dramatic freedom of movement.',
        provenance: 'Central India Silks',
        metric: 'Reinforced Grosgrain Stay'
      },
      {
        id: 'hs-04-2',
        x: 40,
        y: 45,
        title: 'Tussar Wild Silk Slub',
        detail: 'Unbleached, naturally golden wild silk with rich tactile texture.',
        provenance: 'Jharkhand Forest Guild',
        metric: 'Organic Forest Sericulture'
      },
      {
        id: 'hs-04-3',
        x: 64,
        y: 68,
        title: 'Habotai Silk Underlay',
        detail: 'Featherlight 8-momme silk lining providing cloud-like contact against skin.',
        provenance: 'Como, Italy',
        metric: '100% Breathable Mulmul'
      }
    ]
  },
  {
    id: 'runway-05',
    lookNumber: 'LOOK 05 / AW26',
    title: 'Monolithic Heavyweight Milano Rib Cocoon',
    gender: 'men',
    category: 'knitwear',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=85&w=1600&auto=format&fit=crop',
    silhouetteStory: 'Dense 7-gauge knitwear spun from three-ply cashmere yarn. Designed as an outer garment capable of resisting winter drafts without bulk.',
    productId: 'm-03',
    productSlug: 'milano-rib-heavyweight-sweater',
    materialsSummary: '7-Gauge 3-Ply Mongolian Cashmere',
    runwayLocation: 'Teatro alla Scala, Milan',
    hotspots: [
      {
        id: 'hs-05-1',
        x: 48,
        y: 25,
        title: 'Seamless Ribbed Collar',
        detail: 'Knitted as one continuous tubular rib that never stretches out of shape.',
        provenance: 'Umbria, Italy',
        metric: 'Zero-Waste Seamless'
      },
      {
        id: 'hs-05-2',
        x: 32,
        y: 48,
        title: 'Full-Fashioned Armhole',
        detail: 'Decreased and increased stitch counts eliminate stiff cut-and-sew arm seams.',
        provenance: 'Inner Mongolia',
        metric: 'Fully Fashioned Gauge'
      },
      {
        id: 'hs-05-3',
        x: 60,
        y: 75,
        title: 'Dense Milano Stitch Hem',
        detail: 'Double-jersey construction prevents rolling and anchors garment silhouette.',
        provenance: 'Piedmont Mills',
        metric: '7-Gauge Milano Rib'
      }
    ]
  }
];
