---
name: Identity data protection
description: User-required encrypted Redux identity persistence and development-only HTTP boundary.
---

Persist authenticated API user data and session credentials in encrypted Redux Persist. Do not reintroduce plaintext persisted copies of those identity fields in other app state.

**Why:** The user explicitly changed the earlier Zustand/profile-cache arrangement and requested encrypted, persistent Redux user data. Device storage encryption does not protect network traffic.

**How to apply:** React Query may still handle network requests and transient cache, but the persistent identity snapshot must be encrypted. Any UI showing a user's name/email should use the authenticated API identity rather than a sample/default local identity.

Plain HTTP authentication is approved only for development, not production.

**Why:** The user explicitly selected the HTTP development option after being warned that passwords, OTPs and tokens are unencrypted in transit and that HTTPS previews block direct HTTP calls.

**How to apply:** Keep production HTTPS enforcement. A development preview proxy fixes mixed-content restrictions, not upstream transport confidentiality. Obtain actual API contracts rather than guessing paths or putting emails into phone-only APIs.

Email OTP is intended to reuse the mobile OTP APIs, not separate email endpoints. The backend owns the identifier-field change.

**Why:** The user confirmed that the APIs are the same and asked to leave the app unchanged while the backend changes the field.

**How to apply:** Do not invent separate email routes or guess the replacement request field. Integrate the backend-confirmed identifier contract when client changes are requested.

The identity backend rotates refresh tokens: the previous token is revoked immediately and reuse returns INVALID_REFRESH_TOKEN.

**Why:** The owner-provided refresh documentation explicitly confirms single-use rotation, not reusable refresh tokens.

**How to apply:** Coordinate concurrent refresh calls and persist the replacement pair before using it. Do not automatically retry the same refresh request after an ambiguous network failure; the backend may already have consumed the token.
