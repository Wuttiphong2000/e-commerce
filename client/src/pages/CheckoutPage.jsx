import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, MapPin, CreditCard } from 'lucide-react'
import axiosClient from '@/api/axiosClient'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

const PAYMENT_OPTIONS = [
  { value: 'cod', label: 'เก็บเงินปลายทาง (COD)' },
  { value: 'promptpay', label: 'พร้อมเพย์' },
  { value: 'credit_card', label: 'บัตรเครดิต / เดบิต' },
]

function SectionCard({ title, icon: Icon, children }) {
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
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const clearStore = useCartStore((s) => s.clear)

  const [cartItems, setCartItems] = useState([])
  const [addressIdx, setAddressIdx] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosClient
      .get('/api/users/cart')
      .then(({ data }) => {
        if (!data.items?.length) { navigate('/cart'); return }
        setCartItems(data.items)
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setLoading(false))
  }, [navigate])

  const addresses = user?.addresses || []
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!addresses.length) { setError('กรุณาเพิ่มที่อยู่จัดส่งก่อน'); return }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await axiosClient.post('/api/orders', {
        shippingAddressIdx: addressIdx,
        paymentMethod,
      })
      clearStore()
      navigate(`/orders/${data.order._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'สั่งซื้อไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-36 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">สรุปคำสั่งซื้อ</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <SectionCard title="รายการสินค้า" icon={ShoppingBag}>
          <div className="divide-y divide-gray-100">
            {cartItems.map((item) => (
              <div key={item._id} className="flex justify-between items-center py-3 text-sm">
                <span className="text-gray-700 truncate max-w-xs">
                  {item.productName}
                  <span className="text-gray-400 ml-1">× {item.quantity}</span>
                </span>
                <span className="font-medium text-gray-900 ml-4 shrink-0 tabular-nums">
                  ฿{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t flex justify-between font-bold text-gray-900">
            <span>รวมทั้งหมด</span>
            <span className="text-indigo-600 tabular-nums">฿{subtotal.toLocaleString()}</span>
          </div>
        </SectionCard>

        <SectionCard title="ที่อยู่จัดส่ง" icon={MapPin}>
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-500">
              ยังไม่มีที่อยู่จัดส่ง{' '}
              <Link to="/profile" className="text-indigo-600 hover:underline">เพิ่มที่อยู่</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    addressIdx === i
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={addressIdx === i}
                    onChange={() => setAddressIdx(i)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div className="text-sm leading-relaxed">
                    <p className="text-gray-800">{addr.street}, {addr.city}</p>
                    <p className="text-gray-500">{addr.state} {addr.zip} {addr.country}</p>
                    {addr.isDefault && (
                      <span className="mt-0.5 inline-block text-xs font-medium text-indigo-600">ที่อยู่หลัก</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="วิธีชำระเงิน" icon={CreditCard}>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                  paymentMethod === opt.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-800">{opt.label}</span>
              </label>
            ))}
          </div>
        </SectionCard>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || addresses.length === 0}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? 'กำลังสั่งซื้อ…' : `ยืนยันคำสั่งซื้อ · ฿${subtotal.toLocaleString()}`}
        </button>

        <Link to="/cart" className="block text-center text-sm text-indigo-600 hover:underline">
          ← กลับไปแก้ไขตะกร้า
        </Link>
      </form>
    </main>
  )
}

