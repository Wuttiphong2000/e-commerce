import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '@/api/axiosClient'

function Field({ label, name, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
    </div>
  )
}

export function Component() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({ name: '', slug: '', description: '', street: '', city: '', state: '', zip: '', country: 'Thailand' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosClient.get('/api/shops/me')
      .then(() => navigate('/seller/dashboard', { replace: true }))
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [navigate])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await axiosClient.post('/api/shops', form)
      navigate('/seller/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'สมัครเปิดร้านไม่สำเร็จ')
    } finally { setLoading(false) }
  }

  if (checking) return null

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">เปิดร้านค้า</h1>
      <p className="text-sm text-gray-500 mb-8">กรอกข้อมูลเพื่อสมัครเป็นผู้ขาย ทีมงานจะตรวจสอบและอนุมัติภายใน 1-3 วันทำการ</p>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-2xl bg-white shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">ข้อมูลร้านค้า</h2>
          <Field label="ชื่อร้าน" name="name" value={form.name} onChange={onChange} placeholder="ร้านของฉัน" required />
          <Field label="Slug (URL ร้าน)" name="slug" value={form.slug} onChange={onChange} placeholder="my-shop" required />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">คำอธิบายร้าน</label>
            <textarea name="description" value={form.description} onChange={onChange} rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="แนะนำร้านของคุณ..." />
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">ที่อยู่ร้าน</h2>
          <Field label="ที่อยู่" name="street" value={form.street} onChange={onChange} placeholder="บ้านเลขที่ ถนน" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="เมือง" name="city" value={form.city} onChange={onChange} required />
            <Field label="จังหวัด" name="state" value={form.state} onChange={onChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="รหัสไปรษณีย์" name="zip" value={form.zip} onChange={onChange} />
            <Field label="ประเทศ" name="country" value={form.country} onChange={onChange} required />
          </div>
        </div>
        {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {loading ? 'กำลังสมัคร…' : 'สมัครเปิดร้าน'}
        </button>
      </form>
    </main>
  )
}

