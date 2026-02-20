'use client'
import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading,
  onConfirm,
  onCancel,
}: Props) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />

      {/* card */}
      <div className="relative bg-[#0e1422] border border-white/10 rounded-2xl p-6 w-full max-w-md flex flex-col gap-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
        {/* icon + close */}
        <div className="flex items-start justify-between gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            variant === 'danger'
              ? 'bg-red-500/15 border border-red-500/25'
              : 'bg-amber-500/15 border border-amber-500/25'
          }`}>
            <AlertTriangle size={18} className={variant === 'danger' ? 'text-red-400' : 'text-amber-400'} />
          </div>
          <button
            onClick={() => !loading && onCancel()}
            className="text-white/25 hover:text-white/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* text */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
          <p className="text-white/45 text-sm leading-relaxed">{description}</p>
        </div>

        {/* buttons */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => !loading && onCancel()}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/25 text-white/50 hover:text-white text-sm font-medium transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
