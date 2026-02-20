'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { ServerStatus } from '@/lib/types'
import { Save, RotateCcw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  serverId: string
  status:   ServerStatus
}

//  Property definitions 

type FieldType = 'text' | 'number' | 'toggle' | 'select'

interface FieldDef {
  key:      string
  label:    string
  type:     FieldType
  options?: { value: string; label: string }[]
  min?:     number
  max?:     number
  hint?:    string
  needsRestart?: boolean
  defaultValue?: string
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'General',
    fields: [
      { key: 'motd',       label: 'Server Description (MOTD)', type: 'text',   hint: 'Shown in the multiplayer list', needsRestart: true },
      { key: 'max-players', label: 'Max Players',              type: 'number', min: 1,  max: 1000 },
      { key: 'view-distance', label: 'View Distance',          type: 'number', min: 2,  max: 32, hint: 'Chunks rendered around each player' },
      { key: 'simulation-distance', label: 'Simulation Distance', type: 'number', min: 2, max: 32 },
    ],
  },
  {
    title: 'Gameplay',
    fields: [
      {
        key: 'gamemode', label: 'Default Gamemode', type: 'select',
        options: [
          { value: 'survival',  label: 'Survival' },
          { value: 'creative',  label: 'Creative' },
          { value: 'adventure', label: 'Adventure' },
          { value: 'spectator', label: 'Spectator' },
        ],
      },
      {
        key: 'difficulty', label: 'Difficulty', type: 'select',
        options: [
          { value: 'peaceful', label: 'Peaceful' },
          { value: 'easy',     label: 'Easy' },
          { value: 'normal',   label: 'Normal' },
          { value: 'hard',     label: 'Hard' },
        ],
      },
      { key: 'pvp',              label: 'PvP',                  type: 'toggle' },
      { key: 'allow-flight',     label: 'Allow Flight',         type: 'toggle', hint: 'Allows players in survival to fly (e.g. with mods)' },
      { key: 'force-gamemode',   label: 'Force Gamemode',       type: 'toggle', hint: 'Players always join in the default gamemode' },
      { key: 'hardcore',         label: 'Hardcore Mode',        type: 'toggle', hint: 'Players are banned on death', needsRestart: true },
    ],
  },
  {
    title: 'World',
    fields: [
      { key: 'spawn-animals',   label: 'Spawn Animals',   type: 'toggle', defaultValue: 'true' },
      { key: 'spawn-monsters',  label: 'Spawn Monsters',  type: 'toggle' },
      { key: 'spawn-npcs',      label: 'Spawn NPCs',      type: 'toggle', hint: 'Villagers, wandering traders, etc.', defaultValue: 'true' },
      { key: 'generate-structures', label: 'Generate Structures', type: 'toggle', hint: 'Villages, temples, etc.' },
      { key: 'allow-nether',    label: 'Allow Nether',    type: 'toggle', needsRestart: true },
    ],
  },
  {
    title: 'Access',
    fields: [
      { key: 'white-list',      label: 'Whitelist',       type: 'toggle', hint: 'Only whitelisted players can join' },
      { key: 'online-mode',     label: 'Online Mode',     type: 'toggle', hint: 'Verify players against Mojang (turn off for cracked clients)', needsRestart: true },
      { key: 'enforce-secure-profile', label: 'Enforce Secure Profile', type: 'toggle' },
    ],
  },
]

const ALL_KEYS = SECTIONS.flatMap(s => s.fields.map(f => f.key))

export default function PropertiesPanel({ serverId, status }: Props) {
  const [props,   setProps]   = useState<Record<string, string> | null>(null)
  const [draft,   setDraft]   = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProps = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/api/servers/${serverId}/properties`)
      setProps(data)
      setDraft(data)
    } catch {
      setError('Could not load server properties. The server may need to be started at least once.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProps() }, [serverId])

  const update = (key: string, value: string) =>
    setDraft(d => ({ ...d, [key]: value }))

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      // Only send the keys we manage — don't touch the rest
      const changes: Record<string, string> = {}
      for (const key of ALL_KEYS) {
        if (draft[key] !== undefined) changes[key] = draft[key]
      }
      await api.put(`/api/servers/${serverId}/properties`, changes)
      setProps({ ...props, ...changes })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      showToast('Settings applied', true)
    } catch {
      setError('Failed to save properties.')
      showToast('Failed to save settings', false)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => setDraft(props ?? {})

  const isDirty   = JSON.stringify(draft) !== JSON.stringify(props)
  const anyRestart = SECTIONS.flatMap(s => s.fields)
    .filter(f => f.needsRestart && draft[f.key] !== props?.[f.key])
    .length > 0

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-white/30 text-sm">
      Loading properties…
    </div>
  )

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-5 text-red-400 text-sm flex gap-3 items-start">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <span>{error}</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">

      {/* Restart warning */}
      {anyRestart && (
        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-amber-400 text-xs">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          Some changes (marked ↺) require a server restart to take effect.
        </div>
      )}

      {/* Running notice */}
      {status === 'running' && (
        <div className="flex items-start gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-xs">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          The server is running. Some changes will only apply after a restart.
        </div>
      )}

      {/* Property sections */}
      {SECTIONS.map(section => (
        <div key={section.title} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8">
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/40">{section.title}</h3>
          </div>
          <div className="divide-y divide-white/5">
            {section.fields.map(field => {
              const val = draft[field.key] ?? field.defaultValue ?? ''
              return (
                <div key={field.key} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm text-white flex items-center gap-1.5">
                      {field.label}
                      {field.needsRestart && <span className="text-amber-400/70 text-xs">↺</span>}
                    </p>
                    {field.hint && <p className="text-xs text-white/30 mt-0.5">{field.hint}</p>}
                  </div>

                  {/* Toggle */}
                  {field.type === 'toggle' && (
                    <button
                      onClick={() => update(field.key, val === 'true' ? 'false' : 'true')}
                      className={`relative shrink-0 w-10 h-5.5 rounded-full transition-colors duration-200 ${val === 'true' ? 'bg-emerald-500' : 'bg-white/15'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${val === 'true' ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'}`} />
                    </button>
                  )}

                  {/* Select */}
                  {field.type === 'select' && (
                    <select
                      value={val}
                      onChange={e => update(field.key, e.target.value)}
                      className="shrink-0 bg-white/8 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 transition-colors"
                    >
                      {field.options?.map(o => (
                        <option key={o.value} value={o.value} className="bg-white text-black">{o.label}</option>
                      ))}
                    </select>
                  )}

                  {/* Number */}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={val}
                      min={field.min}
                      max={field.max}
                      onChange={e => update(field.key, e.target.value)}
                      className="shrink-0 w-24 bg-white/8 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-white/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  )}

                  {/* Text */}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={val}
                      onChange={e => update(field.key, e.target.value)}
                      className="shrink-0 w-56 bg-white/8 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 transition-colors"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Save / Reset bar */}
      <div className={`sticky bottom-4 flex items-center justify-between gap-3 bg-[#1a2130] border rounded-2xl px-4 py-3 transition-all duration-300 ${isDirty ? 'border-white/20 opacity-100' : 'border-white/8 opacity-50 pointer-events-none'}`}>
        <p className="text-xs text-white/40">
          {saved ? '✓ Saved' : isDirty ? 'You have unsaved changes' : 'No changes'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={!isDirty || saving}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/15 text-white/40 hover:text-white hover:border-white/30 transition-all disabled:opacity-30"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={save}
            disabled={!isDirty || saving}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition-all disabled:opacity-40"
          >
            <Save size={12} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl transition-all duration-300 ${
          toast.ok
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300'
        }`}>
          {toast.ok
            ? <CheckCircle size={15} className="shrink-0" />
            : <XCircle    size={15} className="shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
