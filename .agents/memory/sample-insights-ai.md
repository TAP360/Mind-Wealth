---
name: AI explanations of sample insights
description: Honesty boundary for AI explanations of illustrative financial nudges and anomalies.
---

When AI explains a financial behavior card that is only an example, keep the model grounded in the visible example and frame the explanation as conditional. Do not claim the user's bank, browser, subscription, transaction, or mood history was analyzed.

**Why:** An AI explanation can make an invented sample card sound like a verified personal finding. That is especially risky when the user is being asked to adjust financial behavior.

**How to apply:** Before adding AI-driven insight descriptions, confirm whether a real detector and real user data exist. Label examples in the UI and prompt, omit invented confidence metrics, and invite users to verify their own records. Trusting an example is only a local dismissal, not feedback to a detector.