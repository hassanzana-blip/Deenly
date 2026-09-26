// ─── DeenDunya app shell ─────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StoreProvider, useStore } from './store'
import { StatusBar, TabBar, MiniPlayer } from './components/chrome'
import { AlertDialog } from './components/bits'
import MainScreen from './screens/Main'
import TodayScreen from './screens/Today'
import ReadScreen, { MushafsScreen } from './screens/Read'
import SleepScreen, { AmbientOverlay } from './screens/Sleep'
import SearchScreen, { LanguageSheet, ProfileSheet, SearchBookSheet, SignInSheet } from './screens/SearchProfile'
import { AllRecitersScreen, ReciterScreen } from './screens/Reciters'
import { ReaderScreen } from './screens/Reader'
import { RECITERS } from './lib/data'
import { platform } from './lib/platform'

function Screens() {
  const st = useStore()
  const top = st.nav.stack[st.nav.stack.length - 1]
  return (
    <>
      {/* tab roots */}
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={st.nav.tab}
              className="absolute inset-0"
              initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {st.nav.tab === 'main' && <MainScreen />}
              {st.nav.tab === 'today' && <TodayScreen />}
              {st.nav.tab === 'read' && <ReadScreen />}
              {st.nav.tab === 'sleep' && <SleepScreen />}
              {st.nav.tab === 'search' && <SearchScreen />}
            </motion.div>
          </AnimatePresence>
        </div>
        <MiniPlayer />
        <TabBar />
      </div>

      {/* pushed screens cover the tab bar */}
      <AnimatePresence>
        {top && (
          <motion.div
            key={st.nav.stack.length + JSON.stringify(top)}
            className="absolute inset-0 z-40 dd-bg flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <StatusBar nested />
            <div className="flex-1 relative overflow-hidden">
              {top.t === 'reciters' && <AllRecitersScreen />}
              {top.t === 'reciter' && <ReciterScreen id={top.id} />}
              {top.t === 'mushafs' && <MushafsScreen />}
              {top.t === 'reader' && <ReaderScreen surah={top.surah} ayah={top.ayah} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* sheets + overlays */}
      <ProfileSheet />
      <SignInSheet />
      <SearchBookSheet />
      <LanguageSheet />
      <AmbientOverlay />

      {/* dialogs */}
      <AlertDialog
        open={st.dialog === 'downloadAll'}
        title={st.t('downloadAllQ')}
        sub={st.t('waitLoading')}
        actions={[
          { label: st.t('cancel'), onClick: () => st.setDialog(null) },
          {
            label: st.t('download'), primary: true, onClick: () => {
              const rid = st.player.reciter?.id ?? RECITERS[0].id
              for (let i = 1; i <= 114; i++) if (!st.downloads.includes(`${rid}:${i}`)) st.toggleDownload(`${rid}:${i}`)
              st.setDialog(null)
            },
          },
        ]}
      />
      <AlertDialog
        open={st.dialog === 'signinRequired'}
        title={st.t('signInRequired')}
        sub={st.t('signInPlaylists')}
        actions={[
          { label: st.t('cancel'), onClick: () => st.setDialog(null) },
          { label: st.t('signIn'), primary: true, onClick: () => { st.setDialog(null); st.setSheet('signin') } },
        ]}
      />
    </>
  )
}

// ── splash ────────────────────────────────────────────────────────────────────
function Splash({ done }: { done: () => void }) {
  useEffect(() => { const id = setTimeout(done, 1600); return () => clearTimeout(id) }, [done])
  return (
    <motion.div
      className="absolute inset-0 z-[90] flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(165deg,#4f96d6 0%,#2f6cb3 55%,#1d4e89 100%)' }}
      exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.5 }}
    >
      <svg viewBox="0 0 74 74" className="w-[72px] h-[72px] drop-shadow-lg">
        <path d="M47 16a21 21 0 100 42 23 23 0 01-15.5-21A23 23 0 0147 16z" fill="white" />
        <path d="M54 26l1.6 4.4 4.4 1.6-4.4 1.6L54 38l-1.6-4.4-4.4-1.6 4.4-1.6z" fill="white" />
      </svg>
      <div className="font-display text-[34px] font-bold text-white mt-4 tracking-tight">DeenDunya</div>
      <div className="font-naskh text-white/80 text-[17px] mt-1">دنيا الإيمان</div>
      <div className="absolute bottom-14 w-7 h-7 rounded-full border-[3px] border-white/40 border-t-white spin-slow" />
    </motion.div>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)
  return (
    <StoreProvider>
      <div id="dd-root" className="h-full w-full flex items-center justify-center bg-[#0c0a09]">
        {/* phone frame on larger screens, full-bleed on mobile */}
        <div
          id="dd-app"
          className={`relative dd-bg overflow-hidden flex flex-col w-full h-full ${platform.native ? '' : 'sm:h-[min(880px,96vh)] sm:w-[402px] sm:rounded-[44px] sm:shadow-[0_40px_120px_rgba(0,0,0,0.6)] sm:border-[6px] sm:border-[#1c1917]'}`}
          dir="ltr"
        >
          <StatusBar />
          <div className="flex-1 relative overflow-hidden">
            <Screens />
          </div>
          <AnimatePresence>{splash && <Splash done={() => setSplash(false)} />}</AnimatePresence>
        </div>
      </div>
    </StoreProvider>
  )
}
