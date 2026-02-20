export type ServerStatus =
  | 'installing'
  | 'stopped'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error'
  | 'suspended'

export type ServerType = 'vanilla' | 'paper' | 'spigot' | 'forge' | 'fabric' | 'bungeecord' | 'velocity'

export interface Plan {
  id: string
  name: string
  ram_mb: number
  cpu_limit: number
  disk_gb: number
  price_cents: number
  max_players: number
  is_active: boolean
}

export interface Server {
  id: string
  user_id: string
  node_id: string
  plan_id: string
  name: string
  status: ServerStatus
  port: number
  ram_mb: number
  cpu_limit: number
  disk_gb: number
  mc_version: string
  server_type: ServerType
  docker_id: string | null
  installed_at: string | null
  lxc_ip: string | null
  created_at: string
  plans?: Plan
  nodes?: { ip: string; public_ip: string }
}

export interface ServerMetrics {
  cpu_percent: number
  ram_used_mb: number
  ram_limit_mb: number
  network_rx_bytes: number
  network_tx_bytes: number
  players_online: number
  player_names:   string[]
}
