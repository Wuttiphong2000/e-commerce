import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import RootLayout from '@/components/Layout/RootLayout'

function ProtectedRoute() {
  const { isAuth, loading } = useAuthStore()
  if (loading) return null
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />
}

function GuestRoute() {
  const { isAuth, loading } = useAuthStore()
  if (loading) return null
  return !isAuth ? <Outlet /> : <Navigate to="/" replace />
}

function SellerRoute() {
  const { isAuth, user, loading } = useAuthStore()
  if (loading) return null
  return isAuth && (user?.role === 'seller' || user?.role === 'admin')
    ? <Outlet />
    : <Navigate to="/" replace />
}

function AdminRoute() {
  const { isAuth, user, loading } = useAuthStore()
  if (loading) return null
  return isAuth && user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', lazy: () => import('@/pages/HomePage') },
      { path: '/product/:slug', lazy: () => import('@/pages/ProductDetailPage') },
      { path: '/shop/:slug', lazy: () => import('@/pages/ShopPage') },

      { element: <GuestRoute />, children: [
        { path: '/login', lazy: () => import('@/pages/LoginPage') },
        { path: '/register', lazy: () => import('@/pages/RegisterPage') },
      ]},

      { element: <ProtectedRoute />, children: [
        { path: '/cart', lazy: () => import('@/pages/CartPage') },
        { path: '/checkout', lazy: () => import('@/pages/CheckoutPage') },
        { path: '/profile', lazy: () => import('@/pages/ProfilePage') },
        { path: '/orders', lazy: () => import('@/pages/OrdersPage') },
        { path: '/orders/:id', lazy: () => import('@/pages/OrderDetailPage') },
      ]},

      { element: <SellerRoute />, children: [
        { path: '/seller/dashboard', lazy: () => import('@/pages/seller/DashboardPage') },
        { path: '/seller/products', lazy: () => import('@/pages/seller/ProductsPage') },
        { path: '/seller/orders', lazy: () => import('@/pages/seller/SellerOrdersPage') },
        { path: '/seller/settings', lazy: () => import('@/pages/seller/ShopSettingsPage') },
        { path: '/seller/open', lazy: () => import('@/pages/seller/OpenShopPage') },
      ]},

      { element: <AdminRoute />, children: [
        { path: '/admin', lazy: () => import('@/pages/admin/AdminDashboardPage') },
        { path: '/admin/shops', lazy: () => import('@/pages/admin/AdminShopsPage') },
        { path: '/admin/products', lazy: () => import('@/pages/admin/AdminProductsPage') },
        { path: '/admin/users', lazy: () => import('@/pages/admin/AdminUsersPage') },
      ]},
    ],
  },
])

export default router
