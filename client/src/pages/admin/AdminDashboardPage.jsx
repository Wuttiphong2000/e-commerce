import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Store, Package, ShoppingBag } from 'lucide-react'
import axiosClient from '@/api/axiosClient'

function StatCard({ icon: Icon, label, value, to, warn }) {
  return (
    <Link to={to} className="rounded-2xl bg-white shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${warn ? 'bg-red-50' : 'bg-indigo-50'}`}>
        <Icon className={`w-5 h-5 ${warn ? 'text-red-500' : 'text-indigo-600'}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Link>
  )
}

export function Component() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axiosClient.get('/api/admin/stats').then(({ data }) => setStats(data.stats)).catch(() => {})
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Users} label="ผู้ใช้ทั้งหมด" value={stats?.userCount} to="/admin/users" />
        <StatCard icon={Store} label="ร้านรออนุมัติ" value={stats?.shopPending} to="/admin/shops?status=pending" warn={stats?.shopPending > 0} />
        <StatCard icon={Package} label="สินค้ารออนุมัติ" value={stats?.productPending} to="/admin/products" warn={stats?.productPending > 0} />
        <StatCard icon={ShoppingBag} label="คำสั่งซื้อทั้งหมด" value={stats?.orderCount} to="/admin/shops" />
      </div>
      <div className="rounded-2xl bg-white shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">เมนูด่วน</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: '/admin/shops', icon: Store, label: 'จัดการร้านค้า' },
            { to: '/admin/products', icon: Package, label: 'จัดการสินค้า' },
            { to: '/admin/users', icon: Users, label: 'จัดการผู้ใช้' },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <Icon className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
