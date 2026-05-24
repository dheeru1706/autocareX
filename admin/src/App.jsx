import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import theme from './theme';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import FranchiseList from './pages/franchise/FranchiseList';
import FranchiseDetail from './pages/franchise/FranchiseDetail';
import CustomerList from './pages/customers/CustomerList';
import BookingList from './pages/bookings/BookingList';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import MarketplaceManagement from './pages/marketplace/MarketplaceManagement';
import SubscriptionManagement from './pages/subscriptions/SubscriptionManagement';
import NotificationCenter from './pages/notifications/NotificationCenter';
import CouponManagement from './pages/coupons/CouponManagement';
import Settings from './pages/settings/Settings';
import FleetManagement from './pages/fleet/FleetManagement';
import InsuranceManagement from './pages/insurance/InsuranceManagement';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1A1A1A', color: '#fff', border: '1px solid #2C2C2C' },
          success: { iconTheme: { primary: '#F5C518', secondary: '#000' } },
          error: { iconTheme: { primary: '#FF4444', secondary: '#fff' } },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="franchise" element={<FranchiseList />} />
            <Route path="franchise/:id" element={<FranchiseDetail />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="bookings" element={<BookingList />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="marketplace" element={<MarketplaceManagement />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="coupons" element={<CouponManagement />} />
            <Route path="fleet" element={<FleetManagement />} />
            <Route path="insurance" element={<InsuranceManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
