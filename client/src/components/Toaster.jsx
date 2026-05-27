import { useToastStore } from '@/store/toastStore'

export default function Toaster() {
  const { toasts, dismiss } = useToastStore()
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(({ id, message, type }) => (
        <div key={id} onClick={() => dismiss(id)}
          className={`pointer-events-auto max-w-xs rounded-xl px-4 py-3 text-sm font-medium shadow-lg cursor-pointer transition-all
            ${type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
          {message}
        </div>
      ))}
    </div>
  )
}
