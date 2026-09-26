// Artwork is imported rather than referenced by absolute path, so it resolves both
// in the Vite web build and inside the native app's DOM bundle (served from file://).
import birds from '../assets/img/birds.jpg'
import fire from '../assets/img/fire.jpg'
import lantern from '../assets/img/lantern.jpg'
import madinah from '../assets/img/madinah.jpg'
import rain from '../assets/img/rain.jpg'
import tile from '../assets/img/tile.jpg'
import waves from '../assets/img/waves.jpg'

// Vite yields a URL string; Metro may yield { uri } or { default }.
function url(m: unknown): string {
  if (typeof m === 'string') return m
  const o = m as { uri?: string; default?: unknown } | null
  if (o?.uri) return o.uri
  if (o?.default !== undefined) return url(o.default)
  return ''
}

export const IMG = {
  birds: url(birds),
  fire: url(fire),
  lantern: url(lantern),
  madinah: url(madinah),
  rain: url(rain),
  tile: url(tile),
  waves: url(waves),
}
