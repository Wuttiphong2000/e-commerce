import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Package, MapPin, CreditCard, Truck } from 'lucide-react'
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

const PAYMENT_LABELS = {
  cod:         'เก็บเงินปลายทาง (COD)',
  promptpay:   'พร้อมเพย์',
  credit_card: 'บัตรเครดิต / เดบิต',
}

function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`rounded-full px-3 py-1 text-sm font-medium ${cls}`}>{label}</span>
}

function InfoCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-6">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
        <Icon className="w-4 h-4 text-indigo-600" />
        {title}
      </h2>
      {children}
    </div>
  )
}

export function Component() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    axiosClient
      .get(`/api/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => {
        if (err.response?.status === 404 || err.response?.status === 403) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [id])

  const onCancel = async () => {
    if (!window.confirm('ยืนยันการยกเลิกคำสั่งซื้อ?')) return
    setCancelling(true)
    setCancelError('')
    try {
      const { data } = await axiosClient.patch(`/api/orders/${id}/cancel`)
      setOrder(data.order)
    } catch (err) {
      setCancelError(err.response?.data?.message || 'ยกเลิกไม่สำเร็จ')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-4 animate-pulse">
        {[1, 2, 3].map((n) => <div key={n} className="h-32 rounded-2xl bg-gray-200" />)}
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500 mb-4">ไม่พบคำสั่งซื้อนี้</p>
        <Link to="/orders" className="text-indigo-600 hover:underline text-sm">
          ← กลับไปรายการคำสั่งซื้อ
        </Link>
      </div>
    )
  }

  if (!order) return null

  const canCancel = ['pending_payment', 'paid'].includes(order.status)

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/orders" className="text-sm text-indigo-600 hover:underline">
            ← คำสั่งซื้อของฉัน
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-400">
            {new Date(order.createdAt).toLocaleString('th-TH')}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <InfoCard title="รายการสินค้า" icon={Package}>
        <div className="divide-y divide-gray-100">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-gray-800">{item.productName}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  ฿{item.price?.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold text-gray-900 ml-4 tabular-nums">
                ฿{(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>ราคาสินค้า</span>
            <span className="tabular-nums">฿{order.subtotal?.toLocaleString()}</span>
          </div>
          {order.shippingFee > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>ค่าจัดส่ง</span>
              <span className="tabular-nums">฿{order.shippingFee?.toLocaleString()}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>ส่วนลด</span>
              <span className="tabular-nums">−฿{order.discount?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t">
            <span>รวมทั้งหมด</span>
            <span className="text-indigo-600 tabular-nums">฿{order.total?.toLocaleString()}</span>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="ที่อยู่จัดส่ง" icon={MapPin}>
        <div className="text-sm text-gray-700 leading-relaxed">
          <p>{order.shippingAddress?.street}</p>
          <p>{order.shippingAddress?.city} {order.shippingAddress?.zip}</p>
          <p>{order.shippingAddress?.state} {order.shippingAddress?.country}</p>
        </div>
      </InfoCard>

      <InfoCard title="การชำระเงิน" icon={CreditCard}>
        <p className="text-sm text-gray-700">
          {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
        </p>
      </InfoCard>

      {order.trackingNumber && (
        <InfoCard title="เลขพัสดุ" icon={Truck}>
          <p className="font-mono text-sm text-gray-800">{order.trackingNumber}</p>
        </InfoCard>
      )}

      {canCancel && (
        <div className="rounded-2xl bg-white shadow-sm p-6">
          {cancelError && <p className="mb-3 text-sm text-red-600">{cancelError}</p>}
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            {cancelling ? 'กำลังยกเลิก…' : 'ยกเลิกคำสั่งซื้อ'}
          </button>
        </div>
      )}
    </main>
  )
}

