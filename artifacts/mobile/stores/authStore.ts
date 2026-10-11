import AsyncStorage from "@react-native-async-storage/async-storage";
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, type PersistorOptions } from "redux-persist";
import type { ConsumerTokens, ConsumerProfile, OtpVerificationResult } from "@workspace/api-client-react";
import { encryptedStorage } from "@/storage/encryptedStorage";

export const AUTH_STORAGE_KEY = "persist:bassera_identity";
const LEGACY_KEY = "@bassera_auth_session";
interface IdentityState {
  tokens: ConsumerTokens | null;
  profile: ConsumerProfile | null;
  phone: string | null;
  expiresAt: number;
  profileFetchedAt: number;
  sessionReady: boolean;
}
const initialState: IdentityState = {
  tokens: null, profile: null, phone: null, expiresAt: 0, profileFetchedAt: 0, sessionReady: false,
};
let persistenceError: unknown;
let hydrationError: unknown;
const slice = createSlice({
  name: "identity",
  initialState,
  reducers: {
    session(state, action: PayloadAction<{ tokens: ConsumerTokens; phone?: string | null }>) {
      state.tokens = action.payload.tokens; state.profile = null; state.profileFetchedAt = 0;
      state.phone = action.payload.phone ?? null;
      state.expiresAt = Date.now() + action.payload.tokens.expiresIn * 1000; state.sessionReady = false;
    },
    profile(state, action: PayloadAction<ConsumerProfile>) {
      state.profile = action.payload; state.profileFetchedAt = Date.now();
    },
    rotate(state, action: PayloadAction<ConsumerTokens>) {
      state.tokens = action.payload;
      state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
    },
    ready(state, action: PayloadAction<boolean>) { state.sessionReady = action.payload; },
    clear: () => ({ ...initialState }),
  },
});
const reducer = persistReducer({
  key: "bassera_identity", version: 2,
  storage: {
    ...encryptedStorage,
    async setItem(key: string, value: string) {
      if (hydrationError) throw new Error("SESSION_STORAGE_FAILED");
      return encryptedStorage.setItem(key, value);
    },
    async getItem(key: string) {
      try { return await encryptedStorage.getItem(key); }
      catch (error) { hydrationError = error; throw error; }
    },
  },
  whitelist: ["tokens", "profile", "phone", "expiresAt", "profileFetchedAt"],
  writeFailHandler: (error: unknown) => { persistenceError = error; },
}, slice.reducer);
export const identityStore = configureStore({
  reducer,
  devTools: false,
  middleware: (getDefault) => getDefault({
    serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
  }),
});
// redux-persist supports manualPersist at runtime but omits it from its public types.
const persistOptions: PersistorOptions & { manualPersist: boolean } = { manualPersist: true };
export const identityPersistor = persistStore(identityStore, persistOptions);
let hydration: Promise<void> | undefined;
let bootstrapped = false;
let operations = Promise.resolve();

function normalizeToken(value: unknown): string {
  if (typeof value !== "string") throw new Error("INVALID_SESSION");
  const token = value.trim().replace(/^Bearer\s+/i, "");
  if (!token || /\s/.test(token)) throw new Error("INVALID_SESSION");
  return token;
}
export function validateSession(value: ConsumerTokens): ConsumerTokens {
  if (!value || typeof value.userId !== "string" || !value.userId.trim() ||
    typeof value.userType !== "string" || !value.userType.trim() ||
    !Number.isFinite(value.expiresIn) || value.expiresIn <= 0) throw new Error("INVALID_SESSION");
  return {
    accessToken: normalizeToken(value.accessToken), refreshToken: normalizeToken(value.refreshToken),
    userId: value.userId, userType: value.userType, expiresIn: value.expiresIn,
  };
}
export function sessionFromVerification(result: OtpVerificationResult): ConsumerTokens {
  if (result?.mfaRequired === true) throw new Error("MFA_REQUIRED");
  if (result?.mfaRequired !== false || !result.tokens) throw new Error("INVALID_SESSION");
  return validateSession(result.tokens);
}
async function flush() {
  await identityPersistor.flush();
  if (persistenceError) throw new Error("SESSION_STORAGE_FAILED");
}
export function ensureAuthHydrated(): Promise<void> {
  if (bootstrapped) return Promise.resolve();
  if (!hydration) {
    hydration = (async () => {
      if (identityPersistor.getState().bootstrapped && hydrationError) {
        const raw = await encryptedStorage.getItem(AUTH_STORAGE_KEY);
        const serialized = raw ? JSON.parse(raw) : {};
        const payload: Partial<IdentityState> = {};
        for (const key of ["tokens", "profile", "phone", "expiresAt", "profileFetchedAt"] as const) {
          if (serialized[key] !== undefined) (payload as Record<string, unknown>)[key] = JSON.parse(serialized[key]);
        }
        if (payload.tokens) validateSession(payload.tokens);
        if (payload.profile && payload.profile.id !== payload.tokens?.userId) throw new Error("INVALID_PROFILE");
        hydrationError = undefined;
        persistenceError = undefined;
        identityStore.dispatch({ type: REHYDRATE, key: "bassera_identity", payload });
      } else {
        hydrationError = undefined;
        identityPersistor.persist();
        if (!identityPersistor.getState().bootstrapped) await new Promise<void>((resolve) => {
          const unsubscribe = identityPersistor.subscribe(() => {
            if (identityPersistor.getState().bootstrapped) { unsubscribe(); resolve(); }
          });
        });
      }
      if (hydrationError) throw new Error("SESSION_STORAGE_FAILED");
      const state = identityStore.getState();
      if (state.tokens) {
        validateSession(state.tokens);
        if (state.profile && state.profile.id !== state.tokens.userId) throw new Error("INVALID_PROFILE");
      } else {
        const legacy = await AsyncStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (parsed.state?.tokens) {
            identityStore.dispatch(slice.actions.session({ tokens: validateSession(parsed.state.tokens) }));
            persistenceError = undefined;
            await flush();
          }
          await AsyncStorage.removeItem(LEGACY_KEY);
        }
      }
      // Covers a crash after the encrypted write but before legacy cleanup.
      persistenceError = undefined;
      await flush();
      await AsyncStorage.removeItem(LEGACY_KEY);
      await AsyncStorage.removeItem("@bassera_access_token");
      bootstrapped = true;
      identityStore.dispatch(slice.actions.ready(!!identityStore.getState().tokens));
    })();
    void hydration.catch(() => { hydration = undefined; });
  }
  return hydration;
}
function serialize(action: () => Promise<void>): Promise<void> {
  const operation = operations.catch(() => undefined).then(action);
  operations = operation;
  void operation.catch(() => undefined);
  return operation;
}
async function saveSession(raw: ConsumerTokens, phone?: string): Promise<void> {
  await ensureAuthHydrated();
  const tokens = validateSession(raw);
  return serialize(async () => {
    persistenceError = undefined;
    identityStore.dispatch(slice.actions.session({ tokens, phone }));
    try {
      await flush();
      identityStore.dispatch(slice.actions.ready(true));
    } catch {
      identityStore.dispatch(slice.actions.clear());
      await identityPersistor.flush();
      throw new Error("SESSION_STORAGE_FAILED");
    }
  });
}
export async function saveConsumerProfile(profile: ConsumerProfile): Promise<void> {
  await ensureAuthHydrated();
  return serialize(async () => {
    if (!profile || profile.id !== identityStore.getState().tokens?.userId) throw new Error("INVALID_PROFILE");
    persistenceError = undefined;
    identityStore.dispatch(slice.actions.profile(profile));
    await flush();
  });
}
export async function rotateSession(raw: ConsumerTokens, previousRefreshToken: string): Promise<void> {
  const tokens = validateSession(raw);
  return serialize(async () => {
    const current = identityStore.getState().tokens;
    if (!current || current.refreshToken !== previousRefreshToken || current.userId !== tokens.userId) {
      throw new Error("INVALID_SESSION");
    }
    persistenceError = undefined;
    identityStore.dispatch(slice.actions.rotate(tokens));
    try { await flush(); }
    catch {
      // The server revoked the old refresh token; never roll back to it.
      identityStore.dispatch(slice.actions.clear());
      await identityPersistor.flush();
      throw new Error("SESSION_STORAGE_FAILED");
    }
  });
}
async function clearSession(): Promise<void> {
  await ensureAuthHydrated();
  return serialize(async () => {
    const previous = identityStore.getState();
    persistenceError = undefined;
    identityStore.dispatch(slice.actions.clear());
    try { await flush(); await AsyncStorage.removeItem(LEGACY_KEY); }
    catch {
      // Retain the previous in-memory session if durable logout failed.
      if (previous.tokens) {
        identityStore.dispatch(slice.actions.session({ tokens: previous.tokens, phone: previous.phone }));
        if (previous.profile) identityStore.dispatch(slice.actions.profile(previous.profile));
        identityStore.dispatch(slice.actions.ready(previous.sessionReady));
      }
      throw new Error("SESSION_STORAGE_FAILED");
    }
  });
}
function getState() { return { ...identityStore.getState(), saveSession, clearSession }; }
// Compatibility facade for existing callers; all state is now Redux, not Zustand.
export const useAuthStore = Object.assign(
  <T>(selector: (state: ReturnType<typeof getState>) => T): T =>
    useSelector(() => selector(getState())),
  { getState },
);
