import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import axiosClient from '@/api/axiosClient'

function Section({ title, children }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
    </div>
  )
}

function ProfileForm({ user, onUpdated }) {
  const [form, setForm] = useState({ firstname: user.firstname || '', lastname: user.lastname || '', middlename: user.middlename || '', phone: user.phone || '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axiosClient.patch('/api/users/me', form)
      onUpdated(data.user)
      setMsg('บันทึกสำเร็จ')
    } catch (err) { setMsg(err.response?.data?.message || 'บันทึกไม่สำเร็จ') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="ชื่อ" name="firstname" value={form.firstname} onChange={onChange} />
        <Field label="นามสกุล" name="lastname" value={form.lastname} onChange={onChange} />
      </div>
      <Field label="ชื่อกลาง (ถ้ามี)" name="middlename" value={form.middlename} onChange={onChange} />
      <Field label="เบอร์โทร" name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="0812345678" />
      {msg && <p className="text-sm text-indigo-600">{msg}</p>}
      <button type="submit" disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {loading ? 'กำลังบันทึก…' : 'บันทึก'}
      </button>
    </form>
  )
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword.length < 8) return setMsg('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัว')
    setLoading(true)
    try {
      await axiosClient.patch('/api/users/me/password', form)
      setMsg('เปลี่ยนรหัสผ่านสำเร็จ')
      setForm({ currentPassword: '', newPassword: '' })
    } catch (err) { setMsg(err.response?.data?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="รหัสผ่านเดิม" name="currentPassword" type="password" value={form.currentPassword} onChange={onChange} placeholder="••••••••" />
      <Field label="รหัสผ่านใหม่" name="newPassword" type="password" value={form.newPassword} onChange={onChange} placeholder="•••••••• (อย่างน้อย 8 ตัว)" />
      {msg && <p className="text-sm text-indigo-600">{msg}</p>}
      <button type="submit" disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {loading ? 'กำลังเปลี่ยน…' : 'เปลี่ยนรหัสผ่าน'}
      </button>
    </form>
  )
}

function AddressesSection({ initialAddresses }) {
  const [addresses, setAddresses] = useState(initialAddresses)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ street: '', city: '', state: '', zip: '', country: 'Thailand' })
  const [loading, setLoading] = useState(false)
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onAdd = async (e) => {
    e.preventDefault()
    if (!form.street || !form.city || !form.country) return
    setLoading(true)
    try {
      const { data } = await axiosClient.post('/api/users/me/addresses', form)
      setAddresses(data.addresses)
      setForm({ street: '', city: '', state: '', zip: '', country: 'Thailand' })
      setAdding(false)
    } catch {}
    finally { setLoading(false) }
  }

  const onSetDefault = async (idx) => {
    try {
      const { data } = await axiosClient.patch(`/api/users/me/addresses/${idx}/default`)
      setAddresses(data.addresses)
    } catch {}
  }

  const onDelete = async (idx) => {
    try {
      const { data } = await axiosClient.delete(`/api/users/me/addresses/${idx}`)
      setAddresses(data.addresses)
    } catch {}
  }

  return (
    <div className="space-y-3">
      {addresses.map((addr, idx) => (
        <div key={idx} className={`rounded-lg border p-4 ${addr.isDefault ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'}`}>
          <p className="text-sm text-gray-800">{addr.street}, {addr.city} {addr.zip}</p>
          <p className="text-sm text-gray-500">{addr.state} {addr.country}</p>
          <div className="mt-2 flex gap-3">
            {addr.isDefault
              ? <span className="text-xs font-medium text-indigo-600">ที่อยู่หลัก</span>
              : <button onClick={() => onSetDefault(idx)} className="text-xs text-indigo-600 hover:underline">ตั้งเป็นหลัก</button>}
            <button onClick={() => onDelete(idx)} className="text-xs text-red-500 hover:underline">ลบ</button>
          </div>
        </div>
      ))}

      {adding ? (
        <form onSubmit={onAdd} className="space-y-3 rounded-lg border border-dashed border-gray-300 p-4">
          <Field label="ที่อยู่" name="street" value={form.street} onChange={onChange} placeholder="บ้านเลขที่ ถนน" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="เมือง" name="city" value={form.city} onChange={onChange} />
            <Field label="จังหวัด" name="state" value={form.state} onChange={onChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="รหัสไปรษณีย์" name="zip" value={form.zip} onChange={onChange} />
            <Field label="ประเทศ" name="country" value={form.country} onChange={onChange} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              ยกเลิก
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600">
          + เพิ่มที่อยู่
        </button>
      )}
    </div>
  )
}

export function Component() {
  const { user, setUser } = useAuthStore()
  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
          {user.firstname?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.firstname} {user.lastname}</p>
          <p className="text-sm text-gray-500">@{user.username} · {user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">{user.role}</span>
        </div>
      </div>

      <div className="space-y-6">
        <Section title="ข้อมูลส่วนตัว">
          <ProfileForm user={user} onUpdated={setUser} />
        </Section>
        <Section title="เปลี่ยนรหัสผ่าน">
          <PasswordForm />
        </Section>
        <Section title="ที่อยู่จัดส่ง">
          <AddressesSection initialAddresses={user.addresses || []} />
        </Section>
      </div>
    </div>
  )
}
