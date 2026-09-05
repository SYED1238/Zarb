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
      {/* Outer Floating Liquid Glass Unified Pill */}
      <div
        className="relative flex items-center justify-between p-1 rounded-full transition-all duration-300"
        style={{
          background: isAlabaster
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(246, 245, 240, 0.96) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(20, 20, 25, 0.65) 45%, rgba(10, 10, 14, 0.8) 100%)',
          backdropFilter: 'blur(34px) saturate(200%) contrast(108%)',
          WebkitBackdropFilter: 'blur(34px) saturate(200%) contrast(108%)',
          border: isAlabaster ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.22)',
          borderTop: isAlabaster ? '1px solid rgba(255, 255, 255, 1)' : '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: isAlabaster
            ? '0 20px 45px -10px rgba(35, 30, 25, 0.18), 0 4px 12px rgba(0, 0, 0, 0.05), inset 0 1px 1.5px 0 rgba(255, 255, 255, 1)'
            : '0 20px 45px -10px rgba(0, 0, 0, 0.85), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className={`relative flex-1 flex items-center justify-center h-11 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                isActive
                  ? isAlabaster
                    ? 'bg-stone-950 text-white shadow-md'
                    : 'bg-white/[0.22] text-white shadow-[inset_0_1px_1.5px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.3)] border border-white/25'
                  : isAlabaster
                  ? 'text-stone-600 hover:text-stone-950 active:scale-95'
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
                      ? 'scale-100 stroke-[1.75] text-stone-700'
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
