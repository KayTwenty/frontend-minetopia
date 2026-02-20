'use client'
import { useEffect } from 'react'
import { AlertCircle, RotateCcw, WifiOff } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard error boundary]', error)
  }, [error])

  const isNetworkError =
    error.message?.toLowerCase().includes('fetch') ||
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('econnrefused')

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-7 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        {isNetworkError
          ? <WifiOff size={26} className="text-red-400" />
          : <AlertCircle size={26} className="text-red-400" />}
      </div>

      <div className="flex flex-col gap-2 max-w-sm">
        <h2 className="text-xl font-bold tracking-tight">
          {isNetworkError ? 'Can\'t reach the server' : 'Something went wrong'}
        </h2>
        <p className="text-white/35 text-sm leading-relaxed">
          {isNetworkError
            ? 'The API is unreachable. Make sure the backend is running and your connection is stable.'
            : 'An unexpected error occurred loading this page.'}
        </p>
        {error.digest && (
          <p className="text-white/15 text-xs font-mono mt-1">ref: {error.digest}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm font-medium bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/25 px-5 py-2.5 rounded-xl text-white/70 hover:text-white transition-all"
        >
          <RotateCcw size={14} />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="text-sm text-white/30 hover:text-white/60 transition-colors px-3 py-2.5"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
