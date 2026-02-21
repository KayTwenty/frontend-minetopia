'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Server, CreditCard, Settings, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/servers',  label: 'Servers',   icon: Server,          exact: false },
  { href: '/dashboard/billing',  label: 'Billing',   icon: CreditCard,      exact: false },
  { href: '/dashboard/settings', label: 'Settings',  icon: Settings,        exact: false },
]

function MinetopiaLogo() {
  return (
    <svg viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-7 shrink-0">
      <ellipse cx="20" cy="15" rx="19" ry="14" fill="white" />
      <circle cx="13" cy="15" r="3" fill="black" />
      <circle cx="27" cy="15" r="3" fill="black" />
    </svg>
  )
}

export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const email       = user?.email ?? ''
  const displayName = user?.user_metadata?.display_name || email.split('@')[0] || '\u2026'
  const initial     = displayName[0]?.toUpperCase() ?? '?'

  return (
    <aside className="w-56 min-h-screen bg-[#0b0f1a] border-r border-white/8 flex flex-col py-8 px-5">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <MinetopiaLogo />
        <span className="font-semibold text-sm tracking-wide text-white">Minetopia</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? 'text-white font-medium bg-white/8'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/4 font-normal'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User card */}
      <div className="mt-auto flex items-center gap-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 flex-1 min-w-0 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-emerald-400">{initial}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-white/70 truncate leading-tight">{displayName}</span>
            <span className="text-xs text-white/25 truncate leading-tight">{email}</span>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/4 transition-all shrink-0"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
