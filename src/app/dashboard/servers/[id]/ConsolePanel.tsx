'use client'
import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ServerStatus } from '@/lib/types'
import { Terminal, CornerDownLeft, Copy, Check, Maximize2, Minimize2, ArrowDown } from 'lucide-react'

interface Props {
  serverId:  string
  status:    ServerStatus
  createdAt?: string   // ISO timestamp — used to resume install progress after a refresh
}

//  Install phase steps 
const INSTALL_STEPS = [
  { label: 'Creating LXC container',      hint: 'Allocating isolated environment...' },
  { label: 'Installing Java runtime',       hint: 'apt-get install openjdk-17-jre-headless openjdk-21-jre-headless' },
  { label: 'Downloading server jar',       hint: 'Fetching from Mojang...' },
  { label: 'Registering systemd service',  hint: 'Writing /etc/systemd/system/mc-*' },
  { label: 'Starting Minecraft',           hint: 'Launching server process...' },
]

//  Startup step tracker 
interface Step { label: string; detail?: string; done: boolean }

const INITIAL_STEPS: Step[] = [
  { label: 'Initializing',      done: false },
  { label: 'Downloading files', done: false },
  { label: 'Generating world',  done: false },
  { label: 'Ready',             done: false },
]

function classifyLine(line: string, steps: Step[]): Step[] {
  const s = [...steps]
  const set = (i: number, detail?: string) => {
    for (let j = 0; j < i; j++) s[j] = { ...s[j], done: true }
    s[i] = { ...s[i], done: false, detail: detail ?? s[i].detail }
    return s
  }
  if (/Resolving type|Resolving version/.test(line))                               return set(0, 'Resolving version...')
  if (/Downloading/.test(line))                                                    return set(1, 'Downloading server jar...')
  if (/Preparing level|Loading initial chunks|Preparing start region/.test(line))  return set(2, 'Generating world...')
  if (/Loading libraries|Starting Minecraft server|Starting net\.minecraft/.test(line)) return set(2)
  if (/Done \(\d/.test(line))                                                      return s.map(t => ({ ...t, done: true }))
  return s
}

//  Timestamp helper for event markers 
function nowTime(): string {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

//  Log line color 
function lineClass(line: string): string {
  if (/^\s*> /.test(line))                               return 'text-cyan-400'
  if (/\bERROR\b|\bSEVERE\b/i.test(line))               return 'text-red-400'
  if (/\bWARN(ING)?\b/i.test(line))                     return 'text-yellow-400'
  if (/Done \(\d/.test(line))                            return 'text-green-400'
  if (/^\[[\d:]+\] \[Server thread\/INFO\]/.test(line)) return 'text-zinc-300'
  return 'text-zinc-500'
}

export default function ConsolePanel({ serverId, status, createdAt }: Props) {
  const [lines, setLines]             = useState<string[]>([])
  const [connected, setConnected]     = useState(false)
  const [steps, setSteps]             = useState<Step[]>(INITIAL_STEPS)
  // Seed install progress from the real server age so a page refresh resumes
  // at the correct step instead of restarting from 0.
  const seedInstall = () => {
    if (status !== 'installing' || !createdAt) return { step: 0, secs: 0 }
    const secs = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1_000)
    const step = Math.min(Math.floor(secs / 18), INSTALL_STEPS.length - 1)
    return { step, secs }
  }
  const { step: initStep, secs: initSecs } = seedInstall()
  const [installStep, setInstallStep] = useState(initStep)
  const [elapsed, setElapsed]         = useState(initSecs)
  const [input, setInput]             = useState('')
  const [cmdHistory, setCmdHistory]   = useState<string[]>([])
  const [historyIdx, setHistoryIdx]   = useState(-1)
  const wsRef                         = useRef<WebSocket | null>(null)
  const bottomRef                     = useRef<HTMLDivElement>(null)
  const logRef                        = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)
  const statusRef                     = useRef(status)
  const reconnectTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelay                = useRef(2_000)
  const reconnectAttempt              = useRef(0)
  const unmounted                     = useRef(false)
  const [atBottom, setAtBottom]       = useState(true)
  const [expanded, setExpanded]       = useState(false)
  const [logCopied, setLogCopied]     = useState(false)

  // Auto-scroll on new lines — only when pinned to the bottom
  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [lines, atBottom])

  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Install progress timer — advances from wherever we seeded (handles refresh)
  useEffect(() => {
    if (status !== 'installing') { setInstallStep(0); setElapsed(0); return }
    // Inline seed so createdAt is a proper dep (avoids stale closure)
    const age  = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 1_000) : 0
    const step = Math.min(Math.floor(age / 18), INSTALL_STEPS.length - 1)
    setInstallStep(step)
    setElapsed(age)
    const secTimer = setInterval(() => setElapsed(s => s + 1), 1_000)
    // Align the first step-advance to the correct sub-interval boundary
    const msUntilNextStep = (18 - (age % 18)) * 1_000
    stepTimeoutRef.current = setTimeout(() => {
      setInstallStep(i => Math.min(i + 1, INSTALL_STEPS.length - 1))
      stepIntervalRef.current = setInterval(
        () => setInstallStep(i => Math.min(i + 1, INSTALL_STEPS.length - 1)),
        18_000,
      )
    }, msUntilNextStep)
    return () => {
      clearInterval(secTimer)
      if (stepTimeoutRef.current)  clearTimeout(stepTimeoutRef.current)
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current)
    }
  }, [status, createdAt])

  // Keep statusRef current so onclose callbacks always see the latest status
  useEffect(() => { statusRef.current = status }, [status])

  // Reset / complete steps on status transition
  useEffect(() => {
    if (status === 'starting') setSteps(INITIAL_STEPS)
    if (status === 'running')  setSteps(s => s.map(step => ({ ...step, done: true })))
  }, [status])

  // WebSocket lifecycle with exponential-backoff auto-reconnect
  useEffect(() => {
    unmounted.current = false

    if (status !== 'running' && status !== 'starting') {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      const staleEarly = wsRef.current
      wsRef.current        = null
      staleEarly?.close()
      reconnectDelay.current   = 2_000
      reconnectAttempt.current = 0
      return
    }

    const connect = async () => {
      if (unmounted.current) return
      if (wsRef.current?.readyState === WebSocket.OPEN) return

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || unmounted.current) return

      const apiWsUrl = process.env.NEXT_PUBLIC_API_URL!.replace(/^http/, 'ws')
      const ws = new WebSocket(`${apiWsUrl}/api/servers/${serverId}/console`)
      wsRef.current = ws

      ws.onopen = () => {
        if (unmounted.current) { ws.close(); return }
        ws.send(JSON.stringify({ token: session.access_token }))
        setConnected(true)
        // On first connect clear lines; on reconnect append a notice instead
        setLines(prev => reconnectAttempt.current > 0 ? [...prev, `\u2014 reconnected at ${nowTime()} \u2014`] : [])
        reconnectDelay.current   = 2_000
        reconnectAttempt.current = 0
      }

      ws.onclose = () => {
        setConnected(false)
        // Bail if this WS was intentionally replaced (cleanup nulled wsRef before closing)
        if (wsRef.current !== ws) return
        wsRef.current = null
        if (unmounted.current) return

        const active = statusRef.current === 'running' || statusRef.current === 'starting'
        if (active) {
          const attempt = ++reconnectAttempt.current
          const delay   = reconnectDelay.current
          reconnectDelay.current = Math.min(delay * 2, 30_000)
          setLines(prev => [...prev,
            attempt === 1
              ? `\u2014 disconnected at ${nowTime()} \u2014 reconnecting in ${delay / 1000}s...`
              : `\u2014 reconnect attempt ${attempt} at ${nowTime()} in ${delay / 1000}s...`,
          ])
          reconnectTimer.current = setTimeout(connect, delay)
        } else {
          setLines(prev => [...prev, `\u2014 disconnected at ${nowTime()} \u2014`])
        }
      }

      ws.onerror = () => setConnected(false)

      ws.onmessage = (e) => {
        try {
          const msg  = JSON.parse(e.data)
          const text = msg.type === 'log'   ? msg.line
                     : msg.type === 'error' ? `[error] ${msg.message}`
                     : e.data
          setLines(prev => [...prev, text].slice(-500))
          setSteps(prev => classifyLine(text, prev))
        } catch {
          setLines(prev => [...prev, e.data].slice(-500))
        }
      }
    }

    connect()

    return () => {
      unmounted.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      // Null ref BEFORE closing so the onclose handler sees wsRef !== ws and skips reconnect
      const stale = wsRef.current
      wsRef.current        = null
      stale?.close()
      reconnectDelay.current   = 2_000
      reconnectAttempt.current = 0
    }
  }, [serverId, status])

  const sendCmd = () => {
    const cmd = input.trim()
    if (!cmd || wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'command', cmd }))
    setCmdHistory(h => [cmd, ...h].slice(0, 100))
    setHistoryIdx(-1)
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { sendCmd(); return }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(historyIdx + 1, cmdHistory.length - 1)
      setHistoryIdx(idx); setInput(cmdHistory[idx] ?? '')
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(historyIdx - 1, -1)
      setHistoryIdx(idx); setInput(idx === -1 ? '' : cmdHistory[idx])
    }
  }

  const copyLogs     = () => {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setLogCopied(true)
      setTimeout(() => setLogCopied(false), 2_000)
    })
  }
  const jumpToBottom = () => {
    setAtBottom(true)
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }
  const handleScroll = () => {
    const el = logRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 50)
  }

  const doneCount    = steps.filter(s => s.done).length
  const progressPct  = Math.round((doneCount / steps.length) * 100)
  const activeIdx    = steps.findIndex(s => !s.done)
  const isInstalling = status === 'installing'
  const isStarting   = status === 'starting'
  const canInput     = status === 'running' && connected
  const elapsedStr   = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col bg-black border border-white/10 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm font-medium text-white/60">
          <Terminal size={14} />
          Console
        </div>
        <div className="flex items-center gap-3">
          {lines.length > 0 && (
            <button onClick={copyLogs} title="Copy log" className="text-white/20 hover:text-white/60 transition-colors">
              {logCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            title={expanded ? 'Collapse' : 'Expand'}
            className="text-white/20 hover:text-white/60 transition-colors"
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <span className={`text-xs font-mono ${
            connected    ? 'text-white' :
            isInstalling ? 'text-white/50' :
            isStarting   ? 'text-white/60'  :
                           'text-white/20'
          }`}>
            {connected    ? '● live'
            : isInstalling ? '● installing'
            : isStarting   ? '● starting'
            :                '○ offline'}
          </span>
        </div>
      </div>

      {/*  Installing phase  */}
      {isInstalling && (
        <div className="p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center text-xs text-white/30">
            <span>Setting up your server — this takes a few minutes</span>
            <span className="font-mono tabular-nums text-white/50">{elapsedStr}</span>
          </div>
          <div className="h-px bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1200"
              style={{ width: `${Math.round(((installStep + 0.5) / INSTALL_STEPS.length) * 100)}%` }}
            />
          </div>
          <div className="flex flex-col gap-3">
            {INSTALL_STEPS.map((step, i) => {
              const done   = i < installStep
              const active = i === installStep
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold transition-colors
                    ${done   ? 'bg-white text-black' :
                      active ? 'ring-2 ring-white text-white' :
                               'bg-white/10 text-white/20'}`}>
                    {done ? '✓' : null}
                  </div>
                  <div>
                    <p className={`text-sm leading-none ${done ? 'text-white/20' : active ? 'text-white' : 'text-white/20'}`}>
                      {step.label}
                      {active && <span className="ml-2 inline-block w-1 h-1 rounded-full bg-white animate-pulse align-middle" />}
                    </p>
                    {active && <p className="text-[11px] text-white/30 font-mono mt-1">{step.hint}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/*  Terminal (starting + running)  */}
      {!isInstalling && (
        <>
          {/* Startup progress — slim bar above terminal while starting */}
          {isStarting && (
            <div className="flex items-center gap-3 px-4 py-2 border-b border-white/8 bg-black/60 shrink-0">
              <div className="flex-1 h-px bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[11px] text-white/30 tabular-nums">{progressPct}%</span>
              <span className="text-[11px] text-white/30 truncate max-w-35">
                {activeIdx >= 0 ? steps[activeIdx].label : 'Ready'}
              </span>
            </div>
          )}

          {/* Log output */}
          <div className="relative">
            <div
              ref={logRef}
              onScroll={handleScroll}
              className={`${expanded ? 'h-128' : 'h-72'} overflow-y-auto bg-black p-4 font-mono text-[11px] leading-[1.6] cursor-text transition-[height] duration-200`}
              onClick={() => canInput && inputRef.current?.focus()}
            >
              {lines.length === 0 ? (
                <span className="text-zinc-700">Waiting for output...</span>
              ) : (
                <>
                  {lines.length >= 500 && (
                    <div className="text-zinc-600 text-center mb-3 select-none">— older output trimmed —</div>
                  )}
                  {lines.map((line, i) => <div key={i} className={lineClass(line)}>{line}</div>)}
                </>
              )}
              <div ref={bottomRef} />
            </div>
            {!atBottom && lines.length > 0 && (
              <button
                onClick={jumpToBottom}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white/50 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] transition-all"
              >
                <ArrowDown size={11} />
                Latest
              </button>
            )}
          </div>

          {/* Command input */}
          <div className={`flex items-center gap-2 px-4 py-2.5 border-t border-white/10 bg-black transition-opacity
            ${canInput ? 'opacity-100' : 'opacity-25 pointer-events-none'}`}>
            <span className="text-white/50 font-mono text-sm select-none leading-none">›</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setHistoryIdx(-1) }}
              onKeyDown={onKeyDown}
              disabled={!canInput}
              placeholder={canInput ? 'Enter command...' : isStarting ? 'Server starting...' : 'Server offline'}
              className="flex-1 bg-transparent text-[11px] font-mono text-white placeholder-white/20 outline-none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {input.trim() && (
              <button onClick={sendCmd} className="text-white/30 hover:text-white transition-colors" title="Send (Enter)">
                <CornerDownLeft size={12} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}