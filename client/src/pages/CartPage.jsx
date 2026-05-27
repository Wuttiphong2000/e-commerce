import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import axiosClient from '@/api/axiosClient'
import { useCartStore } from '@/store/cartStore'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

function toImgUrl(publicId) {
  if (!CLOUD_NAME || !publicId) return null
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_120/${publicId}`
}

function CartItemRow({ item, onUpdate, onRemove }) {
  const [qty, setQty] = useState(item.quantity)
  const [busy, setBusy] = useState(false)

  const changeQty = async (next) => {
    if (next < 1 || busy) return
    setBusy(true)
    try {
      await onUpdate(item._id, next)
      setQty(next)
    } finally {
      setBusy(false)
    }
  }

  const imgUrl = toImgUrl(item.imagePublicId)

  return (
    <div className="flex items-start gap-4 py-5 border-b border-gray-100 last:border-0">
      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
        {imgUrl
          ? <img src={imgUrl} alt={item.productName} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">📦</div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 leading-snug truncate">{item.productName}</p>
        <p className="text-indigo-600 font-semibold text-sm mt-1">฿{item.price?.toLocaleString()}</p>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => changeQty(qty - 1)}
            disabled={busy || qty <= 1}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
            aria-label="ลดจำนวน"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{qty}</span>
          <button
            onClick={() => changeQty(qty + 1)}
            disabled={busy}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
            aria-label="เพิ่มจำนวน"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between h-20">
        <p className="font-bold text-gray-900 tabular-nums">
          ฿{(item.price * qty).toLocaleString()}
        </p>
        <button
          onClick={() => onRemove(item._id)}
          className="text-gray-300 hover:text-red-500 transition-colors"
          aria-label="ลบสินค้า"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function Component() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const clearStore = useCartStore((s) => s.clear)

  useEffect(() => {
    axiosClient
      .get('/api/users/cart')
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setError('โหลดตะกร้าไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async (itemId, qty) => {
    const { data } = await axiosClient.patch(`/api/users/cart/${itemId}`, { quantity: qty })
    setItems(data.items)
  }

  const handleRemove = async (itemId) => {
    try {
      const { data } = await axiosClient.delete(`/api/users/cart/${itemId}`)
      setItems(data.items)
      if (!data.items?.length) clearStore()
    } catch {}
  }

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex gap-4 animate-pulse">
            <div className="w-20 h-20 rounded-xl bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="py-24 text-center text-red-500">{error}</div>
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <ShoppingBag className="mx-auto w-14 h-14 text-gray-200 mb-5" />
        <p className="text-gray-500 mb-6">ตะกร้าสินค้าว่างเปล่า</p>
        <Link
          to="/"
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          เลือกซื้อสินค้า
        </Link>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ตะกร้าสินค้า</h1>

      <div className="rounded-2xl bg-white shadow-sm p-6">
        {items.map((item) => (
          <CartItemRow
            key={item._id}
            item={item}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}

        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>รายการทั้งหมด ({totalQty} ชิ้น)</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900">
            <span>ยอดรวม</span>
            <span className="text-indigo-600 text-lg">฿{subtotal.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          สั่งซื้อ · ฿{subtotal.toLocaleString()}
        </button>
      </div>

      <Link
        to="/"
        className="mt-4 block text-center text-sm text-indigo-600 hover:underline"
      >
        ← เลือกซื้อสินค้าเพิ่มเติม
      </Link>
    </main>
  )
}

