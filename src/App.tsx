import React, { useState, useEffect } from 'react';
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

// Homepage Content Component
const HomePage: React.FC<{
  onQuickView: (p: Product) => void;
}> = ({ onQuickView }) => {
  const { setGender } = useStore();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilter] = useState<string | null>(null);

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

      {/* 4. Editorial Lookbook & Brand Story */}
      <EditorialSection onShopCollection={(g) => handleShopHeroClick(g)} />

      {/* 5. VIP Newsletter */}
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
      <ProductDetailModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onSelectProduct={(p: Product) => setActiveProduct(p)}
      />
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
          <StoreFront />
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}

export default App;
