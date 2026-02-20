import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Server, PlusCircle } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { Server as ServerType } from '@/lib/types'

export default async function ServersPage() {
  const supabase = await createClient()

  let servers: any[] = []

  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('servers')
      .select('*, plans(name, price_cents), nodes(ip, public_ip)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    servers = data ?? []
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center justify-center">
          <Server size={22} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/60">Unable to load servers</p>
          <p className="text-xs text-white/25 mt-1">Could not connect to the database. Refresh the page to try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servers</h1>
          <p className="text-white/40 text-sm mt-1">{servers?.length ?? 0} server{servers?.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/dashboard/servers/new"
          className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-semibold px-4 py-2 rounded-full text-sm transition-colors"
        >
          <PlusCircle size={16} />
          New Server
        </Link>
      </div>

      {/* List */}
      {!servers?.length ? (
        <div className="border border-dashed border-white/10 rounded-2xl p-20 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/3 flex items-center justify-center">
            <Server size={24} className="text-white/20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold text-white/50">No servers yet</p>
            <p className="text-xs text-white/25 max-w-xs leading-relaxed">
              Deploy your first Minecraft server and have it online in under 60 seconds.
            </p>
          </div>
          <Link
            href="/dashboard/servers/new"
            className="flex items-center gap-2 text-xs font-semibold bg-white/8 hover:bg-white/12 border border-white/12 hover:border-white/25 text-white/60 hover:text-white px-5 py-2.5 rounded-xl transition-all"
          >
            <PlusCircle size={14} />
            Deploy a server
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {servers.map((server: ServerType & { plans: { name: string; price_cents: number } }) => (
            <Link
              key={server.id}
              href={`/dashboard/servers/${server.id}`}
              className="border border-white/10 hover:border-white/25 hover:bg-white/3 rounded-xl px-6 py-4 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <img
                  src="https://images.igdb.com/igdb/image/upload/t_cover_big/co8fu7.webp"
                  alt="Minecraft"
                  className="w-14 h-18 rounded-xl object-cover shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white">{server.name}</span>
                  <span className="text-white/35 text-xs font-mono">
                    {server.lxc_ip || server.nodes?.public_ip || server.nodes?.ip}:{server.port}
                    <span className="font-sans ml-2 text-white/20">· {server.mc_version} · {server.plans?.name} plan</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={server.status} />
                <span className="text-white/15 group-hover:text-white/40 transition-colors text-xs">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
