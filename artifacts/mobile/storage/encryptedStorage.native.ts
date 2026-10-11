import * as SecureStore from "expo-secure-store";
import { getRandomBytesAsync } from "expo-crypto";
import { gcm } from "@noble/ciphers/aes.js";
import { createEncryptedStorage, hex, unhex, utf8, text } from "./encryptedStorageCore";

const KEY_NAME = "bassera.persistence.aes.key";
let keyPromise: Promise<Uint8Array> | undefined;
function getKey(): Promise<Uint8Array> {
  if (!keyPromise) {
    keyPromise = (async () => {
      if (!await SecureStore.isAvailableAsync()) throw new Error("SESSION_STORAGE_FAILED");
      const existing = await SecureStore.getItemAsync(KEY_NAME);
      if (existing) {
        const bytes = unhex(existing);
        if (bytes.length !== 32) throw new Error("SESSION_STORAGE_FAILED");
        return bytes;
      }
      const bytes = await getRandomBytesAsync(32);
      await SecureStore.setItemAsync(KEY_NAME, hex(bytes), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
      return bytes;
    })();
    void keyPromise.catch(() => { keyPromise = undefined; });
  }
  return keyPromise;
}

export const encryptedStorage = createEncryptedStorage({
  async seal(storageKey, value) {
    const key = await getKey();
    const nonce = await getRandomBytesAsync(12);
    return `${hex(nonce)}:${hex(gcm(key, nonce, utf8(storageKey)).encrypt(utf8(value)))}`;
  },
  async open(storageKey, value) {
    const [nonce, cipher, extra] = value.split(":");
    if (extra !== undefined || !nonce || !cipher || nonce.length !== 24) throw new Error("SESSION_STORAGE_FAILED");
    try {
      return text(gcm(await getKey(), unhex(nonce), utf8(storageKey)).decrypt(unhex(cipher)));
    } catch { throw new Error("SESSION_STORAGE_FAILED"); }
  },
});
