import type { ConsumerTokens } from "@workspace/api-client-react";
import { ensureAuthHydrated, useAuthStore } from "@/stores/authStore";

/** Save the complete verified session, never an access-token-only login. */
export async function setAuthTokens(tokens: ConsumerTokens): Promise<void> {
  await useAuthStore.getState().saveSession(tokens);
}

export async function getAuthToken(): Promise<string | null> {
  await ensureAuthHydrated();
  const state = useAuthStore.getState();
  return state.sessionReady ? state.tokens?.accessToken ?? null : null;
}

export async function clearAuthToken(): Promise<void> {
  await useAuthStore.getState().clearSession();
}
