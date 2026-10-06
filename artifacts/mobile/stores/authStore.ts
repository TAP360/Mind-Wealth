import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { ConsumerTokens, OtpVerificationResult } from "@workspace/api-client-react";

export const AUTH_STORAGE_KEY = "@bassera_auth_session";
let lastWrite: Promise<void> = Promise.resolve();
let hydration: Promise<void> | undefined;
let hydrationError: unknown;
const committedValues = new Map<string, string>();

// Serialize persistence and expose completion to login/logout. Zustand's
// asynchronous persistence must finish before we report a saved session.
const storage: StateStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => {
    lastWrite = lastWrite.catch(() => undefined).then(async () => {
      if (committedValues.get(key) === value) return;
      await AsyncStorage.setItem(key, value);
      committedValues.set(key, value);
    });
    void lastWrite.catch(() => undefined);
    return lastWrite;
  },
  removeItem: (key) => {
    lastWrite = lastWrite.catch(() => undefined).then(async () => {
      await AsyncStorage.removeItem(key);
      committedValues.delete(key);
    });
    void lastWrite.catch(() => undefined);
    return lastWrite;
  },
};

function normalizeToken(value: unknown): string {
  if (typeof value !== "string") throw new Error("INVALID_SESSION");
  const token = value.trim().replace(/^Bearer\s+/i, "");
  if (!token || /\s/.test(token)) throw new Error("INVALID_SESSION");
  return token;
}

export function validateSession(value: ConsumerTokens): ConsumerTokens {
  if (
    !value ||
    typeof value.userId !== "string" || !value.userId.trim() ||
    typeof value.userType !== "string" || !value.userType.trim() ||
    !Number.isFinite(value.expiresIn) || value.expiresIn <= 0
  ) throw new Error("INVALID_SESSION");
  return {
    accessToken: normalizeToken(value.accessToken),
    refreshToken: normalizeToken(value.refreshToken),
    userId: value.userId,
    userType: value.userType,
    expiresIn: value.expiresIn,
  };
}

export function sessionFromVerification(result: OtpVerificationResult): ConsumerTokens {
  if (result?.mfaRequired === true) throw new Error("MFA_REQUIRED");
  if (result?.mfaRequired !== false || !result.tokens) throw new Error("INVALID_SESSION");
  return validateSession(result.tokens);
}

interface AuthState {
  tokens: ConsumerTokens | null;
  sessionReady: boolean;
  saveSession: (tokens: ConsumerTokens) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      sessionReady: false,
      saveSession: async (tokens) => {
        await ensureAuthHydrated();
        const session = validateSession(tokens);
        set({ tokens: session, sessionReady: false });
        try {
          await lastWrite;
          set({ sessionReady: true });
          await lastWrite;
        } catch {
          set({ tokens: null, sessionReady: false });
          await lastWrite.catch(() => undefined);
          throw new Error("SESSION_STORAGE_FAILED");
        }
      },
      clearSession: async () => {
        await ensureAuthHydrated();
        const previous = useAuthStore.getState();
        set({ tokens: null, sessionReady: false });
        try {
          await lastWrite;
          // Remove the access-token-only key used before session persistence.
          await AsyncStorage.removeItem("@bassera_access_token");
        } catch {
          set({ tokens: previous.tokens, sessionReady: previous.sessionReady });
          await lastWrite.catch(() => undefined);
          throw new Error("SESSION_STORAGE_FAILED");
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ tokens: state.tokens }),
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = persisted as { tokens?: ConsumerTokens | null } | undefined;
        const tokens = saved?.tokens ? validateSession(saved.tokens) : null;
        return { ...current, tokens, sessionReady: !!tokens };
      },
      onRehydrateStorage: () => {
        hydrationError = undefined;
        return (_state, error) => { hydrationError = error; };
      },
    },
  ),
);

export function ensureAuthHydrated(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) return Promise.resolve();
  if (!hydration) {
    hydration = Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
      if (hydrationError) {
        hydration = undefined;
        throw new Error("SESSION_STORAGE_FAILED");
      }
    });
  }
  return hydration;
}
