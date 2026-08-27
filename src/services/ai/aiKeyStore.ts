/**
 * AiKeyStore — dynamic Gemini API key management.
 *
 * Priority order:
 *   1. expo-secure-store (user-entered key from Settings)
 *   2. .env fallback via Expo inline env (EXPO_PUBLIC_GEMINI_API_KEY)
 *   3. null -> Settings shows a setup prompt
 *
 * FIX (deep-fix pass): real Google Gemini API keys issued from AI Studio are
 * prefixed "AIza…" — the previous build required an "AQ" prefix and therefore
 * rejected EVERY valid key ("accepts input visually but the key is useless").
 * We now accept both spellings:
 *   - standard keys : AIzaSy… (39 chars)
 *   - some legacy/lab keys / other Google-flavoured tokens beginning "AQ"
 * Keys are stored encrypted on-device and never logged.
 */
import * as SecureStore from 'expo-secure-store';

export const GEMINI_API_KEY_STORAGE_KEY = 'cthos.gemini.apiKey';
/** Accepted key prefixes (standard Studio keys first). */
export const GEMINI_API_KEY_PREFIXES = ['AIza', 'AQ'] as const;

/** Fallback read from Expo inline env (does not touch .env files directly). */
const ENV_FALLBACK =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_GEMINI_API_KEY : undefined;

export type ApiKeySource = 'secure' | 'env' | 'missing';

/** Accept any realistic Gemini key: AIza… (standard) or AQ… (legacy/lab). */
export function isValidGeminiApiKey(key: string): boolean {
  const trimmed = (key ?? '').trim();
  if (!trimmed) return false;
  // Strip the common "Bearer "/"key=" wrappers people paste by accident.
  const cleaned = trimmed.replace(/^(bearer|key)\s+/i, '').trim();
  const okPrefix = GEMINI_API_KEY_PREFIXES.some((p) => cleaned.startsWith(p));
  return okPrefix && cleaned.length >= 20;
}

/** Normalise wrapper junk out of a pasted key before storing it. */
function cleanKey(key: string): string {
  return (key ?? '').replace(/^(bearer|key)\s+/i, '').trim();
}


/** Read the key: SecureStore first, then .env fallback. */
export async function getGeminiApiKey(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE_KEY);
    if (stored) {
      const cleaned = cleanKey(stored);
      if (isValidGeminiApiKey(cleaned)) return cleaned;
    }
  } catch (e) {
    console.warn('[Cthos:KeyStore] secure read failed', e);
  }
  if (ENV_FALLBACK && isValidGeminiApiKey(ENV_FALLBACK)) return cleanKey(ENV_FALLBACK);
  return null;
}

/** Persist a validated key. Throws if the key is invalid or empty. */
export async function saveGeminiApiKey(key: string): Promise<void> {
  const cleaned = cleanKey(key ?? '');
  if (!isValidGeminiApiKey(cleaned)) {
    throw new Error(
      'Invalid Gemini API key. Standard keys start with "AIza" — copy the full key from Google AI Studio.'
    );
  }
  await SecureStore.setItemAsync(GEMINI_API_KEY_STORAGE_KEY, cleaned);
}


/** Remove the stored key. Never rejects on engines that error when absent. */
export async function deleteGeminiApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(GEMINI_API_KEY_STORAGE_KEY);
  } catch (e) {
    console.warn('[Cthos:KeyStore] secure delete failed', e);
  }
}


/** Determine where the active key currently comes from (for Settings UI). */
export async function getApiKeySource(): Promise<ApiKeySource> {
  try {
    const stored = await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE_KEY);
    if (stored) return 'secure';
  } catch {
    /* ignore */
  }
  if (ENV_FALLBACK && isValidGeminiApiKey(ENV_FALLBACK)) return 'env';
  return 'missing';
}

export const apiKeyStore = {
  get: getGeminiApiKey,
  save: saveGeminiApiKey,
  delete: deleteGeminiApiKey,
  validate: isValidGeminiApiKey,
  source: getApiKeySource,
  prefixes: GEMINI_API_KEY_PREFIXES,
};
