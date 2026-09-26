// ─── native playback ─────────────────────────────────────────────────────────
// Runs the shared engine on expo-audio, keeps the lock screen / Control Center
// in sync, and plays live radio on a second player.
import { createAudioPlayer, setAudioModeAsync, type AudioStatus } from 'expo-audio'
import { Engine, type EngineCommand, type PlayerSnapshot } from '../src/lib/audio'
import { surah } from '../src/lib/data'
import { NativeAudioElement } from './audioBackend'
import { localUriFor } from './downloads'

const element = new NativeAudioElement(url => localUriFor(url) ?? url)
export const engine = new Engine(element)

const radio = createAudioPlayer(null, { updateInterval: 1000 })

export function configureAudioSession() {
  // doNotMix is required for the lock screen controls to attach to our player
  return setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  })
}

// ── lock screen ──────────────────────────────────────────────────────────────
let shownKey = ''
engine.subscribe(s => updateLockScreen(s))

function updateLockScreen(s: PlayerSnapshot) {
  if (!s.reciter || !s.surah) return
  const key = `${s.reciter.id}:${s.surah}`
  if (key === shownKey) return
  shownKey = key
  const meta = surah(s.surah)
  element.player.setActiveForLockScreen(
    true,
    { title: `${meta.n}. ${meta.name}`, artist: s.reciter.name, albumTitle: 'DeenDunya' },
    { showSeekForward: true, showSeekBackward: true },
  )
}

// ── commands from the UI ─────────────────────────────────────────────────────
const COMMANDS: readonly EngineCommand[] = [
  'play', 'pause', 'toggle', 'next', 'prev', 'seek', 'skip', 'setSpeed', 'setRepeat', 'setShuffle', 'playAyahDirect',
]

export async function runCommand(cmd: EngineCommand, args: unknown[]) {
  if (!COMMANDS.includes(cmd)) return
  if (cmd === 'play' || cmd === 'toggle' || cmd === 'playAyahDirect') stopRadio()
  await (engine[cmd] as (...a: unknown[]) => unknown)(...args)
}

// ── live radio ───────────────────────────────────────────────────────────────
export function playRadio(url: string): Promise<boolean> {
  engine.pause()
  radio.replace({ uri: url })
  radio.play()
  return new Promise(resolve => {
    const done = (ok: boolean) => { clearTimeout(timer); sub.remove(); if (!ok) radio.pause(); resolve(ok) }
    const sub = radio.addListener('playbackStatusUpdate', (s: AudioStatus) => {
      if (s.error) done(false)
      else if (s.playing) done(true)
    })
    const timer = setTimeout(() => done(false), 10000)
  })
}

export function stopRadio() {
  radio.pause()
}
