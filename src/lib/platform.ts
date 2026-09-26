// ─── host platform services ─────────────────────────────────────────────────
// The UI talks to the device only through this module. The web build uses browser
// APIs; the iOS app (Expo DOM component, see src/dom/DomRoot.tsx) swaps in
// implementations backed by native modules via setPlatform().

export interface Position { latitude: number; longitude: number }

export interface Platform {
  /** true inside the native iOS app */
  native: boolean
  getPosition(): Promise<Position | null>
  openUrl(url: string): void
  share(p: { title: string; text: string }): void
  /** live radio stream; resolves false when the stream could not start */
  radioPlay(url: string): Promise<boolean>
  radioStop(): void
  /** desired offline downloads, as "reciterId:surah" keys */
  syncDownloads(keys: string[]): void
  /** app theme changed; the native side matches the status bar and background */
  setDarkMode(dark: boolean): void
}

let radioEl: HTMLAudioElement | null = null

const web: Platform = {
  native: false,
  getPosition: () => new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve(null), { timeout: 6000 },
    )
  }),
  openUrl: url => { window.open(url, '_blank', 'noopener,noreferrer') },
  share: p => { navigator.share?.(p).catch(() => {}) },
  radioPlay: url => {
    if (!radioEl) radioEl = new Audio()
    radioEl.src = url
    return radioEl.play().then(() => true, () => false)
  },
  radioStop: () => { radioEl?.pause() },
  syncDownloads: () => {},
  setDarkMode: () => {},
}

export let platform: Platform = web

export function setPlatform(p: Platform) { platform = p }
