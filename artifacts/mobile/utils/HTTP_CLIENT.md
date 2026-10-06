# Axios client

Use `httpClient` from `@/utils/httpClient` for future HTTP endpoints.
Its current base URL is the deliberately non-routable `https://api.example.invalid`.
Replace `HTTP_BASE_URL` before making real requests. Existing generated AI API
calls remain unchanged and do not use this placeholder.

Every request sets `Content-Type: application/json`, reads the user's persisted
language (`ar` or `en`, otherwise the device preference), and reads the latest
AsyncStorage token. When a token exists, it sets `Authorization: Bearer <token>`.
When no token exists, it removes the Authorization header.

After a real login, call `await setAuthToken(accessToken)` from `@/storage/authToken`.
The helper accepts a raw token or strips a supplied `Bearer ` prefix.
Call `await clearAuthToken()` on logout. Read with `await getAuthToken()`.
Do not pass a user profile ID or dummy value
as an access token. No authentication/login endpoint is added by this change.

The response interceptor returns the full Axios response and rejects failures
unchanged. Handle `response.data` and HTTP errors at the call site. There are no
automatic retries, token refreshes, or forced redirects.

AsyncStorage works with the current Expo Go and web setup without a custom
native storage module. All token helpers are asynchronous; await a save or
clear operation before sending requests that depend on it. Storage failures
reject the operation rather than silently sending an unauthenticated request.

AsyncStorage is not encrypted. Before storing production credentials, decide
on an appropriate secure-storage and web session-security strategy. Never log
tokens or entire request configurations.
