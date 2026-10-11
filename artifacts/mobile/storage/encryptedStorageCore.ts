import AsyncStorage from "@react-native-async-storage/async-storage";

export const ENCRYPTED_PREFIX = "mwenc:v1:";
const migratableKeys = new Set(["@mindwealth_state", "@mindwealth_accounts"]);

export function utf8(value: string): Uint8Array {
  return Uint8Array.from((encodeURIComponent(value).match(/%[0-9A-F]{2}|[^%]/g) ?? [])
    .map((part) => part.startsWith("%") ? parseInt(part.slice(1), 16) : part.charCodeAt(0)));
}
export function text(value: Uint8Array): string {
  return decodeURIComponent(Array.from(value, (byte) => `%${byte.toString(16).padStart(2, "0")}`).join(""));
}
export function hex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export function unhex(value: string): Uint8Array {
  if (!/^(?:[a-f0-9]{2})+$/i.test(value)) throw new Error("SESSION_STORAGE_FAILED");
  return Uint8Array.from(value.match(/../g)!.map((byte) => parseInt(byte, 16)));
}

/** Serialized, authenticated encryption. No plaintext/key fallback on failure. */
export function createEncryptedStorage(codec: {
  seal: (key: string, value: string) => Promise<string>;
  open: (key: string, value: string) => Promise<string>;
}) {
  const writes = new Map<string, Promise<void>>();
  const storage = {
    async getItem(key: string): Promise<string | null> {
      await writes.get(key);
      const saved = await AsyncStorage.getItem(key);
      if (saved === null) return null;
      if (saved.startsWith(ENCRYPTED_PREFIX)) return codec.open(key, saved.slice(ENCRYPTED_PREFIX.length));
      if (!migratableKeys.has(key)) throw new Error("SESSION_STORAGE_FAILED");
      // Migrate old financial/profile data only after a successful encrypted write.
      await storage.setItem(key, saved);
      return saved;
    },
    setItem(key: string, value: string): Promise<void> {
      const operation = (writes.get(key) ?? Promise.resolve()).catch(() => undefined).then(async () => {
        const encrypted = await codec.seal(key, value);
        await AsyncStorage.setItem(key, `${ENCRYPTED_PREFIX}${encrypted}`);
      });
      writes.set(key, operation);
      void operation.finally(() => { if (writes.get(key) === operation) writes.delete(key); }).catch(() => undefined);
      return operation;
    },
    async removeItem(key: string): Promise<void> {
      await writes.get(key)?.catch(() => undefined);
      await AsyncStorage.removeItem(key);
    },
  };
  return storage;
}
