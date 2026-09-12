import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Globe, Shield, Lock } from 'lucide-react';
import { HolographicBeams } from './ui/BeamsBackground';

export const Footer: React.FC = () => {
  const { theme } = useStore();
  const isAlabaster = theme === 'alabaster';

  return (
    <footer
      id="global-footer"
      className={`relative border-t font-sans text-xs overflow-hidden transition-colors duration-500 ${
        isAlabaster
          ? 'bg-[#ece8df] border-stone-300/80 text-stone-700'
          : 'bg-[#070709] border-white/10 text-stone-400'
      }`}
    >
      {/* Holographic Light Beams Rising from Downside */}
      <HolographicBeams
        className="absolute inset-0 z-0"
        density={isAlabaster ? 28 : 45}
        speed={isAlabaster ? 2.5 : 3.9}
        aberration={isAlabaster ? 6.0 : 10.0}
        opacity={isAlabaster ? 18 : 50}
      />

      {/* Top Border Specular Refraction Seam */}
      <div
        className={`absolute top-0 inset-x-0 h-[1px] pointer-events-none z-10 ${
          isAlabaster
            ? 'bg-gradient-to-r from-transparent via-stone-400/40 to-transparent'
            : 'bg-gradient-to-r from-transparent via-white/30 to-transparent'
        }`}
      />

      {/* Desktop Upper Footer: Boutiques & Divisions (Full Directory) */}
      <div className="hidden md:block relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <span
                className={`font-brand text-xl tracking-[0.25em] ${
                  isAlabaster ? 'text-stone-950 font-bold' : 'text-white'
                }`}
              >
                ZARB
              </span>
            </div>
            <p
              className={`text-xs font-light leading-relaxed max-w-sm ${
                isAlabaster ? 'text-stone-600' : 'text-stone-400'
              }`}
            >
              Maison de haute prêt-à-porter dedicated to architectural minimalism, noble textiles, and timeless silhouettes for both men and women.
            </p>
          </div>

          {/* Col 2: Global Boutiques */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                isAlabaster ? 'text-stone-950 font-semibold' : 'text-white'
              }`}
            >
              Global Salons
            </h4>
            <ul className={`space-y-2 text-xs ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
              <li>14 Rue Saint-Honoré, Paris</li>
              <li>Via Montenapoleone 8, Milan</li>
              <li>724 Madison Avenue, New York</li>
              <li>Ginza Six, Tokyo</li>
              <li>The Pavilion, BKC, Mumbai</li>
            </ul>
          </div>

          {/* Col 3: Client Concierge */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                isAlabaster ? 'text-stone-950 font-semibold' : 'text-white'
              }`}
            >
              Customer Concierge
            </h4>
            <ul className={`space-y-2 text-xs ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
              <li><a href="#catalog-section" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Private Fitting Appointments</a></li>
              <li><a href="#catalog-section" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Complimentary Alterations</a></li>
              <li><a href="#catalog-section" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Track Haute Consignment</a></li>
              <li><a href="#catalog-section" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>White-Glove Courier Logistics</a></li>
              <li><a href="#catalog-section" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Care & Preservation</a></li>
            </ul>
          </div>

          {/* Col 4: Maison & Legal */}
          <div className="space-y-3">
            <h4
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                isAlabaster ? 'text-stone-950 font-semibold' : 'text-white'
              }`}
            >
              The Maison
            </h4>
            <ul className={`space-y-2 text-xs ${isAlabaster ? 'text-stone-600' : 'text-stone-400'}`}>
              <li><a href="#brand-story" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Atelier Provenance</a></li>
              <li><a href="#brand-story" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Sustainable Sourcing Standard</a></li>
              <li><a href="#editorial-section" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Autumn/Winter 2026 Runway</a></li>
              <li><a href="#" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Privacy Policy</a></li>
              <li><a href="#" className={`transition-colors ${isAlabaster ? 'hover:text-black' : 'hover:text-white'}`}>Terms of Haute Couture</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile Ultra-Compact Footer: Short & Less */}
      <div className="md:hidden relative z-10 px-5 pt-8 pb-4 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <span
            className={`font-brand text-lg tracking-[0.25em] ${
              isAlabaster ? 'text-stone-950 font-bold' : 'text-white drop-shadow-md'
            }`}
          >
            ZARB
          </span>
        </div>

        <p className={`text-[11px] font-light leading-snug ${isAlabaster ? 'text-stone-600' : 'text-stone-300 drop-shadow-sm'}`}>
          Haute prêt-à-porter &middot; Architectural minimalism.
        </p>

        {/* 2-Column Concise Links */}
        <div className={`grid grid-cols-2 gap-4 pt-3 border-t text-[11px] ${
          isAlabaster ? 'border-stone-300/80' : 'border-white/15'
        }`}>
          {/* Column 1: Salons & Concierge */}
          <div className="space-y-3">
            <div>
              <h4 className={`text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 ${
                isAlabaster ? 'text-stone-950' : 'text-white drop-shadow-sm'
              }`}>
                Salons
              </h4>
              <p className={`text-[10px] leading-relaxed ${
                isAlabaster ? 'text-stone-600' : 'text-stone-300 drop-shadow-sm'
              }`}>
                Paris &middot; Milan &middot; NY &middot; Tokyo &middot; Mumbai
              </p>
            </div>

            <div>
              <h4 className={`text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 ${
                isAlabaster ? 'text-stone-950' : 'text-white drop-shadow-sm'
              }`}>
                Concierge
              </h4>
              <ul className={`space-y-1 text-[10px] ${
                isAlabaster ? 'text-stone-600' : 'text-stone-300 drop-shadow-sm'
              }`}>
                <li><a href="#catalog-section" className={isAlabaster ? 'hover:text-black' : 'hover:text-white'}>Private Fittings</a></li>
                <li><a href="#catalog-section" className={isAlabaster ? 'hover:text-black' : 'hover:text-white'}>Alterations</a></li>
                <li><a href="#catalog-section" className={isAlabaster ? 'hover:text-black' : 'hover:text-white'}>White-Glove Courier</a></li>
              </ul>
            </div>
          </div>

          {/* Column 2: Maison & Policy */}
          <div className="space-y-3">
            <div>
              <h4 className={`text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 ${
                isAlabaster ? 'text-stone-950' : 'text-white drop-shadow-sm'
              }`}>
                Maison
              </h4>
              <ul className={`space-y-1 text-[10px] ${
                isAlabaster ? 'text-stone-600' : 'text-stone-300 drop-shadow-sm'
              }`}>
                <li><a href="#brand-story" className={isAlabaster ? 'hover:text-black' : 'hover:text-white'}>Atelier Provenance</a></li>
                <li><a href="#editorial-section" className={isAlabaster ? 'hover:text-black' : 'hover:text-white'}>AW26 Runway</a></li>
                <li><a href="#" className={isAlabaster ? 'hover:text-black' : 'hover:text-white'}>Privacy & Terms</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 ${
                isAlabaster ? 'text-stone-950' : 'text-white drop-shadow-sm'
              }`}>
                Security
              </h4>
              <div className={`flex items-center space-x-1 text-[10px] ${
                isAlabaster ? 'text-stone-700' : 'text-stone-300 drop-shadow-sm'
              }`}>
                <Shield className={`w-3 h-3 ${isAlabaster ? 'text-emerald-600' : 'text-emerald-400'} shrink-0`} />
                <span>PCI-DSS Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`relative z-10 border-t pt-4 pb-28 sm:pb-6 ${
        isAlabaster ? 'border-stone-300/80' : 'border-white/10'
      }`}>
        <div className={`max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] sm:text-[11px] text-center sm:text-left ${
          isAlabaster ? 'text-stone-600' : 'text-stone-300 drop-shadow-sm'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            <span>&copy; {new Date().getFullYear()} ZARB S.A.S. All Rights Reserved.</span>
            <Link
              to="/admin"
              className={`transition-colors p-1 ${
                isAlabaster ? 'text-stone-400 hover:text-stone-800' : 'text-stone-500 hover:text-stone-300'
              }`}
              title="Zarb Archive Gateway (Ctrl+Shift+A)"
              aria-label="Admin Portal"
            >
              <Lock className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-1 ${
              isAlabaster ? 'text-stone-700' : 'text-stone-300'
            }`}>
              <Globe className="w-3 h-3" />
              <span>India &middot; INR (₹)</span>
            </div>
            <div className={`hidden sm:flex items-center space-x-1 ${
              isAlabaster ? 'text-stone-700' : 'text-stone-300'
            }`}>
              <Shield className={`w-3.5 h-3.5 ${isAlabaster ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Certified PCI-DSS Secure</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
