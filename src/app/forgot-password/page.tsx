'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle } from 'lucide-react'

function MinetopiaLogo() {
  return (
    <svg viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-6 shrink-0">
      <ellipse cx="20" cy="15" rx="19" ry="14" fill="white" />
      <circle cx="13" cy="15" r="3" fill="black" />
      <circle cx="27" cy="15" r="3" fill="black" />
    </svg>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white flex items-center justify-center px-4">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-150 h-150 bg-emerald-500/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col gap-8">
        {/* logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center">
          <MinetopiaLogo />
          <span className="font-bold text-lg tracking-wide text-white">Minetopia</span>
        </Link>

        {/* card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6 backdrop-blur-xl">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <CheckCircle size={22} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Check your email</h1>
                <p className="text-white/40 text-sm mt-1">
                  We sent a reset link to <span className="text-white/60">{email}</span>
                </p>
              </div>
              <p className="text-white/25 text-xs">
                Didn&apos;t receive it? Check your spam folder, or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
                <p className="text-white/40 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/40 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/60 transition-colors"
                    placeholder="you@example.com"
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
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors mt-1"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-white/30 hover:text-white/60 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
