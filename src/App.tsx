
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { ThemeProvider } from "@/contexts/ThemeContext"
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetails from '@/pages/ProductDetails';
import Cart from '@/pages/Cart';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import VendorRegistration from '@/pages/VendorRegistration';
import VendorDashboard from '@/pages/VendorDashboard';
import VendorShop from '@/pages/VendorShop';
import AdminPanel from '@/pages/AdminPanel';
import CustomerDashboard from '@/pages/CustomerDashboard';
import Dashboard from '@/pages/Dashboard';
import Navigation from '@/components/Navigation';
import Orders from '@/pages/Orders';
import Chat from "@/pages/Chat";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AdminProvider>
            <ThemeProvider>
              <Toaster />
              <BrowserRouter>
                <div className="min-h-screen bg-background">
                  <Navigation />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:productId" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                    <Route path="/vendor-registration" element={<VendorRegistration />} />
                    <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                    <Route path="/vendor/:vendorId" element={<VendorShop />} />
                    <Route path="/admin-dashboard" element={<AdminPanel />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/chat" element={<Chat />} />
                  </Routes>
                </div>
              </BrowserRouter>
            </ThemeProvider>
          </AdminProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
