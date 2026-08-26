# Cthos

**Advanced, proactive AI assistant for Android** — real-time voice, full device
control, multimodal vision, and multi-persona conversation.

Built with **React Native (Expo SDK 57)** + modular native-bridge architecture.

> **Status: STEP 3 (Voice & Personality Engine) complete.**
> Next: STEP 4 — Device Automation & Sub-Agent Framework.

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
  theme/           design tokens (navy/glassmorphism palette, spacing, radii)
  components/      UI system:
                     GlassCard, PillButton, SettingsRow, DataWidget
                     GlowingHeart, CthosLogo, AvatarViewport, VoiceVisualizer,
                     MicButton, SidebarDrawer
  config/          permissions manifest (json)
  navigation/      Stack + Drawer (custom sectioned SidebarDrawer)
  screens/         Step 2: Loading, Dashboard, Settings
                   placeholder: Vision, Macro
  services/
    ai/
      agentOrchestrator    intent routing + persona-switch detection (EN/HI)
      personalityManager   GF / Professional / Venom + TTS options + shaping
      toneEngine           emotional tone matching (EN + Hindi cues)
      subAgentWorker       background priority queue (STEP 4)
    voice/
      languageManager      EN/HI locale + detection (Devanagari)
      sttEngine            expo-speech-recognition wrapper (EN/HI, interim/final)
      ttsEngine            expo-speech wrapper, persona-aware pitch/rate
      audioStreamer        VoiceSession: full-duplex loop + barge-in
    vision/        screenCapture, cameraVision (STEP 4)
    automation/    accessibilityBridge, macroRecorder (STEP 4)
    integrations/  whatsappService, spotify (STEP 4)
  store/
    userState        persona (synced to PersonalityManager) + voice flags
    conversationState voice session <-> UI wiring + turn history

## Voice dependencies (SDK 57)
- `expo-speech` (~57.0.1) — TTS
- `expo-audio` (~57.0.4) — recording/playback (background recording)
- `expo-speech-recognition` (~56.0.1) — STT (`npx expo install --fix` to align)

## Roadmap

- STEP 1 ✅ Project init, navigation, eas.json, CI, service scaffolding
- STEP 2 ✅ UI Design System (navy/glass) + Loading / Dashboard / Sidebar / Settings
- STEP 3 ✅ Voice & Personality Engine — STT/TTS, EN/HI, personas, tone, barge-in
- STEP 4 ⏳ Device Automation & Sub-Agent Framework
- STEP 5 — Wiring, full flow test, build checklist