'use dom'
// ─── iOS entry for the UI ────────────────────────────────────────────────────
// The whole React UI runs as an Expo DOM component (a WebView managed by Expo).
// Everything that needs the device — audio, location, sharing, downloads — is
// passed in from the native host (native/App.tsx) as async functions, and the
// native audio engine's state comes back in through the `player` prop.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { DOMProps } from 'expo/dom'
import '../index.css'
import App from '../App'
import { INITIAL_SNAPSHOT, setEngine, type EngineApi, type EngineCommand, type PlayerSnapshot } from '../lib/audio'
import { setPlatform, type Position } from '../lib/platform'

export interface DomRootProps {
  dom?: DOMProps
  insets: { top: number; bottom: number }
  player: PlayerSnapshot
  engineCommand: (cmd: EngineCommand, args: unknown[]) => Promise<void>
  getPosition: () => Promise<Position | null>
  openUrl: (url: string) => Promise<void>
  share: (title: string, text: string) => Promise<void>
  radioPlay: (url: string) => Promise<boolean>
  radioStop: () => Promise<void>
  syncDownloads: (keys: string[]) => Promise<void>
  setDarkMode: (dark: boolean) => Promise<void>
  onReady: () => Promise<void>
}

// Latest props, read by the proxies below at call time.
let bridge: DomRootProps | null = null
const ignore = () => {}

/** Mirrors the native engine: reads come from pushed snapshots, calls are forwarded. */
class RemoteEngine implements EngineApi {
  private snap: PlayerSnapshot = INITIAL_SNAPSHOT
  private listeners = new Set<(s: PlayerSnapshot) => void>()
  update(s: PlayerSnapshot) { this.snap = s; this.listeners.forEach(l => l(s)) }
  private send(cmd: EngineCommand, ...args: unknown[]) { bridge?.engineCommand(cmd, args).catch(ignore) }

  subscribe = (l: (s: PlayerSnapshot) => void) => { this.listeners.add(l); l(this.snap); return () => { this.listeners.delete(l) } }
  getSnapshot = () => this.snap
  play: EngineApi['play'] = async (...args) => this.send('play', ...args)
  pause = () => this.send('pause')
  toggle = () => this.send('toggle')
  next = () => this.send('next')
  prev = () => this.send('prev')
  seek = (v: number) => this.send('seek', v)
  skip = (d: number) => this.send('skip', d)
  setSpeed = (v: number) => this.send('setSpeed', v)
  setRepeat: EngineApi['setRepeat'] = r => this.send('setRepeat', r)
  setShuffle = (b: boolean) => this.send('setShuffle', b)
  playAyahDirect = (n: number) => this.send('playAyahDirect', n)
}

// Installed at module load, before <App> first renders and subscribes.
document.documentElement.classList.add('dd-native')
const remote = new RemoteEngine()
setEngine(remote)
setPlatform({
  native: true,
  getPosition: () => bridge?.getPosition().catch(() => null) ?? Promise.resolve(null),
  openUrl: url => { bridge?.openUrl(url).catch(ignore) },
  share: ({ title, text }) => { bridge?.share(title, text).catch(ignore) },
  radioPlay: url => bridge?.radioPlay(url).catch(() => false) ?? Promise.resolve(false),
  radioStop: () => { bridge?.radioStop().catch(ignore) },
  syncDownloads: keys => { bridge?.syncDownloads(keys).catch(ignore) },
  setDarkMode: dark => { bridge?.setDarkMode(dark).catch(ignore) },
})

export default function DomRoot(props: DomRootProps) {
  const { insets, player } = props

  // Layout effects run before any passive effect, so the UI's first effects
  // (initial download sync, location lookup) already see the bridge.
  useLayoutEffect(() => { bridge = props })

  useLayoutEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--sat', `${insets.top}px`)
    root.setProperty('--sab', `${insets.bottom}px`)
  }, [insets.top, insets.bottom])

  useEffect(() => { remote.update(player) }, [player])

  const ready = useRef(false)
  useEffect(() => {
    if (ready.current) return
    ready.current = true
    props.onReady().catch(ignore)
  }, [props])

  // the store re-renders the tree on player updates itself; don't also re-render it on every prop push
  const app = useMemo(() => <App />, [])

  return <div style={{ position: 'fixed', inset: 0 }}>{app}</div>
}
