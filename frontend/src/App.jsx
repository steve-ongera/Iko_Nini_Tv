import { Routes, Route } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import MobileNav from './components/layout/MobileNav'

// Pages
import Index from './pages/Index'
import Store from './pages/Store'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirm from './pages/OrderConfirm'
import Account from './pages/Account'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Wishlist from './pages/Wishlist'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

function App() {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

  return (
    <PayPalScriptProvider options={{ 
      clientId: paypalClientId,
      currency: 'KES',
      intent: 'capture'
    }}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <div className="app-wrapper">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/store" element={<Store />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    <Route path="/order-confirmation/:orderNumber" element={
                      <ProtectedRoute>
                        <OrderConfirm />
                      </ProtectedRoute>
                    } />
                    <Route path="/account" element={
                      <ProtectedRoute>
                        <Account />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders/:orderNumber" element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/wishlist" element={
                      <ProtectedRoute>
                        <Wishlist />
                      </ProtectedRoute>
                    } />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <MobileNav />
              </div>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </PayPalScriptProvider>
  )
}

export default App