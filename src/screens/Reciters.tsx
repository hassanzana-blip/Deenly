// ─── S02 All Reciters + S03 Reciter Profile ──────────────────────────────────
import { useMemo, useState } from 'react'
import { ChevronLeft, CloudDownload, Download, Heart, Info, Link2, MoreHorizontal, Play, Share2, Shuffle, X } from 'lucide-react'
import { engine } from '../lib/audio'
import { RECITERS, SURAHS } from '../lib/data'
import { useStore } from '../store'
import { Avatar, CircleBtn, DownloadBtn, EqBars, MenuItem, Popover, Sheet } from '../components/bits'

export function AllRecitersScreen() {
  const st = useStore()
  return (
    <div className="h-full flex flex-col">
      <div className="relative flex items-center justify-center pt-2 pb-3 px-4">
        <CircleBtn onClick={() => st.pop()} label="back" className="absolute start-4 top-2"><ChevronLeft size={20} className="rtl-flip" /></CircleBtn>
        <h1 className="font-display text-[20px] font-bold dd-ink">{st.t('allReciters')}</h1>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-44">
        <div className="grid grid-cols-3 gap-x-3 gap-y-6 px-5 pt-2">
          {RECITERS.map(r => (
            <button key={r.id} onClick={() => st.push({ t: 'reciter', id: r.id })} className="flex flex-col items-center active:scale-95 transition-transform">
              <Avatar name={r.name} size={94} />
              <span className="mt-2 text-[12.5px] font-semibold dd-ink text-center leading-tight line-clamp-2">{r.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReciterScreen({ id }: { id: string }) {
  const st = useStore()
  const reciter = useMemo(() => RECITERS.find(r => r.id === id), [id])
  const [menu, setMenu] = useState(false)
  const [about, setAbout] = useState(false)
  if (!reciter) return null
  const fav = st.favorites.includes(reciter.id)
  const fol = st.follows.includes(reciter.id)
  const isCurrent = st.player.reciter?.id === reciter.id

  const playAll = (shuffle = false) => {
    engine.setShuffle(shuffle)
    st.play(reciter, isCurrent ? st.player.surah : 1)
    st.push({ t: 'reader', surah: isCurrent ? st.player.surah : 1 })
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* dark hero */}
      <div className="absolute inset-x-0 top-0 h-[380px] overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(40,36,33,.55), rgba(40,36,33,.82))' }} />
        <div className="absolute inset-0 opacity-30 blur-2xl scale-150" style={{ background: 'radial-gradient(circle at 50% 20%, #8a6a4a, #2a2422)' }} />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 pt-2">
        <CircleBtn dark onClick={() => st.pop()} label="back"><ChevronLeft size={20} className="rtl-flip" /></CircleBtn>
        <div className="flex gap-2.5">
          <CircleBtn dark onClick={() => setAbout(true)} label="info"><Info size={18} /></CircleBtn>
          <CircleBtn dark onClick={() => setMenu(v => !v)} label="more"><MoreHorizontal size={18} /></CircleBtn>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center pt-4 pb-6">
        <Avatar name={reciter.name} size={128} ring />
        <h1 className="font-display text-[30px] font-bold text-white mt-3.5 leading-tight">{reciter.name}</h1>
        {reciter.arabic && <div className="font-naskh text-white/75 text-[16px] mt-0.5">{reciter.arabic}</div>}
        <p className="text-white/75 text-[13.5px] mt-1">{reciter.count} {st.t('surahs')}{reciter.sync ? ` · ${st.t('audioSync')}` : ''}</p>

        <div className="flex items-center gap-8 mt-5">
          <ActionBtn icon={<CloudDownload size={21} />} label={st.t('download')} onClick={() => st.setDialog('downloadAll')} />
          <ActionBtn icon={<Shuffle size={21} />} label={st.t('shuffle')} onClick={() => playAll(true)} />
          <ActionBtn
            icon={isCurrent && st.player.status === 'playing' ? <PauseGlyph /> : <Play size={22} fill="currentColor" className="ms-0.5" />}
            label={isCurrent ? st.t('continue') : st.t('play')}
            primary
            onClick={() => isCurrent ? engine.toggle() : playAll(false)}
          />
        </div>
      </div>

      {/* surah list */}
      <div className="relative z-10 flex-1 dd-bg rounded-t-[26px] overflow-y-auto no-scrollbar pb-44 -mt-1 shadow-[0_-8px_30px_rgba(0,0,0,0.18)]">
        <div className="px-5 pt-4">
          {SURAHS.map(s => {
            const key = `${reciter.id}:${s.n}`
            const cur = isCurrent && st.player.surah === s.n
            return (
              <button
                key={s.n}
                onClick={() => { st.play(reciter, s.n); st.push({ t: 'reader', surah: s.n }) }}
                className="w-full flex items-center gap-3 py-3 border-b dd-line text-start active:opacity-70 transition-opacity"
              >
                <span className={`w-6 text-[13px] tabular-nums ${cur ? 'dd-red font-bold' : 'dd-ink-3'}`}>{s.n}</span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[15.5px] font-semibold truncate ${cur ? 'dd-red' : 'dd-ink'}`}>
                    {cur && st.player.status === 'playing' && <span className="inline-block me-1.5 align-middle"><EqBars size={11} color="rgb(var(--dd-red))" /></span>}
                    {s.name} ({s.english})
                  </span>
                  <span className="block font-naskh text-[14px] dd-ink-2 mt-0.5">{s.arabic}</span>
                </span>
                <DownloadBtn done={st.downloads.includes(key)} onClick={() => st.toggleDownload(key)} />
                <MoreHorizontal size={17} className="dd-ink-3 shrink-0" />
              </button>
            )
          })}
        </div>
      </div>

      {/* more menu */}
      <Popover open={menu} onClose={() => setMenu(false)}>
        <MenuItem icon={<Heart size={18} fill={fav ? 'currentColor' : 'none'} />} label={fav ? st.t('removeFavorite') : st.t('addFavorite')} onClick={() => { st.toggleFavorite(reciter.id); setMenu(false) }} />
        <MenuItem icon={<Link2 size={18} />} label={fol ? st.t('following') : st.t('followReciter')} onClick={() => { st.toggleFollow(reciter.id); setMenu(false) }} />
        <MenuItem icon={<Download size={18} />} label={st.t('downloadManager')} onClick={() => { setMenu(false); st.setSheet('profile') }} />
        <MenuItem icon={<Share2 size={18} />} label={st.t('share')} onClick={() => { setMenu(false); navigator.share?.({ title: reciter.name, text: `Listen to ${reciter.name} on DeenDunya` }).catch(() => {}) }} />
      </Popover>

      {/* about sheet */}
      <Sheet open={about} onClose={() => setAbout(false)} title={st.t('aboutReciter')}>
        <div className="px-6 pb-10">
          <div className="flex flex-col items-center pt-2 pb-5">
            <Avatar name={reciter.name} size={84} />
            <h2 className="font-display text-[22px] font-bold dd-ink mt-3">{reciter.name}</h2>
            <p className="text-[13px] dd-ink-2">{reciter.count} {st.t('surahs')}{reciter.sync ? ` · ${st.t('audioSync')}` : ''}</p>
          </div>
          <p className="text-[15.5px] leading-relaxed dd-ink">
            {reciter.bio ?? `${reciter.name} is a renowned Quran reciter, known for a beautiful and melodious recitation of the Holy Quran. This collection contains ${reciter.count} surahs in Hafs narration.`}
          </p>
          {reciter.sync && (
            <p className="text-[14px] leading-relaxed dd-ink-2 mt-4">
              {st.t('audioSync')}: each ayah is highlighted in the reader as it is recited, with per-ayah seeking and continuous playback.
            </p>
          )}
        </div>
      </Sheet>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, primary = false }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 active:scale-92 transition-transform">
      <span className={`w-[60px] h-[60px] rounded-full flex items-center justify-center ${primary ? 'bg-white text-black shadow-xl' : 'bg-white/15 text-white backdrop-blur-md'}`}>{icon}</span>
      <span className="text-[12px] font-medium text-white/85">{label}</span>
    </button>
  )
}
function PauseGlyph() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4" width="4.6" height="16" rx="1.4"/><rect x="13.9" y="4" width="4.6" height="16" rx="1.4"/></svg>
}
export { X as _X }
