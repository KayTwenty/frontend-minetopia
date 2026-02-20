'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'

function MinetopiaLogo() {
  return (
    <svg viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-6 shrink-0">
      <ellipse cx="20" cy="15" rx="19" ry="14" fill="white" />
      <circle cx="13" cy="15" r="3" fill="black" />
      <circle cx="27" cy="15" r="3" fill="black" />
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
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
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-white/40 text-sm">Get your server online in minutes</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/40 uppercase tracking-wide">Password</label>
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
              {loading ? 'Creating account…' : <><span>Create Account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-white/20 text-xs text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <span className="text-white/40">Terms of Service</span> and{' '}
            <span className="text-white/40">Privacy Policy</span>.
          </p>
        </div>

        <p className="text-white/30 text-sm text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

