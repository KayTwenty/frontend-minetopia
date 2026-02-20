'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'

function MinetopiaLogo() {
  return (
    <svg viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-6 shrink-0">
      <ellipse cx="20" cy="15" rx="19" ry="14" fill="white" />
      <circle cx="13" cy="15" r="3" fill="black" />
      <circle cx="27" cy="15" r="3" fill="black" />
    </svg>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)

  // Supabase puts the recovery token in the URL hash; the client library
  // will handle it automatically once we call getSession.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidSession(!!session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-150 h-150 bg-emerald-500/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col gap-8">
        <Link href="/" className="flex items-center gap-2.5 justify-center">
          <MinetopiaLogo />
          <span className="font-bold text-lg tracking-wide text-white">Minetopia</span>
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6 backdrop-blur-xl">
          {validSession === null ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
            </div>

          ) : !validSession ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <AlertCircle size={28} className="text-red-400" />
              <div>
                <h1 className="text-xl font-bold">Link expired</h1>
                <p className="text-white/40 text-sm mt-1">This reset link is invalid or has expired.</p>
              </div>
              <Link href="/forgot-password" className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                Request a new link
              </Link>
            </div>

          ) : done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <CheckCircle size={22} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Password updated</h1>
                <p className="text-white/40 text-sm mt-1">Redirecting you to your dashboard…</p>
              </div>
            </div>

          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">New password</h1>
                <p className="text-white/40 text-sm">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/40 uppercase tracking-wide">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/60 transition-colors"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/40 uppercase tracking-wide">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/60 transition-colors"
                    placeholder="Re-enter your password"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors mt-1"
                >
                  {loading ? 'Saving…' : <><span>Set New Password</span><ArrowRight size={15} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
