import { ServerStatus } from '@/lib/types'

const statusConfig: Record<ServerStatus, { label: string; color: string }> = {
  installing: { label: 'Installing', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  stopped:    { label: 'Stopped',    color: 'bg-white/5 text-white/35 border border-white/10' },
  starting:   { label: 'Starting',   color: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  running:    { label: 'Online',     color: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  stopping:   { label: 'Stopping',   color: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
  error:      { label: 'Error',      color: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  suspended:  { label: 'Suspended',  color: 'bg-red-900/20 text-red-500 border border-red-900/40' },
}

export default function StatusBadge({ status }: { status: ServerStatus }) {
  const { label, color } = statusConfig[status] ?? statusConfig.error
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
