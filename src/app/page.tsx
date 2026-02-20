'use client'
import Link from 'next/link'
import { Zap, Server, Shield, Users, Terminal, ArrowRight, CheckCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const PLANS = [
  { name: 'Spark',  ram: '1 GB',  price: '4.99',  players: 10,  popular: false },
  { name: 'Blaze',  ram: '2 GB',  price: '8.99',  players: 30,  popular: false },
  { name: 'Storm',  ram: '4 GB',  price: '14.99', players: 60,  popular: true  },
  { name: 'Surge',  ram: '6 GB',  price: '19.99', players: 100, popular: false },
  { name: 'Titan',  ram: '8 GB',  price: '27.99', players: 150, popular: false },
  { name: 'Apex',   ram: '16 GB', price: '49.99', players: 250, popular: false },
]

const FEATURES = [
  {
    icon: <Zap size={18} className="text-emerald-400" />,
    title: 'Instant Deploy',
    desc: 'Your server is online in under 60 seconds. No waiting, no setup headaches.',
  },
  {
    icon: <Terminal size={18} className="text-emerald-400" />,
    title: 'Live Console',
    desc: 'Stream server logs in real time and run commands directly from your browser.',
  },
  {
    icon: <Server size={18} className="text-emerald-400" />,
    title: 'Full Control',
    desc: 'Start, stop, restart, and configure every property from one clean interface.',
  },
  {
    icon: <Shield size={18} className="text-emerald-400" />,
    title: 'Always Online',
    desc: '24/7 bare-metal racks with automatic monitoring and instant failure detection.',
  },
  {
    icon: <Users size={18} className="text-emerald-400" />,
    title: 'Player Insights',
    desc: "See who's online in real time with live player tracking and session history.",
  },
  {
    icon: <CheckCircle size={18} className="text-emerald-400" />,
    title: 'One-Click Config',
    desc: 'Edit every server.properties setting without touching a config file manually.',
  },
]

function MinetopiaLogo() {
  return (
    <svg viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-6 shrink-0">
      <ellipse cx="20" cy="15" rx="19" ry="14" fill="white" />
      <circle cx="13" cy="15" r="3" fill="black" />
      <circle cx="27" cy="15" r="3" fill="black" />
    </svg>
  )
}

export default function Home() {
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      setNavVisible(current < 50 || current < lastScrollY.current)
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">

      {/*  Nav  */}
      <div className={`fixed top-4 left-0 right-0 z-50 flex justify-center px-4 transition-transform duration-300 ease-in-out ${navVisible ? 'translate-y-0' : '-translate-y-28'}`}>
        <nav className="flex items-center justify-between w-full max-w-3xl px-5 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <Link href="/" className="flex items-center gap-2.5">
            <MinetopiaLogo />
            <span className="font-bold text-lg tracking-wide text-white">Minetopia</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-1.5">
              Login
            </Link>
            <Link href="/register" className="text-sm bg-white hover:bg-white/90 text-black font-semibold px-4 py-1.5 rounded-full transition-colors">
              Get Started
            </Link>
          </div>
        </nav>
      </div>

      {/*  Hero  */}
      <section className="flex flex-col items-center text-center pt-40 pb-24 px-6 gap-7 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Servers deploy in under 60 seconds
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Minecraft Hosting.<br />
          <span className="text-emerald-400">Built different.</span>
        </h1>
        <p className="text-white/40 text-lg max-w-xl leading-relaxed">
          High-performance servers on bare-metal hardware. Canadian infrastructure.
          A clean dashboard that actually makes sense.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/register" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-7 py-3 rounded-xl text-sm transition-colors">
            Deploy Your Server <ArrowRight size={15} />
          </Link>
          <Link href="/login" className="flex items-center gap-2 border border-white/15 hover:border-white/30 hover:bg-white/5 text-white/60 hover:text-white font-medium px-7 py-3 rounded-xl text-sm transition-all">
            Sign In
          </Link>
        </div>
      </section>

      {/*  Dashboard preview  */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        {/* browser chrome */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/6 bg-white/2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            <span className="ml-3 text-xs text-white/20 font-mono">dashboard.minetopia.gg/servers/survival</span>
          </div>

          {/* page content */}
          <div className="p-6 flex flex-col gap-4 pointer-events-none select-none">

            {/* header card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://images.igdb.com/igdb/image/upload/t_cover_big/co8fu7.webp"
                  alt="Minecraft"
                  className="w-11 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base">Survival World</span>
                    <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-medium">running</span>
                  </div>
                  <span className="text-white/35 text-xs">Minecraft 1.21.4 · Vanilla <span className="text-white/20 ml-1">:25565</span></span>
                </div>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">Delete</div>
            </div>

            {/* stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'CPU',     value: '18.3', unit: '%',    bar: 18, color: 'text-white' },
                { label: 'RAM',     value: '1842', unit: 'MB',   bar: 45, color: 'text-white' },
                { label: 'Players', value: '5',    unit: 'online', bar: 25, color: 'text-white', names: ['Steve', 'Alex', 'Notch', 'Herobrine', 'Dave'] },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5">
                  <span className="text-xs text-white/35 uppercase tracking-wider">{stat.label}</span>
                  <p className={`text-2xl font-bold leading-none ${stat.color}`}>
                    {stat.value}<span className="text-sm font-normal text-white/30 ml-1">{stat.unit}</span>
                  </p>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stat.bar}%` }} />
                  </div>
                  {stat.names && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {stat.names.map(n => (
                        <span key={n} className="text-[10px] bg-white/8 text-white/50 rounded px-1.5 py-0.5">{n}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* power buttons */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">
                ▶ Start
              </div>
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-500/12 text-red-400 border border-red-500/25">
                ■ Stop
              </div>
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-amber-500/12 text-amber-400 border border-amber-500/25">
                ↺ Restart
              </div>
            </div>

            {/* console */}
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6">
                <span className="text-xs text-white/30 font-medium uppercase tracking-wider">Console</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="p-4 font-mono text-xs flex flex-col gap-1 text-white/40">
                {[
                  { t: '16:04:01', c: 'text-white/25', m: '[Server thread/INFO]: Starting minecraft server on *:25565' },
                  { t: '16:04:03', c: 'text-white/25', m: '[Server thread/INFO]: Preparing level "world"' },
                  { t: '16:04:11', c: 'text-emerald-400/70', m: '[Server thread/INFO]: Done (8.241s)! For help, type "help"' },
                  { t: '16:04:18', c: 'text-blue-400/70',   m: '[Server thread/INFO]: Steve joined the game' },
                  { t: '16:04:22', c: 'text-blue-400/70',   m: '[Server thread/INFO]: Alex joined the game' },
                  { t: '16:05:01', c: 'text-white/25', m: '[Server thread/INFO]: Saving the game (this may take a moment!)' },
                ].map((line, i) => (
                  <p key={i}>
                    <span className="text-white/20">[{line.t}]</span>{' '}
                    <span className={line.c}>{line.m}</span>
                  </p>
                ))}
                <p className="mt-1">
                  <span className="text-white/20 mr-1">›</span>
                  <span className="bg-white/60 w-1.5 h-3.5 inline-block align-middle ml-0.5 animate-pulse" />
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/*  Features  */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-white/25 mb-3">Why Minetopia</p>
          <h2 className="text-3xl font-bold tracking-tight">Everything you need, nothing you don&apos;t</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white/4 border border-white/8 hover:border-white/15 rounded-2xl p-6 flex flex-col gap-3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/*  Plans  */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-white/25 mb-3">Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight">Simple, honest pricing</h2>
          <p className="text-white/30 text-sm mt-3">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col gap-5 transition-colors ${
                plan.popular
                  ? 'bg-emerald-500/8 border border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-white/4 border border-white/8 hover:border-white/18'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-bold">{plan.name}</h3>
                <p className="text-3xl font-extrabold tracking-tight">
                  ${plan.price}
                  <span className="text-sm font-normal text-white/30 ml-1">/mo</span>
                </p>
              </div>
              <ul className="flex flex-col gap-2 text-sm text-white/45">
                {[
                  `${plan.ram} RAM`,
                  `Up to ${plan.players} players`,
                  'Instant Vanilla setup',
                  'Canadian servers',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-emerald-500/60 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-auto block text-center font-semibold py-2.5 rounded-xl text-sm transition-colors ${
                  plan.popular
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-white/8 hover:bg-white/14 text-white border border-white/10'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/*  CTA  */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <div className="bg-white/4 border border-white/8 rounded-2xl p-12 flex flex-col items-center text-center gap-5">
          <h2 className="text-3xl font-bold tracking-tight">Ready to play?</h2>
          <p className="text-white/35 text-sm max-w-md">
            Deploy your server in under a minute. No credit card required to get started.
          </p>
          <Link href="/register" className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-bold px-8 py-3 rounded-xl text-sm transition-colors">
            Deploy Now <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/*  Footer  */}
      <footer className="border-t border-white/6 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-white/20 text-xs">
          <span><span className="text-emerald-400/70">⛏</span> Minetopia</span>
          <span>© {new Date().getFullYear()} Minetopia. All rights reserved.</span>
        </div>
      </footer>

    </div>
  )
}