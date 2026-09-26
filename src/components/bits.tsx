// ─── shared UI primitives ────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import { useStore } from '../store'

// ── monogram avatar (lawful generated artwork, no copied photos) ─────────────
const GRADIENTS = [
  ['#c8a26a', '#8a5a34'], ['#7aa5c8', '#34548a'], ['#8ac8a2', '#3a7a56'],
  ['#c87a7a', '#8a3a3a'], ['#a58ac8', '#5a3a8a'], ['#c8bc7a', '#8a7a34'],
  ['#7ac8c2', '#34857f'], ['#c8917a', '#8a5434'],
]
export function Avatar({ name, size = 96, className = '', ring = false }: { name: string; size?: number; className?: string; ring?: boolean }) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  const [c1, c2] = GRADIENTS[h % GRADIENTS.length]
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div
      className={`relative flex items-center justify-center rounded-full select-none overflow-hidden ${ring ? 'ring-2 ring-white/70' : ''} ${className}`}
      style={{ width: size, height: size, background: `linear-gradient(140deg, ${c1}, ${c2})` }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0 opacity-25">
        <g fill="none" stroke="white" strokeWidth="1.1">
          <path d="M50 8 L61 39 L92 50 L61 61 L50 92 L39 61 L8 50 L39 39 Z" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="44" strokeDasharray="4 5" />
        </g>
      </svg>
      <span className="relative font-display font-bold text-white" style={{ fontSize: size * 0.34, textShadow: '0 2px 8px rgba(0,0,0,.25)' }}>{initials}</span>
    </div>
  )
}

// ── section header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, onMore, sub }: { title: string; onMore?: () => void; sub?: string }) {
  return (
    <button onClick={onMore} className="w-full flex items-end justify-between px-5 pt-7 pb-3 text-start group">
      <div className="flex items-center gap-1.5">
        <h2 className="font-display text-[26px] leading-none font-bold dd-ink">{title}</h2>
        {onMore && <ChevronRight size={20} className="dd-ink-3 mt-0.5 rtl-flip" />}
      </div>
      {sub && <span className="text-[13px] dd-ink-3 pb-0.5">{sub}</span>}
    </button>
  )
}

// ── circular frosted icon button ──────────────────────────────────────────────
export function CircleBtn({ children, onClick, size = 40, dark = false, label, className = '' }: { children: React.ReactNode; onClick?: () => void; size?: number; dark?: boolean; label?: string; className?: string }) {
  return (
    <button
      aria-label={label}
      onClick={e => { e.stopPropagation(); onClick?.() }}
      className={`flex items-center justify-center rounded-full transition-transform active:scale-90 ${dark ? 'bg-white/15 text-white backdrop-blur-md' : 'dd-surface dd-ink shadow-sm border dd-line'} ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  )
}

// ── bottom sheet ──────────────────────────────────────────────────────────────
export function Sheet({ open, onClose, title, children, tall = false }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; tall?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="absolute inset-0 z-40 bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={`absolute inset-x-0 bottom-0 z-50 dd-bg rounded-t-[28px] shadow-2xl flex flex-col ${tall ? 'h-[82%]' : 'max-h-[72%]'}`}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            {(title !== undefined) && (
              <div className="relative flex items-center justify-center pt-5 pb-3 px-14">
                <h3 className="font-display text-[19px] font-bold dd-ink">{title}</h3>
                <button onClick={onClose} className="absolute end-4 top-4 w-9 h-9 rounded-full dd-surface border dd-line flex items-center justify-center dd-ink active:scale-90 transition-transform">
                  <X size={17} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── frosted popover menu (anchored, dismiss on outside) ──────────────────────
export function Popover({ open, onClose, anchor = 'tr', children, width = 250 }: { open: boolean; onClose: () => void; anchor?: 'tr' | 'br' | 'bl'; children: React.ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    window.addEventListener('pointerdown', h)
    return () => window.removeEventListener('pointerdown', h)
  }, [open, onClose])
  const pos = anchor === 'tr' ? 'top-14 end-4' : anchor === 'br' ? 'bottom-16 end-4' : 'bottom-16 start-4'
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          className={`absolute ${pos} z-50 glass-dark rounded-3xl p-2 shadow-2xl`}
          style={{ width }}
          initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function MenuItem({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-start text-white/95 hover:bg-white/10 active:bg-white/15 transition-colors">
      <span className="text-white/85">{icon}</span>
      <span className="flex-1">
        <span className="block text-[15px] font-medium leading-tight">{label}</span>
        {sub && <span className="block text-[12px] text-white/55 mt-0.5">{sub}</span>}
      </span>
    </button>
  )
}

// ── segmented control ─────────────────────────────────────────────────────────
export function Segmented<T extends string>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-full p-1 dd-surface border dd-line">
      {options.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`flex-1 rounded-full py-1.5 text-[13px] font-semibold transition-all ${value === o.v ? 'dd-ink shadow-sm dd-bg' : 'dd-ink-3'}`}
          style={value === o.v ? { boxShadow: '0 1px 4px rgba(0,0,0,.12)' } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── centered alert dialog ─────────────────────────────────────────────────────
export function AlertDialog({ open, title, sub, actions }: { open: boolean; title: string; sub?: string; actions: { label: string; primary?: boolean; onClick: () => void }[] }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="absolute z-[61] inset-x-10 top-1/2 -translate-y-1/2 dd-surface rounded-[26px] p-6 shadow-2xl text-center"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
          >
            <h3 className="font-display text-[19px] font-bold dd-ink leading-snug">{title}</h3>
            {sub && <p className="text-[14px] dd-ink-2 mt-1.5">{sub}</p>}
            <div className="flex gap-2.5 mt-5">
              {actions.map(a => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className={`flex-1 py-3 rounded-full text-[15px] font-semibold transition-transform active:scale-95 ${a.primary ? 'dd-ink' : 'dd-ink-2'}`}
                  style={{ background: a.primary ? 'rgba(120,120,128,.22)' : 'rgba(120,120,128,.14)' }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── equalizer bars (now-playing indicator) ────────────────────────────────────
export function EqBars({ color = 'currentColor', size = 14 }: { color?: string; size?: number }) {
  return (
    <div className="flex items-end gap-[2.5px]" style={{ height: size }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="eq-bar rounded-full" style={{ width: 3, height: size, background: color, animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  )
}

// ── download circle button ────────────────────────────────────────────────────
export function DownloadBtn({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }} className="w-8 h-8 rounded-full border dd-line flex items-center justify-center dd-ink-2 active:scale-90 transition-transform" aria-label="download">
      {done ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16" /></svg>
      )}
    </button>
  )
}

// tiny helper for RTL-aware chevrons
export function useRtlFlip() { const { rtl } = useStore(); return rtl }
