import { useState, useEffect } from 'react'
import axiosClient from '@/api/axiosClient'

const STATUS_MAP = {
  pending_payment: { label: 'รอชำระเงิน', cls: 'bg-yellow-100 text-yellow-700' },
  paid:            { label: 'ชำระแล้ว',    cls: 'bg-green-100 text-green-700' },
  processing:      { label: 'กำลังจัดเตรียม', cls: 'bg-blue-100 text-blue-700' },
  shipped:         { label: 'จัดส่งแล้ว',  cls: 'bg-indigo-100 text-indigo-700' },
  delivered:       { label: 'ส่งแล้ว',      cls: 'bg-green-100 text-green-800' },
  cancelled:       { label: 'ยกเลิกแล้ว',  cls: 'bg-red-100 text-red-700' },
}

const FILTERS = ['ทั้งหมด', 'paid', 'processing', 'shipped', 'cancelled']

function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}

function ShipModal({ order, onShipped, onClose }) {
  const [tracking, setTracking] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { data } = await axiosClient.patch(`/api/orders/${order._id}/ship`, { trackingNumber: tracking })
      onShipped(data.order)
    } catch (err) {
      setError(err.response?.data?.message || 'อัปเดตไม่สำเร็จ')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="font-semibold text-gray-900 mb-1">ยืนยันการจัดส่ง</h3>
        <p className="text-sm text-gray-500 mb-4">#{order._id.slice(-8).toUpperCase()}</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input value={tracking} onChange={(e) => setTracking(e.target.value)}
            placeholder="เลขพัสดุ (ถ้ามี)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'กำลังบันทึก…' : 'ยืนยันจัดส่ง'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Component() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ทั้งหมด')
  const [shipping, setShipping] = useState(null)

  useEffect(() => {
    const params = filter !== 'ทั้งหมด' ? `?status=${filter}` : ''
    axiosClient.get(`/api/orders/seller-orders${params}`)
      .then(({ data }) => setOrders(data.orders || []))
      .finally(() => setLoading(false))
  }, [filter])

  const handleShipped = (updated) => {
    setOrders((os) => os.map((o) => o._id === updated._id ? updated : o))
    setShipping(null)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">คำสั่งซื้อของร้าน</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true) }}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
            {STATUS_MAP[f]?.label ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(n=><div key={n} className="h-16 bg-gray-200 rounded-2xl animate-pulse"/>)}</div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-gray-400">ไม่มีคำสั่งซื้อ</div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">คำสั่งซื้อ</th>
                <th className="px-4 py-3 text-left">สินค้า</th>
                <th className="px-4 py-3 text-right">ยอดรวม</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-500">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('th-TH')}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                    {order.items[0]?.productName}
                    {order.items.length > 1 && <span className="text-gray-400"> +{order.items.length - 1}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                    ฿{order.total?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {['paid', 'processing'].includes(order.status) && (
                      <button onClick={() => setShipping(order)}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">
                        จัดส่ง
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {shipping && <ShipModal order={shipping} onShipped={handleShipped} onClose={() => setShipping(null)} />}
    </main>
  )
}

