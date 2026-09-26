// ─── S05 Quran Reader ────────────────────────────────────────────────────────
// Cream page · ornamental surah header · Bismillah · ayah blocks (Arabic RTL,
// transliteration, translation) · audio-sync highlight + autoscroll ·
// bottom player / reading-progress card with toolbar.
import { useEffect, useRef, useState } from 'react'
import { AArrowUp, Bookmark, BookmarkCheck, Cast, Check, ChevronDown, Headphones, MoreHorizontal, Search } from 'lucide-react'
import { engine } from '../lib/audio'
import { getSurahText, surah, type SurahText } from '../lib/data'
import { useStore } from '../store'
import { CircleBtn, MenuItem, Popover } from '../components/bits'
import { PlayerCard, ReadProgressCard } from '../components/PlayerCard'

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'
const FONT_SIZES = [26, 30, 34, 38]

export function ReaderScreen({ surah: n, ayah: initialAyah }: { surah: number; ayah?: number }) {
  const st = useStore()
  const meta = surah(n)
  const [text, setText] = useState<SurahText | null>(null)
  const [readMode, setReadMode] = useState(false)
  const [more, setMore] = useState(false)
  const [aa, setAa] = useState(false)
  const [cast, setCast] = useState(false)
  const [fontIdx, setFontIdx] = useState(1)
  const [showTrans, setShowTrans] = useState(true)
  const [showTranslit, setShowTranslit] = useState(true)
  const [currentAyah, setCurrentAyah] = useState(initialAyah ?? 1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => { setText(null); getSurahText(n).then(setText) }, [n])

  const synced = st.player.surah === n && st.player.mode === 'sync' && st.player.reciter
  const activeAyah = synced ? st.player.ayah : currentAyah

  // autoscroll to active ayah while playing
  useEffect(() => {
    if (synced && (st.player.status === 'playing' || st.player.status === 'loading')) {
      ayahRefs.current[st.player.ayah]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synced ? st.player.ayah : 0])

  useEffect(() => {
    if (initialAyah) setTimeout(() => ayahRefs.current[initialAyah]?.scrollIntoView({ block: 'center' }), 350)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const mid = el.scrollTop + el.clientHeight * 0.4
    let best = 1
    for (const [k, ref] of Object.entries(ayahRefs.current)) {
      if (ref && ref.offsetTop <= mid) best = Number(k)
    }
    setCurrentAyah(best)
  }

  const fontSize = FONT_SIZES[fontIdx]

  return (
    <div className="h-full flex flex-col dd-cream relative">
      {/* top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-2 pb-1">
        <CircleBtn onClick={() => st.pop()} label="collapse"><ChevronDown size={20} /></CircleBtn>
        <div className="text-center">
          <div className="font-naskh text-[17px] dd-cream-ink leading-none">{meta.arabic}</div>
          <div className="text-[10.5px] dd-cream-ink opacity-60 mt-1">{meta.name} · {meta.ayahs} ayahs</div>
        </div>
        <CircleBtn onClick={() => setMore(v => !v)} label="more"><MoreHorizontal size={18} /></CircleBtn>
      </div>

      {/* content */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[230px]" dir="ltr">
        {/* ornamental surah header */}
        <div className="mt-3 mb-2">
          <div className="relative mx-auto max-w-[330px] py-3 px-8" style={{ border: '2px solid rgb(var(--dd-blue))', borderRadius: 4 }}>
            <div className="absolute inset-[3px] pointer-events-none" style={{ border: '1px solid rgb(var(--dd-blue))', borderRadius: 2, opacity: 0.75 }} />
            {[0, 1, 2, 3].map(i => (
              <span key={i} className="absolute w-2.5 h-2.5 rotate-45" style={{
                background: 'rgb(var(--dd-cream))', border: '2px solid rgb(var(--dd-blue))',
                top: i < 2 ? -7 : 'auto', bottom: i >= 2 ? -7 : 'auto',
                left: i % 2 === 0 ? -7 : 'auto', right: i % 2 === 1 ? -7 : 'auto',
              }} />
            ))}
            <div className="text-center font-quran text-[26px] leading-none" style={{ color: 'rgb(var(--dd-blue))' }}>{meta.arabic}</div>
          </div>
        </div>

        {n !== 9 && n !== 1 && (
          <div className="text-center font-quran dd-cream-ink py-5" dir="rtl" style={{ fontSize: fontSize + 2 }}>{BISMILLAH}</div>
        )}

        {/* ayahs */}
        {!text ? (
          <div className="flex justify-center pt-16"><div className="w-8 h-8 rounded-full border-[3px] dd-cream-ink border-t-transparent spin-slow opacity-50" /></div>
        ) : (
          text.ayahs.map((a, i) => {
            const ayahN = i + 1
            const active = activeAyah === ayahN
            return (
              <div
                key={a.k}
                ref={el => { ayahRefs.current[ayahN] = el }}
                onClick={() => { setCurrentAyah(ayahN); if (st.player.mode === 'sync' && st.player.reciter && st.player.surah === n) engine.playAyahDirect(ayahN) }}
                className={`relative rounded-2xl px-3 py-4 mb-1 transition-colors duration-500 cursor-pointer ${active && synced ? '' : ''}`}
                style={active && synced ? { background: 'rgba(210,165,100,0.22)', boxShadow: 'inset 3px 0 0 rgb(var(--dd-red))' } : undefined}
              >
                <div className="flex items-center justify-between mb-1" dir="ltr">
                  <MoreHorizontal size={15} className="dd-cream-ink opacity-40" />
                  <span className={`text-[12px] tabular-nums font-semibold ${active && synced ? 'dd-red' : 'dd-cream-ink opacity-45'}`}>{ayahN}</span>
                </div>
                <p dir="rtl" className="font-quran dd-cream-ink text-right" style={{ fontSize, lineHeight: 2.05 }}>{a.u}<span className="font-quran" style={{ fontSize: fontSize * 0.62 }}> ﴿{toArabicDigits(ayahN)}﴾</span></p>
                {showTranslit && a.t && (
                  <p className="mt-2.5 text-[15px] leading-relaxed dd-cream-ink opacity-90" dir="ltr">{a.t}</p>
                )}
                {showTrans && a.e && (
                  <p className="mt-1.5 text-[13.5px] leading-relaxed dd-cream-ink opacity-60" dir="ltr">{a.e}</p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* bottom card + toolbar */}
      <div className="absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30">
        {readMode ? <ReadProgressCard ayah={currentAyah} total={meta.ayahs} /> : <PlayerCard compact />}
        <div className="dd-surface rounded-full mt-2 shadow-[0_8px_24px_rgba(0,0,0,0.10)] border dd-line flex items-center justify-around py-1.5">
          <ToolbarBtn onClick={() => st.setSheet('searchBook')} label="search"><Search size={19} /></ToolbarBtn>
          <ToolbarBtn onClick={() => st.toggleBookmark(`${n}:${currentAyah}`)} label="bookmark">
            {st.bookmarks.includes(`${n}:${currentAyah}`) ? <BookmarkCheck size={19} className="dd-red" /> : <Bookmark size={19} />}
          </ToolbarBtn>
          <ToolbarBtn active={!readMode} onClick={() => setReadMode(v => !v)} label="listen">
            <Headphones size={19} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => setAa(v => !v)} label="font"><AArrowUp size={20} /></ToolbarBtn>
          <ToolbarBtn onClick={() => setCast(v => !v)} label="cast"><Cast size={19} /></ToolbarBtn>
        </div>
      </div>

      {/* popovers */}
      <Popover open={more} onClose={() => setMore(false)}>
        <MenuItem icon={<Bookmark size={18} />} label={st.t('bookmarks')} sub={`${st.bookmarks.length}`} onClick={() => setMore(false)} />
        <MenuItem icon={<Headphones size={18} />} label={readMode ? st.t('play') : st.t('read')} onClick={() => { setReadMode(v => !v); setMore(false) }} />
      </Popover>
      <Popover open={aa} onClose={() => setAa(false)} anchor="br" width={230}>
        <div className="px-4 py-3">
          <div className="text-white/80 text-[12px] font-semibold mb-2">Arabic size</div>
          <div className="flex items-center gap-2">
            {FONT_SIZES.map((f, i) => (
              <button key={f} onClick={() => setFontIdx(i)} className={`flex-1 h-9 rounded-xl text-[13px] font-bold ${i === fontIdx ? 'bg-white text-black' : 'bg-white/15 text-white'}`}>{'A'.repeat(0) || `A${i + 1}`}</button>
            ))}
          </div>
          <Toggle label="Transliteration" on={showTranslit} onClick={() => setShowTranslit(v => !v)} />
          <Toggle label="Translation" on={showTrans} onClick={() => setShowTrans(v => !v)} />
        </div>
      </Popover>
      <Popover open={cast} onClose={() => setCast(false)} anchor="br" width={230}>
        <MenuItem icon={<Check size={18} />} label="This device" onClick={() => setCast(false)} />
        <MenuItem icon={<Cast size={18} />} label="AirPlay & Bluetooth" onClick={() => setCast(false)} />
      </Popover>
    </div>
  )
}

function ToolbarBtn({ children, onClick, active, label }: { children: React.ReactNode; onClick?: () => void; active?: boolean; label?: string }) {
  return (
    <button aria-label={label} onClick={onClick} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${active ? 'dd-bg shadow-sm dd-ink' : 'dd-ink-2'}`}>{children}</button>
  )
}
function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-2.5 mt-1">
      <span className="text-white/90 text-[14px]">{label}</span>
      <span className={`w-11 h-6.5 h-[26px] rounded-full p-0.5 transition-colors ${on ? 'bg-green-500' : 'bg-white/25'}`}>
        <span className={`block w-[22px] h-[22px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
      </span>
    </button>
  )
}

function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
