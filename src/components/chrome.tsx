// ─── persistent chrome: status bar, tab bar, mini player ────────────────────
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CalendarDays, Home, MoonStar, Pause, Play, Search, SkipForward, type LucideIcon } from 'lucide-react'
import { useStore, type Tab } from '../store'
import { Avatar, EqBars } from './bits'
import { fmtTime, surah } from '../lib/data'
import { platform } from '../lib/platform'

export function StatusBar({ nested = false }: { nested?: boolean }) {
  // In the iOS app the real status bar sits above us: the top-level bar just reserves
  // its height, and a nested one (pushed screens) keeps the mock bar's spacing.
  if (platform.native) return <div className="relative z-30 shrink-0" style={{ height: nested ? 36 : 'var(--sat)' }} />
  return <MockStatusBar />
}

// phone-mockup status bar for the web preview
function MockStatusBar() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const f = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
    f(); const id = setInterval(f, 15000); return () => clearInterval(id)
  }, [])
  return (
    <div className="relative z-30 flex items-center justify-between px-7 pt-3 pb-1 dd-ink pointer-events-none select-none">
      <span className="text-[13px] font-semibold tracking-wide">{time}</span>
      <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[110px] h-[30px] bg-black rounded-full" />
      <div className="flex items-center gap-1.5 opacity-90">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="4.3" y="4.8" width="3" height="6.2" rx="0.6"/><rect x="8.6" y="2.4" width="3" height="8.6" rx="0.6"/><rect x="12.9" y="0" width="3" height="11" rx="0.6"/></svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 9.2a1.4 1.4 0 100 2.8 1.4 1.4 0 000-2.8zM7.5 5.6c1.7 0 3.2.6 4.4 1.7l1.4-1.5A8.1 8.1 0 007.5 4a8.1 8.1 0 00-5.8 1.8l1.4 1.5a6.3 6.3 0 014.4-1.7zM7.5 0c3 0 5.7 1.1 7.8 3L13.9 4.5A10.9 10.9 0 007.5 2a10.9 10.9 0 00-6.4 2.5L-.3 3A13 13 0 017.5 0z" transform="translate(0.5,-1)"/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.2" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="14" height="8" rx="1.8" fill="currentColor"/><path d="M23.5 4v4a2.2 2.2 0 000-4z" fill="currentColor" opacity="0.5"/></svg>
      </div>
    </div>
  )
}

const TABS: { id: Tab; icon: LucideIcon }[] = [
  { id: 'main', icon: Home },
  { id: 'today', icon: CalendarDays },
  { id: 'read', icon: BookOpen },
  { id: 'sleep', icon: MoonStar },
  { id: 'search', icon: Search },
]

export function TabBar() {
  const { nav, setTab, t } = useStore()
  return (
    <div className="relative z-30 dd-surface border-t dd-line">
      <div className="flex items-stretch justify-around px-2 pt-1.5 pb-[max(10px,var(--sab))]">
        {TABS.map(({ id, icon: Icon }) => {
          const active = nav.tab === id
          return (
            <button key={id} onClick={() => setTab(id)} className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-colors min-w-[62px]">
              {active && <motion.span layoutId="tab-pill" className="absolute inset-0 dd-red-soft rounded-2xl" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} className={`relative ${active ? 'dd-red' : 'dd-ink-3'}`} />
              <span className={`relative text-[10.5px] font-semibold ${active ? 'dd-red' : 'dd-ink-3'}`}>{t(id)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MiniPlayer() {
  const { player, push, nav } = useStore()
  const { reciter, surah: s, status, elapsed, duration } = player
  if (!reciter || !s) return null
  const meta = surah(s)
  const inReader = nav.stack.some(p => p.t === 'reader')
  const pct = duration ? Math.min(100, (elapsed / duration) * 100) : 0
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="absolute inset-x-3 bottom-[calc(68px+var(--sab))] z-30"
    >
      <div
        onClick={() => { if (!inReader) push({ t: 'reader', surah: s }) }}
        className="glass rounded-full ps-2 pe-2.5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.14)] border border-white/50 flex items-center gap-2.5 cursor-pointer active:scale-[0.985] transition-transform"
      >
        <div className="relative">
          <Avatar name={reciter.name} size={38} />
          <div className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-black/15 overflow-hidden">
            <div className="h-full dd-red-bg" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="text-[13px] font-semibold dd-ink truncate">{s}. {meta.name} <span className="font-naskh">· {meta.arabic.replace('سورة', '')}</span></div>
          <div className="text-[11px] dd-ink-2 truncate flex items-center gap-1.5">
            {status === 'playing' && <EqBars size={10} color="rgb(var(--dd-red))" />}
            {reciter.name}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); import('../lib/audio').then(m => m.engine.toggle()) }}
          className="w-9 h-9 flex items-center justify-center dd-ink active:scale-90 transition-transform"
          aria-label="play/pause"
        >
          {status === 'playing' ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" className="ms-0.5" />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); import('../lib/audio').then(m => m.engine.next()) }}
          className="w-8 h-8 flex items-center justify-center dd-ink active:scale-90 transition-transform rtl-flip"
          aria-label="next"
        >
          <SkipForward size={19} fill="currentColor" />
        </button>
      </div>
    </motion.div>
  )
}

// ── shared slider ─────────────────────────────────────────────────────────────
export function Slider({ value, max, onSeek, dark = false, small = false }: { value: number; max: number; onSeek: (v: number) => void; dark?: boolean; small?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={`relative w-full flex items-center group ${small ? 'h-4' : 'h-6'}`}>
      <div className={`relative w-full ${small ? 'h-[3px]' : 'h-[4px]'} rounded-full ${dark ? 'bg-white/25' : 'bg-black/12'}`}>
        <div className={`absolute inset-y-0 start-0 rounded-full ${dark ? 'bg-white' : 'dd-red-bg'}`} style={{ width: `${pct}%` }} />
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full shadow ${dark ? 'bg-white' : 'dd-red-bg'}`}
          style={{ insetInlineStart: `${pct}%`, width: small ? 10 : 13, height: small ? 10 : 13 }}
        />
      </div>
      <input
        type="range" min={0} max={Math.max(1, max)} step={0.5} value={value}
        onChange={e => onSeek(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
        aria-label="seek"
      />
    </div>
  )
}

export { fmtTime }
