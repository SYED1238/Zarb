import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategorySection } from './components/CategorySection';
import { ProductGrid } from './components/ProductGrid';
import { CategoryPage } from './components/CategoryPage';
import { AdminPortal } from './components/admin/AdminPortal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { InstagramBrowserChoiceModal } from './components/InstagramBrowserChoiceModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { SearchOverlay } from './components/SearchOverlay';
import { WishlistDrawer } from './components/WishlistDrawer';
import { AccountDrawer } from './components/AccountDrawer';
import { EditorialSection } from './components/EditorialSection';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthProvider } from './context/AuthContext';
import { PaymentReturnPage } from './components/PaymentReturnPage';
import type { Product, GenderType } from './types/product';

// Scroll restoration component: ensures navigating to any route begins at top
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

import { ParfumerieSection } from './components/ParfumerieSection';
import { PerfumeCardShowcase } from './components/PerfumeCardShowcase';
import { ErrorBoundary } from './components/ErrorBoundary';

// Homepage Content Component
const HomePage: React.FC<{
  onQuickView: (p: Product) => void;
}> = ({ onQuickView }) => {
  const { setGender } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilter] = useState<string | null>(null);

  // Smooth scroll to perfume section if navigating to /perfumes
  useEffect(() => {
    if (location.pathname === '/perfumes' || location.pathname === '/haute-parfumerie' || location.hash === '#haute-parfumerie') {
      setTimeout(() => {
        document.getElementById('haute-parfumerie')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [location.pathname, location.hash]);

  const handleShopHeroClick = (genderChoice: GenderType) => {
    setGender(genderChoice);
    navigate(`/shop/${genderChoice}`);
  };

  return (
    <main>
      {/* 1. Campaign Hero */}
      <Hero onShopClick={handleShopHeroClick} />

      {/* 2. Category Collections (Visual Entry Points -> navigate to category page on click) */}
      <CategorySection />

      {/* 3. Featured Curated Collection Grid */}
      <ProductGrid
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        activeFilter={activeFilter}
        onQuickView={onQuickView}
      />

      {/* 4. Haute Parfumerie & Royal Attar Showcase */}
      <ErrorBoundary fallbackTitle="Haute Parfumerie Atelier">
        <ParfumerieSection onQuickView={onQuickView} />
      </ErrorBoundary>

      {/* 5. Editorial Lookbook & Brand Story */}
      <EditorialSection onShopCollection={(g) => handleShopHeroClick(g)} />

      {/* 6. VIP Newsletter */}
      <Newsletter />
    </main>
  );
};

const StoreFront: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    gender,
    theme,
    products,
    activeProduct,
    setActiveProduct,
  } = useStore();

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/atelier-portal');

  // Secret Master Shortcut: Ctrl + Shift + A or Cmd + Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Deep-link: auto-open product from ?product=slug on page load
  const hasHandledDeepLink = useRef(false);
  useEffect(() => {
    if (hasHandledDeepLink.current || products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const productSlug = params.get('product');
    if (productSlug) {
      const match = products.find(p => p.slug === productSlug);
      if (match) {
        // Push a clean homepage entry first so pressing back lands on the store
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({ isStorePage: true }, '', cleanUrl);
        // Now push the product URL as a new entry on top
        const productUrl = cleanUrl + '?product=' + productSlug;
        window.history.pushState({ isProductDeepLink: true }, '', productUrl);
        setActiveProduct(match);
        hasHandledDeepLink.current = true;
      }
    }
  }, [products, setActiveProduct]);

  // Listen for popstate (browser back button) to close product modal
  useEffect(() => {
    const handlePopState = () => {
      if (activeProduct) {
        setActiveProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeProduct, setActiveProduct]);

  // Update URL when product modal opens/closes (only for non-deep-link navigations)
  useEffect(() => {
    if (activeProduct) {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('product')) {
        url.searchParams.set('product', activeProduct.slug);
        window.history.replaceState({}, '', url.toString());
      }
    } else if (window.location.search.includes('product=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeProduct]);

  const handleSearchSelectCategory = (cat: string) => {
    const slugMap: Record<string, string> = {
      Jackets: 'jackets',
      Dresses: 'dresses-gowns',
      Trousers: 'trousers',
      Bags: 'leather-bags',
      Kurtis: 'kurtis',
    };
    const targetSlug = slugMap[cat] || cat.toLowerCase();
    navigate(`/shop/${gender}/${targetSlug}`);
  };

  // Dedicated Administrative Shell (Concealed from public visitors)
  if (isAdminRoute) {
    return (
      <div className="relative min-h-screen">
        <ScrollToTop />
        <Routes>
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/atelier-portal" element={<AdminPortal />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
        <Toast />
      </div>
    );
  }

  // Dedicated Single Card Showcase Shell (Focus entirely on ONE product card)
  const isCardShowcaseRoute =
    location.pathname === '/perfume-card' ||
    location.pathname === '/card' ||
    location.pathname === '/card-preview';

  if (isCardShowcaseRoute) {
    return (
      <div className="relative min-h-screen">
        <ScrollToTop />
        <PerfumeCardShowcase />
        <Toast />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen transition-colors duration-500 ${theme === 'alabaster' ? 'bg-[#f6f5f0] text-[#141416]' : 'bg-[#09090b] text-[#f5f5f3]'}`}>
      <ScrollToTop />

      {/* Main Store Header */}
      <Header />

      {/* Page Routes */}
      <Routes>
        {/* Homepage Route */}
        <Route
          path="/"
          element={<HomePage onQuickView={(p) => setActiveProduct(p)} />}
        />

        {/* Dedicated Haute Parfumerie Showcase Routes */}
        <Route
          path="/perfumes"
          element={<HomePage onQuickView={(p) => setActiveProduct(p)} />}
        />
        <Route
          path="/haute-parfumerie"
          element={<HomePage onQuickView={(p) => setActiveProduct(p)} />}
        />

        {/* Dedicated Category Page Routes */}
        <Route
          path="/shop/:gender/:categorySlug"
          element={<CategoryPage onQuickView={(p) => setActiveProduct(p)} />}
        />
        <Route
          path="/shop/:gender"
          element={<CategoryPage onQuickView={(p) => setActiveProduct(p)} />}
        />

        {/* Cashfree Payment Return Route */}
        <Route path="/payment-return" element={<PaymentReturnPage />} />

        {/* Concealed Admin Route */}
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/atelier-portal" element={<AdminPortal />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Footer */}
      <Footer />

      {/* Floating Liquid Glass Bottom Navigation Bar (Mobile only) */}
      <MobileBottomNav />

      {/* Interactive Overlays & Modals */}
      <InstagramBrowserChoiceModal />
      <ErrorBoundary fallbackTitle="Product Details">
        <ProductDetailModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onSelectProduct={(p: Product) => setActiveProduct(p)}
        />
      </ErrorBoundary>
      <SizeGuideModal />
      <CartDrawer />
      <CheckoutModal />
      <SearchOverlay
        onSelectProduct={(p: Product) => setActiveProduct(p)}
        onSelectCategory={handleSearchSelectCategory}
      />
      <WishlistDrawer onSelectProduct={(p: Product) => setActiveProduct(p)} />
      <AccountDrawer />
      <Toast />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <ErrorBoundary>
            <StoreFront />
          </ErrorBoundary>
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}

export default App;
