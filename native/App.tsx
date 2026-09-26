// ─── iOS host ────────────────────────────────────────────────────────────────
// A thin native shell around the UI (src/dom/DomRoot.tsx): it owns the audio
// engine, safe-area insets, status bar, location, sharing and downloads, and
// hands them to the UI as props.
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Share } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as SystemUI from 'expo-system-ui'
import * as WebBrowser from 'expo-web-browser'
import * as Location from 'expo-location'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import DomRoot from '../src/dom/DomRoot'
import type { EngineCommand } from '../src/lib/audio'
import type { Position } from '../src/lib/platform'
import { configureAudioSession, engine, playRadio, runCommand, stopRadio } from './player'
import { initDownloads, syncDownloads } from './downloads'

SplashScreen.preventAutoHideAsync().catch(() => {})
// the UI hides the splash once it has rendered; never leave the user stuck on it
setTimeout(() => { SplashScreen.hideAsync().catch(() => {}) }, 8000)
initDownloads()
configureAudioSession().catch(() => {})

// app background colours (match --dd-bg in src/index.css)
const BG = { light: '#faf9f7', dark: '#121110' }

async function getPosition(): Promise<Position | null> {
  const perm = await Location.requestForegroundPermissionsAsync()
  if (!perm.granted) return null
  const last = await Location.getLastKnownPositionAsync({ maxAge: 6 * 60 * 60 * 1000 })
  const pos = last ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
}

function Host() {
  const insets = useSafeAreaInsets()
  const player = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  const [dark, setDark] = useState(false)

  useEffect(() => { SystemUI.setBackgroundColorAsync(dark ? BG.dark : BG.light).catch(() => {}) }, [dark])

  const engineCommand = useCallback(async (cmd: EngineCommand, args: unknown[]) => { await runCommand(cmd, args) }, [])
  const openUrl = useCallback(async (url: string) => { await WebBrowser.openBrowserAsync(url) }, [])
  const share = useCallback(async (title: string, text: string) => { await Share.share({ title, message: text }) }, [])
  const radioPlay = useCallback((url: string) => playRadio(url), [])
  const radioStop = useCallback(async () => { stopRadio() }, [])
  const sync = useCallback(async (keys: string[]) => { syncDownloads(keys) }, [])
  const setDarkMode = useCallback(async (d: boolean) => { setDark(d) }, [])
  const onReady = useCallback(async () => { await SplashScreen.hideAsync() }, [])

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <DomRoot
        dom={{
          style: { flex: 1, backgroundColor: dark ? BG.dark : BG.light },
          // the UI lays itself out edge to edge using the insets passed below
          contentInsetAdjustmentBehavior: 'never',
          automaticallyAdjustsScrollIndicatorInsets: false,
          scrollEnabled: false,
          bounces: false,
          overScrollMode: 'never',
        }}
        insets={{ top: insets.top, bottom: insets.bottom }}
        player={player}
        engineCommand={engineCommand}
        getPosition={getPosition}
        openUrl={openUrl}
        share={share}
        radioPlay={radioPlay}
        radioStop={radioStop}
        syncDownloads={sync}
        setDarkMode={setDarkMode}
        onReady={onReady}
      />
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Host />
    </SafeAreaProvider>
  )
}
