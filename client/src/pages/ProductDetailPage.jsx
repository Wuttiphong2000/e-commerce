import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axiosClient from '@/api/axiosClient'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          className={`text-2xl leading-none ${s <= value ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
      ))}
    </div>
  )
}

function ReviewSection({ productId, isAuth }) {
  const [reviews, setReviews] = useState([])
  const [total, setTotal] = useState(0)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    axiosClient.get(`/api/products/${productId}/reviews?limit=5`)
      .then(({ data }) => { setReviews(data.reviews || []); setTotal(data.total || 0) })
      .catch(() => {})
  }, [productId])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true); setMsg('')
    try {
      const { data } = await axiosClient.post(`/api/products/${productId}/reviews`, { rating, comment })
      setReviews((rs) => [data.review, ...rs])
      setTotal((t) => t + 1)
      setComment(''); setRating(5)
      setMsg('ขอบคุณสำหรับรีวิว!')
    } catch (err) {
      setMsg(err.response?.data?.message || 'ส่งรีวิวไม่สำเร็จ')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="mt-10 border-t border-gray-100 pt-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">รีวิวสินค้า ({total})</h2>

      {isAuth && (
        <form onSubmit={onSubmit} className="rounded-2xl bg-gray-50 p-4 mb-6 space-y-3">
          <p className="text-sm font-medium text-gray-700">เขียนรีวิว</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            placeholder="แชร์ความคิดเห็นของคุณ…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          {msg && <p className={`text-sm ${msg.includes('ไม่') ? 'text-red-600' : 'text-indigo-600'}`}>{msg}</p>}
          <button type="submit" disabled={submitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? 'กำลังส่ง…' : 'ส่งรีวิว'}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400">ยังไม่มีรีวิว เป็นคนแรกที่รีวิว!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                {r.userId?.firstname?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{r.userId?.firstname} {r.userId?.lastname}</p>
                <p className="text-yellow-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                {r.comment && <p className="text-sm text-gray-600 mt-0.5">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString('th-TH')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ImageGallery({ publicIds }) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const [selected, setSelected] = useState(0)

  const toUrl = (id) =>
    cloudName ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${id}` : null

  if (!publicIds?.length) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center text-7xl text-gray-300">
        📦
      </div>
    )
  }

  const mainUrl = toUrl(publicIds[selected])
  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
        {mainUrl
          ? <img src={mainUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-7xl text-gray-300">📦</div>
        }
      </div>
      {publicIds.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {publicIds.map((id, i) => {
            const url = toUrl(id)
            return (
              <button key={i} onClick={() => setSelected(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selected ? 'border-indigo-500' : 'border-transparent'}`}>
                {url
                  ? <img src={url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gray-200" />
                }
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Component() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuth } = useAuthStore()
  const addItem = useCartStore(s => s.addItem)

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)
  const [cartMsg, setCartMsg] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setLoading(true)
    axiosClient.get(`/api/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.product)
        if (data.product.variants?.length > 0) setSelectedVariant(0)
      })
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [slug])

  const effectivePrice = selectedVariant !== null && product?.variants?.length > 0
    ? product.variants[selectedVariant].price
    : product?.price

  const effectiveStock = selectedVariant !== null && product?.variants?.length > 0
    ? product.variants[selectedVariant].stockQty
    : product?.stockQty

  const onAddToCart = async () => {
    if (!isAuth) { navigate('/login'); return }
    setAdding(true)
    setCartMsg('')
    try {
      const payload = { productId: product._id, quantity: qty }
      if (selectedVariant !== null && product.variants?.length > 0) payload.variantIdx = selectedVariant
      await axiosClient.post('/api/users/cart', payload)
      addItem({ productId: product._id, name: product.name, price: effectivePrice, quantity: qty, imagePublicId: product.imagePublicIds?.[0] })
      setCartMsg('เพิ่มลงตะกร้าแล้ว ✓')
    } catch (err) {
      setCartMsg(err.response?.data?.message || 'เพิ่มลงตะกร้าไม่สำเร็จ')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return (
    <div className="mx-auto max-w-5xl px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
      <div className="aspect-square rounded-2xl bg-gray-200" />
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-8 bg-indigo-100 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  )

  if (notFound) return (
    <div className="py-24 text-center">
      <p className="text-gray-500 mb-4">ไม่พบสินค้านี้</p>
      <Link to="/" className="text-indigo-600 hover:underline text-sm">← กลับหน้าหลัก</Link>
    </div>
  )

  if (!product) return null

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <ImageGallery publicIds={product.imagePublicIds} />

        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
            {product.ratingCount > 0 && (
              <p className="mt-1 text-sm text-yellow-500">
                ★ {product.ratingAvg.toFixed(1)} <span className="text-gray-400">({product.ratingCount} รีวิว)</span>
              </p>
            )}
          </div>

          <p className="text-3xl font-bold text-indigo-600">฿{effectivePrice?.toLocaleString()}</p>

          {product.variants?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">เลือกตัวเลือก</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => {
                  const attrs = v.attrs ? Object.fromEntries(v.attrs) : {}
                  const label = Object.entries(attrs).map(([k, val]) => `${k}: ${val}`).join(' / ') || `ตัวเลือก ${i + 1}`
                  return (
                    <button key={i} onClick={() => setSelectedVariant(i)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${selectedVariant === i ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-300 text-gray-600 hover:border-indigo-300'}`}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-700">จำนวน</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg">−</button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(q => Math.min(effectiveStock ?? 99, q + 1))}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg">+</button>
            </div>
            <p className="text-xs text-gray-400">มีสินค้า {effectiveStock} ชิ้น</p>
          </div>

          <div className="space-y-2">
            <button onClick={onAddToCart} disabled={adding || effectiveStock === 0}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {adding ? 'กำลังเพิ่ม…' : effectiveStock === 0 ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
            </button>
            {cartMsg && <p className="text-sm text-center text-indigo-600">{cartMsg}</p>}
          </div>

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">รายละเอียดสินค้า</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.shopId && (
            <Link to={`/shop/${product.shopId.slug}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition-colors">
              {product.shopId.logoUrl
                ? <img src={product.shopId.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                : <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {product.shopId.name?.[0]?.toUpperCase()}
                  </div>
              }
              <div>
                <p className="text-sm font-semibold text-gray-800">{product.shopId.name}</p>
                {product.shopId.ratingAvg > 0 && (
                  <p className="text-xs text-yellow-500">★ {product.shopId.ratingAvg.toFixed(1)}</p>
                )}
              </div>
              <span className="ml-auto text-xs text-indigo-600">ดูร้าน →</span>
            </Link>
          )}
        </div>
      </div>
      <ReviewSection productId={product._id} isAuth={isAuth} />
    </div>
  )
}
