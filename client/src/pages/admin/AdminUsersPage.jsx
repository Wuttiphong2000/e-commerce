import { useState, useEffect, useCallback } from 'react'
import axiosClient from '@/api/axiosClient'

const ROLE_MAP = {
  user:   { label: 'ผู้ใช้',   cls: 'bg-gray-100 text-gray-600' },
  seller: { label: 'ผู้ขาย',  cls: 'bg-indigo-100 text-indigo-700' },
  admin:  { label: 'แอดมิน', cls: 'bg-purple-100 text-purple-700' },
}

const FILTERS = ['all', 'user', 'seller', 'admin']

export function Component() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    const qs = filter !== 'all' ? `?role=${filter}` : ''
    axiosClient.get(`/api/admin/users${qs}`)
      .then(({ data }) => setUsers(data.users || []))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">จัดการผู้ใช้</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
            {ROLE_MAP[f]?.label ?? 'ทั้งหมด'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(n=><div key={n} className="h-12 bg-gray-200 rounded-2xl animate-pulse"/>)}</div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center text-gray-400">ไม่มีผู้ใช้</div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ผู้ใช้</th>
                <th className="px-4 py-3 text-left">อีเมล</th>
                <th className="px-4 py-3 text-center">สิทธิ์</th>
                <th className="px-4 py-3 text-right">วันที่สมัคร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.firstname} {u.lastname}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_MAP[u.role]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                      {ROLE_MAP[u.role]?.label ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('th-TH')}
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
