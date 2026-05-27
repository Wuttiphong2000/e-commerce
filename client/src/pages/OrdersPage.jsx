import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import axiosClient from '@/api/axiosClient'

const STATUS_MAP = {
  pending_payment: { label: 'รอชำระเงิน', cls: 'bg-yellow-100 text-yellow-700' },
  paid:            { label: 'ชำระแล้ว',    cls: 'bg-green-100 text-green-700' },
  processing:      { label: 'กำลังจัดเตรียม', cls: 'bg-blue-100 text-blue-700' },
  shipped:         { label: 'จัดส่งแล้ว',  cls: 'bg-indigo-100 text-indigo-700' },
  delivered:       { label: 'ส่งแล้ว',      cls: 'bg-green-100 text-green-800' },
  cancelled:       { label: 'ยกเลิกแล้ว',  cls: 'bg-red-100 text-red-700' },
  refunded:        { label: 'คืนเงินแล้ว', cls: 'bg-gray-100 text-gray-600' },
}

function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}

export function Component() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosClient
      .get('/api/orders')
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => setError('โหลดคำสั่งซื้อไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="py-24 text-center text-red-500">{error}</div>
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">คำสั่งซื้อของฉัน</h1>

      {orders.length === 0 ? (
        <div className="py-24 text-center">
          <Package className="mx-auto w-14 h-14 text-gray-200 mb-5" />
          <p className="text-gray-500 mb-6">ยังไม่มีคำสั่งซื้อ</p>
          <Link
            to="/"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            เลือกซื้อสินค้า
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block rounded-2xl bg-white shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-1">
                    #{order._id.slice(-8).toUpperCase()} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString('th-TH')}
                  </p>
                  <p className="text-sm text-gray-700 truncate">
                    {order.items[0]?.productName}
                    {order.items.length > 1 && (
                      <span className="text-gray-400"> และอีก {order.items.length - 1} รายการ</span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={order.status} />
                  <p className="mt-2 font-bold text-indigo-600 tabular-nums">
                    ฿{order.total?.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

