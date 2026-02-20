import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Server, CreditCard, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard',         label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/servers', label: 'Servers',   icon: Server,          exact: false },
  { href: '/dashboard/billing', label: 'Billing',   icon: CreditCard,      exact: false },
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
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-[#111827] border-r border-white/8 flex flex-col py-8 px-5">
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
              className={`group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                active
                  ? 'text-white font-medium'
                  : 'text-white/35 hover:text-white/70 font-normal'
              }`}
            >
              <span className={`w-0.5 h-4 rounded-full transition-all ${
                active ? 'bg-white' : 'bg-transparent group-hover:bg-white/20'
              }`} />
              <Icon size={15} className="shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/20 hover:text-white/50 transition-all"
      >
        <span className="w-0.5 h-4" />
        <LogOut size={15} className="shrink-0" />
        Sign Out
      </button>
    </aside>
  )
}
