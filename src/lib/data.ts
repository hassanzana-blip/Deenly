// ─── DeenDunya data layer ────────────────────────────────────────────────────
// Quran text: Tanzil/Uthmani via api.quran.com (verified structured source)
// Audio: QDC per-ayah CDN (verses.quran.com) + mp3quran.net chapter files
import surahsJson from '../data/surahs.json'
import juzsJson from '../data/juzs.json'
import recitersJson from '../data/reciters.json'
import qdcPrefix from '../data/qdc_prefix.json'

import q1 from '../data/quran/1.json'
import q2 from '../data/quran/2.json'
import q13 from '../data/quran/13.json'
import q18 from '../data/quran/18.json'
import q36 from '../data/quran/36.json'
import q55 from '../data/quran/55.json'
import q67 from '../data/quran/67.json'
import q94 from '../data/quran/94.json'
import q112 from '../data/quran/112.json'
import q113 from '../data/quran/113.json'
import q114 from '../data/quran/114.json'

export interface SurahMeta { n: number; name: string; arabic: string; english: string; ayahs: number; place: string; page: number }
export interface Reciter {
  id: string; name: string; arabic?: string; sync: boolean; featured?: boolean; bio?: string
  qdc?: number; prefix?: string; server?: string; count: number
}
export interface Ayah { k: string; u: string; e: string; t: string }
export interface SurahText { surah: number; ayahs: Ayah[] }
export interface Timings { total: number; url?: string; ayahs: { k: string; f: number; t: number }[] }

export const SURAHS = surahsJson as SurahMeta[]
export const JUZS = juzsJson as unknown as { n: number; mapping: Record<string, string> }[]
export const RECITERS = recitersJson as Reciter[]
export const QDC_PREFIX = qdcPrefix as Record<string, string>

const BUNDLED: Record<number, SurahText> = { 1: q1, 2: q2, 13: q13, 18: q18, 36: q36, 55: q55, 67: q67, 94: q94, 112: q112, 113: q113, 114: q114 } as Record<number, SurahText>

const textCache = new Map<number, Promise<SurahText>>()
export function getSurahText(n: number): Promise<SurahText> {
  if (BUNDLED[n]) return Promise.resolve(BUNDLED[n])
  if (!textCache.has(n)) {
    textCache.set(n, (async () => {
      const h = { 'User-Agent': 'DeenDunya/1.0' }
      const [u, t, tr] = await Promise.all([
        fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${n}&per_page=300`, { headers: h }).then(r => r.json()),
        fetch(`https://api.quran.com/api/v4/quran/translations/20?chapter_number=${n}&per_page=300`, { headers: h }).then(r => r.json()),
        fetch(`https://api.quran.com/api/v4/quran/translations/57?chapter_number=${n}&per_page=300`, { headers: h }).then(r => r.json()),
      ])
      // remove HTML tags, then the footnote digits the <sup> markers leave behind
      const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/(?<=[A-Za-zÀ-ž.,)"”])\d{1,2}(?=\s|$)/g, '')
      const ayahs: Ayah[] = u.verses.map((v: any, i: number) => ({
        k: v.verse_key, u: v.text_uthmani,
        e: t.translations[i] ? strip(t.translations[i].text) : '',
        t: tr.translations[i] ? tr.translations[i].text : '',
      }))
      return { surah: n, ayahs }
    })())
  }
  return textCache.get(n)!
}

// ── timings (per-reciter, per-surah) ─────────────────────────────────────────
const timingLoaders: Record<string, () => Promise<any>> = import.meta.glob('../data/timings/*.json')
const timingCache = new Map<string, Promise<Timings | null>>()
export function getTimings(qdc: number, surah: number): Promise<Timings | null> {
  const key = `${qdc}_${surah}`
  if (!timingCache.has(key)) {
    const local = timingLoaders[`../data/timings/${key}.json`]
    if (local) {
      timingCache.set(key, local().then(m => (m.default ?? m) as Timings))
    } else {
      timingCache.set(key, fetch(`https://api.quran.com/api/v4/chapter_recitations/${qdc}/${surah}?segments=true`, { headers: { 'User-Agent': 'DeenDunya/1.0' } })
        .then(r => r.json())
        .then(d => {
          const f = d.audio_file
          if (!f?.timestamps?.length) return null
          return { total: f.timestamps[f.timestamps.length - 1].timestamp_to, url: f.audio_url, ayahs: f.timestamps.map((x: any) => ({ k: x.verse_key, f: x.timestamp_from, t: x.timestamp_to })) } as Timings
        })
        .catch(() => null))
    }
  }
  return timingCache.get(key)!
}

// ── audio url helpers ────────────────────────────────────────────────────────
export function ayahAudioUrl(reciter: Reciter, surah: number, ayah: number): string {
  const p = reciter.prefix!
  const file = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`
  if (p.startsWith('//')) return `https:${p}${file}`
  return `https://verses.quran.com/${p}${file}`
}
export function chapterAudioUrl(reciter: Reciter, surah: number): string {
  return `${reciter.server}${String(surah).padStart(3, '0')}.mp3`
}

// ── misc helpers ─────────────────────────────────────────────────────────────
export const surah = (n: number) => SURAHS[n - 1]
export const reciterById = (id: string) => RECITERS.find(r => r.id === id)

export function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

export function juzOfSurah(n: number): number {
  for (const j of JUZS) if (j.mapping[String(n)]) return j.n
  return 1
}

export const SAJDA: { surah: number; ayah: number }[] = [
  { surah: 7, ayah: 206 }, { surah: 13, ayah: 15 }, { surah: 16, ayah: 50 }, { surah: 17, ayah: 109 },
  { surah: 19, ayah: 58 }, { surah: 22, ayah: 18 }, { surah: 22, ayah: 77 }, { surah: 25, ayah: 60 },
  { surah: 27, ayah: 26 }, { surah: 32, ayah: 15 }, { surah: 38, ayah: 24 }, { surah: 41, ayah: 37 },
  { surah: 53, ayah: 62 }, { surah: 84, ayah: 21 }, { surah: 96, ayah: 19 },
]

export function hijriToday(locale = 'en'): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-islamic' : 'en-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  } catch { return '' }
}

// Verse-of-the-day pool — real ayahs from bundled surahs (Uthmani + Saheeh Intl)
export const VERSes_OF_DAY = [
  { surah: 2, ayah: 152 }, { surah: 2, ayah: 186 }, { surah: 13, ayah: 28 }, { surah: 94, ayah: 6 },
  { surah: 36, ayah: 58 }, { surah: 55, ayah: 13 }, { surah: 67, ayah: 2 }, { surah: 18, ayah: 10 },
  { surah: 2, ayah: 45 }, { surah: 1, ayah: 6 },
]
export const HADITH_OF_DAY = [
  { text: 'Actions are but by intentions, and every person shall have only that which he intended.', source: 'Sahih al-Bukhari 1' },
  { text: 'The best among you are those who learn the Quran and teach it.', source: 'Sahih al-Bukhari 5027' },
  { text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.', source: 'Sahih al-Bukhari 6018' },
  { text: 'Make things easy and do not make them difficult; give glad tidings and do not repel people.', source: 'Sahih al-Bukhari 69' },
  { text: 'None of you truly believes until he loves for his brother what he loves for himself.', source: 'Sahih al-Bukhari 13' },
  { text: 'The most beloved deeds to Allah are those done most consistently, even if small.', source: 'Sahih al-Bukhari 6464' },
]

export const AMBIENTS = [
  { id: 'birds', label: 'Birds', img: '/img/birds.png' },
  { id: 'fire', label: 'Fire', img: '/img/fire.png' },
  { id: 'rain', label: 'Rain', img: '/img/rain.png' },
  { id: 'waves', label: 'Waves', img: '/img/waves.png' },
] as const
export type AmbientId = typeof AMBIENTS[number]['id']
