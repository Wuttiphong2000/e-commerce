import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axiosClient from '@/api/axiosClient'

function ProductCard({ product }) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const imgUrl = cloudName && product.imagePublicIds?.length > 0
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_400,f_auto,q_auto/${product.imagePublicIds[0]}`
    : null

  return (
    <Link to={`/product/${product.slug || product._id}`}
      className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {imgUrl
          ? <img src={imgUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">📦</div>
        }
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{product.name}</p>
        <p className="mt-1 text-indigo-600 font-semibold text-sm">฿{product.price.toLocaleString()}</p>
        {product.ratingCount > 0 && (
          <p className="text-xs text-yellow-500 mt-0.5">★ {product.ratingAvg.toFixed(1)}</p>
        )}
      </div>
    </Link>
  )
}

export function Component() {
  const { slug } = useParams()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    axiosClient.get(`/api/shops/${slug}`)
      .then(({ data }) => setShop(data.shop))
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (notFound) return
    setLoadingProducts(true)
    axiosClient.get(`/api/shops/${slug}/products`, { params: { page, limit: 20 } })
      .then(({ data }) => {
        setProducts(data.items)
        setTotal(data.total)
        setPages(data.pages)
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [slug, page, notFound])

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 w-full" />
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )

  if (notFound) return (
    <div className="py-24 text-center">
      <p className="text-gray-500 mb-4">ไม่พบร้านค้านี้</p>
      <Link to="/" className="text-indigo-600 hover:underline text-sm">← กลับหน้าหลัก</Link>
    </div>
  )

  if (!shop) return null

  return (
    <div>
      <div className="relative h-48 bg-indigo-100 overflow-hidden">
        {shop.bannerUrl
          ? <img src={shop.bannerUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-purple-400" />
        }
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-end gap-4 -mt-10 mb-6">
          <div className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-sm shrink-0">
            {shop.logoUrl
              ? <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {shop.name?.[0]?.toUpperCase()}
                </div>
            }
          </div>
          <div className="pb-1">
            <h1 className="text-xl font-bold text-gray-900">{shop.name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {shop.ratingAvg > 0 && (
                <span className="text-yellow-500">★ {shop.ratingAvg.toFixed(1)} <span className="text-gray-400">({shop.ratingCount})</span></span>
              )}
              <span>{total} สินค้า</span>
            </div>
          </div>
        </div>

        {shop.description && (
          <p className="mb-6 text-sm text-gray-600 max-w-2xl">{shop.description}</p>
        )}

        <h2 className="mb-4 text-base font-semibold text-gray-800">สินค้าทั้งหมด</h2>

        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-indigo-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">ยังไม่มีสินค้า</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
            {pages > 1 && (
              <div className="mt-8 mb-4 flex items-center justify-center gap-3">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  ← ก่อนหน้า
                </button>
                <span className="text-sm text-gray-500">{page} / {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  ถัดไป →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
