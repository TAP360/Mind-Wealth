---
name: Expo Go storage boundary
description: Why this project's HTTP token storage must not require a custom native runtime.
---

Keep token storage compatible with the current Expo Go runtime. The user explicitly chose AsyncStorage rather than MMKV because the current setup cannot supply MMKV's native implementation.

**Why:** Adding an Expo-compatible package is not the same as having its native module available in Expo Go. Requiring a custom build just for storage would change the project's supported runtime without agreement.

**How to apply:** Do not reintroduce MMKV or other native-only storage unless adopting a custom native build is explicitly in scope. Treat AsyncStorage as unencrypted and evaluate production credential protection separately rather than claiming it is secure storage.
