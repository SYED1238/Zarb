import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Home, Layers, Search, Heart, ShoppingBag, Sun, Moon, User } from 'lucide-react';

interface MobileBottomNavProps {
  onSelectCategory?: (cat: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onSelectCategory }) => {
  const navigate = useNavigate();
  const { setIsAccountDrawerOpen } = useAuth();
  const {
    gender,
    cartCount,
    setIsCartOpen,
    isCartOpen,
    wishlist,
    setIsWishlistOpen,
    isWishlistOpen,
    setIsSearchOpen,
    isSearchOpen,
    theme,
    toggleTheme,
    showEntryScreen,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'search' | 'wishlist' | 'bag' | 'theme' | 'account'>('home');

  // Reflect external drawer/modal opens in active tab
  useEffect(() => {
    if (isCartOpen) {
      setActiveTab('bag');
    } else if (isWishlistOpen) {
      setActiveTab('wishlist');
    } else if (isSearchOpen) {
      setActiveTab('search');
    }
  }, [isCartOpen, isWishlistOpen, isSearchOpen]);

  // Listen to scroll position to update active tab between home & catalog
  useEffect(() => {
    const handleScroll = () => {
      if (isCartOpen || isWishlistOpen || isSearchOpen) return;

      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        const rect = catalogEl.getBoundingClientRect();
        if (rect.top <= 250 && rect.bottom >= 200) {
          setActiveTab('catalog');
          return;
        }
      }
      if (window.scrollY < 400) {
        setActiveTab('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCartOpen, isWishlistOpen, isSearchOpen]);

  const handleHomeClick = () => {
    setActiveTab('home');
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCatalogClick = () => {
    setActiveTab('catalog');
    if (onSelectCategory) {
      onSelectCategory('all');
    }
    navigate(`/shop/${gender}`);
  };

  const handleSearchClick = () => {
    setActiveTab('search');
    setIsSearchOpen(true);
  };

  const handleWishlistClick = () => {
    setActiveTab('wishlist');
    setIsWishlistOpen(true);
  };

  const handleBagClick = () => {
    setActiveTab('bag');
    setIsCartOpen(true);
  };

  const handleThemeClick = () => {
    toggleTheme();
  };

  const isAlabaster = theme === 'alabaster';

  const tabs = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
      action: handleHomeClick,
    },
    {
      id: 'catalog' as const,
      label: 'Collections',
      icon: Layers,
      action: handleCatalogClick,
    },
    {
      id: 'search' as const,
      label: 'Search',
      icon: Search,
      action: handleSearchClick,
    },
    {
      id: 'wishlist' as const,
      label: 'Wishlist',
      icon: Heart,
      action: handleWishlistClick,
      badge: wishlist.length > 0 ? wishlist.length : null,
    },
    {
      id: 'bag' as const,
      label: 'Bag',
      icon: ShoppingBag,
      action: handleBagClick,
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      id: 'account' as const,
      label: 'Account',
      icon: User,
      action: () => {
        setActiveTab('account');
        setIsAccountDrawerOpen(true);
      },
    },
    {
      id: 'theme' as const,
      label: 'Theme',
      icon: isAlabaster ? Moon : Sun,
      action: handleThemeClick,
      isHighlight: isAlabaster,
    },
  ];

  if (showEntryScreen) return null;

  return (
    <nav
      aria-label="Mobile Unified Navigation"
      className="md:hidden fixed bottom-5 inset-x-0 z-50 mx-auto w-[94%] max-w-[364px] pointer-events-auto select-none"
    >
      {/* Downward Ambient Light Reflection behind the bar */}
      <div className="absolute -bottom-8 left-0 right-0 h-16 pointer-events-none overflow-visible -z-10">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[88%] h-14 pointer-events-none"
          style={{
            background: isAlabaster
              ? 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.85) 0%, rgba(225, 220, 210, 0.25) 50%, transparent 75%)'
              : 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 75%)',
            filter: 'blur(18px)',
          }}
        />
      </div>

      {/* Outer Floating Liquid Glass Unified Pill */}
      <div
        className="relative flex items-center justify-between p-1 rounded-full transition-all duration-500 overflow-hidden"
        style={{
          background: isAlabaster
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.72) 0%, rgba(250, 248, 242, 0.38) 45%, rgba(242, 238, 230, 0.62) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 40%, rgba(18, 18, 22, 0.45) 75%, rgba(255, 255, 255, 0.09) 100%)',
          backdropFilter: 'blur(36px) saturate(210%) contrast(108%)',
          WebkitBackdropFilter: 'blur(36px) saturate(210%) contrast(108%)',
          border: isAlabaster ? '1px solid rgba(255, 255, 255, 0.85)' : '1px solid rgba(255, 255, 255, 0.22)',
          borderTop: isAlabaster ? '1px solid rgba(255, 255, 255, 1)' : '1px solid rgba(255, 255, 255, 0.65)',
          borderBottom: isAlabaster ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: isAlabaster
            ? '0 20px 45px -10px rgba(35, 30, 25, 0.15), 0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1.5px 2px 0 rgba(255, 255, 255, 1), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.04), inset 1.5px 0 2px 0 rgba(255, 255, 255, 0.5), inset -1.5px 0 2px 0 rgba(255, 255, 255, 0.5)'
            : '0 30px 60px -15px rgba(0, 0, 0, 0.75), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.75), inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.45), inset 1.5px 0 2px 0 rgba(255, 255, 255, 0.25), inset -1.5px 0 2px 0 rgba(255, 255, 255, 0.25)',
        }}
      >
        {/* Liquid Glass Internal Specular Refraction Sheen */}
        <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden -z-0">
          <div
            className="absolute -top-6 -left-10 w-48 h-20 bg-gradient-to-br from-white/30 via-white/10 to-transparent blur-sm transform -rotate-12 pointer-events-none"
          />
        </div>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`relative z-10 flex-1 flex items-center justify-center h-11 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                isActive
                  ? isAlabaster
                    ? 'bg-stone-950 text-white shadow-md'
                    : 'bg-white/[0.22] text-white shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.3)] border border-white/25'
                  : isAlabaster
                  ? 'text-stone-700 hover:text-black active:scale-95'
                  : 'text-stone-300 hover:text-white active:scale-95'
              }`}
              aria-label={tab.label}
              title={tab.label}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isActive
                      ? 'scale-110 stroke-[2.2] text-white'
                      : isAlabaster
                      ? 'scale-100 stroke-[1.85] text-stone-800'
                      : 'scale-100 stroke-[1.65] text-stone-300'
                  }`}
                />

                {/* Badge for Bag or Wishlist */}
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[15px] h-3.5 px-0.5 rounded-full text-[8px] font-mono font-bold flex items-center justify-center shadow-md leading-none ${
                      isAlabaster ? 'bg-stone-950 text-white' : 'bg-white text-black'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
