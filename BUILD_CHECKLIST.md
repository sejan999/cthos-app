# Cthos Build & Release Checklist

Final STEP 5 verification list. Run `python3 scripts/flow_audit.py` after any
service change — it validates the full wiring graph without needing Node.

## 1. Environment

- [ ] Node.js ≥ 22.13 (`nvm use`; `.nvmrc` is 22.13.0)
- [ ] `npm install` clean, no peer warnings for expo packages
- [ ] `npx expo install --fix` → no SDK-version drift
- [ ] `npm run typecheck` → zero errors
- [ ] `npx expo-doctor` → healthy
- [ ] EAS CLI ≥ 16 (`npm i -g eas-cli`)

## 2. Project config

- [ ] `app.json` → replace BOTH placeholders with your real EAS project id:
      `extra.eas.projectId` **and** `updates.url` (run `eas init`)
- [ ] `android.package` = `com.cthos.app` (change if you forked)
- [ ] Permissions present: RECORD_AUDIO, FOREGROUND_SERVICE(_MICROPHONE),
      WAKE_LOCK, ACCESS_NETWORK_STATE, INTERNET
- [ ] Plugins intact: expo-audio (mic + background recording),
      expo-speech-recognition (speech service package), expo-secure-store,
      expo-splash-screen

## 3. Feature smoke test (Expo Go / dev client)

Voice loop:

- [ ] Loading screen advances to Dashboard (~2.6 s boot animation)
- [ ] Mic button toggles; OS mic permission prompt on first enable
- [ ] Status pill flips: voice ready → listening → thinking… → speaking
- [ ] Barge-in: speaking while Cthos talks interrupts playback mid-sentence

Gemini brain:

- [ ] Settings → Gemini key card accepts an "AQ"-prefixed key; badge turns ON
- [ ] Ask a conversational question via text bar and via voice — persona-shaped reply comes back
- [ ] Remove key → friendly "needs a key" fallback instead of crash/loop break

Automation (STEP 4 pipeline):

- [ ] Text "open whatsapp" → WhatsApp deep-links open + spoken ack
- [ ] Voice "play spotify" / "send message" / "unread" route through worker (no conversation thread block)
- [ ] Macro Studio: add quick-steps while recording, name it, Save — appears in Routines
- [ ] Say the routine's trigger phrase → plays via sub-agent queue
- [ ] Play ▶ / delete buttons work per routine row
- [ ] (Dev client only) gestures/toggles live once CthosAccessibility native module installed;
      Expo Go shows the graceful "needs native module" notice instead of failing

Persistence:

- [ ] Send a few messages → force-kill app → relaunch → last 30 turns restored
- [ ] Persona persists across restarts (hydrated user state)

## 4. Builds (EAS)

```bash
eas build --profile development --platform android   # dev client APK
eas build --profile preview     --platform android   # internal test APK
eas build --profile production  --platform android   # store AAB
```

- [ ] dev client installs, logs in to same expo account, connects to `expo start`
- [ ] preview APK runs the full smoke test above standalone
- [ ] production AAB uploaded via `eas submit` (needs `service-account-key.json`)

## 5. CI

- [ ] Repo secret `EXPO_TOKEN` set
- [ ] Push to `main` triggers `.github/workflows/eas-build.yml`: npm ci → expo-doctor → eas build
