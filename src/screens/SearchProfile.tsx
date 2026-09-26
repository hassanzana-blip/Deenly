// ─── S11 Search + Profile sheet + Sign-in sheet + Search-in-Book ─────────────
import React, { useMemo, useState } from 'react'
import { Bell, Check, ChevronRight, Crown, Download, Globe, Headphones, Languages, Moon, Search as SearchIcon, Sparkles, Star, User, X } from 'lucide-react'
import { RECITERS, SURAHS } from '../lib/data'
import { useStore, type Lang } from '../store'
import { Avatar, Segmented, Sheet } from '../components/bits'
import { SurahRow } from './Read'

export default function SearchScreen() {
  const st = useStore()
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return SURAHS
    return SURAHS.filter(x => x.name.toLowerCase().includes(s) || x.english.toLowerCase().includes(s) || x.arabic.includes(q.trim()) || String(x.n) === s)
  }, [q])
  const reciterResults = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? RECITERS.filter(r => r.name.toLowerCase().includes(s)) : RECITERS.slice(0, 8)
  }, [q])
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <h1 className="font-display text-[34px] font-bold dd-ink leading-none">{st.t('search')}</h1>
        <button onClick={() => st.setSheet('profile')} className="w-10 h-10 rounded-full dd-red-soft dd-red flex items-center justify-center active:scale-90 transition-transform mt-1"><User size={18} /></button>
      </div>
      <div className="px-5">
        <div className="flex items-center gap-2.5 dd-surface border dd-line rounded-full px-4 py-3">
          <SearchIcon size={17} className="dd-ink-3" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder={st.t('searchSurahs')}
            className="flex-1 bg-transparent outline-none text-[15px] dd-ink placeholder:dd-ink-3"
          />
          {q && <button onClick={() => setQ('')}><X size={16} className="dd-ink-3" /></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-44">
        <div className="font-display text-[22px] font-bold dd-ink px-5 pt-5 pb-3">{st.t('reciters')}</div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-5">
          {reciterResults.map(r => (
            <button key={r.id} onClick={() => st.push({ t: 'reciter', id: r.id })} className="w-[76px] shrink-0 flex flex-col items-center active:scale-95 transition-transform">
              <Avatar name={r.name} size={66} />
              <span className="mt-1.5 text-[11px] font-semibold dd-ink text-center leading-tight line-clamp-2">{r.name.split(' ').slice(0, 2).join(' ')}</span>
            </button>
          ))}
        </div>
        <div className="font-display text-[22px] font-bold dd-ink px-5 pt-6 pb-2">{st.t('surahs').replace(/^./, c => c.toUpperCase())}</div>
        <div className="px-5">
          {results.slice(0, 30).map(s => <SurahRow key={s.n} n={s.n} onClick={() => st.push({ t: 'reader', surah: s.n })} />)}
          {results.length === 0 && <div className="py-10 text-center dd-ink-3 text-[14px]">No results for “{q}”</div>}
        </div>
      </div>
    </div>
  )
}

// ── profile sheet ─────────────────────────────────────────────────────────────
export function ProfileSheet() {
  const st = useStore()
  const open = st.sheet === 'profile'
  return (
    <Sheet open={open} onClose={() => st.setSheet(null)} title={st.t('profile')} tall>
      <div className="px-5 pb-12">
        {/* account */}
        <div className="dd-surface rounded-[22px] border dd-line p-4 flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#3b82c4,#1d4e89)' }}><User size={21} /></span>
          <span className="flex-1">
            <span className="block text-[16px] font-bold dd-ink">{st.signedIn ? 'DeenDunya Member' : st.t('guest')}</span>
            <span className="block text-[12.5px] dd-ink-2">{st.t('syncData')}</span>
          </span>
          {!st.signedIn && (
            <button onClick={() => st.setSheet('signin')} className="px-4 py-2 rounded-full text-white text-[13.5px] font-bold active:scale-95 transition-transform" style={{ background: 'linear-gradient(135deg,#3b82c4,#1d4e89)' }}>{st.t('signIn')}</button>
          )}
        </div>

        {/* stats */}
        <div className="dd-surface rounded-[22px] border dd-line mt-3.5 divide-y dd-line">
          <Row icon={<Crown size={17} />} label={st.t('premium')} value="Free" />
          <Row icon={<Sparkles size={17} />} label="Isharat" value="—" />
          <Row icon={<Download size={17} />} label={st.t('downloadManager')} value={String(st.downloads.length)} />
          <Row icon={<Star size={17} />} label={st.t('bookmarks')} value={String(st.bookmarks.length)} />
        </div>

        {/* settings */}
        <div className="font-display text-[19px] font-bold dd-ink pt-6 pb-2.5">{st.t('settings')}</div>
        <div className="dd-surface rounded-[22px] border dd-line p-4">
          <div className="flex items-center gap-3 pb-3.5">
            <Bell size={17} className="dd-ink-2" /><span className="text-[15px] dd-ink flex-1">{st.t('notifications')}</span>
            <ToggleDot on />
          </div>
          <div className="flex items-center gap-3">
            <Moon size={17} className="dd-ink-2" /><span className="text-[15px] dd-ink flex-1">{st.t('appTheme')}</span>
          </div>
          <div className="mt-3">
            <Segmented
              options={[{ v: 'system', label: st.t('system') }, { v: 'dark', label: st.t('dark') }, { v: 'light', label: st.t('light') }]}
              value={st.theme} onChange={st.setTheme}
            />
          </div>
          <div className="mt-4">
            <Row icon={<Headphones size={17} />} label={st.t('audioQuality')} value="High" bare />
            <Row icon={<Languages size={17} />} label={st.t('translator')} value="Saheeh International" bare />
            <button onClick={() => st.setSheet('language')} className="w-full flex items-center gap-3 py-2.5 text-start">
              <Globe size={17} className="dd-ink-2" />
              <span className="text-[15px] dd-ink flex-1">{st.t('language')}</span>
              <span className="text-[13px] dd-ink-3">{{ en: 'English', no: 'Norsk', ar: 'العربية', ckb: 'کوردی' }[st.lang]}</span>
              <ChevronRight size={16} className="dd-ink-3 rtl-flip" />
            </button>
          </div>
        </div>

        {/* favorites / follows */}
        {(st.favorites.length > 0 || st.follows.length > 0) && (
          <>
            <div className="font-display text-[19px] font-bold dd-ink pt-6 pb-2.5">{st.t('reciters')}</div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {RECITERS.filter(r => st.favorites.includes(r.id) || st.follows.includes(r.id)).map(r => (
                <button key={r.id} onClick={() => { st.setSheet(null); st.push({ t: 'reciter', id: r.id }) }} className="w-[70px] shrink-0 flex flex-col items-center">
                  <Avatar name={r.name} size={60} />
                  <span className="mt-1 text-[11px] font-semibold dd-ink text-center leading-tight line-clamp-2">{r.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Sheet>
  )
}

function Row({ icon, label, value, bare = false }: { icon: React.ReactNode; label: string; value: string; bare?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${bare ? 'py-2.5' : 'p-4'}`}>
      <span className="dd-ink-2">{icon}</span>
      <span className="text-[15px] dd-ink flex-1">{label}</span>
      <span className="text-[13px] dd-ink-3">{value}</span>
      {!bare && <ChevronRight size={16} className="dd-ink-3 rtl-flip" />}
    </div>
  )
}
function ToggleDot({ on }: { on: boolean }) {
  const [v, setV] = useState(on)
  return (
    <button onClick={() => setV(x => !x)} className={`w-11 h-[26px] rounded-full p-0.5 transition-colors ${v ? 'bg-green-500' : 'bg-black/20'}`}>
      <span className={`block w-[22px] h-[22px] rounded-full bg-white shadow transition-transform ${v ? 'translate-x-[18px]' : ''}`} />
    </button>
  )
}

// ── language sheet ────────────────────────────────────────────────────────────
export function LanguageSheet() {
  const st = useStore()
  const langs: { v: Lang; label: string; native: string }[] = [
    { v: 'en', label: 'English', native: 'English' },
    { v: 'no', label: 'Norwegian', native: 'Norsk' },
    { v: 'ar', label: 'Arabic', native: 'العربية' },
    { v: 'ckb', label: 'Kurdish (Sorani)', native: 'کوردی سۆرانی' },
  ]
  return (
    <Sheet open={st.sheet === 'language'} onClose={() => st.setSheet('profile')} title={st.t('language')}>
      <div className="px-5 pb-10">
        {langs.map(l => (
          <button key={l.v} onClick={() => { st.setLang(l.v); st.setSheet('profile') }} className="w-full flex items-center gap-3.5 py-3.5 border-b dd-line text-start">
            <span className="flex-1">
              <span className="block text-[16px] font-semibold dd-ink">{l.native}</span>
              <span className="block text-[12.5px] dd-ink-2">{l.label}</span>
            </span>
            {st.lang === l.v && <Check size={18} className="dd-red" />}
          </button>
        ))}
        <p className="text-[12.5px] dd-ink-3 mt-4 leading-relaxed">Arabic and Sorani switch the interface to true right-to-left layout with mirrored navigation and icons.</p>
      </div>
    </Sheet>
  )
}

// ── sign-in sheet ─────────────────────────────────────────────────────────────
export function SignInSheet() {
  const st = useStore()
  return (
    <Sheet open={st.sheet === 'signin'} onClose={() => st.setSheet(null)} tall>
      <div className="px-6 pb-12 flex flex-col items-center text-center">
        <div className="w-[72px] h-[72px] rounded-[20px] shadow-lg mt-2" style={{ background: 'linear-gradient(145deg,#3b82c4,#1d4e89)' }}>
          <svg viewBox="0 0 74 74" className="w-full h-full">
            <path d="M47 22a17 17 0 100 30 19 19 0 01-13-15 19 19 0 0113-15z" fill="white" opacity="0.95" />
            <path d="M52 30l1.2 3.4 3.4 1.2-3.4 1.2L52 39.2l-1.2-3.4-3.4-1.2 3.4-1.2z" fill="white" opacity="0.9" />
          </svg>
        </div>
        <h2 className="font-display text-[30px] font-bold dd-ink mt-4 leading-tight">{st.t('welcome')} <span className="dd-red">DeenDunya</span></h2>
        <p className="text-[14px] dd-ink-2 mt-2 leading-relaxed max-w-[300px]">{st.t('welcomeSub')}</p>

        <div className="w-full text-start mt-6">
          <div className="text-[14px] font-bold dd-ink mb-2">{st.t('benefits')}</div>
          <div className="flex gap-2.5 items-start dd-surface border dd-line rounded-2xl p-3.5">
            <Star size={16} className="dd-red mt-0.5" />
            <span className="text-[13.5px] dd-ink-2 leading-snug">{st.t('benefitSync')}</span>
          </div>
        </div>

        <button onClick={() => { st.signIn(); st.setSheet(null) }} className="w-full mt-6 py-3.5 rounded-full bg-black text-white text-[15.5px] font-semibold active:scale-[0.98] transition-transform dark:bg-white dark:text-black">
           Continue with Apple
        </button>
        <div className="flex items-center gap-3 w-full my-4">
          <span className="flex-1 h-px dd-line bg-current opacity-15" />
          <span className="text-[12px] dd-ink-3">Or Continue with</span>
          <span className="flex-1 h-px dd-line bg-current opacity-15" />
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={() => { st.signIn(); st.setSheet(null) }} className="flex-1 py-3 rounded-full dd-surface border dd-line text-[14.5px] font-semibold dd-ink active:scale-[0.98] transition-transform">Google</button>
          <button onClick={() => { st.signIn(); st.setSheet(null) }} className="flex-1 py-3 rounded-full dd-surface border dd-line text-[14.5px] font-semibold dd-ink active:scale-[0.98] transition-transform">Email</button>
        </div>
        <button onClick={() => st.setSheet(null)} className="mt-4 text-[13.5px] dd-ink-2 underline underline-offset-2">{st.t('continueGuest')}</button>
      </div>
    </Sheet>
  )
}

// ── search in the book sheet ──────────────────────────────────────────────────
export function SearchBookSheet() {
  const st = useStore()
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return SURAHS.filter(x => x.name.toLowerCase().includes(s) || x.english.toLowerCase().includes(s) || x.arabic.includes(q.trim()) || String(x.n) === s).slice(0, 20)
  }, [q])
  return (
    <Sheet open={st.sheet === 'searchBook'} onClose={() => st.setSheet(null)} title={st.t('searchInBook')}>
      <div className="px-5 pb-10">
        <div className="flex items-center gap-2.5 dd-surface border dd-line rounded-full px-4 py-3">
          <SearchIcon size={17} className="dd-ink-3" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={st.t('searchSurahs')} className="flex-1 bg-transparent outline-none text-[15px] dd-ink" />
          {q && <button onClick={() => setQ('')}><X size={16} className="dd-ink-3" /></button>}
        </div>
        <div className="mt-2">
          {results.map(s => <SurahRow key={s.n} n={s.n} onClick={() => { st.setSheet(null); st.push({ t: 'reader', surah: s.n }) }} />)}
          {q && results.length === 0 && <div className="py-8 text-center dd-ink-3 text-[14px]">No results</div>}
        </div>
      </div>
    </Sheet>
  )
}
