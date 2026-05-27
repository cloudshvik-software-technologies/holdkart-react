import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import SessionGuard from './components/SessionGuard.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

import Home          from './pages/Home.jsx';
import Dashboard     from './pages/Dashboard.jsx';
import Login         from './pages/Login.jsx';
import Register      from './pages/Register.jsx';
import Forgot        from './pages/Forgot.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Products      from './pages/Products.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart          from './pages/Cart.jsx';
import Checkout      from './pages/Checkout.jsx';
import Orders        from './pages/Orders.jsx';
import OrderDetail   from './pages/OrderDetail.jsx';
import Wishlist      from './pages/Wishlist.jsx';
import Profile       from './pages/Profile.jsx';
import Notifications from './pages/Notifications.jsx';
import Complaints    from './pages/Complaints.jsx';
import Campaigns     from './pages/Campaigns.jsx';

/* Redirect unauthenticated users to /login */
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#6b7280' }}>Loading…</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

/* Redirect already-logged-in users away from auth pages */
function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

/* Layout wrapper with Header + Footer (used on all pages) */
function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <SessionGuard />
      <Routes>
        {/* ── Public landing page — no header/footer wrapper ── */}
        <Route path="/" element={<Home />} />

        {/* ── Auth pages (guest only) — WITH header/footer ── */}
        <Route element={<AppLayout />}>
          <Route element={<GuestRoute />}>
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/forgot"         element={<Forgot />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* ── Protected app pages with header/footer ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/products"     element={<Products />} />
            <Route path="/product/:id"  element={<ProductDetail />} />
            <Route path="/campaigns"    element={<Campaigns />} />
            <Route path="/cart"         element={<Cart />} />
            <Route path="/checkout"     element={<Checkout />} />
            <Route path="/orders"       element={<Orders />} />
            <Route path="/order/:id"    element={<OrderDetail />} />
            <Route path="/wishlist"     element={<Wishlist />} />
            <Route path="/profile"      element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/complaints"   element={<Complaints />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}