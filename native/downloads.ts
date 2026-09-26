// ─── offline downloads ───────────────────────────────────────────────────────
// The UI keeps the list of surahs the user wants offline ("reciterId:surah");
// syncDownloads() makes the files on disk match it. Chapter files live in
// <documents>/downloads/<reciterId>/<surah>.mp3, next to the ayah timings for
// verse-synced reciters, so a downloaded surah plays and highlights offline.
import { Directory, File, Paths } from 'expo-file-system'
import { chapterAudioUrl, getTimings, registerLocalTimings, reciterById, type Timings } from '../src/lib/data'

// Paths are stored relative to `root`: the app container path changes between app updates.
interface Entry { url: string; qdc?: number }

const root = new Directory(Paths.document, 'downloads')
const manifestFile = new File(root, 'manifest.json')

let manifest: Record<string, Entry> = {}
const localByUrl = new Map<string, string>()
let desired = new Set<string>()
let running = false

/** Local file for a remote audio URL, if it has been downloaded. */
export function localUriFor(url: string): string | undefined {
  return localByUrl.get(url)
}

function split(key: string) {
  const i = key.lastIndexOf(':')
  return { reciterId: key.slice(0, i), surah: Number(key.slice(i + 1)) }
}

function audioFile(key: string) {
  const { reciterId, surah } = split(key)
  return new File(root, reciterId, `${surah}.mp3`)
}
function timingsFile(key: string) {
  const { reciterId, surah } = split(key)
  return new File(root, reciterId, `${surah}.json`)
}

function index(key: string, e: Entry) {
  localByUrl.set(e.url, audioFile(key).uri)
  if (e.qdc) {
    try {
      registerLocalTimings(e.qdc, split(key).surah, JSON.parse(timingsFile(key).textSync()) as Timings)
    } catch { /* timings are optional; playback falls back to the network */ }
  }
}

function save() {
  try { manifestFile.write(JSON.stringify(manifest)) } catch { /* retried on next change */ }
}

/** Loads what is already on disk. Call once at startup. */
export function initDownloads() {
  try {
    root.create({ intermediates: true, idempotent: true })
    if (manifestFile.exists) manifest = JSON.parse(manifestFile.textSync())
  } catch { manifest = {} }
  for (const [key, e] of Object.entries(manifest)) {
    if (audioFile(key).exists) index(key, e)
    else delete manifest[key]
  }
}

/** Resolves false when there is nothing that can be downloaded for this key. */
async function download(key: string): Promise<boolean> {
  const { reciterId, surah } = split(key)
  const reciter = reciterById(reciterId)
  if (!reciter || !(surah >= 1 && surah <= 114)) return false

  let url: string
  let timings: Timings | null = null
  if (reciter.sync && reciter.qdc) {
    timings = await getTimings(reciter.qdc, surah)
    if (!timings?.url) return false // no single chapter file for this reciter/surah
    url = timings.url
  } else {
    url = chapterAudioUrl(reciter, surah)
  }

  new Directory(root, reciterId).create({ intermediates: true, idempotent: true })
  await File.downloadFileAsync(url, audioFile(key), { idempotent: true })

  const entry: Entry = { url }
  if (timings && reciter.qdc) {
    timingsFile(key).write(JSON.stringify(timings))
    entry.qdc = reciter.qdc
  }
  // the user may have removed it while it was downloading
  if (!desired.has(key)) { remove(key, entry); return true }
  manifest[key] = entry
  index(key, entry)
  save()
  return true
}

function remove(key: string, e: Entry | undefined = manifest[key]) {
  if (!e) return
  localByUrl.delete(e.url)
  for (const f of [audioFile(key), timingsFile(key)]) {
    try { if (f.exists) f.delete() } catch { /* already gone */ }
  }
  delete manifest[key]
}

/** Downloads missing keys (one at a time) and deletes files no longer wanted. */
export function syncDownloads(keys: string[]) {
  desired = new Set(keys)
  let changed = false
  for (const key of Object.keys(manifest)) {
    if (!desired.has(key)) { remove(key); changed = true }
  }
  if (changed) save()
  if (!running) void drain()
}

async function drain() {
  running = true
  const failed = new Set<string>()
  try {
    for (;;) {
      const next = [...desired].find(k => !manifest[k] && !failed.has(k))
      if (!next) break
      // failures are retried on the next sync (next change or app start)
      const ok = await download(next).catch(() => false)
      if (!ok) failed.add(next)
    }
  } finally {
    running = false
  }
}
