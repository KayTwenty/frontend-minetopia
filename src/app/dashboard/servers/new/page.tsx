'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Plan } from '@/lib/types'
import { Check, Loader2, X } from 'lucide-react'

const MC_VERSIONS = ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4']

export default function NewServerPage() {
  const router = useRouter()
  const [plans, setPlans]     = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError]     = useState('')
  const [name, setName]       = useState('')
  const [planId, setPlanId]   = useState('')
  const [version, setVersion] = useState('1.21.4')
  const [port, setPort]       = useState(25565)
  const [portStatus, setPortStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

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
        server_type: 'vanilla',
        port,
      })
      router.push('/dashboard/servers')
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

  return (
    <div className="max-w-4xl mx-auto w-full py-4 flex flex-col gap-10">

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-2">New Server</p>
        <h1 className="text-3xl font-bold tracking-tight">Deploy a Server</h1>
        <p className="text-white/40 text-sm mt-2">Your server will be online in under a minute.</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">

        {/* LEFT — Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

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

          {/* Step 2 — Version */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 shrink-0">2</span>
              <label className="text-sm font-medium text-white/70">Minecraft Version</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {MC_VERSIONS.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVersion(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-mono transition-all border ${
                    version === v
                      ? 'border-white/60 text-white bg-white/8'
                      : 'border-white/10 text-white/35 hover:border-white/30 hover:text-white/70'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 — Plan */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 shrink-0">3</span>
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
                    <p className="text-white/40 text-xs">{plan.max_players} players</p>
                  </div>
                </button>
              ))
              )}
            </div>
          </div>

          {/* Step 4 — Port */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40 shrink-0">4</span>
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

          <button
            type="submit"
            disabled={loading || !planId || !name || portStatus === 'taken'}
            className="bg-white hover:bg-white/90 disabled:opacity-30 text-black font-semibold py-3.5 rounded-xl text-sm transition-all"
          >
            {loading ? 'Deploying...' : 'Deploy Server →'}
          </button>

        </form>

        {/* RIGHT — Receipt (sticky) */}
        <div className="lg:sticky lg:top-8 flex flex-col gap-4">
          <p className="text-xs uppercase tracking-widest text-white/30">Order Summary</p>

          <div className="border border-white/10 rounded-xl overflow-hidden">
            {/* Line items */}
            <div className="flex flex-col divide-y divide-white/8">
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
