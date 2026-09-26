// ─── the expanded player card (reader + ambient) ─────────────────────────────
// Mirrors the reference: artwork, title, reciter, transport row
// (1x · −10s · prev · play/pause · next · +10s · more), slider, toolbar.
import React, { useState } from 'react'
import { AArrowUp, Bookmark, BookmarkCheck, Car, Cast, Check, Headphones, ListMusic, MoreHorizontal, Music2, Repeat, Repeat1, RotateCcw, RotateCw, Search, Share2, Shuffle, SkipBack, SkipForward, Timer } from 'lucide-react'
import { engine } from '../lib/audio'
import { surah } from '../lib/data'
import { useStore } from '../store'
import { Avatar, MenuItem, Popover } from './bits'
import { fmtTime, Slider } from './chrome'

export function PlayerTransport({ dark = false }: { dark?: boolean }) {
  const { player } = useStore()
  const [menu, setMenu] = useState(false)
  const [route, setRoute] = useState(false)
  const playing = player.status === 'playing'
  const ink = dark ? 'text-white' : 'dd-ink'
  const speeds = [1, 1.25, 1.5, 1.75, 2, 0.75]
  return (
    <div className="relative">
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => { const i = speeds.indexOf(player.speed); engine.setSpeed(speeds[(i + 1) % speeds.length]) }}
          className={`w-10 h-10 flex items-center justify-center text-[13px] font-bold ${ink} active:scale-90 transition-transform`}
        >{player.speed}x</button>
        <button onClick={() => engine.skip(-10)} className={`relative w-10 h-10 flex items-center justify-center ${ink} active:scale-90 transition-transform`} aria-label="back 10s">
          <RotateCcw size={22} strokeWidth={1.8} /><span className="absolute text-[8px] font-bold mt-[1px]">10</span>
        </button>
        <button onClick={() => engine.prev()} className={`w-10 h-10 flex items-center justify-center ${ink} active:scale-90 transition-transform rtl-flip`} aria-label="previous">
          <SkipBack size={26} fill="currentColor" />
        </button>
        <button
          onClick={() => engine.toggle()}
          className={`w-[68px] h-[68px] rounded-full flex items-center justify-center active:scale-92 transition-transform ${dark ? 'bg-white text-black' : 'bg-black text-white dark:bg-white dark:text-black'}`}
          style={{ boxShadow: '0 6px 20px rgba(0,0,0,.25)' }}
          aria-label="play/pause"
        >
          {player.status === 'loading' ? (
            <div className="w-6 h-6 rounded-full border-[2.5px] border-current border-t-transparent spin-slow" />
          ) : playing ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4" width="4.6" height="16" rx="1.4"/><rect x="13.9" y="4" width="4.6" height="16" rx="1.4"/></svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="ms-1"><path d="M7 4.9c0-1.2 1.3-1.9 2.3-1.3l11 6.4c.9.6.9 1.9 0 2.5l-11 6.4c-1 .6-2.3-.1-2.3-1.3V4.9z"/></svg>
          )}
        </button>
        <button onClick={() => engine.next()} className={`w-10 h-10 flex items-center justify-center ${ink} active:scale-90 transition-transform rtl-flip`} aria-label="next">
          <SkipForward size={26} fill="currentColor" />
        </button>
        <button onClick={() => engine.skip(10)} className={`relative w-10 h-10 flex items-center justify-center ${ink} active:scale-90 transition-transform`} aria-label="forward 10s">
          <RotateCw size={22} strokeWidth={1.8} /><span className="absolute text-[8px] font-bold mt-[1px]">10</span>
        </button>
        <button onClick={() => setMenu(v => !v)} className={`w-10 h-10 flex items-center justify-center ${ink} active:scale-90 transition-transform`} aria-label="more">
          <MoreHorizontal size={22} />
        </button>
      </div>

      <Popover open={menu} onClose={() => setMenu(false)} anchor="br" width={240}>
        <MenuItem icon={<ListMusic size={18} />} label="Queue" onClick={() => setMenu(false)} />
        <MenuItem icon={<Car size={18} />} label="CarPlay" onClick={() => setMenu(false)} />
        <MenuItem icon={<Shuffle size={18} />} label="Shuffle" sub={player.shuffle ? 'On' : 'Off'} onClick={() => engine.setShuffle(!player.shuffle)} />
        <MenuItem
          icon={player.repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          label="Repeat"
          sub={player.repeat === 'off' ? 'Off' : player.repeat === 'one' ? 'One' : 'All'}
          onClick={() => engine.setRepeat(player.repeat === 'off' ? 'one' : player.repeat === 'one' ? 'all' : 'off')}
        />
        <MenuItem icon={<Timer size={18} />} label="Timer" sub="Sleep timer" onClick={() => setMenu(false)} />
        <MenuItem icon={<Share2 size={18} />} label="Share" onClick={() => { setMenu(false); navigator.share?.({ title: 'DeenDunya', text: 'Listen to the Quran on DeenDunya' }).catch(() => {}) }} />
      </Popover>
      <Popover open={route} onClose={() => setRoute(false)} anchor="br" width={240}>
        <MenuItem icon={<Check size={18} />} label="This device" onClick={() => setRoute(false)} />
        <MenuItem icon={<Cast size={18} />} label="AirPlay & Bluetooth" onClick={() => setRoute(false)} />
      </Popover>
    </div>
  )
}

export function PlayerCard({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { player, bookmarks, toggleBookmark, setSheet, t } = useStore()
  const { reciter, surah: s } = player
  const [cast, setCast] = useState(false)
  if (!reciter || !s) return null
  const meta = surah(s)
  const bm = bookmarks.includes(`${s}:1`)
  const sub = dark ? 'text-white/70' : 'dd-ink-2'
  const ink = dark ? 'text-white' : 'dd-ink'

  return (
    <div className={`${dark ? 'glass-dark' : 'dd-surface shadow-[0_10px_36px_rgba(0,0,0,0.12)]'} rounded-[30px] px-4 pt-3.5 pb-3`}>
      <div className="flex items-center gap-3">
        <Avatar name={reciter.name} size={44} />
        <div className="flex-1 min-w-0">
          <div className={`text-[14.5px] font-bold truncate ${ink}`}>
            {s}. {meta.name} — <span className="font-naskh">{meta.arabic}</span>
          </div>
          <div className={`text-[12.5px] truncate ${sub}`}>{reciter.name}</div>
        </div>
        <button className={`w-9 h-9 rounded-full flex items-center justify-center ${dark ? 'bg-white/15 text-white' : 'dd-red-soft dd-red'}`}>
          <Music2 size={17} />
        </button>
      </div>

      <div className="mt-2.5">
        <PlayerTransport dark={dark} />
      </div>

      <div className="mt-1.5 px-0.5">
        <Slider value={player.elapsed} max={player.duration || 0} onSeek={v => engine.seek(v)} dark={dark} small />
        <div className={`flex justify-between text-[11px] mt-0.5 tabular-nums ${sub}`}>
          <span>{fmtTime(player.elapsed)}</span>
          <span>{player.duration ? fmtTime(player.duration) : '—'}</span>
        </div>
      </div>

      {!compact && (
        <div className={`mt-1 pt-2 border-t ${dark ? 'border-white/15' : 'dd-line border-t'} flex items-center justify-around`}>
          <ToolbarBtn dark={dark} onClick={() => setSheet('searchBook')} label={t('search')}><Search size={19} /></ToolbarBtn>
          <ToolbarBtn dark={dark} onClick={() => toggleBookmark(`${s}:1`)} label={t('bookmarks')}>
            {bm ? <BookmarkCheck size={19} className="dd-red" /> : <Bookmark size={19} />}
          </ToolbarBtn>
          <ToolbarBtn dark={dark} active label={t('audioSync')}><Headphones size={19} /></ToolbarBtn>
          <ToolbarBtn dark={dark} onClick={() => {}} label="Aa">
            <span className="flex items-end gap-0.5"><AArrowUp size={20} /></span>
          </ToolbarBtn>
          <ToolbarBtn dark={dark} onClick={() => setCast(v => !v)} label="cast"><Cast size={19} /></ToolbarBtn>
        </div>
      )}
      <Popover open={cast} onClose={() => setCast(false)} anchor="br" width={230}>
        <MenuItem icon={<Check size={18} />} label="This device" onClick={() => setCast(false)} />
        <MenuItem icon={<Cast size={18} />} label="AirPlay & Bluetooth" onClick={() => setCast(false)} />
      </Popover>
    </div>
  )
}

function ToolbarBtn({ children, onClick, dark, active, label }: { children: React.ReactNode; onClick?: () => void; dark?: boolean; active?: boolean; label?: string }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90 ${active ? (dark ? 'bg-white/20 text-white' : 'dd-surface shadow dd-ink') : (dark ? 'text-white/85' : 'dd-ink-2')}`}
    >
      {children}
    </button>
  )
}

// ── reading progress card (reader "read mode" toggle) ────────────────────────
export function ReadProgressCard({ ayah, total }: { ayah: number; total: number }) {
  const { player, t } = useStore()
  const s = player.surah
  if (!s) return null
  const meta = surah(s)
  const pct = total ? Math.round((ayah / total) * 100) : 0
  return (
    <div className="dd-surface rounded-[30px] px-5 pt-4 pb-3 shadow-[0_10px_36px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between">
        <div className="text-[14.5px] font-bold dd-ink">{s}. {meta.name} — <span className="font-naskh">{meta.arabic}</span></div>
        <span className="w-8 h-8 rounded-full dd-red-soft dd-red flex items-center justify-center"><Check size={16} strokeWidth={2.6} /></span>
      </div>
      <div className="text-[12.5px] dd-ink-2 mt-0.5">{t('page')} {meta.page}, {t('juz')} {Math.ceil(s / 4)}, {t('hizb')} 1</div>
      <div className="mt-3">
        <Slider value={ayah} max={total} onSeek={() => {}} small />
        <div className="flex justify-between text-[11px] dd-ink-2 mt-0.5 tabular-nums">
          <span>{t('read')} {pct}%</span>
          <span>{ayah} / {total}</span>
        </div>
      </div>
    </div>
  )
}
