import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import axiosClient from '@/api/axiosClient'

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const toImg = (id) => CLOUD && id ? `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_80/${id}` : null

const STATUS_CLS = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-600',
}

function AddForm({ onAdded, onClose }) {
  const [form, setForm] = useState({ name: '', price: '', stockQty: '', description: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (file) fd.append('image', file)
      const { data } = await axiosClient.post('/api/products', fd)
      onAdded(data.product)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'เพิ่มสินค้าไม่สำเร็จ')
    } finally { setLoading(false) }
  }

  return (
    <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-5 mb-4">
      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-gray-900">เพิ่มสินค้าใหม่</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input name="name" value={form.name} onChange={onChange} placeholder="ชื่อสินค้า *" required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-500" />
          <input name="price" type="number" min="0" value={form.price} onChange={onChange} placeholder="ราคา (฿) *" required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input name="stockQty" type="number" min="0" value={form.stockQty} onChange={onChange} placeholder="จำนวนสต็อก"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-500" />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none" />
        </div>
        <textarea name="description" value={form.description} onChange={onChange} placeholder="คำอธิบาย" rows={2}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full focus:outline-none focus:border-indigo-500" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'กำลังเพิ่ม…' : 'เพิ่มสินค้า'}
        </button>
      </form>
    </div>
  )
}

function EditRow({ product, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: product.name, price: product.price, stockQty: product.stockQty ?? 0, description: product.description ?? '' })
  const [loading, setLoading] = useState(false)
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axiosClient.patch(`/api/products/${product._id}`, form)
      onSaved(data.product)
    } catch {} finally { setLoading(false) }
  }

  return (
    <tr className="bg-indigo-50">
      <td colSpan={5} className="px-4 py-3">
        <form onSubmit={onSubmit} className="flex flex-wrap gap-2 items-center">
          <input name="name" value={form.name} onChange={onChange}
            className="rounded border border-gray-300 px-2 py-1 text-sm w-48 focus:outline-none focus:border-indigo-500" />
          <input name="price" type="number" value={form.price} onChange={onChange}
            className="rounded border border-gray-300 px-2 py-1 text-sm w-24 focus:outline-none focus:border-indigo-500" />
          <input name="stockQty" type="number" value={form.stockQty} onChange={onChange}
            className="rounded border border-gray-300 px-2 py-1 text-sm w-20 focus:outline-none focus:border-indigo-500" />
          <button type="submit" disabled={loading}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {loading ? 'บันทึก…' : 'บันทึก'}
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">ยกเลิก</button>
        </form>
      </td>
    </tr>
  )
}

export function Component() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    axiosClient.get('/api/products/me?limit=50')
      .then(({ data }) => setProducts(data.items || []))
      .finally(() => setLoading(false))
  }, [])

  const handleAdded = (p) => setProducts((ps) => [p, ...ps])
  const handleSaved = (p) => setProducts((ps) => ps.map((x) => x._id === p._id ? p : x))
  const handleDelete = async (id) => {
    if (!window.confirm('ลบสินค้านี้?')) return
    try {
      await axiosClient.delete(`/api/products/${id}`)
      setProducts((ps) => ps.filter((p) => p._id !== id))
    } catch {}
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10 animate-pulse space-y-3">{[1,2,3].map(n=><div key={n} className="h-12 bg-gray-200 rounded-xl"/>)}</div>

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>

      {showAdd && <AddForm onAdded={handleAdded} onClose={() => setShowAdd(false)} />}

      {products.length === 0 ? (
        <div className="py-20 text-center text-gray-400">ยังไม่มีสินค้า กดปุ่มเพิ่มสินค้าเพื่อเริ่มต้น</div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">สินค้า</th>
                <th className="px-4 py-3 text-right">ราคา</th>
                <th className="px-4 py-3 text-right">สต็อก</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => editId === p._id ? (
                <EditRow key={p._id} product={p} onSaved={(up) => { handleSaved(up); setEditId(null) }} onCancel={() => setEditId(null)} />
              ) : (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {toImg(p.imagePublicIds?.[0])
                      ? <img src={toImg(p.imagePublicIds[0])} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 shrink-0">📦</div>
                    }
                    <span className="font-medium text-gray-800 truncate max-w-[200px]">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">฿{p.price?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{p.stockQty ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[p.status] ?? 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditId(p._id)} className="text-gray-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p._id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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

