import { useState, useEffect, useCallback } from 'react'
import axiosClient from '@/api/axiosClient'

const STATUS_MAP = {
  pending:   { label: 'รออนุมัติ', cls: 'bg-yellow-100 text-yellow-700' },
  active:    { label: 'เปิดขาย',  cls: 'bg-green-100 text-green-700' },
  draft:     { label: 'แบบร่าง',  cls: 'bg-gray-100 text-gray-500' },
  suspended: { label: 'ระงับ',    cls: 'bg-red-100 text-red-600' },
}

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const toImg = (id) => CLOUD && id ? `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_60/${id}` : null

const FILTERS = ['pending', 'active', 'suspended', 'all']

export function Component() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [acting, setActing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    axiosClient.get(`/api/admin/products?status=${filter}`)
      .then(({ data }) => setItems(data.items || []))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const setStatus = async (id, status) => {
    setActing(id)
    try {
      const { data } = await axiosClient.patch(`/api/admin/products/${id}/status`, { status })
      setItems((ps) => ps.map((p) => p._id === id ? data.product : p))
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally { setActing(null) }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">จัดการสินค้า</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
            {STATUS_MAP[f]?.label ?? 'ทั้งหมด'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(n=><div key={n} className="h-14 bg-gray-200 rounded-2xl animate-pulse"/>)}</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">ไม่มีสินค้า</div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">สินค้า</th>
                <th className="px-4 py-3 text-left">ร้าน</th>
                <th className="px-4 py-3 text-right">ราคา</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {toImg(p.imagePublicIds?.[0])
                      ? <img src={toImg(p.imagePublicIds[0])} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      : <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />}
                    <span className="font-medium text-gray-800 truncate max-w-[180px]">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.shopId?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">฿{p.price?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_MAP[p.status]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_MAP[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      {p.status !== 'active' && (
                        <button disabled={acting === p._id} onClick={() => setStatus(p._id, 'active')}
                          className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60">อนุมัติ</button>
                      )}
                      {p.status !== 'suspended' && (
                        <button disabled={acting === p._id} onClick={() => setStatus(p._id, 'suspended')}
                          className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">ระงับ</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
