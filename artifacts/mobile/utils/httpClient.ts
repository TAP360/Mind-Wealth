import axios from "axios";
import { Platform } from "react-native";

import { getRequestLanguage } from "@/localization/preferences";
import { getAuthToken } from "@/storage/authToken";
import { useAuthStore, rotateSession } from "@/stores/authStore";
import type { ConsumerTokens } from "@workspace/api-client-react";

// Plain HTTP explicitly approved for development only.
export const IDENTITY_BASE_URL = process.env.EXPO_PUBLIC_IDENTITY_API_URL || "http://72.61.108.231:8080/";
export const HTTP_BASE_URL = Platform.OS === "web" && IDENTITY_BASE_URL.startsWith("http:")
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/identity-dev`
  : IDENTITY_BASE_URL;

export const httpClient = axios.create({
  baseURL: HTTP_BASE_URL,
  timeout: 30_000,
});
// Isolated client avoids recursively intercepting the refresh request itself.
export const refreshClient = axios.create({ baseURL: HTTP_BASE_URL, timeout: 30_000 });
let rotation: Promise<void> | undefined;
function isPublicAuth(url?: string) {
  const path = url?.split("?")[0];
  return path?.startsWith("/v1/identity/consumer/auth/") || path === "/v1/identity/auth/refresh";
}
async function refreshSession(): Promise<void> {
  if (!rotation) {
    const previous = useAuthStore.getState().tokens;
    if (!previous) throw new Error("INVALID_SESSION");
    rotation = (async () => {
      try {
        const response = await refreshClient.post<ConsumerTokens>("/v1/identity/auth/refresh", {
          refreshToken: previous.refreshToken,
        }, { headers: { "Content-Type": "application/json", "Accept-Language": await getRequestLanguage() } });
        await rotateSession(response.data, previous.refreshToken);
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        // Network/5xx failures are retryable. Invalid/revoked tokens are not.
        if (([400, 401, 403].includes(status ?? 0) || (error instanceof Error && error.message === "INVALID_SESSION")) &&
          useAuthStore.getState().tokens?.refreshToken === previous.refreshToken) {
          await useAuthStore.getState().clearSession();
        }
        throw error;
      }
    })();
    void rotation.finally(() => { rotation = undefined; }).catch(() => undefined);
  }
  return rotation;
}

httpClient.interceptors.request.use(
  async (config) => {
    if (typeof __DEV__ !== "undefined" && !__DEV__ && IDENTITY_BASE_URL.startsWith("http:")) {
      throw new Error("IDENTITY_HTTPS_REQUIRED");
    }
    config.headers.set("Content-Type", "application/json");
    config.headers.set("Accept-Language", await getRequestLanguage());

    // Read on each request so a login, token update, or logout takes effect immediately.
    const publicRequest = isPublicAuth(config.url);
    if (!publicRequest && rotation) await rotation;
    let token = publicRequest ? null : await getAuthToken();
    if (!publicRequest && token && useAuthStore.getState().expiresAt <= Date.now() + 30_000) {
      await refreshSession();
      token = await getAuthToken();
    }
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    else config.headers.delete("Authorization");

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config ||
      isPublicAuth(error.config.url)) throw error;
    const config = error.config as typeof error.config & { _identityRetried?: boolean };
    if (config._identityRetried || !useAuthStore.getState().tokens) throw error;
    config._identityRetried = true;
    const sent = config.headers.get("Authorization");
    if (rotation) await rotation;
    const current = await getAuthToken();
    // Another concurrent request may already have rotated this token.
    if (sent === `Bearer ${current}`) await refreshSession();
    if (!useAuthStore.getState().tokens) throw error;
    return httpClient.request(config);
  },
);

export default httpClient;
