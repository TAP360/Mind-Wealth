import { createEncryptedStorage, hex, unhex, utf8, text } from "./encryptedStorageCore";

let keyPromise: Promise<CryptoKey> | undefined;

function getKey(): Promise<CryptoKey> {
  if (keyPromise) return keyPromise;
  keyPromise = (async () => {
    if (!globalThis.crypto?.subtle || !globalThis.indexedDB) throw new Error("SESSION_STORAGE_FAILED");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("bassera-encryption", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("keys");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("SESSION_STORAGE_FAILED"));
      request.onblocked = () => reject(new Error("SESSION_STORAGE_FAILED"));
    });
    try {
      const candidate = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      // A read/write transaction prevents two tabs generating competing keys.
      return await new Promise<CryptoKey>((resolve, reject) => {
        const transaction = db.transaction("keys", "readwrite");
        const store = transaction.objectStore("keys");
        const request = store.get("data-key");
        let chosen: CryptoKey;
        request.onsuccess = () => {
          chosen = request.result ?? candidate;
          if (!request.result) store.put(chosen, "data-key");
        };
        transaction.oncomplete = () => {
          if (!chosen || chosen.extractable || chosen.algorithm.name !== "AES-GCM") reject(new Error("SESSION_STORAGE_FAILED"));
          else resolve(chosen);
        };
        transaction.onerror = transaction.onabort = () => reject(new Error("SESSION_STORAGE_FAILED"));
      });
    } finally { db.close(); }
  })();
  void keyPromise.catch(() => { keyPromise = undefined; });
  return keyPromise;
}

export const encryptedStorage = createEncryptedStorage({
  async seal(storageKey, value) {
    const key = await getKey();
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({
      name: "AES-GCM", iv: nonce, additionalData: utf8(storageKey) as Uint8Array<ArrayBuffer>,
    }, key, utf8(value) as Uint8Array<ArrayBuffer>);
    return `${hex(nonce)}:${hex(new Uint8Array(cipher))}`;
  },
  async open(storageKey, value) {
    const [nonce, cipher, extra] = value.split(":");
    if (extra !== undefined || !nonce || !cipher || nonce.length !== 24) throw new Error("SESSION_STORAGE_FAILED");
    try {
      const plain = await crypto.subtle.decrypt({
        name: "AES-GCM", iv: unhex(nonce) as Uint8Array<ArrayBuffer>,
        additionalData: utf8(storageKey) as Uint8Array<ArrayBuffer>,
      }, await getKey(), unhex(cipher) as Uint8Array<ArrayBuffer>);
      return text(new Uint8Array(plain));
    } catch { throw new Error("SESSION_STORAGE_FAILED"); }
  },
});
