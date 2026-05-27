import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Store, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import axiosClient from '@/api/axiosClient'

export default function Navbar() {
  const { user, isAuth, clearUser } = useAuthStore()
  const items = useCartStore((s) => s.items)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await axiosClient.delete('/api/users/session') } catch {}
    clearUser()
    useCartStore.getState().clear()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-indigo-600">ShopHub</Link>

        <nav className="flex items-center gap-4">
          <Link to="/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-indigo-600" />
            {items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {items.length}
              </span>
            )}
          </Link>

          {isAuth ? (
            <div className="flex items-center gap-3">
              {(user?.role === 'seller' || user?.role === 'admin') && (
                <Link to="/seller/dashboard" title="Seller dashboard">
                  <Store className="h-5 w-5 text-gray-600 hover:text-indigo-600" />
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" title="Admin panel">
                  <LayoutDashboard className="h-5 w-5 text-gray-600 hover:text-indigo-600" />
                </Link>
              )}
              <Link to="/profile" title="Profile">
                <User className="h-5 w-5 text-gray-600 hover:text-indigo-600" />
              </Link>
              <button onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5 text-gray-600 hover:text-red-500" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600">เข้าสู่ระบบ</Link>
              <Link to="/register" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">สมัครสมาชิก</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
