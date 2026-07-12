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
import { AdminCustomers } from './pages/AdminCustomers';
import { AdminOrders } from './pages/AdminOrders';
import { AdminOrderDetails } from './pages/AdminOrderDetails';
import { AdminOrderEdit } from './pages/AdminOrderEdit';
import { AdminLogin } from './pages/AdminLogin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { OrderDetails } from './pages/OrderDetails';
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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/register', '/admin/login'].includes(location.pathname);

  return (
    <div className="app-layout" data-route={location.pathname} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAdminRoute && <Header />}
      
      {/* Global Cart Drawer Overlay */}
      {!isAdminRoute && <CartDrawer onOpenCheckout={() => window.location.hash = '#/checkout'} />}
      
      {/* Real-time Analytics Debugger (restricted to development/toggle mode) */}
      <AnalyticsDebugger />

      <main className="app-main" style={{ flexGrow: 1 }}>
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
            <Route path="/account/orders/:transactionId" element={<OrderDetails />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminGuard />}>
            <Route path="/orders" element={<AdminOrders />} />
            <Route path="/orders/:orderId" element={<AdminOrderDetails />} />
            <Route path="/orders/:orderId/edit" element={<AdminOrderEdit />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:orderId" element={<AdminOrderDetails />} />
            <Route path="/admin/orders/:orderId/edit" element={<AdminOrderEdit />} />
          </Route>

          <Route path="/faq" element={<FaqPage />} />
          <Route path="/policy/:policyType" element={<PolicyPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      
      {!isAdminRoute && !isAuthRoute && <Footer />}
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
