'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import api from '@/lib/api'
import ConfirmModal from '@/components/ConfirmModal'
import {
  User, Lock, Trash2, Check, AlertCircle, Loader2, Mail, Eye, EyeOff,
} from 'lucide-react'

export default function SettingsPage() {
  const router  = useRouter()
  const [user, setUser] = useState<any>(null)

  // Profile
  const [displayName, setDisplayName] = useState('')
  const [nameLoading, setNameLoading]   = useState(false)
  const [nameSuccess, setNameSuccess]   = useState(false)
  const [nameError, setNameError]       = useState('')

  // Password
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew]                 = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [pwLoading, setPwLoading]             = useState(false)
  const [pwSuccess, setPwSuccess]             = useState(false)
  const [pwError, setPwError]                 = useState('')

  // Delete
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    document.title = 'Settings — Minetopia'
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setDisplayName(data.user?.user_metadata?.display_name ?? '')
    })
  }, [])

  const saveDisplayName = async () => {
    if (!displayName.trim()) return
    setNameLoading(true)
    setNameError('')
    setNameSuccess(false)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      })
      if (error) throw error
      setUser((u: any) => ({ ...u, user_metadata: { ...u.user_metadata, display_name: displayName.trim() } }))
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err: any) {
      setNameError(err.message)
    } finally {
      setNameLoading(false)
    }
  }

  const changePassword = async () => {
    setPwError('')
    setPwSuccess(false)
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }
    setPwLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 4000)
    } catch (err: any) {
      setPwError(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  const deleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await api.delete('/api/account')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch {
      setDeleteLoading(false)
      setDeleteOpen(false)
    }
  }

  const email       = user?.email ?? ''
  const name        = user?.user_metadata?.display_name || email.split('@')[0] || '?'
  const initial     = name[0].toUpperCase()
  const joinedAt    = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full">

      {/* Page title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-white/35 text-sm">Manage your account and preferences</p>
      </div>

      {/* ── Profile card ── */}
      <section className="flex flex-col gap-5 bg-white/4 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-white/8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-emerald-400">{initial}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-white">{name}</p>
            <p className="text-xs text-white/35">{email}</p>
            {joinedAt && <p className="text-xs text-white/20 mt-0.5">Member since {joinedAt}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/40 font-medium uppercase tracking-wider">Display Name</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveDisplayName()}
                placeholder="Your display name"
                maxLength={32}
                className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl px-3 py-2.5 pl-9 text-sm text-white placeholder-white/20 outline-none transition-colors"
              />
            </div>
            <button
              onClick={saveDisplayName}
              disabled={nameLoading || !displayName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/25 text-sm font-medium text-white/60 hover:text-white transition-all disabled:opacity-40"
            >
              {nameLoading ? <Loader2 size={14} className="animate-spin" /> : nameSuccess ? <Check size={14} className="text-emerald-400" /> : null}
              {nameSuccess ? 'Saved' : 'Save'}
            </button>
          </div>
          {nameError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
              <AlertCircle size={12} />{nameError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-white/40 font-medium uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              type="email"
              value={email}
              readOnly
              className="w-full bg-white/3 border border-white/8 rounded-xl px-3 py-2.5 pl-9 text-sm text-white/40 outline-none cursor-default"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-md px-2 py-0.5">
              verified
            </span>
          </div>
        </div>
      </section>

      {/* ── Security card ── */}
      <section className="flex flex-col gap-5 bg-white/4 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 pb-5 border-b border-white/8">
          <Lock size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white/80">Security</h2>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-xs text-white/40 font-medium uppercase tracking-wider">New Password</label>

          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-white/20 outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            >
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              onKeyDown={e => e.key === 'Enter' && changePassword()}
              className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-white/20 outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            >
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {pwError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12} />{pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Check size={12} />Password updated successfully
            </p>
          )}

          <button
            onClick={changePassword}
            disabled={pwLoading || !newPassword || !confirmPassword}
            className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/25 text-sm font-medium text-white/60 hover:text-white transition-all disabled:opacity-40 mt-1"
          >
            {pwLoading && <Loader2 size={14} className="animate-spin" />}
            Update Password
          </button>
        </div>
      </section>

      {/* ── Danger zone ── */}
      <section className="flex flex-col gap-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-red-500/15">
          <AlertCircle size={15} className="text-red-400/70" />
          <h2 className="text-sm font-semibold text-red-400/80">Danger Zone</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/60">Delete account</p>
            <p className="text-xs text-white/25 mt-0.5">Permanently delete your account and all servers. This cannot be undone.</p>
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-sm font-medium text-red-400 transition-all shrink-0"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </section>

      <ConfirmModal
        open={deleteOpen}
        title="Delete your account?"
        description="All your servers will be destroyed and your account permanently deleted. This action cannot be undone."
        confirmLabel="Delete My Account"
        variant="danger"
        loading={deleteLoading}
        onConfirm={deleteAccount}
        onCancel={() => { if (!deleteLoading) setDeleteOpen(false) }}
      />
    </div>
  )
}
