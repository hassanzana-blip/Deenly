// ─── S09 Sleep Stories + S10 Ambient mode ────────────────────────────────────
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Clock3, MoreHorizontal, Play, User } from 'lucide-react'
import { AMBIENTS, RECITERS, type AmbientId } from '../lib/data'
import { IMG } from '../lib/images'
import { useStore } from '../store'
import { PlayerCard } from '../components/PlayerCard'
import { SectionHeader } from '../components/bits'
import { engine } from '../lib/audio'

const STORIES = [
  { id: 'lantern', title: 'The Lantern of Little Deeds', narrator: 'Yassine El-Fassi', dur: '7:19', img: IMG.lantern, date: '16 FEBRUARY', surah: 67, reciter: 'mahmoud-khalil-al-hussary' },
  { id: 'ramadan', title: 'Ramadan Nights', narrator: 'Zaidan Al-Amin', dur: '9:42', img: IMG.waves, date: '15 FEBRUARY', surah: 55, reciter: 'saad-el-ghamidi' },
  { id: 'rain', title: 'Rain over the Valley', narrator: 'Maryam Haddad', dur: '12:05', img: IMG.rain, date: '12 FEBRUARY', surah: 36, reciter: 'islam-sobhi' },
  { id: 'fire', title: 'By the Fireplace', narrator: 'Omar Farouk', dur: '10:31', img: IMG.fire, date: '8 FEBRUARY', surah: 18, reciter: 'maher-al-mueaqly' },
  { id: 'birds', title: 'Morning Birds', narrator: 'Layla Nour', dur: '8:44', img: IMG.birds, date: '2 FEBRUARY', surah: 13, reciter: 'mishary-rashid-alafasy' },
]

export default function SleepScreen() {
  const st = useStore()
  const start = (s: typeof STORIES[number], ambient: AmbientId) => {
    const r = RECITERS.find(x => x.id === s.reciter) ?? RECITERS[0]
    st.setAmbient(ambient)
    st.play(r, s.surah)
    st.setSheet('ambient')
  }
  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-44">
      <div className="flex items-start justify-between px-5 pt-2">
        <h1 className="font-display text-[34px] font-bold dd-ink leading-none">{st.t('sleepStories')}</h1>
        <button onClick={() => st.setSheet('profile')} className="w-10 h-10 rounded-full dd-surface border dd-line flex items-center justify-center dd-ink-2 active:scale-90 transition-transform mt-1"><User size={18} /></button>
      </div>

      <SectionHeader title={st.t('editorsChoice')} />
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-5">
        {STORIES.slice(0, 3).map(s => <StoryCard key={s.id} s={s} big onPlay={() => start(s, ambientFor(s.id))} />)}
      </div>

      <SectionHeader title={st.t('recentlyAdded')} />
      <div className="grid grid-cols-2 gap-3.5 px-5">
        {STORIES.slice(2).map(s => <StoryCard key={s.id} s={s} onPlay={() => start(s, ambientFor(s.id))} />)}
      </div>

      <SectionHeader title="Ambient Sounds" />
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-5 pb-2">
        {AMBIENTS.map(a => (
          <button key={a.id} onClick={() => { st.setAmbient(a.id); if (!st.player.reciter) { const r = RECITERS.find(x => x.id === 'mishary-rashid-alafasy')!; st.play(r, 67) } st.setSheet('ambient') }}
            className="shrink-0 w-[130px] h-[170px] rounded-[22px] overflow-hidden relative active:scale-[0.97] transition-transform">
            <img src={a.img} alt={a.label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-3 inset-x-0 text-center text-white text-[15px] font-bold">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ambientFor(id: string): AmbientId {
  return (['birds', 'fire', 'rain', 'waves'].includes(id) ? id : 'waves') as AmbientId
}

function StoryCard({ s, big = false, onPlay }: { s: typeof STORIES[number]; big?: boolean; onPlay: () => void }) {
  return (
    <button onClick={onPlay} className={`shrink-0 ${big ? 'w-[240px]' : 'w-full'} rounded-[24px] overflow-hidden text-start active:scale-[0.98] transition-transform dd-surface border dd-line`}>
      <div className={`relative ${big ? 'h-[150px]' : 'h-[110px]'}`}>
        <img src={s.img} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
      </div>
      <div className="p-3.5">
        <div className="text-[10px] font-bold tracking-widest dd-ink-3">{s.date}</div>
        <div className="font-display text-[16.5px] font-bold dd-ink leading-tight mt-0.5 line-clamp-1">{s.title}</div>
        <div className="text-[12px] dd-ink-2 mt-0.5">{s.narrator}</div>
        <div className="flex items-center gap-2 mt-2.5">
          <span className="flex items-center gap-1.5 rounded-full border dd-line px-2.5 py-1">
            <Play size={11} fill="currentColor" className="dd-ink" />
            <span className="flex-1 h-[3px] w-14 rounded-full bg-black/10"><span className="block h-full w-0 rounded-full dd-red-bg" /></span>
            <span className="text-[11px] dd-ink-2 tabular-nums">{s.dur}</span>
          </span>
          <MoreHorizontal size={16} className="dd-ink-3 ms-auto" />
        </div>
      </div>
    </button>
  )
}

// ── fullscreen ambient mode (frosted player over living background) ──────────
export function AmbientOverlay() {
  const st = useStore()
  const open = st.sheet === 'ambient'
  const amb = AMBIENTS.find(a => a.id === st.ambient) ?? AMBIENTS[0]
  useEffect(() => { if (open) window.scrollTo(0, 0) }, [open])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[70] overflow-hidden bg-black"
          initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            key={amb.id}
            src={amb.img} alt={amb.label}
            className="absolute inset-0 w-full h-full object-cover kenburns"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/45" />

          <div className="absolute top-2 start-4 z-10">
            <button onClick={() => st.setSheet(null)} className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-transform">
              <ChevronLeft size={20} className="rtl-flip" />
            </button>
          </div>

          {/* ambient selector */}
          <div className="absolute bottom-[218px] inset-x-0 z-10">
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 justify-start">
              {AMBIENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => st.setAmbient(a.id)}
                  className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all active:scale-95 ${a.id === st.ambient ? 'bg-white/90 text-black shadow-lg' : 'bg-white/15 text-white backdrop-blur-md'}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* frosted player */}
          <div className="absolute inset-x-3 bottom-[max(14px,var(--sab))] z-10">
            {st.player.reciter ? <PlayerCard dark compact /> : (
              <div className="glass-dark rounded-[30px] p-6 text-center text-white">
                <Clock3 size={22} className="mx-auto mb-2 opacity-80" />
                <div className="text-[15px] font-semibold">Pick a sleep story to begin</div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { engine as _engine }
