'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Server, ServerMetrics } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { Play, Square, RotateCcw, Copy, Check, Trash2, Users, Cpu, MemoryStick, Wifi, SlidersHorizontal, LayoutDashboard, AlertCircle } from 'lucide-react'
import ConsolePanel from './ConsolePanel'
import ConfirmModal from '@/components/ConfirmModal'
import PropertiesPanel from './PropertiesPanel'

export default function ServerPage() {
  const { id } = useParams<{ id: string }>()
  const [server, setServer]           = useState<Server | null>(null)
  const [metrics, setMetrics]         = useState<ServerMetrics | null>(null)
  const [loading, setLoading]         = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied]           = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [tab, setTab]                     = useState<'overview' | 'settings'>('overview')
  const [modal, setModal]                 = useState<{
    title: string; description: string
    confirmLabel: string; variant: 'danger' | 'warning'
    action: () => Promise<void>
  } | null>(null)
  const [modalLoading, setModalLoading]   = useState(false)
  const router = useRouter()
  const deleted = useRef(false)

  const fetchServer = async () => {
    if (deleted.current) return
    try {
      const { data } = await api.get(`/api/servers/${id}`)
      setServer(data)
      setLoading(false)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Server was deleted — stop polling and go back
        deleted.current = true
        router.push('/dashboard')
      }
    }
  }

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get(`/api/servers/${id}/metrics`)
      setMetrics(data)
    } catch {
      setMetrics(null)
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  useEffect(() => {
    fetchServer()
    const interval = setInterval(() => {
      fetchServer()
    }, 5000)
    return () => clearInterval(interval)
  }, [id])

  // Only poll metrics when the server is actually running
  useEffect(() => {
    if (server?.status !== 'running') {
      setMetrics(null)
      return
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [server?.status])

  const powerAction = async (action: 'start' | 'stop' | 'restart') => {
    setActionLoading(true)
    try {
      await api.post(`/api/servers/${id}/${action}`)
      await fetchServer()
    } finally {
      setActionLoading(false)
    }
  }

  const openModal = (cfg: NonNullable<typeof modal>) => setModal(cfg)

  const runModal = async () => {
    if (!modal) return
    setModalLoading(true)
    try {
      await modal.action()
      setModal(null)
    } finally {
      setModalLoading(false)
    }
  }

  const deleteServer = () => openModal({
    title: `Delete "${server?.name}"?`,
    description: 'This will permanently destroy the server and all world data. This action cannot be undone.',
    confirmLabel: 'Delete Server',
    variant: 'danger',
    action: async () => {
      setDeleteLoading(true)
      try {
        deleted.current = true
        await api.delete(`/api/servers/${id}`)
        router.push('/dashboard')
      } catch {
        deleted.current = false
        setDeleteLoading(false)
      }
    },
  })

  const copyAddress = () => {
    const addr = `${server?.lxc_ip || server?.nodes?.public_ip || server?.nodes?.ip}:${server?.port}`
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-10 animate-pulse">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-18 rounded-xl bg-white/8 shrink-0" />
          <div className="flex flex-col gap-2.5">
            <div className="h-7 w-48 bg-white/8 rounded-xl" />
            <div className="h-4 w-32 bg-white/5 rounded-lg" />
          </div>
        </div>
        <div className="h-8 w-20 bg-white/5 rounded-lg shrink-0" />
      </div>
      <div className="h-12 bg-white/5 border border-white/10 rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-28" />
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl h-16" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-14" />
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl h-64" />
    </div>
  )
  if (!server) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="w-12 h-12 rounded-full border border-red-500/20 bg-red-500/10 flex items-center justify-center">
        <AlertCircle size={20} className="text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/60">Server not found</p>
        <p className="text-xs text-white/25 mt-1">This server may have been deleted or you don't have access.</p>
      </div>
    </div>
  )

  const isRunning  = server.status === 'running'
  const address    = `${server.lxc_ip || server.nodes?.public_ip || server.nodes?.ip}:${server.port}`
  const ramPercent = metrics ? Math.round((metrics.ram_used_mb / metrics.ram_limit_mb) * 100) : 0

  const cpuVal   = metrics?.cpu_percent ?? 0
  const cpuColor = cpuVal >= 80 ? 'text-red-400' : cpuVal >= 50 ? 'text-yellow-400' : 'text-white'
  const cpuBar   = cpuVal >= 80 ? 'bg-red-500'   : cpuVal >= 50 ? 'bg-yellow-400'   : 'bg-emerald-400'
  const ramColor = ramPercent >= 80 ? 'text-red-400' : ramPercent >= 50 ? 'text-yellow-400' : 'text-white'
  const ramBar   = ramPercent >= 80 ? 'bg-red-500'   : ramPercent >= 50 ? 'bg-yellow-400'   : 'bg-emerald-400'

  const canStart   = !actionLoading && !['running','starting','installing'].includes(server.status)
  const canStop    = !actionLoading && !['stopped','stopping','installing'].includes(server.status)
  const canRestart = !actionLoading && server.status === 'running'
  const canDelete  = !deleteLoading && !['running','starting','stopping','installing'].includes(server.status)

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-10">

      {/*  Header card  */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images.igdb.com/igdb/image/upload/t_cover_big/co8fu7.webp"
            alt="Minecraft"
            className="w-14 h-18 rounded-xl object-cover shrink-0 shadow-lg"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{server.name}</h1>
              <StatusBadge status={server.status} />
            </div>
            <p className="text-white/40 text-sm">
              Minecraft {server.mc_version} · Vanilla
              {server.port && <span className="ml-2 text-white/25">:{server.port}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={deleteServer}
          disabled={!canDelete}
          title={!canDelete ? (server.status === 'installing' ? 'Wait for installation to finish' : server.status === 'stopping' ? 'Wait for the server to stop' : 'Stop the server before deleting') : 'Delete server'}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-25 shrink-0"
        >
          <Trash2 size={13} />
          {deleteLoading ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {/*  Error status banner  */}
      {server.status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-400 text-sm">Server encountered an error</p>
            <p className="text-white/40 text-xs mt-1.5">
              Installation failed or the container crashed. Delete this server and create a new one to try again.
            </p>
          </div>
        </div>
      )}

      {/*  Tab bar  */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
        <button
          onClick={() => setTab('overview')}
          className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'overview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          <LayoutDashboard size={14} /> Overview
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'settings' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          <SlidersHorizontal size={14} /> Settings
        </button>
      </div>

      {tab === 'overview' && (<>

      {/*  Stats row  */}
      <div className={`grid grid-cols-3 gap-3 transition-opacity duration-500 ${isRunning && metrics ? 'opacity-100' : 'opacity-35'}`}>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/40">
            <Cpu size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">CPU</span>
          </div>
          <p className={`text-3xl font-bold leading-none transition-colors duration-500 ${cpuColor}`}>
            {cpuVal.toFixed(1)}<span className="text-base font-normal text-white/30 ml-1">%</span>
          </p>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${cpuBar}`} style={{ width: `${Math.min(cpuVal, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/40">
            <MemoryStick size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">RAM</span>
          </div>
          <p className={`text-3xl font-bold leading-none transition-colors duration-500 ${ramColor}`}>
            {metrics?.ram_used_mb ?? 0}<span className="text-base font-normal text-white/30 ml-1">MB</span>
          </p>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${ramBar}`} style={{ width: `${ramPercent}%` }} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/40">
            <Users size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">Players</span>
          </div>
          <p className="text-3xl font-bold leading-none">
            {metrics?.players_online ?? 0}
            <span className="text-base font-normal text-white/30 ml-1">online</span>
          </p>
          {metrics?.player_names && metrics.player_names.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {metrics.player_names.map(name => (
                <span key={name} className="text-xs bg-white/8 text-white/60 rounded-md px-1.5 py-0.5">{name}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/25">No one connected yet</p>
          )}
        </div>
      </div>

      {/*  Connection address  */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${isRunning ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-white/30'}`}>
            <Wifi size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/40 mb-0.5">Server Address</p>
            <p className="font-mono text-sm text-white truncate">{address}</p>
          </div>
        </div>
        <button
          onClick={copyAddress}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 hover:border-white/35 hover:bg-white/5 text-white/45 hover:text-white transition-all shrink-0"
        >
          {copied
            ? <><Check size={12} className="text-emerald-400" /> Copied!</>
            : <><Copy size={12} /> Copy</>}
        </button>
      </div>

      {/*  Power controls  */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => powerAction('start')}
          disabled={!canStart}
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-30
            bg-emerald-500 hover:bg-emerald-400 text-white border border-emerald-400/40"
        >
          <Play size={15} fill="currentColor" /> Start
        </button>
        <button
          onClick={() => canStop && openModal({
            title: 'Stop server?',
            description: 'The server will shut down and all connected players will be disconnected.',
            confirmLabel: 'Stop Server',
            variant: 'warning',
            action: () => powerAction('stop'),
          })}
          disabled={!canStop}
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-30
            bg-red-500/12 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 hover:border-red-400/40"
        >
          <Square size={15} fill="currentColor" /> Stop
        </button>
        <button
          onClick={() => canRestart && openModal({
            title: 'Restart server?',
            description: 'The server will restart and connected players will be briefly disconnected.',
            confirmLabel: 'Restart',
            variant: 'warning',
            action: () => powerAction('restart'),
          })}
          disabled={!canRestart}
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-30
            bg-amber-500/12 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/25 hover:border-amber-400/40"
        >
          <RotateCcw size={15} /> Restart
        </button>
      </div>

      {/*  Console  */}
      <ConsolePanel serverId={id} status={server.status} createdAt={server.created_at} />

      </>)}

      {tab === 'settings' && (
        <PropertiesPanel serverId={id} status={server.status} />
      )}

      <ConfirmModal
        open={!!modal}
        title={modal?.title ?? ''}
        description={modal?.description ?? ''}
        confirmLabel={modal?.confirmLabel}
        variant={modal?.variant ?? 'danger'}
        loading={modalLoading}
        onConfirm={runModal}
        onCancel={() => { if (!modalLoading) setModal(null) }}
      />

    </div>
  )
}
