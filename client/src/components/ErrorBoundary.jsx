import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-8 text-center">
          <div>
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาดที่ไม่คาดคิด</h1>
            <p className="text-sm text-gray-500 mb-6">กรุณารีเฟรชหน้าเพื่อลองใหม่</p>
            <button onClick={() => window.location.reload()}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              รีเฟรชหน้า
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
