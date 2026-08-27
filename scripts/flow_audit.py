#!/usr/bin/env python3
"""
Cthos full-flow audit (STEP 5).

Static verification of the complete wiring graph — runs anywhere (no Node needed):

  A. Every relative import in src/ resolves to a real file (catches broken
     module graphs that tsc would flag with TS2307).
  B. Key end-to-end wiring assertions across the pipeline:
       App boot -> initVoice -> router -> worker handlers -> bridge/UI screens.
  C. Structural sanity: balanced braces on every checked source file.

Exit code 0 = all green; nonzero = list of failures printed.
"""
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src")
SRC = os.path.abspath(ROOT)

EXTS = ("", ".ts", ".tsx", ".js", ".jsx", ".json")

failures = []
checked_imports = 0


def rel_resolve(base_dir, spec):
    target = os.path.normpath(os.path.join(base_dir, spec))
    for ext in EXTS:
        candidate = target + ext
        if os.path.isfile(candidate):
            return True
    # directory index (rare here but cheap to check)
    for ext in ("/index.ts", "/index.tsx"):
        if os.path.isfile(target + ext):
            return True
    return False


def check_imports():
    global checked_imports
    imp_re = re.compile(
        r"""(?:from|import\()\s*['"](\.[^'"]+)['"]""", re.S
    )
    for dirpath, _dirs, files in os.walk(SRC):
        for name in files:
            if not name.endswith((".ts", ".tsx")):
                continue
            path = os.path.join(dirpath, name)
            text = open(path, encoding="utf-8").read()
            for m in imp_re.finditer(text):
                spec = m.group(1)
                checked_imports += 1
                if not rel_resolve(dirpath, spec):
                    failures.append(
                        f"IMPORT-RESOLVE {os.path.relpath(path, SRC)} -> {spec}"
                    )


def must_contain(rel_path, pattern, label):
    path = os.path.join(SRC, rel_path)
    try:
        text = open(path, encoding="utf-8").read()
    except OSError:
        failures.append(f"WIRE missing file: {rel_path}")
        return
    if re.search(pattern, text, re.S):
        print(f"  ok: {label}")
    else:
        failures.append(f"WIRE {rel_path} lacks {label}")


WIRING_CHECKS = [
    (
        "../App.tsx",
        r"installGlobalErrorTrap\(\)",
        "global JS error trap installed at boot",
    ),
    (
        "../App.tsx",
        r"\(\) => initVoice\(\)",
        "App boots call initVoice()",
    ),
    (
        "../App.tsx",
        r"<ErrorBoundary>",
        "App root wrapped in ErrorBoundary",
    ),
    (
        "components/ErrorBoundary.tsx",
        r"getDerivedStateFromError",
        "boundary catches render errors",
    ),
    (
        "services/voice/sttEngine.ts",
        r"probeNativeModule",
        "STT degrades gracefully without native module",
    ),
    (
        "services/voice/ttsEngine.ts",
        r"moduleAvailable",
        "TTS no-ops safely when native speech is missing",
    ),
    (
        "services/voice/audioStreamer.ts",
        r"\.catch\(\(\) => \{",
        "turn queue immune to single-turn rejection poisoning",
    ),
    (
        "services/ai/subAgentWorker.ts",
        r"jobTimeoutMs",
        "worker frees slots of hung jobs via watchdog",
    ),
    (
        "../App.tsx",
        r"hydratePersona\(\)",
        "App boots restore persisted persona",
    ),
    (
        "store/conversationState.ts",
        r"registerSubAgentHandlers\(\)",
        "initVoice registers STEP 4 worker handlers",
    ),
    (
        "store/conversationState.ts",
        r"commandRouter\.setFallback\(geminiReplyProvider\)",
        "Gemini brain chained as router fallback",
    ),
    (
        "store/conversationState.ts",
        r"audioStreamer\.setReplyProvider\(commandRouter\.handleUtterance\)",
        "voice session routes through commandRouter",
    ),
    (
        "store/conversationState.ts",
        r"hydrateConversation\(\)",
        "conversation history hydration at boot",
    ),
    (
        "store/conversationState.ts",
        r"export async function submitText",
        "typed-input pipeline export",
    ),
    (
        "store/conversationState.ts",
        r"commandRouter\.handleUtterance\(utterance\)",
        "submitText uses same router pipeline as voice",
    ),
    (
        "store/userState.ts",
        r"SecureStore\.setItemAsync\(PERSONA_KEY",
        "persona changes persist to secure store",
    ),
    (
        "services/ai/commandRouter.ts",
        r"subAgentWorker\.register\('automation'",
        "automation handler registered",
    ),
    (
        "services/ai/commandRouter.ts",
        r"subAgentWorker\.register\('macro'",
        "macro handler registered",
    ),
    (
        "services/ai/commandRouter.ts",
        r"subAgentWorker\.register\('music'",
        "music handler registered",
    ),
    (
        "services/ai/commandRouter.ts",
        r"subAgentWorker\.register\('whatsapp'",
        "whatsapp handler registered",
    ),
    (
        "services/ai/subAgentWorker.ts",
        r"handler\.execute\(job\)",
        "worker invokes registered handlers",
    ),
    (
        "screens/DashboardScreen.tsx",
        r"onPress=\{sendDraft\}",
        "Dashboard send button wired",
    ),
    (
        "screens/DashboardScreen.tsx",
        r"onSubmitEditing=\{sendDraft\}",
        "Dashboard keyboard send wired",
    ),
    (
        "components/MicButton.tsx",
        r"audioStreamer\.start\(\)",
        "MicButton drives voice engine start",
    ),
]


def check_braces():
    # Strip strings AND comments in one alternation pass so braces inside
    # literals ("${x}", "'{'") don't skew the counts.
    strip_re = re.compile(
        r"""'(?:\\.|[^'\\])*'"""
        r'''|"(?:\\.|[^"\\])*"'''
        r"|`(?:\\.|[^`\\])*`"
        r"|//[^\n]*"
        r"|/\*.*?\*/",
        re.S,
    )
    for dirpath, _dirs, files in os.walk(SRC):
        for name in files:
            if not name.endswith((".ts", ".tsx")):
                continue
            path = os.path.join(dirpath, name)
            stripped = strip_re.sub("", open(path, encoding="utf-8").read())
            counts = {c: stripped.count(c) for c in "{}()[]"}
            balanced = (
                counts["{"] == counts["}"]
                and counts["("] == counts[")"]
                and counts["["] == counts["]"]
            )
            if not balanced:
                failures.append(
                    f"BALANCE {os.path.relpath(path, SRC)} mismatch {counts}"
                )


def main():
    print("== A. import resolution ==")
    check_imports()
    print(f"  {checked_imports} relative imports checked")

    print("== B. end-to-end wiring ==")
    for rel, pat, label in WIRING_CHECKS:
        must_contain(rel, pat, label)

    print("== C. structural balance ==")
    check_braces()

    if failures:
        print("\nFAILURES:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("\nAll flow checks passed.")


if __name__ == "__main__":
    main()
