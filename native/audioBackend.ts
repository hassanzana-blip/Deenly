// ─── expo-audio backend for the shared engine ────────────────────────────────
// Implements the small HTMLAudioElement subset the engine (src/lib/audio.ts)
// drives, on top of a native expo-audio player, so the engine runs unchanged in
// the native JS runtime and keeps playing with the app in the background.
import { createAudioPlayer, type AudioPlayer, type AudioStatus } from 'expo-audio'
import type { AudioEventType, AudioLike } from '../src/lib/audio'

type Handler = { fn: () => void; once: boolean }

export class NativeAudioElement implements AudioLike {
  readonly player: AudioPlayer
  private handlers = new Map<AudioEventType, Set<Handler>>()
  private source = ''
  private rate = 1
  // what the engine asked for; the native status can lag behind by one update
  private wantPlaying = false
  private metadataSent = false
  private endedSent = false
  private errorSent = false
  private wasPlaying = false

  /** `resolve` maps a remote URL to a downloaded local file when there is one. */
  constructor(private resolve: (url: string) => string = u => u) {
    this.player = createAudioPlayer(null, { updateInterval: 250 })
    this.player.addListener('playbackStatusUpdate', s => this.onStatus(s))
  }

  get src() { return this.source }
  set src(url: string) {
    this.source = url
    this.wantPlaying = false
    this.metadataSent = this.endedSent = this.errorSent = false
    this.player.pause()
    this.player.replace({ uri: this.resolve(url) })
  }

  get currentTime() { return this.player.currentTime }
  set currentTime(sec: number) { this.player.seekTo(sec).catch(() => {}) }

  get duration() { return this.player.duration || NaN }
  get paused() { return !this.wantPlaying }

  get playbackRate() { return this.rate }
  set playbackRate(v: number) { this.rate = v; this.player.setPlaybackRate(v) }

  play() {
    this.wantPlaying = true
    this.endedSent = false
    this.player.setPlaybackRate(this.rate)
    this.player.play()
    return Promise.resolve()
  }

  pause() {
    this.wantPlaying = false
    this.player.pause()
  }

  addEventListener(type: AudioEventType, fn: () => void, opts?: { once?: boolean }) {
    let set = this.handlers.get(type)
    if (!set) this.handlers.set(type, set = new Set())
    set.add({ fn, once: !!opts?.once })
  }

  private emit(type: AudioEventType) {
    const set = this.handlers.get(type)
    if (!set) return
    for (const h of [...set]) {
      if (h.once) set.delete(h)
      h.fn()
    }
  }

  private onStatus(s: AudioStatus) {
    if (!this.source) return
    if (s.error && !this.errorSent) { this.errorSent = true; this.emit('error'); return }
    if (s.isLoaded && !this.metadataSent && s.duration > 0) { this.metadataSent = true; this.emit('loadedmetadata') }

    if (s.playing && !this.wasPlaying) {
      // also covers play from the lock screen or headphones
      this.wantPlaying = true
      this.emit('playing')
    } else if (!s.playing && this.wasPlaying && this.wantPlaying && !s.didJustFinish && !s.isBuffering && s.timeControlStatus === 'paused') {
      // stopped without us asking: lock screen, headphones unplugged, phone call
      this.wantPlaying = false
      this.emit('remotepause')
    }
    this.wasPlaying = s.playing

    if (s.playing) this.emit('timeupdate')
    if (s.playing && s.isBuffering) this.emit('waiting')

    if (s.didJustFinish && !this.endedSent) {
      this.endedSent = true
      this.wantPlaying = false
      this.emit('timeupdate')
      this.emit('ended')
    }
  }
}
