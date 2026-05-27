import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingBag, Store, Settings } from 'lucide-react'
import axiosClient from '@/api/axiosClient'

const STATUS_LABELS = {
  pending:   { label: 'รอตรวจสอบ', cls: 'bg-yellow-100 text-yellow-700' },
  active:    { label: 'เปิดขายแล้ว', cls: 'bg-green-100 text-green-700' },
  suspended: { label: 'ถูกระงับ', cls: 'bg-red-100 text-red-700' },
  rejected:  { label: 'ถูกปฏิเสธ', cls: 'bg-red-100 text-red-700' },
}

const KYC_LABELS = {
  none:      { label: 'ยังไม่ยื่น KYC', cls: 'bg-gray-100 text-gray-600' },
  submitted: { label: 'KYC รอตรวจ', cls: 'bg-yellow-100 text-yellow-700' },
  verified:  { label: 'KYC ผ่านแล้ว', cls: 'bg-green-100 text-green-700' },
  rejected:  { label: 'KYC ถูกปฏิเสธ', cls: 'bg-red-100 text-red-700' },
}

function Badge({ map, value }) {
  const { label, cls } = map[value] ?? { label: value, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="rounded-2xl bg-white shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Link>
  )
}

export function Component() {
  const [shop, setShop] = useState(null)
  const [productTotal, setProductTotal] = useState(null)
  const [orderTotal, setOrderTotal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axiosClient.get('/api/shops/me'),
      axiosClient.get('/api/products/me?limit=1'),
      axiosClient.get('/api/orders/seller-orders?limit=1&status=pending_payment'),
    ]).then(([s, p, o]) => {
      setShop(s.data.shop)
      setProductTotal(p.data.total)
      setOrderTotal(o.data.total)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4 animate-pulse">
      <div className="h-24 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="h-20 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="rounded-2xl bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{shop?.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">/{shop?.slug}</p>
            {shop?.description && <p className="text-sm text-gray-600 mt-2">{shop.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge map={STATUS_LABELS} value={shop?.status} />
            <Badge map={KYC_LABELS} value={shop?.kycStatus} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Package} label="สินค้าทั้งหมด" value={productTotal} to="/seller/products" />
        <StatCard icon={ShoppingBag} label="คำสั่งซื้อรอดำเนินการ" value={orderTotal} to="/seller/orders" />
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">เมนูด่วน</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: '/seller/products', icon: Package, label: 'จัดการสินค้า' },
            { to: '/seller/orders', icon: ShoppingBag, label: 'คำสั่งซื้อ' },
            { to: '/seller/settings', icon: Settings, label: 'ตั้งค่าร้าน' },
            { to: `/shop/${shop?.slug}`, icon: Store, label: 'ดูหน้าร้าน' },
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

