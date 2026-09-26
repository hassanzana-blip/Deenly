// ─── S06 Today ───────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, MoonStar, Play, Radio, User } from 'lucide-react'
import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan'
import { getSurahText, HADITH_OF_DAY, hijriToday, surah, VERSes_OF_DAY } from '../lib/data'
import { IMG } from '../lib/images'
import { platform } from '../lib/platform'
import { useStore } from '../store'
import { SectionHeader, Segmented } from '../components/bits'
import { engine } from '../lib/audio'

export default function TodayScreen() {
  const st = useStore()
  const [dayIdx] = useState(() => Math.floor(Date.now() / 86400000))
  const vod = VERSes_OF_DAY[dayIdx % VERSes_OF_DAY.length]
  const hod = HADITH_OF_DAY[dayIdx % HADITH_OF_DAY.length]
  const [verse, setVerse] = useState<{ u: string; e: string } | null>(null)
  useEffect(() => { getSurahText(vod.surah).then(t => { const a = t.ayahs[vod.ayah - 1]; if (a) setVerse({ u: a.u, e: a.e }) }, () => {}) }, [vod])

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-44">
      <div className="flex items-start justify-between px-5 pt-2">
        <div>
          <h1 className="font-display text-[34px] font-bold dd-ink leading-none">{st.t('today')}</h1>
          <p className="text-[13px] dd-ink-2 mt-1.5">{new Date().toLocaleDateString(st.lang === 'ar' ? 'ar' : st.lang === 'no' ? 'nb-NO' : 'en-GB', { month: 'long', day: 'numeric', year: 'numeric' })} · {hijriToday(st.lang)}</p>
        </div>
        <button onClick={() => st.setSheet('profile')} className="w-10 h-10 rounded-full dd-red-soft dd-red flex items-center justify-center active:scale-90 transition-transform mt-1">
          <User size={18} />
        </button>
      </div>

      {/* stories */}
      <div className="flex items-baseline justify-between pe-5">
        <SectionHeader title={st.t('stories')} />
      </div>
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-5">
        <button
          onClick={() => st.push({ t: 'reader', surah: vod.surah, ayah: vod.ayah })}
          className="shrink-0 w-[230px] h-[150px] rounded-[22px] p-4 text-start relative overflow-hidden active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(150deg,#7f9ab5,#4a6785 60%,#33485f)' }}
        >
          <div className="font-display text-[21px] font-bold text-white leading-tight">{st.t('verseOfDay')}</div>
          {verse && <div dir="rtl" className="font-quran text-white/90 text-[17px] mt-2 line-clamp-2">{verse.u}</div>}
          <div className="absolute bottom-3 start-4 text-[11px] text-white/75 font-semibold">{surah(vod.surah).name} {vod.surah}:{vod.ayah}</div>
        </button>
        <button
          onClick={() => {}}
          className="shrink-0 w-[230px] h-[150px] rounded-[22px] p-4 text-start relative overflow-hidden active:scale-[0.98] transition-transform bg-cover bg-center"
          style={{ backgroundImage: `url(${IMG.tile})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/10" />
          <div className="relative font-display text-[21px] font-bold text-white leading-tight">{st.t('hadithOfDay')}</div>
          <div className="relative text-white/90 text-[12px] mt-2 line-clamp-3 leading-snug">“{hod.text}”</div>
          <div className="absolute bottom-3 start-4 text-[11px] text-white/85 font-semibold">{hod.source}</div>
        </button>
      </div>

      {/* prayer times (DeenDunya adaptation) */}
      <PrayerCard />

      {/* live tv */}
      <SectionHeader title={st.t('liveTV')} />
      <p className="px-5 -mt-2 text-[13.5px] dd-ink-2 leading-snug">{st.t('liveTVSub')}</p>
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-5 pt-4">
        <TVCard img={IMG.madinah} title="Madinah Live HD" href="https://www.youtube.com/results?search_query=madinah+live" />
        <TVCard title="Makkah Live HD" href="https://www.youtube.com/results?search_query=makkah+live" kaaba />
        <TVCard title="Quran Kareem TV" href="https://www.youtube.com/results?search_query=quran+tv+live" gold />
      </div>

      {/* online radio */}
      <SectionHeader title={st.t('onlineRadio')} />
      <p className="px-5 -mt-2 text-[13.5px] dd-ink-2 leading-snug">{st.t('onlineRadioSub')}</p>
      <RadioRows />

      {/* islamic events */}
      <SectionHeader title={st.t('islamicEvents')} />
      <p className="px-5 -mt-2 text-[13.5px] dd-ink-2 leading-snug">{st.t('islamicEventsSub')}</p>
      <EventsCalendar />
    </div>
  )
}

// ── prayer times card (computed locally with the adhan library) ──────────────
function PrayerCard() {
  const st = useStore()
  const [coords, setCoords] = useState<Coordinates>(new Coordinates(59.9139, 10.7522)) // Oslo fallback
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    let alive = true
    platform.getPosition().then(p => { if (alive && p) setCoords(new Coordinates(p.latitude, p.longitude)) })
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  const { next, nextTime, times } = useMemo(() => {
    const pt = new PrayerTimes(coords, now, CalculationMethod.MuslimWorldLeague())
    const names: [string, Date][] = [['fajr', pt.fajr], ['sunrise', pt.sunrise], ['dhuhr', pt.dhuhr], ['asr', pt.asr], ['maghrib', pt.maghrib], ['isha', pt.isha]]
    const upcoming = names.find(([, d]) => d > now) ?? names[0]
    return { next: upcoming[0], nextTime: upcoming[1], times: names }
  }, [coords, now])
  const diff = Math.max(0, nextTime.getTime() - now.getTime())
  const hh = Math.floor(diff / 3600000), mm = Math.floor((diff % 3600000) / 60000)
  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(140deg,#1d3557,#457b9d)' }}>
        <MoonStar size={90} className="absolute -end-4 -top-4 opacity-15" />
        <div className="text-[12px] font-semibold text-white/75 uppercase tracking-wider">{st.t('nextPrayer')}</div>
        <div className="flex items-end justify-between mt-1">
          <div>
            <span className="font-display text-[30px] font-bold capitalize">{next}</span>
            <span className="text-white/85 text-[15px] ms-2.5 tabular-nums">{nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
          <div className="text-[13px] text-white/85 tabular-nums">−{hh}:{String(mm).padStart(2, '0')}</div>
        </div>
        <div className="flex justify-between mt-4 pt-3 border-t border-white/20">
          {times.map(([n, d]) => (
            <div key={n} className={`text-center ${n === next ? 'text-white' : 'text-white/60'}`}>
              <div className="text-[10px] font-semibold capitalize">{n}</div>
              <div className="text-[11.5px] tabular-nums mt-0.5">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TVCard({ img, title, href, kaaba = false, gold = false }: { img?: string; title: string; href: string; kaaba?: boolean; gold?: boolean }) {
  return (
    <button onClick={() => platform.openUrl(href)} className="shrink-0 w-[190px] h-[120px] rounded-[20px] relative overflow-hidden active:scale-[0.98] transition-transform block text-start"
      style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: gold ? 'linear-gradient(140deg,#e8d9a8,#c9a94f)' : 'linear-gradient(140deg,#f0ead8,#cbbf95)' }}>
      {kaaba && <svg viewBox="0 0 100 100" className="absolute inset-0 m-auto w-16 h-16 opacity-80"><rect x="30" y="35" width="40" height="34" rx="2" fill="#1a1a1a"/><rect x="30" y="41" width="40" height="6" fill="#c9a94f"/><circle cx="50" cy="24" r="9" fill="none" stroke="#c9a94f" strokeWidth="4"/></svg>}
      {gold && <svg viewBox="0 0 100 100" className="absolute inset-0 m-auto w-16 h-16 opacity-80"><path d="M50 15l8 22h23l-18 14 7 23-20-14-20 14 7-23-18-14h23z" fill="#8a6d1f"/></svg>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="absolute bottom-2.5 start-3 text-white text-[13.5px] font-bold drop-shadow">{title}</div>
      <span className="absolute bottom-2.5 end-3 w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center"><Play size={13} fill="currentColor" className="ms-0.5" /></span>
    </button>
  )
}

// ── live quran radio via mp3quran radio streams ──────────────────────────────
const RADIOS = [
  { name: 'Radio Quran — Alafasy', url: 'https://backup.qurango.net/radio/mishary_alafasi' },
  { name: 'Radio Quran — Abdul Basit', url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_murattal' },
  { name: 'Beautiful recitations', url: 'https://backup.qurango.net/radio/maher_al_meaqli' },
]
function RadioRows() {
  const [active, setActive] = useState<number | null>(null)
  const playRadio = (i: number) => {
    if (active === i) { platform.radioStop(); setActive(null); return }
    engine.pause() // radio and recitation never play over each other
    platform.radioPlay(RADIOS[i].url).then(ok => setActive(ok ? i : null))
  }
  useEffect(() => () => { platform.radioStop() }, [])
  return (
    <div className="px-5 pt-4 flex flex-col">
      {RADIOS.map((r, i) => (
        <div key={r.name} className="flex items-center gap-3.5 py-2.5 border-b dd-line">
          <span className="w-11 h-11 rounded-2xl dd-surface border dd-line flex items-center justify-center dd-red"><Radio size={19} /></span>
          <span className="flex-1 text-[15px] font-semibold dd-ink">{r.name}</span>
          <span className="flex items-center gap-1 text-[10px] font-bold dd-red uppercase tracking-wide">{active === i ? 'Live' : ''}</span>
          <button onClick={() => playRadio(i)} className="w-9 h-9 rounded-full dd-surface border dd-line flex items-center justify-center dd-ink active:scale-90 transition-transform">
            {active === i ? <span className="w-3 h-3 rounded-[3px] dd-red-bg" /> : <Play size={14} fill="currentColor" className="ms-0.5" />}
          </button>
        </div>
      ))}
    </div>
  )
}

// ── events calendar ───────────────────────────────────────────────────────────
function EventsCalendar() {
  const st = useStore()
  const [mode, setMode] = useState<'cal' | 'chrono'>('cal')
  const now = new Date()
  const year = now.getFullYear(), month = now.getMonth()
  const first = new Date(year, month, 1)
  const daysIn = new Date(year, month + 1, 0).getDate()
  const startDow = first.getDay()
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)]
  const monthName = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return (
    <div className="px-5 pt-4">
      <Segmented options={[{ v: 'cal', label: st.t('calendar') }, { v: 'chrono', label: st.t('chronology') }]} value={mode} onChange={v => setMode(v)} />
      {mode === 'cal' ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-[18px] font-bold dd-ink flex items-center gap-2">{monthName} <ChevronRight size={16} className="dd-ink-3" /></span>
            <span className="text-[11px] font-bold tracking-widest dd-ink-3">TODAY</span>
          </div>
          <div className="grid grid-cols-7 mt-3 text-center text-[11px] font-bold dd-ink-3">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 text-center">
            {cells.map((d, i) => (
              <div key={i} className="py-1.5">
                {d && (
                  <span className={`inline-flex w-9 h-9 items-center justify-center rounded-full text-[14px] tabular-nums ${d === now.getDate() ? 'bg-black text-white font-bold dark:bg-white dark:text-black' : 'dd-ink'}`}>{d}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col">
          {islamicEvents().map(e => (
            <div key={e.name} className="flex items-center gap-3.5 py-3 border-b dd-line">
              <span className="w-11 h-11 rounded-2xl dd-red-soft dd-red flex items-center justify-center"><CalendarDays size={18} /></span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold dd-ink">{e.name}</span>
                <span className="block text-[12px] dd-ink-2">{e.hijri} · ≈ {e.date}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function islamicEvents(): { name: string; hijri: string; date: string }[] {
  // approximate Gregorian dates for the current Hijri year (approximation flagged in UI)
  const candidates = [
    { name: 'Ramadan begins', hijri: '1 Ramadan', date: '2027-02-08' },
    { name: 'Laylat al-Qadr', hijri: '27 Ramadan', date: '2027-03-06' },
    { name: 'Eid al-Fitr', hijri: '1 Shawwal', date: '2027-03-09' },
    { name: 'Day of Arafah', hijri: '9 Dhul-Hijjah', date: '2027-05-16' },
    { name: 'Eid al-Adha', hijri: '10 Dhul-Hijjah', date: '2027-05-17' },
    { name: 'Islamic New Year', hijri: '1 Muharram', date: '2027-06-06' },
    { name: 'Day of Ashura', hijri: '10 Muharram', date: '2027-06-15' },
  ]
  return candidates.map(c => ({ ...c, date: new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }))
}
