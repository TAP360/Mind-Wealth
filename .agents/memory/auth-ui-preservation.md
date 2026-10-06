---
name: Authentication UI preservation
description: Keep the original onboarding visuals when connecting identity APIs.
---

Preserve the original splash, slides and sign-in layout when adding authentication behavior. Do not replace them with a newly designed standalone phone-login screen.

**Why:** The user explicitly corrected the replacement UI and asked for it to be the same as before. They requested email/phone detection, country codes and password/verification fields as extensions of that existing UI, not a redesign.

**How to apply:** Start from the original onboarding presentation. Add only the fields and states necessary for the requested API behavior, while retaining its styling, social-button layout and introductory sequence. Never use an unconnected social button to simulate successful authentication.

Show only the selected country abbreviation beside the original phone-entry input, not a separate calling-code field. Keep the calling code internal, and let the user continue entering the national number in that same input.

**Why:** The user explicitly clarified that showing the country short name should not also show the country calling code.

**How to apply:** Keep the identifier input mounted when its mode changes or an international prefix is detected. Country selection changes the internally stored calling code; it must not introduce another phone-number input.
