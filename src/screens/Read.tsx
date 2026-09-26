// ─── S07 Read tab + S08 Mushafs ──────────────────────────────────────────────
import { useState } from 'react'
import { BookMarked, ChevronLeft, Download, Flame, LibraryBig, User } from 'lucide-react'
import { JUZS, SAJDA, surah, SURAHS } from '../lib/data'
import { useStore } from '../store'
import { CircleBtn, Segmented } from '../components/bits'

export default function ReadScreen() {
  const st = useStore()
  const [seg, setSeg] = useState<'surah' | 'juz' | 'sajda'>('surah')
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <h1 className="font-display text-[34px] font-bold dd-ink leading-none">{st.t('read')}</h1>
        <div className="flex items-center gap-2.5">
          <button onClick={() => st.push({ t: 'mushafs' })} className="w-10 h-10 rounded-full dd-surface border dd-line flex items-center justify-center dd-ink-2 active:scale-90 transition-transform"><LibraryBig size={17} /></button>
          <div className="w-10 h-10 rounded-full dd-surface border dd-line flex flex-col items-center justify-center dd-ink-2"><Flame size={15} /><span className="text-[9px] font-bold leading-none">{st.streak}</span></div>
          <button onClick={() => st.setSheet('profile')} className="w-10 h-10 rounded-full dd-surface border dd-line flex items-center justify-center dd-ink-2 active:scale-90 transition-transform"><User size={17} /></button>
        </div>
      </div>
      <div className="px-5">
        <Segmented options={[{ v: 'surah', label: 'Surah' }, { v: 'juz', label: st.t('juz') }, { v: 'sajda', label: st.t('sajda') }]} value={seg} onChange={setSeg} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-2 pb-44">
        {seg === 'surah' && SURAHS.map(s => <SurahRow key={s.n} n={s.n} onClick={() => st.push({ t: 'reader', surah: s.n })} />)}
        {seg === 'juz' && JUZS.map(j => {
          const firstSurah = Object.keys(j.mapping)[0]
          const range = j.mapping[firstSurah]
          const start = range.split('-')[0]
          const sm = surah(Number(firstSurah))
          return (
            <button key={j.n} onClick={() => st.push({ t: 'reader', surah: Number(firstSurah), ayah: Number(start) })} className="w-full flex items-center gap-4 py-3.5 border-b dd-line text-start active:opacity-70">
              <span className="w-9 h-9 rounded-full dd-surface border dd-line flex items-center justify-center text-[13px] font-bold dd-ink">{j.n}</span>
              <span className="flex-1">
                <span className="block text-[15.5px] font-semibold dd-ink">{st.t('juz')} {j.n}</span>
                <span className="block text-[12.5px] dd-ink-2 mt-0.5">{sm.name} {firstSurah}:{start}</span>
              </span>
              <span className="font-naskh text-[16px] dd-ink-2">{sm.arabic}</span>
            </button>
          )
        })}
        {seg === 'sajda' && SAJDA.map((s, i) => {
          const sm = surah(s.surah)
          return (
            <button key={i} onClick={() => st.push({ t: 'reader', surah: s.surah, ayah: s.ayah })} className="w-full flex items-center gap-4 py-3.5 border-b dd-line text-start active:opacity-70">
              <span className="w-9 h-9 rounded-full dd-red-soft dd-red flex items-center justify-center"><BookMarked size={15} /></span>
              <span className="flex-1">
                <span className="block text-[15.5px] font-semibold dd-ink">{sm.name} — {st.t('sajda')}</span>
                <span className="block text-[12.5px] dd-ink-2 mt-0.5">{s.surah}:{s.ayah} · {sm.place}</span>
              </span>
              <span className="font-naskh text-[16px] dd-ink-2">{sm.arabic}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SurahRow({ n, onClick }: { n: number; onClick: () => void }) {
  const st = useStore()
  const s = surah(n)
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 py-3 border-b dd-line text-start active:opacity-70 transition-opacity">
      <span className="w-6 text-[13px] tabular-nums dd-ink-3">{s.n}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-semibold dd-ink truncate">{s.name}</span>
        <span className="block text-[12.5px] dd-ink-2 mt-0.5">{s.ayahs} {s.place === 'Meccan' ? st.t('ayahsMeccan') : st.t('ayahsMedinan')}</span>
      </span>
      <span className="font-naskh text-[17px] dd-ink shrink-0">{s.arabic}</span>
      <span className="w-8 text-end text-[13px] tabular-nums dd-ink-3">{s.page}</span>
    </button>
  )
}

// ── mushafs (editions library) ────────────────────────────────────────────────
const MUSHAFS = [
  { id: 'holy-quran', title: 'The Holy Quran', desc: 'The original Arabic text of the Holy Quran, preserved in its authentic form, offering clear Uthmani script.', colors: ['#7a1f2b', '#4a121a'] },
  { id: 'madina', title: "Mus'haf Madina Nabawi", desc: 'A Madina Mushaf edition with a traditional layout, widely used for its readability and elegance.', colors: ['#1f4a7a', '#122a4a'] },
  { id: 'tajwid', title: 'Mushaf al-Tajwid', desc: 'A color-coded Quran designed to teach and apply Tajwid rules, making proper pronunciation easier.', colors: ['#2b2b2b', '#0e0e0e'] },
  { id: 'en', title: 'Quran in English', desc: 'An English translation of the Quran that conveys its meanings in clear and accessible language.', colors: ['#e8dcc0', '#c9b98a'] },
  { id: 'no', title: 'Koranen på norsk', desc: 'A Norwegian translation of the meanings of the Quran for Norwegian-speaking readers.', colors: ['#7a1f1f', '#1f2b4a'] },
  { id: 'ckb', title: 'قورئان بە کوردی سۆرانی', desc: 'A Kurdish Sorani translation of the meanings of the Holy Quran.', colors: ['#1f7a4a', '#0e4a2b'] },
]

export function MushafsScreen() {
  const st = useStore()
  return (
    <div className="h-full flex flex-col">
      <div className="relative flex items-center justify-center pt-2 pb-3 px-4">
        <CircleBtn onClick={() => st.pop()} label="back" className="absolute start-4 top-2"><ChevronLeft size={20} className="rtl-flip" /></CircleBtn>
        <h1 className="font-display text-[22px] font-bold dd-ink">{st.t('mushafs')}</h1>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-44">
        {MUSHAFS.map(m => {
          const key = `mushaf:${m.id}`
          const done = st.downloads.includes(key)
          return (
            <div key={m.id} className="flex gap-4 py-4 border-b dd-line">
              <div className="w-[74px] h-[104px] rounded-md shadow-md shrink-0 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(150deg, ${m.colors[0]}, ${m.colors[1]})` }}>
                <svg viewBox="0 0 60 80" className="w-12 h-16 opacity-90">
                  <rect x="6" y="6" width="48" height="68" rx="3" fill="none" stroke="#e8d9a8" strokeWidth="1.6" />
                  <rect x="11" y="11" width="38" height="58" rx="2" fill="none" stroke="#e8d9a8" strokeWidth="0.8" />
                  <path d="M30 26l3.5 7.5 8 1-5.8 5.7 1.4 8-7.1-3.8-7.1 3.8 1.4-8-5.8-5.7 8-1z" fill="#e8d9a8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[18px] font-bold dd-ink leading-tight">{m.title}</div>
                <p className="text-[12.5px] dd-ink-2 leading-snug mt-1 line-clamp-3">{m.desc}</p>
                <div className="flex items-center gap-2.5 mt-2.5">
                  <button
                    onClick={() => st.toggleDownload(key)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold active:scale-95 transition-transform ${done ? 'dd-red-soft dd-red' : 'text-white'}`}
                    style={done ? undefined : { background: 'rgba(120,120,128,.32)' }}
                  >
                    <Download size={14} /> {done ? '✓' : st.t('download')}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
