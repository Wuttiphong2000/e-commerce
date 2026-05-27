import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosClient from '@/api/axiosClient'

export function Component() {
  const [form, setForm] = useState({ firstname: '', lastname: '', username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { firstname, lastname, username, email, password } = form
    if (!firstname || !lastname || !username || !email || !password)
      return setError('กรุณากรอกข้อมูลให้ครบ')
    if (password.length < 8) return setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    setLoading(true)
    try {
      await axiosClient.post('/api/users/register', form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'firstname', label: 'ชื่อ', type: 'text', placeholder: 'ชื่อ' },
    { name: 'lastname', label: 'นามสกุล', type: 'text', placeholder: 'นามสกุล' },
    { name: 'username', label: 'Username', type: 'text', placeholder: 'username' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
    { name: 'password', label: 'รหัสผ่าน', type: 'password', placeholder: '•••••••• (อย่างน้อย 8 ตัว)' },
  ]

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">สมัครสมาชิก</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
              <input
                name={name} type={type} value={form[name]} onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'กำลังสมัคร…' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          มีบัญชีแล้ว?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  )
}
