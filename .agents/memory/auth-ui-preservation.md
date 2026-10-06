---
name: Authentication UI preservation
description: Keep the original onboarding visuals when connecting identity APIs.
---

Preserve the original splash, slides and sign-in layout when adding authentication behavior. Do not replace them with a newly designed standalone phone-login screen.

**Why:** The user explicitly corrected the replacement UI and asked for it to be the same as before. They requested email/phone detection, country codes and password/verification fields as extensions of that existing UI, not a redesign.

**How to apply:** Start from the original onboarding presentation. Add only the fields and states necessary for the requested API behavior, while retaining its styling, social-button layout and introductory sequence. Never use an unconnected social button to simulate successful authentication.
