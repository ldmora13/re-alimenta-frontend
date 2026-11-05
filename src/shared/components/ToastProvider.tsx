/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Check, TriangleAlert } from 'lucide-react'

interface ToastState {
  id: number
  message: string
  tone: 'success' | 'error'
}

interface ToastContextValue {
  showToast: (message: string, tone?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), message, tone })
    timer.current = window.setTimeout(() => setToast(null), 3600)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-[#2f3a32] bg-[#111713] px-4 py-2.5 text-[12.5px] text-[#f6f1e6] shadow-[0_16px_40px_rgba(0,0,0,0.25)] transition duration-200 ${
          toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        {toast ? (
          <>
            {toast.tone === 'success' ? (
              <Check className="h-4 w-4 text-[#7fd3a0]" />
            ) : (
              <TriangleAlert className="h-4 w-4 text-[#f0a58c]" />
            )}
            <span>{toast.message}</span>
          </>
        ) : (
          <span className="opacity-0">.</span>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
