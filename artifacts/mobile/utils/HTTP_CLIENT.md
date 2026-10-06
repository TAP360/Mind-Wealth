# Mobile identity login

The mobile app uses the existing Axios client in `utils/httpClient.ts` for
the external consumer identity service. Its owner-supplied test base URL is
`https://DymmyTest.com` (corrected from a missing slash); it is not a verified
live authentication service. Override it with `EXPO_PUBLIC_IDENTITY_API_URL`
when connecting the real backend. `EXPO_PUBLIC_IDENTITY_BUSINESS_CODE` defaults
to the documented `NW-EG`. Restart/rebuild Expo after changing these values.
These settings are public configuration, not credentials.

## Flow

1. POST `/v1/identity/consumer/auth/phone/validate` with `{ countryCode, phone }`.
   Only a `valid: true` response with a canonical `e164` number continues.
2. POST `/v1/identity/consumer/auth/otp/request` with `{ businessCode, phone, language }`.
   Resend uses this same endpoint. The UI honors server `expiresIn` and
   `resendAfter`, and never pre-fills or generates an OTP.
3. POST `/v1/identity/consumer/auth/otp/verify` with `{ businessCode, phone, otp }`.
4. A non-MFA response with a complete session saves both access and refresh
   tokens to the Zustand store in `stores/authStore.ts`, persisted with
   AsyncStorage. Persistence is awaited before profile loading is enabled.
5. GET `/v1/identity/consumer/me` with the saved Bearer access token.
   The profile is cached in React Query under
   `["identity", "consumer", "me", userId]`. It is not copied into token storage.
6. Protected routes open only after the profile loads successfully. Restoring
   a persisted session fetches `/me` again; a failure offers retry/sign-out.

The supplied last screenshot was a PUT profile-update endpoint; the owner
confirmed the same path for fetching the profile. Only GET is implemented
here, not profile updates.

## Client and session helpers

Every request sets `Content-Type: application/json` and `Accept-Language`
(`ar` or `en`) from the saved language/device preference. The public auth
endpoints never receive an old Bearer token. Other requests read the hydrated,
current Zustand session before setting Authorization. Existing generated AI
API calls keep their separate working base URL.

The endpoint contracts live in `lib/api-spec/identity.openapi.yaml`; the
generated React Query hooks use an injected Axios transport, separate from
the generated AI service. Regenerate with
`pnpm --filter @workspace/api-spec run codegen`.

Use `await setAuthTokens(completeTokens)` from `@/storage/authToken` or
`await useAuthStore.getState().saveSession(completeTokens)` only after real OTP
verification. `await getAuthToken()` waits for hydration.
Use `logoutSession(queryClient)` to cancel and remove identity profile queries
and clear both tokens. The Profile screen preserves its existing behavior
of also clearing local financial data; its confirmation explicitly warns of
this. `clearAuthToken()` only clears the token session.

Response errors are rejected unchanged by the Axios interceptor. UI errors
are localized and do not print server messages, tokens, or request configs.
Storage failures reject rather than silently claiming a session was saved.
Invalid/expired/exhausted codes, rate limits, and profile loading errors have
explicit UI states.

## Backend and security boundaries

The supplied documentation says OTP delivery currently writes to backend D1
logs until an SMS sender is configured. Requesting a code is not proof that
an SMS was delivered. Development test codes remain a backend behavior;
the client does not bypass verification.

MFA-required accounts remain signed out, with an explanatory message.
No MFA challenge or refresh-token endpoint was provided. Refresh tokens are
persisted but automatic token refresh is not fabricated.

AsyncStorage supports the current Expo Go setup, but is unencrypted.
Choose appropriate production token protection and web session security
before storing real production credentials. Never log tokens or full
Axios errors/configurations.
