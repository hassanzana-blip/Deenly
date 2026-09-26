# DeenDunya

Quran reader & listener app: 31 reciters, verse-synced audio, prayer times, and 4 languages with true RTL (Norwegian, English, Arabic, Sorani).

## Features

- **Quran reader** – full Uthmani text for all 114 surahs, with Saheeh International English translation and transliteration. Browse by surah, juz or sajda verse, and bookmark any ayah.
- **31 reciters** – including Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Mahmoud Khalil Al-Hussary and Saad El Ghamidi. Follow reciters, favourite tracks and queue downloads.
- **Verse-synced audio** – for supported reciters, the reader highlights the current ayah and scrolls with it using per-verse timestamps. If a chapter file can't load, playback falls back to chaining single ayahs.
- **Full player** – play/pause, seek, playback speed, repeat (one / all), shuffle, and a mini-player that stays visible across screens.
- **Prayer times** – daily times computed on the device with the `adhan` library (Muslim World League method), plus the Hijri date and upcoming Islamic events.
- **Today** – verse and hadith of the day, and a daily reading streak.
- **Sleep** – bedtime recitations with a full-screen ambient scene (rain, fire, waves, birds).
- **4 languages with true RTL** – Norwegian (default), English, Arabic and Sorani Kurdish. Arabic and Sorani switch the whole layout to right-to-left.
- **Offline downloads** (iOS app) – download surahs for a reciter and play them without a connection, with verse sync.
- **Background playback** (iOS app) – keeps playing with the screen locked, with lock-screen and Control Center controls.
- **Light / dark / system theme**. Preferences, bookmarks and downloads are saved on the device.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/), styled with [Tailwind CSS 3](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) for transitions, [lucide-react](https://lucide.dev/) icons
- [adhan](https://github.com/batoulapps/adhan-js) for prayer time calculation
- **iOS app:** [Expo SDK 57](https://expo.dev/) (React Native 0.86). The UI runs as an Expo [DOM component](https://docs.expo.dev/guides/dom-components/); audio, location, sharing and downloads are native (`expo-audio`, `expo-location`, `expo-file-system`)
- **Web preview:** [Vite 7](https://vite.dev/), shown in a phone frame on desktop

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
npm run dev      # web preview at http://localhost:3000
npm run build    # type-check and build the web version into dist/
npm run lint     # ESLint
```

## iOS app

### Try it on your iPhone (no Mac needed)

1. Install **Expo Go** from the App Store.
2. Run `npx expo start` and scan the QR code with the iPhone camera.

Expo Go is good for trying the app out. Background playback and lock-screen controls are only guaranteed in a real build (below).

### Build in the iOS Simulator (Mac with Xcode 16.1+)

```bash
npx expo run:ios              # generates ios/, builds and launches the simulator
```

`ios/` is generated from `app.json` (Continuous Native Generation), so it is not committed. Change native settings in `app.json`, not in Xcode.

### Continuous integration

`.github/workflows/ios.yml` runs on every push. It runs the typecheck, lint and web build, then builds the iOS app in Release mode on a macOS runner, launches it in the iPhone Simulator and attaches screenshots to the run (the **ios-simulator** artifact).

### Release to the App Store (TestFlight)

Builds are signed and uploaded with [EAS](https://expo.dev/eas), so you don't need a Mac. You need an [Apple Developer account](https://developer.apple.com/programs/) ($99/year) and a free [Expo account](https://expo.dev/signup).

1. `npx eas-cli login`, then `npx eas-cli init` (links the project to your Expo account)
2. `npx eas-cli build --platform ios --profile production`: the first time, EAS asks for your Apple ID and creates the certificates and provisioning profile for you
3. `npx eas-cli submit --platform ios`: uploads the build to App Store Connect/TestFlight

To release from GitHub instead, create a token at expo.dev → Account settings → Access tokens and add it as the `EXPO_TOKEN` repository secret. Then run **iOS release (EAS → TestFlight)** from the Actions tab.

The bundle identifier is `com.hassanzana.deendunya` (in `app.json`). It can't be changed after the first App Store upload.

### How the iOS app is put together

```
index.ts               Expo entry
native/App.tsx         native host: safe area, status bar, splash, location, share, browser
native/player.ts       runs the audio engine on expo-audio; lock screen; live radio
native/audioBackend.ts expo-audio implementation of the engine's audio interface
native/downloads.ts    offline surah downloads (expo-file-system)
src/dom/DomRoot.tsx    'use dom' entry: renders the React UI and bridges to native
src/lib/platform.ts    device services the UI uses (browser implementations on the web)
```

The audio engine (`src/lib/audio.ts`) is shared. On the web it plays through an `<audio>` element. In the app it runs in the native JavaScript runtime, so recitation, ayah-by-ayah playback and moving on to the next surah keep working with the screen locked. The UI controls it through a thin proxy.

## Project structure

```
src/
  App.tsx          app shell, navigation, sheets and dialogs
  store.tsx        global state, translations (en/no/ar/ckb), persistence
  lib/data.ts      data layer: surahs, reciters, text and timing loaders
  lib/audio.ts     audio engine (verse-synced and full-chapter playback)
  lib/platform.ts  device services (location, share, radio, downloads)
  dom/DomRoot.tsx  entry used by the iOS app
  screens/         Main, Today, Read, Reader, Reciters, Sleep, Search/Profile
  components/      player, chrome (status bar, tab bar, mini-player), shared bits
  assets/img/       artwork for the Sleep and Today screens
  data/            bundled Quran text, timings, surah/juz/reciter metadata
assets/            app icon and splash image
```
