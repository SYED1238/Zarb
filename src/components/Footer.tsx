import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Sparkles, Globe, Shield, Lock } from 'lucide-react';
import { HolographicBeams } from './ui/BeamsBackground';

export const Footer: React.FC = () => {
  const { resetEntryScreen } = useStore();

  return (
    <footer className="relative bg-[#070709] border-t border-white/10 text-stone-400 font-sans text-xs overflow-hidden">
      {/* Holographic Light Beams Rising from Downside (exact preset from user image) */}
      <HolographicBeams
        className="absolute inset-0 z-0"
        density={45}
        speed={3.9}
        aberration={10.0}
        opacity={50}
      />

      {/* Top Border Specular Refraction Seam */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-10" />

      {/* Desktop Upper Footer: Boutiques & Divisions (Full Directory) */}
      <div className="hidden md:block relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-brand text-xl text-white tracking-[0.25em]">
                ZARB
              </span>
            </div>
            <p className="text-xs text-stone-400 font-light leading-relaxed max-w-sm">
              Maison de haute prêt-à-porter dedicated to architectural minimalism, noble textiles, and timeless silhouettes for both men and women.
            </p>
            <div className="pt-2">
              <button
                onClick={resetEntryScreen}
                className="inline-flex items-center space-x-2 text-[11px] tracking-[0.2em] uppercase text-stone-300 hover:text-white border border-white/15 px-3.5 py-2 rounded-full transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-launch Cinematic Intro</span>
              </button>
            </div>
          </div>

          {/* Col 2: Global Boutiques */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Global Salons
            </h4>
            <ul className="space-y-2 text-stone-400 text-xs">
              <li>14 Rue Saint-Honoré, Paris</li>
              <li>Via Montenapoleone 8, Milan</li>
              <li>724 Madison Avenue, New York</li>
              <li>Ginza Six, Tokyo</li>
              <li>The Pavilion, BKC, Mumbai</li>
            </ul>
          </div>

          {/* Col 3: Client Concierge */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Client Concierge
            </h4>
            <ul className="space-y-2 text-stone-400 text-xs">
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Private Fitting Appointments</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Complimentary Alterations</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Track Haute Consignment</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">White-Glove Courier Logistics</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Care & Preservation</a></li>
            </ul>
          </div>

          {/* Col 4: Maison & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
              The Maison
            </h4>
            <ul className="space-y-2 text-stone-400 text-xs">
              <li><a href="#brand-story" className="hover:text-white transition-colors">Atelier Provenance</a></li>
              <li><a href="#brand-story" className="hover:text-white transition-colors">Sustainable Sourcing Standard</a></li>
              <li><a href="#editorial-section" className="hover:text-white transition-colors">Autumn/Winter 2026 Runway</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Haute Couture</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile Ultra-Compact Footer: Short & Less */}
      <div className="md:hidden relative z-10 px-5 pt-8 pb-4 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <span className="font-brand text-lg text-white tracking-[0.25em] drop-shadow-md">
            ZARB
          </span>
          <button
            onClick={resetEntryScreen}
            className="inline-flex items-center space-x-1.5 text-[10px] tracking-[0.18em] uppercase text-stone-200 hover:text-white border border-white/20 px-3 py-1 rounded-full transition-colors cursor-pointer bg-black/30 backdrop-blur-xs"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Intro</span>
          </button>
        </div>

        <p className="text-[11px] text-stone-300 font-light leading-snug drop-shadow-sm">
          Haute prêt-à-porter &middot; Architectural minimalism.
        </p>

        {/* 2-Column Concise Links */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/15 text-[11px]">
          {/* Column 1: Salons & Concierge */}
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white mb-1 drop-shadow-sm">
                Salons
              </h4>
              <p className="text-stone-300 text-[10px] leading-relaxed drop-shadow-sm">
                Paris &middot; Milan &middot; NY &middot; Tokyo &middot; Mumbai
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white mb-1 drop-shadow-sm">
                Concierge
              </h4>
              <ul className="space-y-1 text-stone-300 text-[10px] drop-shadow-sm">
                <li><a href="#catalog-section" className="hover:text-white transition-colors">Private Fittings</a></li>
                <li><a href="#catalog-section" className="hover:text-white transition-colors">Alterations</a></li>
                <li><a href="#catalog-section" className="hover:text-white transition-colors">White-Glove Courier</a></li>
              </ul>
            </div>
          </div>

          {/* Column 2: Maison & Policy */}
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white mb-1 drop-shadow-sm">
                Maison
              </h4>
              <ul className="space-y-1 text-stone-300 text-[10px] drop-shadow-sm">
                <li><a href="#brand-story" className="hover:text-white transition-colors">Atelier Provenance</a></li>
                <li><a href="#editorial-section" className="hover:text-white transition-colors">AW26 Runway</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy & Terms</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white mb-1 drop-shadow-sm">
                Security
              </h4>
              <div className="flex items-center space-x-1 text-stone-300 text-[10px] drop-shadow-sm">
                <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>PCI-DSS Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-white/10 pt-4 pb-28 sm:pb-6">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] sm:text-[11px] text-stone-300 text-center sm:text-left drop-shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <span>&copy; {new Date().getFullYear()} ZARB S.A.S. All Rights Reserved.</span>
            <Link
              to="/admin"
              className="text-stone-500 hover:text-stone-300 transition-colors p-1"
              title="Zarb Archive Gateway (Ctrl+Shift+A)"
              aria-label="Admin Portal"
            >
              <Lock className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1 text-stone-300">
              <Globe className="w-3 h-3" />
              <span>India &middot; INR (₹)</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1 text-stone-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Certified PCI-DSS Secure</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
