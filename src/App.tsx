import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { Header } from './layouts/Header';
import { Footer } from './layouts/Footer';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetails } from './pages/ProductDetails';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { About } from './pages/About';
import { WhyUs } from './pages/WhyUs';
import { Contact } from './pages/Contact';
import { FaqPage } from './pages/Faq';
import { PolicyPage } from './pages/Policy';
import { AdminGuard } from './components/AdminGuard';
import { CustomerGuard } from './components/CustomerGuard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { CartDrawer } from './components/CartDrawer';
import { AnalyticsDebugger } from './components/AnalyticsDebugger';
import { trackPageView } from './analytics/analytics';

// Combined Scroll to Top & GTM Page View Tracking helper component
const PageTrackerAndScroll: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Track Page View automatically on route/hash changes
    trackPageView(pathname + search);
  }, [pathname, search]);

  return null;
};

// Global App components that need CartContext access
const AppContent: React.FC = () => {

  return (
    <div className="app-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      {/* Global Cart Drawer Overlay */}
      <CartDrawer onOpenCheckout={() => window.location.hash = '#/checkout'} />
      
      {/* Real-time Analytics Debugger (restricted to development/toggle mode) */}
      <AnalyticsDebugger />

      <main style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/why-us" element={<WhyUs />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Customer Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Customer Routes */}
          <Route element={<CustomerGuard />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/account" element={<Account />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminGuard />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          <Route path="/faq" element={<FaqPage />} />
          <Route path="/policy/:policyType" element={<PolicyPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <CartProvider>
          <PageTrackerAndScroll />
          <AppContent />
        </CartProvider>
      </Router>
    </HelmetProvider>
  );
};

export default App;
