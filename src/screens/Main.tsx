// ─── S01 Main / Home ─────────────────────────────────────────────────────────

import { ChevronRight, Download, Flame, ListMusic, MoonStar, Pause, Play, User } from 'lucide-react'
import { engine } from '../lib/audio'
import { hijriToday, juzOfSurah, RECITERS, surah } from '../lib/data'
import { useStore } from '../store'
import { Avatar, DownloadBtn, SectionHeader } from '../components/bits'
import { platform } from '../lib/platform'

export default function MainScreen() {
  const st = useStore()
  const { player, t } = st
  const playing = player.status === 'playing'
  const heroSurah = player.surah || 36
  const heroReciter = player.reciter ?? RECITERS.find(r => r.id === 'abdul-rahman-al-sudais')!
  const meta = surah(heroSurah)
  const featured = RECITERS.filter(r => r.featured)
  const grid = RECITERS.slice(0, 12)
  const friday = surah(18)

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-44">
      {/* header */}
      <div className="flex items-center justify-between px-5 pt-2">
        <h1 className="font-display text-[30px] font-bold dd-ink tracking-tight">DeenDunya</h1>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full dd-surface border dd-line flex flex-col items-center justify-center dd-ink-2">
            <Flame size={15} /><span className="text-[9px] font-bold leading-none">{streak0(st.streak)}</span>
          </div>
          <button onClick={() => st.setSheet('profile')} className="w-10 h-10 rounded-full dd-surface border dd-line flex items-center justify-center dd-ink-2 active:scale-90 transition-transform">
            <User size={18} />
          </button>
        </div>
      </div>

      {/* hero / continue listening */}
      <div className="px-5 pt-3">
        <div className="hero-gradient rounded-[34px] px-6 pt-7 pb-7 text-center text-white relative overflow-hidden shadow-[0_18px_50px_rgba(150,84,48,0.35)]">
          <div className="absolute -top-16 -start-16 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
          <button
            onClick={() => playing ? engine.toggle() : (player.reciter ? engine.toggle() : st.playDefault())}
            className="relative w-[74px] h-[74px] rounded-full bg-white/95 text-black flex items-center justify-center mx-auto shadow-xl active:scale-92 transition-transform"
            aria-label="play"
          >
            {player.status === 'loading' ? <div className="w-7 h-7 rounded-full border-[3px] border-black/70 border-t-transparent spin-slow" />
              : playing ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ms-1" />}
          </button>
          <h2 className="relative font-display text-[27px] leading-tight font-bold mt-4">
            {meta.name} ({meta.english})
          </h2>
          <p className="relative text-white/85 text-[13.5px] mt-1">
            {heroReciter.name} — {t('page')} {meta.page}, {t('juz')} {juzOfSurah(heroSurah)}, {t('hizb')} {juzOfSurah(heroSurah) * 2 - 1}
          </p>
          <button
            onClick={() => st.setTab('read')}
            className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-white/70 px-5 py-2 text-[14px] font-semibold active:scale-95 transition-transform"
          >
            <ListMusic size={16} /> {t('listOfSurahs')}
          </button>
        </div>
      </div>

      {/* downloaded */}
      <div className="px-5 pt-6">
        <button onClick={() => st.setSheet('profile')} className="w-full flex items-center gap-3.5 text-start active:opacity-70 transition-opacity">
          <span className="w-12 h-12 rounded-full dd-surface border dd-line flex items-center justify-center dd-ink-2"><Download size={19} /></span>
          <span className="flex-1">
            <span className="block font-display text-[19px] font-bold dd-ink leading-tight">{t('downloaded')}</span>
            <span className="block text-[13px] dd-ink-2">{st.downloads.length > 0 ? `${st.downloads.length} ${t('surahs')} · ${t('availableOffline')}` : t('availableOffline')}</span>
          </span>
        </button>
      </div>

      {/* playlists — placeholders behind a sign-in that has no backend yet, so hidden in the iOS build */}
      {!platform.native && <>
        <SectionHeader title={t('playlists')} onMore={() => st.setDialog('signinRequired')} />
        <div className="px-5 flex flex-col gap-3">
          <PlaylistCard title="Duaa" count={15} onClick={() => st.setDialog('signinRequired')} />
          <PlaylistCard title="Morning Adhkar" count={12} onClick={() => st.setDialog('signinRequired')} dark />
        </div>
      </>}

      {/* prayer promo (DeenDunya adaptation) */}
      <div className="px-5 pt-5">
        <button onClick={() => st.setTab('today')} className="w-full dd-surface border dd-line rounded-[22px] p-4 flex items-center gap-3.5 text-start active:scale-[0.99] transition-transform">
          <span className="w-11 h-11 rounded-2xl dd-red-soft dd-red flex items-center justify-center"><MoonStar size={20} /></span>
          <span className="flex-1">
            <span className="block font-display text-[17px] font-bold dd-ink">{t('prayerTimes')}</span>
            <span className="block text-[12.5px] dd-ink-2">{hijriToday(st.lang)}</span>
          </span>
          <ChevronRight size={18} className="dd-ink-3 rtl-flip" />
        </button>
      </div>

      {/* surah for friday */}
      <SectionHeader title={t('surahFriday')} />
      <div className="px-5">
        <button
          onClick={() => { const r = RECITERS.find(x => x.id === 'mishary-rashid-alafasy')!; st.play(r, 18); st.push({ t: 'reader', surah: 18 }) }}
          className="w-full flex items-center gap-4 text-start active:opacity-75 transition-opacity"
        >
          <div className="flex-1">
            <div className="font-display text-[19px] font-bold dd-ink flex items-center gap-2.5">
              {friday.name}
              <span className="font-naskh text-[15px] dd-ink-2 font-normal border dd-line rounded-md px-1.5 py-0.5">{friday.arabic.replace('سورة ', 'الكهف')}</span>
            </div>
            <div className="text-[13px] dd-ink-2 mt-0.5">{t('page')} {friday.page}, Surah {friday.n}, Aya 1</div>
          </div>
          <span className="text-[15px] font-semibold dd-ink-3 tabular-nums">{friday.page}</span>
        </button>
      </div>

      {/* featured reciters */}
      <SectionHeader title={t('featuredReciters')} />
      <p className="px-5 -mt-2 text-[13.5px] dd-ink-2 leading-snug">Expertly curated voices of the moment — handpicked recitations for listening and reflection.</p>
      <div className="flex gap-5 overflow-x-auto no-scrollbar px-5 pt-4 pb-1">
        {featured.map(r => (
          <button key={r.id} onClick={() => st.push({ t: 'reciter', id: r.id })} className="w-[118px] shrink-0 text-start active:scale-95 transition-transform">
            <Avatar name={r.name} size={118} />
            <div className="mt-2 font-display text-[15px] font-bold dd-ink leading-tight line-clamp-1">{r.name}</div>
            <div className="text-[11.5px] dd-ink-2 leading-snug line-clamp-2 mt-0.5">{r.bio}</div>
          </button>
        ))}
      </div>

      {/* all reciters */}
      <SectionHeader title={t('allReciters')} onMore={() => st.push({ t: 'reciters' })} />
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 px-5">
        {grid.map(r => (
          <button key={r.id} onClick={() => st.push({ t: 'reciter', id: r.id })} className="flex flex-col items-center active:scale-95 transition-transform">
            <Avatar name={r.name} size={92} />
            <span className="mt-1.5 text-[12.5px] font-semibold dd-ink text-center leading-tight line-clamp-2 h-[32px]">{r.name}</span>
          </button>
        ))}
      </div>

      {/* share */}
      <div className="px-5 pt-10 pb-6 text-center">
        <div className="w-[74px] h-[74px] mx-auto rounded-[20px] shadow-lg overflow-hidden" style={{ background: 'linear-gradient(145deg,#3b82c4,#1d4e89)' }}>
          <svg viewBox="0 0 74 74" className="w-full h-full">
            <path d="M47 22a17 17 0 100 30 19 19 0 01-13-15 19 19 0 0113-15z" fill="white" opacity="0.95" />
            <path d="M52 30l1.2 3.4 3.4 1.2-3.4 1.2L52 39.2l-1.2-3.4-3.4-1.2 3.4-1.2z" fill="white" opacity="0.9" />
          </svg>
        </div>
        <h3 className="font-display text-[23px] font-bold dd-ink mt-4 leading-tight">{t('shareApp')}</h3>
        <p className="text-[13.5px] dd-ink-2 mt-1.5 max-w-[280px] mx-auto">{t('shareSub')}</p>
        <button
          onClick={() => platform.share({ title: 'DeenDunya', text: t('shareSub') })}
          className="mt-4 px-9 py-2.5 rounded-full text-white text-[15px] font-bold active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg,#3b82c4,#1d4e89)' }}
        >
          {t('share')}
        </button>
      </div>
    </div>
  )
}

function streak0(n: number) { return n }

function PlaylistCard({ title, count, onClick, dark = false }: { title: string; count: number; onClick: () => void; dark?: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3.5 text-start active:opacity-75 transition-opacity">
      <span
        className="w-[52px] h-[52px] rounded-full shrink-0 border dd-line"
        style={{ background: dark ? 'linear-gradient(135deg,#1c2a4a,#0c1226)' : 'linear-gradient(135deg,#dca86b,#8a5434)' }}
      />
      <span className="flex-1">
        <span className="block font-display text-[19px] font-bold dd-ink leading-tight">{title}</span>
        <span className="block text-[13px] dd-ink-2">{count} audios</span>
      </span>
      <DownloadBtn done={false} onClick={onClick} />
    </button>
  )
}
