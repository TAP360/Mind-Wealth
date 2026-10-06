import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@bassera_access_token";

/** Store the raw access token, not an Authorization header. Never log this value. */
export async function setAuthToken(token: string): Promise<void> {
  const normalized = token.trim().replace(/^Bearer\s+/i, "");
  if (!normalized || /\s/.test(normalized)) {
    throw new Error("An access token must be a non-empty value without whitespace.");
  }
  await AsyncStorage.setItem(TOKEN_KEY, normalized);
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
