# Cthos

**Advanced, proactive AI assistant for Android** — real-time voice, full device
control, multimodal vision, and multi-persona conversation.

Built with **React Native (Expo SDK 57)** + modular native-bridge architecture.

> **Status: STEP 5 complete — full build: voice loop, Gemini brain, device
> automation, Macro Studio, persistence & release checklist.**
> See `BUILD_CHECKLIST.md` before shipping.

### Gemini Live brain

`src/services/ai/geminiLive.ts` registers a persona-aware Gemini
(`gemini-2.5-flash`) reply provider into the voice loop, so spoken turns get
real model replies grounded by the active persona prompt + detected tone.
The API key ("AQ"-prefixed) is stored encrypted via `expo-secure-store` —
enter it in **Settings → Cloud & API keys** (`GeminiKeyCard`) or provide it at
build time as `EXPO_PUBLIC_GEMINI_API_KEY`.

### Device automation & sub-agents (STEP 4)

Spoken commands now execute on-device before falling back to conversation:

- **commandRouter** — the voice reply pipeline is
  `commandRouter → geminiReplyProvider`. Routine triggers win first, then
  deterministic EN/HI intents (`open whatsapp`, `dnd bandh karo`, `scroll down`,
  `play spotify`, `send message`, `unread`), then Gemini chat.
- **subAgentWorker** — priority queue with bounded concurrency, per-kind
  handler registry (`automation/macro/music/whatsapp`), job lifecycle events,
  failure history for dashboards.
- **accessibilityBridge** — single dispatcher for `tap/type/scroll/toggle/
  openApp`. Deep-link app opening works today in Expo Go; gesture & system
  toggles activate with the `CthosAccessibility` native module (EAS dev client)
  and degrade gracefully (clear reason, no crash) until then.
- **Macro Studio** — record routines from quick-step chips, save with a name,
  trigger by voice or play/delete from the list. Playback runs through the
  sub-agent queue so it never blocks the live conversation thread.

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
/scripts   flow_audit.py — static full-flow wiring audit (no Node needed)
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
                   Step 4: Macro (Macro Studio); Vision stays STEP 5
  services/
    ai/
      agentOrchestrator    intent routing + persona-switch detection (EN/HI)
      personalityManager   GF / Professional / Venom + TTS options + shaping
      toneEngine           emotional tone matching (EN + Hindi cues)
      aiKeyStore           Gemini API key mgmt (expo-secure-store, "AQ" prefix)
      geminiLive           Gemini brain: persona/tone-grounded ReplyProvider
      commandRouter        automation-first router -> Gemini chat fallback
      subAgentWorker       concurrent priority queue + handler registry (STEP 4)
    voice/
      languageManager      EN/HI locale + detection (Devanagari)
      sttEngine            expo-speech-recognition wrapper (EN/HI, interim/final)
      ttsEngine            expo-speech wrapper, persona-aware pitch/rate
      audioStreamer        VoiceSession: full-duplex loop + barge-in
    vision/        screenCapture, cameraVision (STEP 5)
    automation/    accessibilityBridge (+types), commandParser, macroRecorder (STEP 4)
    integrations/  whatsappService (deep-link send today; gestures w/ dev client)
  store/
    userState        persona (synced to PersonalityManager) + voice flags
    conversationState voice session <-> UI wiring + turn history

## Voice dependencies (SDK 57)
- `expo-speech` (~57.0.1) — TTS
- `expo-audio` (~57.0.4) — recording/playback (background recording)
- `expo-speech-recognition` (~56.0.1) — STT (`npx expo install --fix` to align)
- `expo-secure-store` (~57.0.1) — encrypted Gemini API key storage
- `@google/genai` (^2.19.0) — Gemini brain (persona-grounded replies)

## Roadmap

- STEP 1 ✅ Project init, navigation, eas.json, CI, service scaffolding
- STEP 2 ✅ UI Design System (navy/glass) + Loading / Dashboard / Sidebar / Settings
- STEP 3 ✅ Voice & Personality Engine — STT/TTS, EN/HI, personas, tone, barge-in
- STEP 4 ✅ Device Automation & Sub-Agent Framework — command router, worker
  queue, automation bridge, Macro Studio, WhatsApp deep-link bridge
- STEP 5 ✅ Wiring & release — text-input pipeline, live engine status,
  conversation + persona persistence (secure store), `scripts/flow_audit.py`
  full-flow verification, `BUILD_CHECKLIST.md`
