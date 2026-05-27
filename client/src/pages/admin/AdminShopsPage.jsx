import { useState, useEffect, useCallback } from 'react'
import axiosClient from '@/api/axiosClient'

const STATUS_MAP = {
  pending:   { label: 'รออนุมัติ',  cls: 'bg-yellow-100 text-yellow-700' },
  active:    { label: 'เปิดขาย',   cls: 'bg-green-100 text-green-700' },
  suspended: { label: 'ระงับแล้ว', cls: 'bg-red-100 text-red-700' },
  rejected:  { label: 'ปฏิเสธ',    cls: 'bg-red-100 text-red-600' },
  closed:    { label: 'ปิดแล้ว',   cls: 'bg-gray-100 text-gray-500' },
}

const KYC_MAP = {
  none:      { label: 'ไม่มี KYC',   cls: 'bg-gray-100 text-gray-500' },
  submitted: { label: 'รอตรวจ KYC', cls: 'bg-yellow-100 text-yellow-700' },
  verified:  { label: 'KYC ผ่าน',   cls: 'bg-green-100 text-green-700' },
  rejected:  { label: 'KYC ปฏิเสธ', cls: 'bg-red-100 text-red-600' },
}

function Badge({ map, value }) {
  const { label, cls } = map[value] ?? { label: value, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}

const FILTERS = ['pending', 'active', 'suspended', 'all']

export function Component() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [acting, setActing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const qs = filter !== 'all' ? `?status=${filter}` : ''
    axiosClient.get(`/api/admin/shops${qs}`)
      .then(({ data }) => setShops(data.shops || []))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const act = async (id, action, body = {}) => {
    setActing(id)
    try {
      const { data } = await axiosClient.patch(`/api/admin/shops/${id}/${action}`, body)
      setShops((ss) => ss.map((s) => s._id === id ? data.shop : s))
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด')
    } finally { setActing(null) }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">จัดการร้านค้า</h1>

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
      ) : shops.length === 0 ? (
        <div className="py-20 text-center text-gray-400">ไม่มีร้านค้า</div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ร้าน</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">KYC</th>
                <th className="px-4 py-3 text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shops.map((shop) => (
                <tr key={shop._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{shop.name}</p>
                    <p className="text-xs text-gray-400">/{shop.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-center"><Badge map={STATUS_MAP} value={shop.status} /></td>
                  <td className="px-4 py-3 text-center"><Badge map={KYC_MAP} value={shop.kycStatus} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {shop.status === 'pending' && (<>
                        <button disabled={acting === shop._id} onClick={() => act(shop._id, 'approve')}
                          className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60">อนุมัติ</button>
                        <button disabled={acting === shop._id} onClick={() => act(shop._id, 'reject', { reason: 'ข้อมูลไม่ครบถ้วน' })}
                          className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60">ปฏิเสธ</button>
                      </>)}
                      {shop.status === 'active' && (
                        <button disabled={acting === shop._id} onClick={() => act(shop._id, 'status', { status: 'suspended' })}
                          className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">ระงับ</button>
                      )}
                      {shop.status === 'suspended' && (
                        <button disabled={acting === shop._id} onClick={() => act(shop._id, 'status', { status: 'active' })}
                          className="rounded-lg border border-green-300 px-2.5 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:opacity-60">เปิดใหม่</button>
                      )}
                      {shop.kycStatus === 'submitted' && (<>
                        <button disabled={acting === shop._id} onClick={() => act(shop._id, 'kyc', { kycStatus: 'verified' })}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">KYC ✓</button>
                        <button disabled={acting === shop._id} onClick={() => act(shop._id, 'kyc', { kycStatus: 'rejected', reason: 'เอกสารไม่ถูกต้อง' })}
                          className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60">KYC ✗</button>
                      </>)}
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
