# Cthos

**Advanced, proactive AI assistant for Android** — real-time voice, full device
control, multimodal vision, and multi-persona conversation.

Built with **React Native (Expo SDK 57)** + modular native-bridge architecture.

> **Status: STEP 1 (Project Initialization) complete.**
> Next: STEP 2 — UI Design System & the 4 primary screens.

---

## Stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Framework    | Expo SDK 57 (React Native 0.86, React 19.2.3)     |
| Language     | TypeScript (strict)                                |
| Navigation   | React Navigation v7 (native-stack + drawer)       |
| State        | Zustand                                            |
| Animation    | React Native Reanimated 4.5 / Gesture Handler    |
| Build/CI     | EAS Build + GitHub Actions                        |

## Getting Started

> Requires **Node.js ≥ 22.13** (`nvm use`), an Android device/emulator, and an
> Expo account for EAS.

```bash
nvm use            # picks 22.13.0 from .nvmrc
npm install         # installs lockfile deps
npx expo install --fix   # align expo & native deps to SDK 57
npx expo start      # dev server (Expo Go / dev client)
npm run android
```

Set your EAS project id in `app.json` (`extra.eas.projectId` &
`updates.url`) and run `eas init` once linked.

### Builds (EAS)

```bash
npm run eas-build:dev      # development client (APK)
npm run eas-build:preview  # internal preview (APK)
npm run eas-build:prod     # production (AAB)
```

`eas.json` profiles: `development` (APK, dev client), `preview` (APK),
`production` (AAB, auto-increment).

## CI/CD

`.github/workflows/eas-build.yml` runs on push to `main` (+ manual dispatch):

1. Checkout, Node 22 setup with npm cache
2. `npm ci`
3. `npx expo-doctor` health check
4. `expo/expo-github-action@v8` (EAS auth)
5. `eas build --platform android --profile production --non-interactive`

Set repo secret **`EXPO_TOKEN`** (EAS account token).

## Source Layout

```
/src
  assets/          icons, sounds, avatar models
  components/      common UI widgets (STEP 2)
  theme/           design tokens (navy/glassmorphism)
  config/          permissions manifest (json)
  navigation/      Stack + Drawer + typed params
  screens/         Loading, Dashboard, Settings, Vision, Macro
  services/
    ai/            agentOrchestrator, personalityManager, subAgentWorker
    voice/         audioStreamer (STT/TTS/call gluer in STEP 3)
    vision/        screenCapture, cameraVision (STEP 3/4)
    automation/    accessibilityBridge, macroRecorder (STEP 4)
    integrations/  whatsappService, spotify (STEP 4)
  store/           userState (Zustand), memoryStore (later)
```

## Roadmap

- STEP 1 ✅ Project init, navigation, eas.json, CI, service scaffolding
- STEP 2 ⏳ UI Design System + 4 primary screens
- STEP 3 — Voice & Personality Engine
- STEP 4 — Device Automation & Sub-Agent Framework
- STEP 5 — Wiring, full flow test, build checklist