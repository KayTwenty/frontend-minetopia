import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusCircle, Activity, Server } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { Server as ServerType } from '@/lib/types'

export const metadata = { title: 'Dashboard — Minetopia' }

export default async function DashboardPage() {
  const supabase = await createClient()

  let user: any = null
  let servers: any[] = []

  try {
    const { data: { user: u } } = await supabase.auth.getUser()
    user = u
    const { data } = await supabase
      .from('servers')
      .select('*, plans(name, price_cents), nodes(ip, public_ip)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    servers = data ?? []
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="w-12 h-12 rounded-full border border-red-500/20 bg-red-500/10 flex items-center justify-center">
          <Activity size={20} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/60">Unable to load dashboard</p>
          <p className="text-xs text-white/25 mt-1">Could not connect to the database. Refresh the page to try again.</p>
        </div>
      </div>
    )
  }

  const runningCount  = servers.filter((s: any) => s.status === 'running').length
  const stoppedCount   = servers.filter((s: any) => s.status === 'stopped').length
  const totalCount    = servers.length
  const username      = user?.email?.split('@')[0] ?? 'there'

  return (
    <div className="flex flex-col gap-10">

      {/* ── Welcome ── */}
      <div className="flex items-end justify-between border-b border-white/8 pb-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-white/25">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {username}</h1>
          <p className="text-white/35 text-sm mt-0.5">{user?.email}</p>
        </div>
        <Link
          href="/dashboard/servers/new"
          className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          <PlusCircle size={15} />
          New Server
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-4 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-wider">Total</span>
            <Server size={14} className="text-white/20" />
          </div>
          <p className="text-5xl font-bold tracking-tight">{totalCount}</p>
          <p className="text-xs text-white/25">server{totalCount !== 1 ? 's' : ''} deployed</p>
        </div>
        <div className="flex flex-col gap-4 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-500/60 uppercase tracking-wider">Online</span>
            <Activity size={14} className="text-green-500/40" />
          </div>
          <p className="text-5xl font-bold tracking-tight text-green-400">{runningCount}</p>
          <p className="text-xs text-green-500/40">running right now</p>
        </div>
        <div className="flex flex-col gap-4 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-wider">Stopped</span>
            <span className="w-2 h-2 rounded-full bg-white/15" />
          </div>
          <p className="text-5xl font-bold tracking-tight text-white/40">{stoppedCount}</p>
          <p className="text-xs text-white/20">server{stoppedCount !== 1 ? 's' : ''} stopped</p>
        </div>
      </div>

      {/* ── Recent servers ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-white/25">Recent Servers</p>
          {totalCount > 0 && (
            <Link href="/dashboard/servers" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              View all →
            </Link>
          )}
        </div>

        {!servers?.length ? (
          <div className="border border-dashed border-white/8 rounded-2xl p-16 flex flex-col items-center gap-5 text-center">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
              <Server size={20} className="text-white/20" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-white/40">No servers yet</p>
              <p className="text-xs text-white/20">Deploy your first server to get started</p>
            </div>
            <Link
              href="/dashboard/servers/new"
              className="text-xs text-white/40 hover:text-white border border-white/15 hover:border-white/30 px-4 py-2 rounded-lg transition-all"
            >
              Deploy a server
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/6 border border-white/10 rounded-2xl overflow-hidden">
            {(servers as (ServerType & { plans: { name: string; price_cents: number } })[])
              .slice(0, 5)
              .map(server => (
              <Link
                key={server.id}
                href={`/dashboard/servers/${server.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <img
                    src="https://images.igdb.com/igdb/image/upload/t_cover_big/co8fu7.webp"
                    alt="Minecraft"
                    className="w-14 h-18 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-white">{server.name}</span>
                    <span className="text-xs text-white/25 font-mono">
                      {server.lxc_ip || server.nodes?.public_ip || server.nodes?.ip}:{server.port}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/20 hidden sm:block">{server.mc_version}</span>
                  <StatusBadge status={server.status} />
                  <span className="text-white/10 group-hover:text-white/30 transition-colors text-xs">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
