import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '@/api/axiosClient'

const CATEGORIES = ['เสื้อผ้า', 'อิเล็กทรอนิกส์', 'ความงาม', 'กีฬา', 'หนังสือ', 'ของเล่น', 'เครื่องครัว', 'เฟอร์นิเจอร์', 'อาหาร', 'สัตว์เลี้ยง']
const SORT_OPTIONS = [
  { value: 'newest', label: 'ใหม่ล่าสุด' },
  { value: 'price_asc', label: 'ราคา: ต่ำ → สูง' },
  { value: 'price_desc', label: 'ราคา: สูง → ต่ำ' },
]

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

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
          : <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">📦</div>
        }
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{product.name}</p>
        <p className="mt-1 text-indigo-600 font-semibold text-sm">฿{product.price.toLocaleString()}</p>
        {product.shopId && <p className="mt-1 text-xs text-gray-400 truncate">{product.shopId.name}</p>}
        {product.ratingCount > 0 && (
          <p className="text-xs text-yellow-500 mt-0.5">★ {product.ratingAvg.toFixed(1)} <span className="text-gray-400">({product.ratingCount})</span></p>
        )}
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-indigo-100 rounded w-1/3" />
      </div>
    </div>
  )
}

function FilterSidebar({ filters, onChange }) {
  return (
    <aside className="w-52 shrink-0 space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">หมวดหมู่</h3>
        <ul className="space-y-0.5">
          <li>
            <button onClick={() => onChange('category', '')}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${!filters.category ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              ทั้งหมด
            </button>
          </li>
          {CATEGORIES.map(cat => (
            <li key={cat}>
              <button onClick={() => onChange('category', cat)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${filters.category === cat ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">ช่วงราคา (฿)</h3>
        <div className="space-y-2">
          <input type="number" placeholder="ราคาต่ำสุด" value={filters.minPrice}
            onChange={e => onChange('minPrice', e.target.value)} min={0}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
          <input type="number" placeholder="ราคาสูงสุด" value={filters.maxPrice}
            onChange={e => onChange('maxPrice', e.target.value)} min={0}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
        </div>
      </div>
    </aside>
  )
}

export function Component() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [filters, setFilters] = useState({ category: '', minPrice: '', maxPrice: '' })

  const debouncedSearch = useDebounce(search)

  const onFilterChange = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }, [])

  useEffect(() => { setPage(1) }, [debouncedSearch, sort])

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: 20, sort }
    if (debouncedSearch) params.q = debouncedSearch
    if (filters.category) params.category = filters.category
    if (filters.minPrice) params.minPrice = filters.minPrice
    if (filters.maxPrice) params.maxPrice = filters.maxPrice

    axiosClient.get('/api/products', { params })
      .then(({ data }) => {
        setProducts(data.items)
        setTotal(data.total)
        setPages(data.pages)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, sort, debouncedSearch, filters])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาสินค้า…"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex gap-8">
        <FilterSidebar filters={filters} onChange={onFilterChange} />

        <div className="flex-1 min-w-0">
          {!loading && total > 0 && (
            <p className="mb-3 text-sm text-gray-500">พบ {total.toLocaleString()} รายการ</p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center text-gray-400 text-sm">ไม่พบสินค้า</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>

              {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
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
    </div>
  )
}
