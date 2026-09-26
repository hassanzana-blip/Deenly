// ─── DeenDunya audio engine (singleton) ─────────────────────────────────────
// Two playback modes:
//  • sync  — QDC reciters: chapter file w/ per-ayah timestamps, falls back to
//            per-ayah chaining from verses.quran.com when the chapter file
//            cannot load. Drives ayah highlight + autoscroll in the reader.
//  • file  — mp3quran reciters: single chapter mp3, fully seekable.
//
// The engine drives an AudioLike (the subset of HTMLAudioElement it uses). The web
// build plays through an <audio> element; the iOS app runs this same engine in the
// native JS runtime on top of expo-audio (native/audioBackend.ts), so playback,
// ayah chaining and auto-advance keep going with the screen locked. The UI then
// talks to it through a remote proxy installed with setEngine().
import { ayahAudioUrl, chapterAudioUrl, getTimings, surah as surahMeta, type Reciter, type Timings } from './data'

export interface PlayerSnapshot {
  reciter: Reciter | null
  surah: number
  status: 'idle' | 'loading' | 'playing' | 'paused'
  mode: 'sync' | 'file'
  transport: 'chapter' | 'ayah' // sync sub-transport
  ayah: number
  elapsed: number // seconds (global)
  duration: number // seconds
  speed: number
  repeat: 'off' | 'one' | 'all'
  shuffle: boolean
  error: string | null
}

type Listener = (s: PlayerSnapshot) => void

export const INITIAL_SNAPSHOT: PlayerSnapshot = {
  reciter: null, surah: 0, status: 'idle', mode: 'file', transport: 'chapter',
  ayah: 1, elapsed: 0, duration: 0, speed: 1, repeat: 'off', shuffle: false, error: null,
}

/** The subset of HTMLAudioElement the engine uses. */
export interface AudioLike {
  src: string
  currentTime: number
  readonly duration: number
  readonly paused: boolean
  playbackRate: number
  play(): Promise<void>
  pause(): void
  addEventListener(type: AudioEventType, fn: () => void, opts?: { once?: boolean }): void
}
// 'remotepause': paused from outside the app (lock screen, headphones, a phone call).
// Only the native backend emits it; <audio> never does.
export type AudioEventType = 'timeupdate' | 'ended' | 'error' | 'playing' | 'waiting' | 'loadedmetadata' | 'remotepause'

export class Engine {
  private audio: AudioLike
  private snap: PlayerSnapshot = { ...INITIAL_SNAPSHOT }
  private listeners = new Set<Listener>()
  private timings: Timings | null = null
  private prefix: number[] = [] // cumulative ms at each ayah start
  private loadToken = 0
  private srcGen = 0 // bumped on every source change, so stale load handlers can tell
  private stallTimer: ReturnType<typeof setTimeout> | undefined
  private armStall(fn: () => void, ms: number) { this.clearStall(); this.stallTimer = setTimeout(fn, ms) }
  private clearStall() { if (this.stallTimer !== undefined) { clearTimeout(this.stallTimer); this.stallTimer = undefined } }

  constructor(audio: AudioLike) {
    this.audio = audio
    this.audio.addEventListener('timeupdate', () => this.onTime())
    this.audio.addEventListener('ended', () => this.onEnded())
    this.audio.addEventListener('error', () => this.onError())
    this.audio.addEventListener('playing', () => this.set({ status: 'playing' }))
    this.audio.addEventListener('waiting', () => { if (this.snap.status === 'playing') this.set({}) })
    this.audio.addEventListener('remotepause', () => { if (this.snap.status === 'playing') this.set({ status: 'paused' }) })
  }

  private setSrc(url: string): number {
    this.audio.src = url
    return ++this.srcGen
  }

  subscribe = (l: Listener) => { this.listeners.add(l); l(this.snap); return () => { this.listeners.delete(l) } }
  getSnapshot = () => this.snap
  private set(patch: Partial<PlayerSnapshot>) {
    this.snap = { ...this.snap, ...patch }
    this.listeners.forEach(l => l(this.snap))
  }

  private prefixSums() {
    if (!this.timings) return
    this.prefix = []
    let acc = 0
    for (const a of this.timings.ayahs) { this.prefix.push(acc); acc += (a.t - a.f) }
  }

  private globalSecForAyah(i: number, offsetSec: number) {
    return ((this.prefix[i] ?? 0) + offsetSec * 1000) / 1000
  }

  private ayahIndexAt(globalSec: number): { i: number; offset: number } {
    if (!this.timings) return { i: 0, offset: 0 }
    const ms = globalSec * 1000
    let lo = 0, hi = this.prefix.length - 1, ans = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (this.prefix[mid] <= ms) { ans = mid; lo = mid + 1 } else hi = mid - 1
    }
    return { i: ans, offset: (ms - this.prefix[ans]) / 1000 }
  }

  private ayahFromChapterTime(sec: number): number {
    if (!this.timings) return 1
    const ms = sec * 1000
    const a = this.timings.ayahs
    let idx = a.findIndex(x => ms < x.t)
    if (idx === -1) idx = a.length - 1
    return idx + 1
  }

  async play(reciter: Reciter, surahN: number, startAyah = 1, autoplay = true) {
    const token = ++this.loadToken
    this.clearStall()
    this.audio.pause()
    this.set({ reciter, surah: surahN, status: 'loading', mode: reciter.sync ? 'sync' : 'file', transport: 'chapter', ayah: startAyah, elapsed: 0, duration: 0, error: null })

    if (reciter.sync && reciter.qdc) {
      this.timings = await getTimings(reciter.qdc, surahN)
      if (token !== this.loadToken) return
      if (this.timings && this.timings.ayahs.length) {
        this.prefixSums()
        const durMs = this.timings.total || this.prefix.reduce((a, _b, i) => a + (this.timings!.ayahs[i].t - this.timings!.ayahs[i].f), 0)
        this.set({ duration: durMs / 1000 })
        // preferred: single chapter file with native seeking
        if (this.timings.url) {
          this.set({ transport: 'chapter' })
          const gen = this.setSrc(this.timings.url)
          this.audio.playbackRate = this.snap.speed
          const startMs = this.prefix[Math.max(0, startAyah - 1)] ?? 0
          const onMeta = () => {
            if (gen !== this.srcGen) return // source changed (e.g. stall fallback) before it loaded
            this.clearStall()
            this.audio.currentTime = startMs / 1000
            if (autoplay) this.audio.play().catch(() => {})
            this.set({ status: autoplay ? 'playing' : 'paused', elapsed: startMs / 1000 })
          }
          this.audio.addEventListener('loadedmetadata', onMeta, { once: true })
          // chapter host may hang without firing error → switch to per-ayah chain
          this.armStall(() => {
            if (token !== this.loadToken) return
            this.set({ transport: 'ayah' })
            this.playAyah(startAyah - 1, 0, autoplay, token)
          }, 7000)
          return
        }
        // fallback: per-ayah chain
        this.set({ transport: 'ayah' })
        this.playAyah(startAyah - 1, 0, autoplay, token)
        return
      }
      // no timings — degrade to per-ayah chain without durations
      this.set({ transport: 'ayah', duration: 0 })
      this.playAyah(startAyah - 1, 0, autoplay, token)
      return
    }

    // file mode
    this.timings = null
    this.set({ transport: 'chapter' })
    this.setSrc(chapterAudioUrl(reciter, surahN))
    this.audio.playbackRate = this.snap.speed
    if (autoplay) this.audio.play().catch(() => this.set({ status: 'paused', error: 'Tap play to start' }))
    else this.set({ status: 'paused' })
  }

  private playAyah(i: number, offsetSec: number, autoplay: boolean, token: number) {
    const r = this.snap.reciter
    if (!r || token !== this.loadToken) return
    const count = surahMeta(this.snap.surah).ayahs
    if (i < 0) i = 0
    if (i >= count) { this.onEnded(); return }
    this.set({ ayah: i + 1 })
    const gen = this.setSrc(ayahAudioUrl(r, this.snap.surah, i + 1))
    this.audio.playbackRate = this.snap.speed
    const onMeta = () => {
      if (gen !== this.srcGen) return
      this.clearStall()
      if (offsetSec > 0.2) this.audio.currentTime = offsetSec
      if (autoplay) this.audio.play().catch(() => {})
      this.set({ status: autoplay ? 'playing' : 'paused' })
    }
    this.audio.addEventListener('loadedmetadata', onMeta, { once: true })
    // a stuck ayah file must not freeze the player — skip ahead
    this.armStall(() => {
      if (token !== this.loadToken) return
      const c = surahMeta(this.snap.surah).ayahs
      if (i + 1 < c) this.playAyah(i + 1, 0, autoplay, token)
      else this.set({ status: 'paused', error: 'Audio unavailable' })
    }, 6000)
  }

  private onTime() {
    const s = this.snap
    if (s.mode === 'file') {
      this.set({ elapsed: this.audio.currentTime, duration: this.audio.duration || s.duration })
      return
    }
    if (s.transport === 'chapter') {
      const t = this.audio.currentTime
      const ay = this.timings ? this.ayahFromChapterTime(t) : s.ayah
      if (ay !== s.ayah) this.set({ elapsed: t, ayah: ay })
      else this.set({ elapsed: t })
      return
    }
    // per-ayah chain
    const glob = this.globalSecForAyah(s.ayah - 1, this.audio.currentTime)
    this.set({ elapsed: glob })
  }

  private onEnded() {
    const s = this.snap
    if (s.mode === 'file' || s.transport === 'chapter') {
      if (s.repeat === 'one') { this.audio.currentTime = 0; this.audio.play().catch(() => {}); return }
      this.advanceSurah(1)
      return
    }
    // per-ayah chain
    if (s.repeat === 'one') { this.playAyah(s.ayah - 1, 0, true, this.loadToken); return }
    if (s.shuffle) {
      const count = surahMeta(s.surah).ayahs
      this.playAyah(Math.floor(Math.random() * count), 0, true, this.loadToken)
      return
    }
    const count = surahMeta(s.surah).ayahs
    if (s.ayah < count) this.playAyah(s.ayah, 0, true, this.loadToken)
    else this.advanceSurah(1)
  }

  private advanceSurah(dir: 1 | -1) {
    const s = this.snap
    const next = s.surah + dir
    if (!s.reciter) return
    if (next >= 1 && next <= 114) this.play(s.reciter, next, 1, true)
    else this.set({ status: 'paused' })
  }

  private onError() {
    this.clearStall()
    const s = this.snap
    // chapter file failed on a sync reciter → fall back to per-ayah chain
    if (s.mode === 'sync' && s.transport === 'chapter' && s.reciter) {
      this.set({ transport: 'ayah' })
      const { i, offset } = this.timings ? this.ayahIndexAt(s.elapsed) : { i: s.ayah - 1, offset: 0 }
      this.playAyah(i, offset, true, this.loadToken)
      return
    }
    if (s.mode === 'sync' && s.transport === 'ayah') {
      // skip broken ayah file
      this.playAyah(s.ayah, 0, true, this.loadToken)
      return
    }
    this.set({ status: 'paused', error: 'Audio unavailable' })
  }

  pause() {
    if (!this.snap.reciter || this.audio.paused) return
    this.audio.pause(); this.set({ status: 'paused' })
  }

  toggle() {
    const s = this.snap
    if (!s.reciter) return
    if (this.audio.paused) { this.audio.play().catch(() => {}); this.set({ status: 'playing' }) }
    else { this.audio.pause(); this.set({ status: 'paused' }) }
  }

  next() {
    const s = this.snap
    if (s.mode === 'sync' && s.transport === 'ayah') { this.playAyah(s.ayah, 0, true, this.loadToken); return }
    this.advanceSurah(1)
  }
  prev() {
    const s = this.snap
    if (s.mode === 'sync' && s.transport === 'ayah') { this.playAyah(Math.max(0, s.ayah - 2), 0, true, this.loadToken); return }
    if (s.mode === 'sync' && s.transport === 'chapter' && this.timings) {
      const i = Math.max(0, s.ayah - 2)
      this.audio.currentTime = this.prefix[i] / 1000
      return
    }
    this.advanceSurah(-1)
  }

  seek(globalSec: number) {
    const s = this.snap
    if (s.mode === 'file') { this.audio.currentTime = globalSec; this.set({ elapsed: globalSec }); return }
    if (s.transport === 'chapter') { this.audio.currentTime = globalSec; this.set({ elapsed: globalSec }); return }
    if (!this.timings) return
    const { i, offset } = this.ayahIndexAt(globalSec)
    this.playAyah(i, offset, s.status === 'playing', this.loadToken)
    this.set({ elapsed: globalSec })
  }

  skip(delta: number) { this.seek(Math.max(0, Math.min(this.snap.duration || 1e9, this.snap.elapsed + delta))) }

  setSpeed(v: number) { this.audio.playbackRate = v; this.set({ speed: v }) }
  setRepeat(r: PlayerSnapshot['repeat']) { this.set({ repeat: r }) }
  setShuffle(b: boolean) { this.set({ shuffle: b }) }

  playAyahDirect(ayahN: number) {
    const s = this.snap
    if (s.mode !== 'sync') return
    if (s.transport === 'chapter' && this.timings) {
      this.audio.currentTime = (this.prefix[ayahN - 1] ?? 0) / 1000
      this.audio.play().catch(() => {})
      this.set({ status: 'playing' })
      return
    }
    this.playAyah(ayahN - 1, 0, true, this.loadToken)
  }
}

export type EngineApi = Pick<Engine,
  'subscribe' | 'getSnapshot' | 'play' | 'pause' | 'toggle' | 'next' | 'prev' | 'seek' | 'skip' |
  'setSpeed' | 'setRepeat' | 'setShuffle' | 'playAyahDirect'>

/** Engine methods the UI may invoke remotely (everything except subscribe/getSnapshot). */
export type EngineCommand = Exclude<keyof EngineApi, 'subscribe' | 'getSnapshot'>

let impl: EngineApi | null = null
function current(): EngineApi {
  if (!impl) {
    const el = new Audio()
    el.preload = 'auto'
    impl = new Engine(el)
  }
  return impl
}

/** Replaces the engine the UI talks to (the iOS app installs a proxy to the native engine). */
export function setEngine(e: EngineApi) { impl = e }

export const engine: EngineApi = {
  subscribe: l => current().subscribe(l),
  getSnapshot: () => current().getSnapshot(),
  play: (...a) => current().play(...a),
  pause: () => current().pause(),
  toggle: () => current().toggle(),
  next: () => current().next(),
  prev: () => current().prev(),
  seek: v => current().seek(v),
  skip: d => current().skip(d),
  setSpeed: v => current().setSpeed(v),
  setRepeat: r => current().setRepeat(r),
  setShuffle: b => current().setShuffle(b),
  playAyahDirect: n => current().playAyahDirect(n),
}
