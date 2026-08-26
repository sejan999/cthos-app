/**
 * AiKeyStore — dynamic Gemini API key management.
 *
 * Priority order:
 *   1. expo-secure-store (user-entered key from Settings)
 *   2. .env fallback via Expo inline env (EXPO_PUBLIC_GEMINI_API_KEY)
 *   3. null -> Settings shows a setup prompt
 *
 * Gemini API keys are prefixed "AQ" (your validated prefix) — we enforce that
 * before persisting. Keys are stored encrypted on-device and never logged.
 */
import * as SecureStore from 'expo-secure-store';

export const GEMINI_API_KEY_STORAGE_KEY = 'cthos.gemini.apiKey';
export const GEMINI_API_KEY_PREFIX = 'AQ';

/** Fallback read from Expo inline env (does not touch .env files directly). */
const ENV_FALLBACK =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_GEMINI_API_KEY : undefined;

export type ApiKeySource = 'secure' | 'env' | 'missing';

/** Gemini keys begin with "AQ" by default. Reject blank or malformed keys. */
export function isValidGeminiApiKey(key: string): boolean {
  const trimmed = (key ?? '').trim();
  if (!trimmed) return false;
  if (!trimmed.startsWith(GEMINI_API_KEY_PREFIX)) return false;
  return trimmed.length >= 20; // realistic minimum length for a real key
}

/** Read the key: SecureStore first, then .env fallback. */
export async function getGeminiApiKey(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE_KEY);
    if (stored && isValidGeminiApiKey(stored)) return stored;
  } catch (e) {
    console.warn('[Cthos:KeyStore] secure read failed', e);
  }
  if (ENV_FALLBACK && isValidGeminiApiKey(ENV_FALLBACK)) return ENV_FALLBACK;
  return null;
}

/** Persist a validated key. Throws if the key is invalid or empty. */
export async function saveGeminiApiKey(key: string): Promise<void> {
  const trimmed = (key ?? '').trim();
  if (!isValidGeminiApiKey(trimmed)) {
    throw new Error(
      `Invalid Gemini API key. It must start with "${GEMINI_API_KEY_PREFIX}" and be a valid key.`
    );
  }
  await SecureStore.setItemAsync(GEMINI_API_KEY_STORAGE_KEY, trimmed);
}

/** Remove the stored key. */
export async function deleteGeminiApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(GEMINI_API_KEY_STORAGE_KEY);
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
  prefix: GEMINI_API_KEY_PREFIX,
};