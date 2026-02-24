'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '@/lib/api'
import { Plan, Server } from '@/lib/types'
import {
  CreditCard, Receipt, ChevronDown, Check, Loader2,
  AlertCircle, ArrowUpRight, ArrowDownRight,
  MemoryStick, Cpu, HardDrive, Users,
} from 'lucide-react'

//  Types 

interface InvoiceItem { label: string; amount_cents: number }
interface Invoice {
  id:           string
  period:       string
  amount_cents: number
  status:       'paid' | 'upcoming'
  items:        InvoiceItem[]
}

interface BillingServer extends Omit<Server, 'plans'> {
  plans: Plan | null
}

interface BillingData {
  servers:      BillingServer[]
  plans:        Plan[]
  total_cents:  number
  invoices:     Invoice[]
}

//  Helpers 

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

const SERVER_TYPE_LABEL: Record<string, string> = {
  paper: 'Paper', vanilla: 'Vanilla', spigot: 'Spigot',
  purpur: 'Purpur', fabric: 'Fabric', forge: 'Forge',
}

//  Plan selector pill 

function PlanSelector({
  server, plans, onChanged,
}: {
  server: BillingServer
  plans: Plan[]
  onChanged: (serverId: string, plan: Plan) => void
}) {
  const [open, setOpen]     = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const current             = server.plans
  const btnRef              = useRef<HTMLButtonElement>(null)
  const [pos, setPos]       = useState({ top: 0, right: 0 })

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 6, right: window.innerWidth - r.right })
    }
    setOpen(true)
  }

  const change = async (plan: Plan) => {
    if (plan.id === current?.id) { setOpen(false); return }
    setSaving(true)
    setError('')
    try {
      await api.post(`/api/billing/servers/${server.id}/plan`, { plan_id: plan.id })
      onChanged(server.id, plan)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to change plan')
    } finally {
      setSaving(false)
      setOpen(false)
    }
  }

  const dropdown = open ? createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        style={{ position: 'absolute', top: pos.top, right: pos.right }}
        className="z-50 w-72 bg-[#0f1724] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Change Plan</p>
        </div>

        <div className="py-1.5">
          {plans.map(plan => {
            const isCurrent = plan.id === current?.id
            const priceDiff = plan.price_cents - (current?.price_cents ?? 0)
            const isUpgrade = priceDiff > 0
            const isDowngrd = priceDiff < 0
            return (
              <button
                key={plan.id}
                onClick={() => change(plan)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
                  isCurrent ? 'bg-emerald-500/6' : 'hover:bg-white/4'
                }`}
              >
                {/* Color swatch */}
                <div className={`w-1.5 h-8 rounded-full shrink-0 ${
                  isCurrent   ? 'bg-emerald-500'
                  : isUpgrade ? 'bg-amber-400/50'
                  : isDowngrd ? 'bg-sky-400/50'
                  : 'bg-white/15'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      isCurrent ? 'text-emerald-300' : 'text-white'
                    }`}>{plan.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">Current</span>
                    )}
                    {!isCurrent && isUpgrade && (
                      <span className="text-[10px] bg-amber-500/12 text-amber-400/80 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <ArrowUpRight size={9} />Upgrade
                      </span>
                    )}
                    {!isCurrent && isDowngrd && (
                      <span className="text-[10px] bg-sky-500/12 text-sky-400/80 border border-sky-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <ArrowDownRight size={9} />Downgrade
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5 text-xs text-white/35">
                    <span>{Math.round(plan.ram_mb / 1024)}GB RAM</span>
                    <span className="text-white/15">·</span>
                    <span>{plan.cpu_limit} vCPU</span>
                    <span className="text-white/15">·</span>
                    <span>{plan.disk_gb}GB disk</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${
                    isCurrent ? 'text-emerald-300' : 'text-white'
                  }`}>{fmt(plan.price_cents)}<span className="text-white/30 font-normal text-[11px]">/mo</span></p>
                  {!isCurrent && priceDiff !== 0 && (
                    <p className={`text-[11px] mt-0.5 ${
                      isUpgrade ? 'text-amber-400' : 'text-sky-400'
                    }`}>{isUpgrade ? '+' : '-'}{fmt(Math.abs(priceDiff))}</p>
                  )}
                </div>

                {isCurrent && <Check size={14} className="text-emerald-400 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </>,
    document.body,
  ) : null

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={openDropdown}
        disabled={saving}
        className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 bg-white/4 hover:bg-white/8 text-white/70 hover:text-white transition-all"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <span>{current?.name ?? 'No plan'}</span>}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {dropdown}
    </div>
  )
}

//  Invoice row 

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false)
  const isPaid = invoice.status === 'paid'

  return (
    <div className={`border-b border-white/5 last:border-0 transition-colors ${
      expanded ? 'bg-white/2' : ''
    }`}>
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isPaid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
        }`}>
          <Receipt size={14} className={isPaid ? 'text-emerald-400' : 'text-amber-400'} />
        </div>

        {/* Period + count */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{invoice.period}</p>
          <p className="text-xs text-white/35 mt-0.5">
            {invoice.items.length} server{invoice.items.length !== 1 ? 's' : ''}
            <span className="text-white/15 mx-1.5">·</span>
            {invoice.items.map(i => i.label.split(' —')[0]).join(', ')}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
            isPaid
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {isPaid ? '✓ Paid' : 'Upcoming'}
          </span>
          <span className="text-sm font-semibold text-white w-16 text-right tabular-nums">{fmt(invoice.amount_cents)}</span>
          <ChevronDown size={13} className={`text-white/30 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`} />
        </div>
      </button>

      {/* Expanded line items */}
      {expanded && (
        <div className="mx-5 mb-4 rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <div className="divide-y divide-white/5">
            {invoice.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-white/60 truncate">{item.label}</span>
                <span className="text-white font-medium tabular-nums ml-6 shrink-0">{fmt(item.amount_cents)}</span>
              </div>
            ))}
          </div>
          {invoice.items.length > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-white/3 border-t border-white/8">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Total</span>
              <span className="text-sm font-bold text-white tabular-nums">{fmt(invoice.amount_cents)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

//  Page 

export default function BillingPage() {
  const [data, setData]       = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/api/billing')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load billing data'))
      .finally(() => setLoading(false))
  }, [])

  const handlePlanChange = (serverId: string, plan: Plan) => {
    setData(d => {
      if (!d) return d
      const updatedServers = d.servers.map(s =>
        s.id === serverId ? { ...s, plans: plan, plan_id: plan.id } : s
      )
      const total_cents = updatedServers.reduce((sum, s) => sum + (s.plans?.price_cents ?? 0), 0)
      return { ...d, servers: updatedServers, total_cents }
    })
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-10">
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-8 w-48 bg-white/8 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 border border-white/8 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-white/5 border border-white/8 rounded-2xl" />
        <div className="h-48 bg-white/5 border border-white/8 rounded-2xl" />
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="max-w-3xl mx-auto w-full flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm">
      <AlertCircle size={16} className="shrink-0" />
      {error || 'Something went wrong'}
    </div>
  )

  const { servers, plans, total_cents, invoices } = data
  const nextBilling = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    d.setDate(1)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  })()

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-10">

      {/*  Header  */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Billing</h1>
        <p className="text-sm text-white/40 mt-1">Manage your subscriptions and view payment history</p>
      </div>

      {/*  Summary cards  */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-1">
          <p className="text-xs text-white/35 uppercase tracking-wider">Monthly Total</p>
          <p className="text-3xl font-bold text-white mt-1">{fmt(total_cents)}</p>
          <p className="text-xs text-white/30">per month</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-1">
          <p className="text-xs text-white/35 uppercase tracking-wider">Active Servers</p>
          <p className="text-3xl font-bold text-white mt-1">{servers.length}</p>
          <p className="text-xs text-white/30">of 5 max</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-1">
          <p className="text-xs text-white/35 uppercase tracking-wider">Next Billing</p>
          <p className="text-lg font-semibold text-white mt-1">{nextBilling}</p>
          <p className="text-xs text-emerald-400/70">Auto-renew on</p>
        </div>
      </div>

      {/*  Subscriptions  */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
          <CreditCard size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white">Subscriptions</h2>
        </div>

        {servers.length === 0 ? (
          <div className="px-5 py-10 text-center text-white/30 text-sm">No active servers</div>
        ) : (
          <div className="divide-y divide-white/5">
            {servers.map(server => {
              const plan = server.plans
              return (
                <div key={server.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white/50">{server.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{server.name}</p>
                      <p className="text-xs text-white/35 mt-0.5">
                        {SERVER_TYPE_LABEL[server.server_type] ?? server.server_type} · MC {server.mc_version}
                      </p>
                    </div>
                  </div>

                  {plan && (
                    <div className="flex items-center gap-4 text-xs text-white/35 shrink-0 ml-2">
                      <span className="flex items-center gap-1"><MemoryStick size={11} />{Math.round(plan.ram_mb / 1024)}GB</span>
                      <span className="flex items-center gap-1"><Cpu size={11} />{plan.cpu_limit} vCPU</span>
                      <span className="flex items-center gap-1"><HardDrive size={11} />{plan.disk_gb}GB</span>
                      <span className="flex items-center gap-1"><Users size={11} />{plan.max_players} players</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 shrink-0 ml-auto">
                    <p className="text-sm font-semibold text-white">{fmt(plan?.price_cents ?? 0)}<span className="text-white/30 font-normal text-xs">/mo</span></p>
                    <PlanSelector server={server} plans={plans} onChanged={handlePlanChange} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {servers.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/8 bg-white/2 flex items-center justify-between">
            <p className="text-xs text-white/35">Total billed monthly</p>
            <p className="text-sm font-bold text-white">{fmt(total_cents)}</p>
          </div>
        )}
      </div>

      {/*  Invoice history  */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
          <Receipt size={15} className="text-white/40" />
          <h2 className="text-sm font-semibold text-white">Invoice History</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-white/30 text-sm">No invoices yet</div>
        ) : (
          <div>
            {invoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
          </div>
        )}
      </div>

      {/*  Payment notice  */}
      <div className="flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-xs text-white/35">
        <AlertCircle size={13} className="shrink-0 mt-0.5 text-white/25" />
        Payments are currently automatic. Stripe billing integration is coming soon — you'll be notified before any changes.
      </div>

    </div>
  )
}
