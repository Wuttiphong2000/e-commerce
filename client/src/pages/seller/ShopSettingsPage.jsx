import { useState, useEffect } from 'react'
import axiosClient from '@/api/axiosClient'

function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function SaveBtn({ loading, label = 'บันทึก' }) {
  return (
    <button type="submit" disabled={loading}
      className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
      {loading ? 'กำลังบันทึก…' : label}
    </button>
  )
}

function Msg({ text }) {
  if (!text) return null
  const isErr = text.includes('ไม่') || text.includes('fail')
  return <p className={`mt-2 text-sm ${isErr ? 'text-red-600' : 'text-indigo-600'}`}>{text}</p>
}

function BasicForm({ shop }) {
  const [form, setForm] = useState({ name: shop.name || '', description: shop.description || '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('')
    try { await axiosClient.patch('/api/shops/me', form); setMsg('บันทึกสำเร็จ') }
    catch (err) { setMsg(err.response?.data?.message || 'บันทึกไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อร้าน</label>
        <input name="name" value={form.name} onChange={onChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">คำอธิบาย</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>
      <SaveBtn loading={loading} />
      <Msg text={msg} />
    </form>
  )
}

function ImagesForm() {
  const [logo, setLogo] = useState(null)
  const [banner, setBanner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const onSubmit = async (e) => {
    e.preventDefault()
    if (!logo && !banner) return
    setLoading(true); setMsg('')
    try {
      const fd = new FormData()
      if (logo) fd.append('logo', logo)
      if (banner) fd.append('banner', banner)
      await axiosClient.patch('/api/shops/me/images', fd)
      setMsg('อัปโหลดรูปสำเร็จ'); setLogo(null); setBanner(null)
    } catch (err) { setMsg(err.response?.data?.message || 'อัปโหลดไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">โลโก้ร้าน</label>
        <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])}
          className="w-full text-sm text-gray-600" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">แบนเนอร์ร้าน</label>
        <input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files[0])}
          className="w-full text-sm text-gray-600" />
      </div>
      <SaveBtn loading={loading} label="อัปโหลด" />
      <Msg text={msg} />
    </form>
  )
}

function PoliciesForm({ shop }) {
  const [form, setForm] = useState({
    shippingPolicy: shop.shippingPolicy || '',
    returnPolicy: shop.returnPolicy || '',
    warrantyPolicy: shop.warrantyPolicy || '',
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('')
    try { await axiosClient.patch('/api/shops/me/policies', form); setMsg('บันทึกนโยบายสำเร็จ') }
    catch (err) { setMsg(err.response?.data?.message || 'บันทึกไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  const textField = (label, name) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea name={name} value={form[name]} onChange={onChange} rows={2}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
    </div>
  )
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {textField('นโยบายการจัดส่ง', 'shippingPolicy')}
      {textField('นโยบายการคืนสินค้า', 'returnPolicy')}
      {textField('นโยบายการรับประกัน', 'warrantyPolicy')}
      <SaveBtn loading={loading} />
      <Msg text={msg} />
    </form>
  )
}

function VacationForm({ shop }) {
  const [on, setOn] = useState(!!shop.vacationMode)
  const [msg, setMsg] = useState(shop.vacationMessage || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setResult('')
    try {
      await axiosClient.patch('/api/shops/me/vacation', { vacationMode: on, vacationMessage: msg })
      setResult('บันทึกสำเร็จ')
    } catch (err) { setResult(err.response?.data?.message || 'บันทึกไม่สำเร็จ') }
    finally { setLoading(false) }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <div onClick={() => setOn(!on)}
          className={`w-11 h-6 rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-gray-300'} relative`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">เปิดโหมดพักร้อน</span>
      </label>
      {on && (
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="ข้อความแสดงต่อลูกค้า"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      )}
      <SaveBtn loading={loading} />
      <Msg text={result} />
    </form>
  )
}

export function Component() {
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosClient.get('/api/shops/me')
      .then(({ data }) => setShop(data.shop))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="mx-auto max-w-2xl px-4 py-10 animate-pulse space-y-4">{[1,2,3].map(n=><div key={n} className="h-40 bg-gray-200 rounded-2xl"/>)}</div>
  if (!shop) return <div className="py-20 text-center text-gray-400">ไม่พบข้อมูลร้าน</div>

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าร้าน</h1>
      <Section title="ข้อมูลทั่วไป"><BasicForm shop={shop} /></Section>
      <Section title="รูปโลโก้ / แบนเนอร์"><ImagesForm /></Section>
      <Section title="นโยบายร้าน"><PoliciesForm shop={shop} /></Section>
      <Section title="โหมดพักร้อน"><VacationForm shop={shop} /></Section>
    </main>
  )
}

