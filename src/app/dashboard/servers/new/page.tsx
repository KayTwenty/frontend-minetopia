'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Plan } from '@/lib/types'
import { Check, Loader2, X, Search, ChevronRight, ChevronLeft } from 'lucide-react'

interface McVersion {
  id:          string
  type:        'release' | 'snapshot'
  releaseTime: string
  java:        number
}

const SERVER_TYPES = [
  { id: 'paper',   label: 'Paper',   badge: 'Recommended', color: 'text-yellow-400',  ring: 'border-yellow-400/40 bg-yellow-400/8',  desc: 'Fastest performance + plugin support' },
  { id: 'vanilla', label: 'Vanilla', badge: '',             color: 'text-emerald-400', ring: 'border-emerald-400/40 bg-emerald-400/8', desc: 'Official Mojang server, no extras' },
  { id: 'purpur',  label: 'Purpur',  badge: '',             color: 'text-purple-400',  ring: 'border-purple-400/40 bg-purple-400/8',  desc: 'Paper fork with extra config options' },
  { id: 'fabric',  label: 'Fabric',  badge: '',             color: 'text-sky-400',     ring: 'border-sky-400/40 bg-sky-400/8',        desc: 'Modern lightweight mod loader' },
  { id: 'forge',   label: 'Forge',   badge: '1.17+',        color: 'text-orange-400',  ring: 'border-orange-400/40 bg-orange-400/8',  desc: 'Classic modding framework' },
  { id: 'spigot',  label: 'Spigot',  badge: 'Slow install', color: 'text-blue-400',    ring: 'border-blue-400/40 bg-blue-400/8',      desc: 'Plugin support, compiled from source' },
]

export default function NewServerPage() {
  const router = useRouter()
  const [plans, setPlans]     = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError]     = useState('')
  const [versions, setVersions]         = useState<McVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(true)
  const [showSnapshots, setShowSnapshots]     = useState(false)
  const [versionSearch, setVersionSearch]     = useState('')
  const [name, setName]       = useState('')
  const [serverType, setServerType] = useState('paper')
  const [planId, setPlanId]   = useState('')
  const [version, setVersion] = useState('')
  const [port, setPort]       = useState(25565)
  const [portStatus, setPortStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [deployed, setDeployed] = useState<string>('')
  const [step, setStep]           = useState(1)

  useEffect(() => {
    api.get('/api/plans')
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data)
          setPlanId(data[0].id)
        } else {
          setPlansError('No plans found — make sure the plans table has rows.')
        }
      })
      .catch(err => {
        setPlansError(err.response?.data?.error ?? 'Could not load plans — is the API running?')
      })
      .finally(() => setPlansLoading(false))
  }, [])

  useEffect(() => {
    api.get('/api/mc-versions?snapshots=true')
      .then(({ data }) => {
        setVersions(data)
        // default to the first release (snapshots are listed after releases)
        const firstRelease = data.find((v: McVersion) => v.type === 'release')
        if (firstRelease) setVersion(firstRelease.id)
        else if (data.length > 0) setVersion(data[0].id)
      })
      .catch(() => { /* non-fatal: user can still type a version ID */ })
      .finally(() => setVersionsLoading(false))
  }, [])

  useEffect(() => {
    document.title = 'New Server \u2014 Minetopia'
    return () => { document.title = 'Servers \u2014 Minetopia' }
  }, [])

  // Debounced port availability check
  useEffect(() => {
    if (port < 1024 || port > 65535) { setPortStatus('idle'); return }
    setPortStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/servers/port-check?port=${port}`)
        setPortStatus(data.available ? 'available' : 'taken')
      } catch {
        setPortStatus('idle')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [port])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/servers', {
        name,
        plan_id:     planId,
        mc_version:  version,
        server_type: serverType,
        port,
      })
      setDeployed(name)
      setTimeout(() => router.push('/dashboard/servers'), 1800)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  const selectedPlan = plans.find(p => p.id === planId) ?? null

  const portIndicator = {
    idle:      null,
    checking:  <Loader2 size={14} className="animate-spin text-white/30" />,
    available: <Check size={14} className="text-green-400" />,
    taken:     <X size={14} className="text-red-400" />,
  }[portStatus]

  if (deployed) return (
    <div className="flex flex-col items-center justify-center h-64 gap-5 text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
        <Check size={24} className="text-emerald-400" />
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-white">{deployed} is deploying</p>
        <p className="text-sm text-white/35 mt-1">Installation will complete in under a minute.</p>
      </div>
      <div className="flex items-center gap-2 text-white/25 text-xs">
        <Loader2 size={12} className="animate-spin" />
        Redirecting to your servers…
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto w-full py-4 flex flex-col gap-10">

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-2">New Server</p>
        <h1 className="text-3xl font-bold tracking-tight">Deploy a Server</h1>
        <p className="text-white/40 text-sm mt-2">Your server will be online in under a minute.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
          step === 1 ? 'border-white/30 bg-white/8 text-white' : 'border-white/10 text-white/30'
        }`}>
          <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
          Configuration
        </div>
        <ChevronRight size={12} className="text-white/20" />
        <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
          step === 2 ? 'border-white/30 bg-white/8 text-white' : 'border-white/10 text-white/30'
        }`}>
          <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
          Plan &amp; Deploy
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">

        {/* LEFT — Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* ── PAGE 1: Name · Type · Version ── */}
          {step === 1 && (
            <>

          {/* Step 1 — Name */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 shrink-0">1</span>
              <label className="text-sm font-medium text-white/70">Server Name</label>
            </div>
            <input
              type="text"
              required
              minLength={3}
              maxLength={32}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Survival World"
              className="w-full bg-transparent border border-white/12 hover:border-white/25 focus:border-white/50 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors"
            />
          </div>

          {/* Step 2 — Server Type */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 shrink-0">2</span>
              <label className="text-sm font-medium text-white/70">Server Type</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SERVER_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setServerType(t.id)}
                  className={`text-left flex flex-col gap-1 px-4 py-3 rounded-xl border transition-all ${
                    serverType === t.id
                      ? `${t.ring} border-2`
                      : 'border-white/10 hover:border-white/25 hover:bg-white/3'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${serverType === t.id ? t.color : 'text-white/70'}`}>{t.label}</span>
                    {t.badge && (
                      <span className="text-[10px] bg-white/8 text-white/30 border border-white/10 rounded px-1.5 py-0.5 leading-none">{t.badge}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/30 leading-snug">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 — Version */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 shrink-0">3</span>
              <label className="text-sm font-medium text-white/70">Minecraft Version</label>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search versions…"
                  value={versionSearch}
                  onChange={e => setVersionSearch(e.target.value)}
                  className="w-full bg-transparent border border-white/10 hover:border-white/20 focus:border-white/35 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/20 outline-none transition-colors font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowSnapshots(s => !s)}
                className={`px-3 py-2 rounded-lg text-xs border transition-all shrink-0 ${
                  showSnapshots
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-white/10 text-white/30 hover:border-white/25 hover:text-white/50'
                }`}
              >
                Snapshots
              </button>
            </div>

            {/* Version grid */}
            {versionsLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse border border-white/8 rounded-lg h-10" />
                ))}
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto pr-0.5">
                <div className="grid grid-cols-3 gap-2">
                  {versions
                    .filter(v => (showSnapshots ? true : v.type === 'release') &&
                      (!versionSearch || v.id.toLowerCase().includes(versionSearch.toLowerCase())))
                    .map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVersion(v.id)}
                        className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg text-left border transition-all ${
                          version === v.id
                            ? 'border-white/50 bg-white/8 text-white'
                            : 'border-white/8 text-white/40 hover:border-white/25 hover:text-white/70'
                        }`}
                      >
                        <span className="text-xs font-mono leading-none">{v.id}</span>
                        <span className={`text-[10px] leading-none ${
                          v.java >= 21 ? 'text-emerald-500/60' : 'text-white/20'
                        }`}>
                          Java {v.java}
                        </span>
                      </button>
                    ))}
                </div>
                {versions.filter(v =>
                  (showSnapshots ? true : v.type === 'release') &&
                  (!versionSearch || v.id.toLowerCase().includes(versionSearch.toLowerCase()))
                ).length === 0 && (
                  <p className="text-xs text-white/25 text-center py-6">No versions match &ldquo;{versionSearch}&rdquo;</p>
                )}
              </div>
            )}

            {/* Selected version summary */}
            {version && (
              <p className="text-xs text-white/30">
                Selected: <span className="font-mono text-white/60">{version}</span>
                {(() => { const v = versions.find(x => x.id === version); return v ? ` · Java ${v.java} required` : '' })()}
              </p>
            )}
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!name.trim() || name.trim().length < 3 || !version}
            className="bg-white hover:bg-white/90 disabled:opacity-30 text-black font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            Next <ChevronRight size={15} />
          </button>

            </>
          )}

          {/* ── PAGE 2: Plan · Port · Deploy ── */}
          {step === 2 && (
            <>

          {/* Step 1 — Plan */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 shrink-0">1</span>
              <label className="text-sm font-medium text-white/70">Plan</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {plansLoading ? (
                // skeleton
                [0, 1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse border border-white/8 rounded-xl p-5 h-32" />
                ))
              ) : plansError ? (
                <p className="col-span-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {plansError}
                </p>
              ) : (
                plans.map(plan => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setPlanId(plan.id)}
                  className={`text-left border rounded-xl p-5 transition-all ${
                    planId === plan.id
                      ? 'border-white/50 bg-white/5'
                      : 'border-white/10 hover:border-white/25 hover:bg-white/3'
                  }`}
                >
                  <p className="font-semibold text-white text-sm">{plan.name}</p>
                  <p className="font-bold text-xl mt-1 text-white">
                    ${(plan.price_cents / 100).toFixed(2)}
                    <span className="text-xs text-white/30 font-normal ml-1">/mo</span>
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/8 flex flex-col gap-1">
                    <p className="text-white/40 text-xs">{plan.ram_mb / 1024} GB RAM</p>
                    <p className="text-white/40 text-xs">{plan.cpu_limit} vCPU</p>
                    <p className="text-white/40 text-xs">{plan.disk_gb} GB disk</p>
                    <p className="text-white/40 text-xs">{plan.max_players} players</p>
                  </div>
                </button>
              ))
              )}
            </div>
          </div>

          {/* Low-RAM warning for heavy server types */}
          {planId && ['forge', 'fabric'].includes(serverType) && (plans.find(p => p.id === planId)?.ram_mb ?? 0) < 3072 && (
            <div className="flex items-start gap-3 border border-amber-500/25 bg-amber-500/8 rounded-xl px-4 py-3">
              <span className="text-amber-400 text-base leading-none mt-0.5">⚠</span>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                <span className="font-semibold text-amber-300">{serverType === 'forge' ? 'Forge' : 'Fabric'} modpacks</span> typically require at least 4 GB RAM.
                The selected plan may cause crashes or poor performance. Consider <span className="font-semibold">Standard</span> or above.
              </p>
            </div>
          )}

          {/* Step 2 — Port */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 shrink-0">2</span>
              <label className="text-sm font-medium text-white/70">Server Port</label>
              <span className="text-xs text-white/25">optional — we’ll auto-assign if taken</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={1024}
                max={65535}
                value={port}
                onChange={e => setPort(parseInt(e.target.value, 10) || 25565)}
                className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm text-white font-mono outline-none transition-colors pr-10 ${
                  portStatus === 'taken'
                    ? 'border-red-500/50 focus:border-red-500/80'
                    : portStatus === 'available'
                    ? 'border-green-500/50 focus:border-green-500/80'
                    : 'border-white/12 hover:border-white/25 focus:border-white/50'
                }`}
              />
              {portIndicator && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">{portIndicator}</div>
              )}
            </div>
            {portStatus === 'taken' && (
              <p className="text-xs text-red-400/80">Port {port} is already in use — choose another or we’ll assign the next free one.</p>
            )}
            {portStatus === 'available' && (
              <p className="text-xs text-green-400/60">Port {port} is available.</p>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Back + Deploy */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-white/15 hover:border-white/30 text-white/60 hover:text-white font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft size={15} /> Back
            </button>
            <button
              type="submit"
              disabled={loading || !planId || portStatus === 'taken'}
              className="flex-2 bg-white hover:bg-white/90 disabled:opacity-30 text-black font-semibold py-3.5 rounded-xl text-sm transition-all"
            >
              {loading ? 'Deploying...' : 'Deploy Server →'}
            </button>
          </div>

            </>
          )}

        </form>

        {/* RIGHT — Receipt (sticky) */}
        <div className="lg:sticky lg:top-8 flex flex-col gap-4">
          <p className="text-xs uppercase tracking-widest text-white/30">Order Summary</p>

          <div className="border border-white/10 rounded-xl overflow-hidden">
            {/* Line items */}
            <div className="flex flex-col divide-y divide-white/8">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-white/40">Type</span>
                <span className={`text-sm font-medium ${
                  SERVER_TYPES.find(t => t.id === serverType)?.color ?? 'text-white/70'
                }`}>
                  {SERVER_TYPES.find(t => t.id === serverType)?.label ?? serverType}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-white/40">Server</span>
                <span className="text-sm text-white font-medium">{name || <span className="text-white/20 italic">—</span>}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-white/40">Port</span>
                <span className="text-sm font-mono text-white/70">{port}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-white/40">Version</span>
                <span className="text-sm font-mono text-white/70">{version}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-white/40">Plan</span>
                <span className="text-sm text-white/70">{selectedPlan?.name ?? <span className="text-white/20 italic">—</span>}</span>
              </div>
              {selectedPlan && (
                <>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-white/40">RAM</span>
                    <span className="text-sm text-white/70">{selectedPlan.ram_mb / 1024} GB</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-white/40">CPU</span>
                    <span className="text-sm text-white/70">{selectedPlan.cpu_limit} vCPU</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-white/40">Disk</span>
                    <span className="text-sm text-white/70">{selectedPlan.disk_gb} GB</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-white/40">Players</span>
                    <span className="text-sm text-white/70">{selectedPlan.max_players}</span>
                  </div>
                </>
              )}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-4 bg-white/3 border-t border-white/10">
              <span className="text-xs text-white/50 uppercase tracking-wider">Monthly</span>
              <span className="text-white font-bold">
                {selectedPlan ? `$${(selectedPlan.price_cents / 100).toFixed(2)}` : '—'}
                {selectedPlan && <span className="text-white/30 font-normal text-xs ml-1">/mo</span>}
              </span>
            </div>
          </div>

          <p className="text-xs text-white/20 leading-relaxed">
            Billed monthly. Cancel anytime. Server activates immediately after deployment.
          </p>
        </div>

      </div>
    </div>
  )
}
