---
name: Financial linking boundary
description: Product boundary between local financial references and actual bank or payment connections.
---

Treat manually saved accounts, cards and wallets as locally stored references only. Do not imply that balances sync, cards can be charged, or a bank has granted consent. Open Banking instructions may describe the expected provider-to-bank flow, but a successful link must not be simulated without a regulated provider integration and a bank-hosted authorization callback.

**Why:** A credible financial UI can mislead users about consent, data access, or payment capability; storing full card numbers, CVV, bank credentials, or one-time codes locally also creates unnecessary risk.

**How to apply:** Keep consent and connection status accurate, never collect sensitive bank login details in app forms, and show an unavailable state until a real integration and user consent are implemented.