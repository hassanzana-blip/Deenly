// ─── DeenDunya global store ──────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { engine, type PlayerSnapshot } from './lib/audio'
import { reciterById, type AmbientId, type Reciter } from './lib/data'
import { platform } from './lib/platform'

export type Tab = 'main' | 'today' | 'read' | 'sleep' | 'search'
export type Push =
  | { t: 'reciters' }
  | { t: 'reciter'; id: string }
  | { t: 'mushafs' }
  | { t: 'reader'; surah: number; ayah?: number }
export type Sheet = 'player' | 'profile' | 'about' | 'searchBook' | 'signin' | 'ambient' | 'language' | null
export type Dialog = 'downloadAll' | 'signinRequired' | null
export type Lang = 'en' | 'no' | 'ar' | 'ckb'

interface NavState { tab: Tab; stack: Push[] }

interface Store {
  nav: NavState
  setTab: (t: Tab) => void
  push: (p: Push) => void
  pop: () => void
  resetStack: () => void
  sheet: Sheet
  setSheet: (s: Sheet) => void
  dialog: Dialog
  setDialog: (d: Dialog) => void
  player: PlayerSnapshot
  play: (reciter: Reciter, surah: number, ayah?: number) => void
  playDefault: () => void
  ambient: AmbientId
  setAmbient: (a: AmbientId) => void
  // persisted user state
  favorites: string[]
  toggleFavorite: (id: string) => void
  follows: string[]
  toggleFollow: (id: string) => void
  downloads: string[] // "reciterId:surah"
  toggleDownload: (key: string) => void
  bookmarks: string[] // "surah:ayah"
  toggleBookmark: (key: string) => void
  streak: number
  lang: Lang
  setLang: (l: Lang) => void
  theme: 'system' | 'dark' | 'light'
  setTheme: (t: 'system' | 'dark' | 'light') => void
  signedIn: boolean
  signIn: () => void
  t: (k: string) => string
  rtl: boolean
}

const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function toggleIn(set: (v: string[] | ((p: string[]) => string[])) => void, id: string) {
  set(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
}

function usePersisted<T>(key: string, fallback: T): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<T>(() => load(key, fallback))
  const set = useCallback((v: T | ((p: T) => T)) => {
    setState(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* storage unavailable */ }
      return next
    })
  }, [key])
  return [state, set]
}

// ── i18n (chrome strings) ────────────────────────────────────────────────────
const STR: Record<string, Record<Lang, string>> = {
  main: { en: 'Main', no: 'Hjem', ar: 'الرئيسية', ckb: 'سەرەتا' },
  today: { en: 'Today', no: 'I dag', ar: 'اليوم', ckb: 'ئەمڕۆ' },
  read: { en: 'Read', no: 'Les', ar: 'اقرأ', ckb: 'بخوێنە' },
  sleep: { en: 'Sleep', no: 'Søvn', ar: 'النوم', ckb: 'خەو' },
  search: { en: 'Search', no: 'Søk', ar: 'بحث', ckb: 'گەڕان' },
  downloaded: { en: 'Downloaded', no: 'Nedlastet', ar: 'تم التنزيل', ckb: 'داگیراوە' },
  availableOffline: { en: 'Available Offline', no: 'Tilgjengelig frakoblet', ar: 'متاح دون اتصال', ckb: 'بەبێ هێڵ بەردەستە' },
  playlists: { en: 'Playlists', no: 'Spillelister', ar: 'قوائم التشغيل', ckb: 'لیستەکانی لێدەر' },
  surahFriday: { en: 'Surah for Friday', no: 'Fredags-surah', ar: 'سورة الجمعة', ckb: 'سوورەتی ھەینی' },
  featuredReciters: { en: 'Featured Reciters', no: 'Utvalgte resitatører', ar: 'قراء مميزون', ckb: 'قاریارانی تایبەت' },
  allReciters: { en: 'All Reciters', no: 'Alle resitatører', ar: 'جميع القراء', ckb: 'هەموو قاریاران' },
  shareApp: { en: 'Share the App with Your Friends', no: 'Del appen med vennene dine', ar: 'شارك التطبيق مع أصدقائك', ckb: 'ئەپەکە بە هاوڕێکانت بڵێ' },
  shareSub: { en: 'The best way to listen, read and remember the Quran.', no: 'Den beste måten å lytte, lese og huske Koranen.', ar: 'أفضل طريقة للاستماع إلى القرآن وقراءته وتدبره.', ckb: 'باشترین ڕێگا بۆ گوێگرتن و خوێندن و لەبەرکردنی قورئان.' },
  listOfSurahs: { en: 'List of Surahs', no: 'Suraher', ar: 'قائمة السور', ckb: 'لیستی سوورەتەکان' },
  download: { en: 'Download', no: 'Last ned', ar: 'تنزيل', ckb: 'داگرتن' },
  shuffle: { en: 'Shuffle', no: 'Tilfeldig', ar: 'عشوائي', ckb: 'هەڕەمەکی' },
  play: { en: 'Play', no: 'Spill', ar: 'تشغيل', ckb: 'لێدان' },
  continue: { en: 'Continue', no: 'Fortsett', ar: 'متابعة', ckb: 'بەردەوامبوون' },
  surahs: { en: 'surahs', no: 'suraher', ar: 'سورة', ckb: 'سوورەت' },
  audioSync: { en: 'Audio Sync', no: 'Lydsynk', ar: 'مزامنة صوتية', ckb: 'هاوکاتبوونی دەنگ' },
  aboutReciter: { en: 'About Reciter', no: 'Om resitatøren', ar: 'عن القارئ', ckb: 'دەربارەی قاری' },
  addFavorite: { en: 'Add to Favorite', no: 'Legg til favoritt', ar: 'إضافة إلى المفضلة', ckb: 'زیادکردن بۆ دڵخواز' },
  removeFavorite: { en: 'Remove Favorite', no: 'Fjern favoritt', ar: 'إزالة من المفضلة', ckb: 'لابردن لە دڵخواز' },
  followReciter: { en: 'Follow the Reciter', no: 'Følg resitatøren', ar: 'متابعة القارئ', ckb: 'شوێن قاریارەکە کەوتن' },
  following: { en: 'Following', no: 'Følger', ar: 'تتم المتابعة', ckb: 'شوێندەکەوەی' },
  downloadManager: { en: 'Download Manager', no: 'Nedlastingsbehandler', ar: 'مدير التنزيلات', ckb: 'بەڕێوەبەری داگرتن' },
  share: { en: 'Share', no: 'Del', ar: 'مشاركة', ckb: 'هاوبەشکردن' },
  downloadAllQ: { en: 'Would you like to download all the surahs?', no: 'Vil du laste ned alle surahene?', ar: 'هل تريد تنزيل جميع السور؟', ckb: 'دەتەوێت هەموو سوورەتەکان دابگریت؟' },
  waitLoading: { en: 'Wait while loading', no: 'Vent mens det lastes', ar: 'يرجى الانتظار', ckb: 'چاوەڕێ بکە' },
  cancel: { en: 'Cancel', no: 'Avbryt', ar: 'إلغاء', ckb: 'هەڵوەشاندنەوە' },
  signInRequired: { en: 'Sign In Required', no: 'Innlogging kreves', ar: 'تسجيل الدخول مطلوب', ckb: 'چوونەژوورەوە پێویستە' },
  signInPlaylists: { en: 'Please sign in to view your playlists.', no: 'Logg inn for å se spillelistene dine.', ar: 'يرجى تسجيل الدخول لعرض قوائم التشغيل.', ckb: 'تکایە بچۆ ژوورەوە بۆ بینینی لیستەکانت.' },
  signIn: { en: 'Sign In', no: 'Logg inn', ar: 'تسجيل الدخول', ckb: 'چوونەژوورەوە' },
  stories: { en: 'Stories', no: 'Historier', ar: 'قصص', ckb: 'چیرۆکەکان' },
  verseOfDay: { en: 'Verse of the Day', no: 'Dagens vers', ar: 'آية اليوم', ckb: 'ئایەتی ڕۆژ' },
  hadithOfDay: { en: 'Hadith of the Day', no: 'Dagens hadith', ar: 'حديث اليوم', ckb: 'حەدیسی ڕۆژ' },
  liveTV: { en: 'Live TV', no: 'Direkte-TV', ar: 'البث المباشر', ckb: 'کەناڵی زیندوو' },
  liveTVSub: { en: 'Watch free Islamic TV channels including Iqra, Mecca and more.', no: 'Se gratis islamske TV-kanaler, inkludert Iqra, Mekka med flere.', ar: 'شاهد قنوات إسلامية مجانية.', ckb: 'کەناڵە ئیسلامییەکانی بەخۆڕایی ببینە.' },
  onlineRadio: { en: 'Online Radio', no: 'Nettradio', ar: 'الإذاعة', ckb: 'ڕادیۆی ئۆنلاین' },
  onlineRadioSub: { en: 'Listen to the best Islamic radio station live.', no: 'Lytt til de beste islamske radiostasjonene direkte.', ar: 'استمع إلى أفضل الإذاعات الإسلامية مباشرة.', ckb: 'گوێ لە باشترین ڕادیۆ ئیسلامی بگرە.' },
  islamicEvents: { en: 'Islamic Events', no: 'Islamske hendelser', ar: 'المناسبات الإسلامية', ckb: 'ڕووداوە ئیسلامییەکان' },
  islamicEventsSub: { en: 'Islamic calendar for determining dates of religious events and rituals.', no: 'Islamsk kalender for religiøse dager og ritualer.', ar: 'التقويم الإسلامي لتحديد مواعيد المناسبات.', ckb: 'ساڵنامەی ئیسلامی بۆ دیاریکردنی ڕۆژەکان.' },
  calendar: { en: 'Calendar', no: 'Kalender', ar: 'التقويم', ckb: 'ساڵنامە' },
  chronology: { en: 'Chronology', no: 'Kronologi', ar: 'الترتيب', ckb: 'ڕیزبەندی' },
  sleepStories: { en: 'Sleep Stories', no: 'Søvnhistorier', ar: 'قصص النوم', ckb: 'چیرۆکەکانی خەو' },
  editorsChoice: { en: "Editor's Choice", no: 'Redaksjonens valg', ar: 'اختيار المحرر', ckb: 'هەڵبژاردەی ئێدیتۆر' },
  recentlyAdded: { en: 'Recently Added', no: 'Nylig lagt til', ar: 'أضيف حديثاً', ckb: 'نوێترینەکان' },
  mushafs: { en: 'Mushafs', no: 'Mushafer', ar: 'المصاحف', ckb: 'مەسحەفەکان' },
  juz: { en: "Juz'", no: 'Juz', ar: 'جزء', ckb: 'جوز' },
  sajda: { en: 'Sajda', no: 'Sajda', ar: 'سجدة', ckb: 'سەجدە' },
  ayahsMeccan: { en: 'ayahs, Meccan', no: 'vers, Mekka', ar: 'آيات، مكية', ckb: 'ئایەت، مەکی' },
  ayahsMedinan: { en: 'ayahs, Medinan', no: 'vers, Medina', ar: 'آيات، مدنية', ckb: 'ئایەت، مەدەنی' },
  searchSurahs: { en: 'Search surahs', no: 'Søk i suraher', ar: 'ابحث في السور', ckb: 'گەڕان لە سوورەتەکان' },
  searchInBook: { en: 'Search in the Book', no: 'Søk i boken', ar: 'ابحث في الكتاب', ckb: 'گەڕان لە کتێبەکە' },
  reciters: { en: 'Reciters', no: 'Resitatører', ar: 'القراء', ckb: 'قاریاران' },
  profile: { en: 'Profile', no: 'Profil', ar: 'الملف الشخصي', ckb: 'پرۆفایل' },
  guest: { en: 'Guest', no: 'Gjest', ar: 'ضيف', ckb: 'میوان' },
  syncData: { en: 'Sync your data', no: 'Synkroniser dataene dine', ar: 'زامن بياناتك', ckb: 'داتاکانت هاوکات بکە' },
  premium: { en: 'Premium', no: 'Premium', ar: 'بريميوم', ckb: 'پریمیۆم' },
  bookmarks: { en: 'Bookmarks', no: 'Bokmerker', ar: 'الإشارات', ckb: 'نیشانەکان' },
  notes: { en: 'Notes', no: 'Notater', ar: 'الملاحظات', ckb: 'تێبینییەکان' },
  settings: { en: 'Settings', no: 'Innstillinger', ar: 'الإعدادات', ckb: 'ڕێکخستنەکان' },
  notifications: { en: 'Notifications', no: 'Varsler', ar: 'الإشعارات', ckb: 'ئاگادارکردنەوەکان' },
  appTheme: { en: 'App Theme', no: 'App-tema', ar: 'مظهر التطبيق', ckb: 'ڕووکاری ئەپ' },
  audioQuality: { en: 'Audio Quality', no: 'Lydkvalitet', ar: 'جودة الصوت', ckb: 'کوالیتی دەنگ' },
  translator: { en: 'Translator', no: 'Oversetter', ar: 'المترجم', ckb: 'وەرگێڕ' },
  language: { en: 'Language', no: 'Språk', ar: 'اللغة', ckb: 'زمان' },
  system: { en: 'System', no: 'System', ar: 'النظام', ckb: 'سیستەم' },
  dark: { en: 'Dark', no: 'Mørk', ar: 'داكن', ckb: 'تاریک' },
  light: { en: 'Light', no: 'Lys', ar: 'فاتح', ckb: 'ڕووناک' },
  queue: { en: 'Queue', no: 'Kø', ar: 'قائمة الانتظار', ckb: 'ڕیز' },
  repeat: { en: 'Repeat', no: 'Gjenta', ar: 'تكرار', ckb: 'دووبارەکردنەوە' },
  timer: { en: 'Timer', no: 'Timer', ar: 'المؤقت', ckb: 'کاتژمێر' },
  of: { en: 'of', no: 'av', ar: 'من', ckb: 'لە' },
  page: { en: 'Page', no: 'Side', ar: 'صفحة', ckb: 'لاپەڕە' },
  hizb: { en: 'Hizb', no: 'Hizb', ar: 'حزب', ckb: 'حزب' },
  nextPrayer: { en: 'Next prayer', no: 'Neste bønn', ar: 'الصلاة التالية', ckb: 'نوێژی داهاتوو' },
  prayerTimes: { en: 'Prayer Times', no: 'Bønnetider', ar: 'أوقات الصلاة', ckb: 'کاتەکانی نوێژ' },
  welcome: { en: 'Welcome to', no: 'Velkommen til', ar: 'مرحباً بك في', ckb: 'بەخێربێیت بۆ' },
  welcomeSub: { en: 'Begin a serene journey through the Quran: Listen, read, reflect, and remember.', no: 'Begynn en rolig reise gjennom Koranen: Lytt, les, reflekter og husk.', ar: 'ابدأ رحلة هادئة عبر القرآن: استمع واقرأ وتدبر واذكر.', ckb: 'گەشتێکی ئارام بە قورئاندا دەست پێبکە.' },
  benefits: { en: 'Benefits of creating an account', no: 'Fordeler med en konto', ar: 'فوائد إنشاء حساب', ckb: 'قازانجەکانی هەژمار' },
  benefitSync: { en: 'Sync bookmarks, downloads and progress across devices', no: 'Synkroniser bokmerker, nedlastinger og fremdrift', ar: 'زامن الإشارات والتنزيلات والتقدم عبر الأجهزة', ckb: 'هاوکاتکردنی نیشانەکان لەسەر هەموو ئامێرەکان' },
  continueGuest: { en: 'Continue as Guest', no: 'Fortsett som gjest', ar: 'المتابعة كضيف', ckb: 'وەک میوان بەردەوامبە' },
  playing: { en: 'Playing', no: 'Spiller', ar: 'يُشغَّل', ckb: 'لێدەدات' },
  offline: { en: 'offline', no: 'frakoblet', ar: 'دون اتصال', ckb: 'بەبێ هێڵ' },
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [nav, setNav] = useState<NavState>({ tab: 'main', stack: [] })
  const [sheet, setSheet] = useState<Sheet>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [ambient, setAmbient] = useState<AmbientId>('birds')
  const player = useSyncExternalStore(engine.subscribe, engine.getSnapshot)

  const [favorites, setFavorites] = usePersisted<string[]>('dd.favorites', [])
  const [follows, setFollows] = usePersisted<string[]>('dd.follows', [])
  const [downloads, setDownloads] = usePersisted<string[]>('dd.downloads', [])
  const [bookmarks, setBookmarks] = usePersisted<string[]>('dd.bookmarks', [])
  const [streak] = useState(0)
  const [lang, setLangRaw] = useState<Lang>(() => load('dd.lang', 'no'))
  const [theme, setThemeRaw] = useState<'system' | 'dark' | 'light'>(() => load('dd.theme', 'system'))
  const [signedIn, setSignedIn] = useState<boolean>(() => load('dd.signedIn', false))

  const setLang = useCallback((l: Lang) => { setLangRaw(l); try { localStorage.setItem('dd.lang', JSON.stringify(l)) } catch { /* storage unavailable */ } }, [])
  const setTheme = useCallback((t: Store['theme']) => { setThemeRaw(t); try { localStorage.setItem('dd.theme', JSON.stringify(t)) } catch { /* storage unavailable */ } }, [])

  // the native app downloads/deletes chapter files to match this list
  useEffect(() => { platform.syncDownloads(downloads) }, [downloads])

  const rtl = lang === 'ar' || lang === 'ckb'
  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.getElementById('dd-root')?.classList.toggle('dark', dark)
    platform.setDarkMode(dark)
    const app = document.getElementById('dd-app')
    if (app) app.dir = rtl ? 'rtl' : 'ltr'
  }, [theme, rtl])

  const setTab = useCallback((t: Tab) => setNav({ tab: t, stack: [] }), [])
  const push = useCallback((p: Push) => setNav(n => ({ ...n, stack: [...n.stack, p] })), [])
  const pop = useCallback(() => setNav(n => ({ ...n, stack: n.stack.slice(0, -1) })), [])
  const resetStack = useCallback(() => setNav(n => ({ ...n, stack: [] })), [])

  const play = useCallback((reciter: Reciter, s: number, ayah = 1) => { engine.play(reciter, s, ayah, true) }, [])
  const playDefault = useCallback(() => {
    const r = reciterById('abdul-rahman-al-sudais') ?? reciterById('mishary-rashid-alafasy')!
    engine.play(r, 36, 1, true)
  }, [])

  const t = useCallback((k: string) => STR[k]?.[lang] ?? STR[k]?.en ?? k, [lang])
  const signIn = useCallback(() => { setSignedIn(true); try { localStorage.setItem('dd.signedIn', 'true') } catch { /* storage unavailable */ } }, [])

  const value = useMemo<Store>(() => ({
    nav, setTab, push, pop, resetStack, sheet, setSheet, dialog, setDialog,
    player, play, playDefault, ambient, setAmbient,
    favorites, toggleFavorite: id => toggleIn(setFavorites, id),
    follows, toggleFollow: id => toggleIn(setFollows, id),
    downloads, toggleDownload: id => toggleIn(setDownloads, id),
    bookmarks, toggleBookmark: id => toggleIn(setBookmarks, id),
    streak, lang, setLang, theme, setTheme, signedIn, signIn, t, rtl,
  }), [nav, sheet, dialog, player, ambient, favorites, follows, downloads, bookmarks, streak, lang, theme, signedIn, t, rtl, setTab, push, pop, resetStack, play, playDefault, setLang, setTheme, signIn, setFavorites, setFollows, setDownloads, setBookmarks])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
