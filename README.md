# DeenDunya

Quran reader & listener app: 31 reciters, verse-synced audio, prayer times, and 4 languages with true RTL (Norwegian, English, Arabic, Sorani).

## Features

- **Quran reader** – full Uthmani text for all 114 surahs, with Saheeh International English translation and transliteration. Browse by surah, juz or sajda verse, and bookmark any ayah.
- **31 reciters** – including Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Mahmoud Khalil Al-Hussary and Saad El Ghamidi. Follow reciters, favourite tracks and queue downloads.
- **Verse-synced audio** – for supported reciters, the reader highlights the current ayah and scrolls with it using per-verse timestamps. If a chapter file can't load, playback falls back to chaining single ayahs.
- **Full player** – play/pause, seek, playback speed, repeat (one / all), shuffle, and a mini-player that stays visible across screens.
- **Prayer times** – daily times computed on the device with the `adhan` library (Muslim World League method), plus the Hijri date and upcoming Islamic events.
- **Today** – verse and hadith of the day, and a daily reading streak.
- **Sleep** – recitations paired with ambient soundscapes (rain, fire, waves, birds).
- **4 languages with true RTL** – Norwegian (default), English, Arabic and Sorani Kurdish. Arabic and Sorani switch the whole layout to right-to-left.
- **Light / dark / system theme**. Preferences, bookmarks and downloads are saved in `localStorage`.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 7](https://vite.dev/) (dev server + build to `dist/`)
- [Tailwind CSS 3](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) / Radix UI primitives
- [Framer Motion](https://www.framer.com/motion/) for transitions
- [lucide-react](https://lucide.dev/) icons
- [adhan](https://github.com/batoulapps/adhan-js) for prayer time calculation

## Data sources

| Data | Source |
| --- | --- |
| Quran text (Uthmani) | [api.quran.com](https://api.quran.com) / [Tanzil](https://tanzil.net) |
| English translation | Saheeh International (via api.quran.com) |
| Verse-synced audio + timestamps | [api.quran.com](https://api.quran.com) chapter recitations, per-ayah audio from verses.quran.com |
| Full-chapter recitations | [mp3quran.net](https://mp3quran.net) |
| Prayer times | [adhan](https://github.com/batoulapps/adhan-js) library, computed locally |

Frequently used surahs (Al-Fatiha, Al-Baqarah, Ar-Ra'd, Al-Kahf, Ya-Sin, Ar-Rahman, Al-Mulk, Ash-Sharh, Al-Ikhlas, Al-Falaq, An-Nas) are bundled in `src/data/quran/` together with their verse timings in `src/data/timings/`. Every other surah is fetched from api.quran.com when you open it.

## Running locally

Requires Node.js 20 or newer.

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:3000
npm run build    # type-check and build for production into dist/
npm run preview  # serve the production build locally
```

## Project structure

```
src/
  App.tsx          app shell, navigation, sheets and dialogs
  store.tsx        global state, translations (en/no/ar/ckb), persistence
  lib/data.ts      data layer: surahs, reciters, text and timing loaders
  lib/audio.ts     audio engine (verse-synced and full-chapter playback)
  screens/         Main, Today, Read, Reader, Reciters, Sleep, Search/Profile
  components/      player, chrome (status bar, tab bar, mini-player), ui/
  data/            bundled Quran text, timings, surah/juz/reciter metadata
public/img/        artwork for the Sleep screen and backgrounds
```
