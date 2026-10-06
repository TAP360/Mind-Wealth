const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const axios = require("axios");

function loadSource(relativePath, mocks) {
  const file = path.join(__dirname, "..", relativePath);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const mockedRequire = (name) => name in mocks ? mocks[name] : require(name);
  new Function("require", "module", "exports", source)(mockedRequire, module, module.exports);
  return module.exports;
}

async function main() {
  let savedLanguage = "ar";
  let deviceLanguage = "en";
  const preferences = loadSource("localization/preferences.ts", {
    "@react-native-async-storage/async-storage": { getItem: async () => savedLanguage },
    "expo-localization": { getLocales: () => [{ languageCode: deviceLanguage }] },
  });
  assert.equal(await preferences.getRequestLanguage(), "ar");
  savedLanguage = "en";
  assert.equal(await preferences.getRequestLanguage(), "en");
  savedLanguage = "unsupported";
  deviceLanguage = "ar-SA";
  assert.equal(await preferences.getRequestLanguage(), "ar");
  deviceLanguage = "fr";
  assert.equal(await preferences.getRequestLanguage(), "en");

  const values = new Map();
  let tokenStorageError;
  const tokenStore = loadSource("storage/authToken.ts", {
    "@react-native-async-storage/async-storage": {
      setItem: async (key, value) => {
        if (tokenStorageError) throw tokenStorageError;
        values.set(key, value);
      },
      getItem: async (key) => {
        if (tokenStorageError) throw tokenStorageError;
        return values.get(key) ?? null;
      },
      removeItem: async (key) => {
        if (tokenStorageError) throw tokenStorageError;
        values.delete(key);
      },
    },
  });
  assert.equal(await tokenStore.getAuthToken(), null);
  await tokenStore.setAuthToken("Bearer test-token-only");
  assert.equal(await tokenStore.getAuthToken(), "test-token-only");
  await tokenStore.setAuthToken("updated-test-token");
  assert.equal(await tokenStore.getAuthToken(), "updated-test-token");
  await tokenStore.clearAuthToken();
  assert.equal(await tokenStore.getAuthToken(), null);
  await assert.rejects(tokenStore.setAuthToken(" "), /non-empty/);
  await assert.rejects(tokenStore.setAuthToken("bad\nvalue"), /whitespace/);
  tokenStorageError = new Error("Token storage failed");
  await assert.rejects(tokenStore.setAuthToken("test-token"), (error) => error === tokenStorageError);
  await assert.rejects(tokenStore.getAuthToken(), (error) => error === tokenStorageError);
  await assert.rejects(tokenStore.clearAuthToken(), (error) => error === tokenStorageError);
  tokenStorageError = undefined;

  let language = "ar";
  let languageError;
  const { httpClient, HTTP_BASE_URL } = loadSource("utils/httpClient.ts", {
    "@/localization/preferences": {
      getRequestLanguage: async () => {
        if (languageError) throw languageError;
        return language;
      },
    },
    "@/storage/authToken": tokenStore,
  });
  assert.equal(HTTP_BASE_URL, "https://api.example.invalid");
  let requestCount = 0;
  httpClient.defaults.adapter = async (config) => {
    requestCount++;
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
  };
  await tokenStore.setAuthToken("test-token-only");
  const first = await httpClient.get("/test", { headers: { "Content-Type": "text/plain" } });
  assert.equal(first.config.headers.get("Content-Type"), "application/json");
  assert.equal(first.config.headers.get("Accept-Language"), "ar");
  assert.equal(first.config.headers.get("Authorization"), "Bearer test-token-only");
  assert.equal(first.status, 200);
  assert.deepEqual(first.data, { ok: true });
  language = "en";
  await tokenStore.setAuthToken("second-test-token");
  const second = await httpClient.get("/test");
  assert.equal(second.config.headers.get("Accept-Language"), "en");
  assert.equal(second.config.headers.get("Authorization"), "Bearer second-test-token");
  await tokenStore.clearAuthToken();
  const anonymous = await httpClient.get("/test", { headers: { Authorization: "Bearer stale-test-token" } });
  assert.equal(anonymous.config.headers.has("Authorization"), false);
  languageError = new Error("Language storage failed");
  await assert.rejects(httpClient.get("/test"), (error) => error === languageError);
  assert.equal(requestCount, 3, "A request interceptor failure must prevent dispatch");
  languageError = undefined;
  tokenStorageError = new Error("Token storage failed");
  await assert.rejects(httpClient.get("/test"), (error) => error === tokenStorageError);
  assert.equal(requestCount, 3, "A token read failure must prevent dispatch");
  tokenStorageError = undefined;
  const failure = new axios.AxiosError("Unauthorized", "ERR_BAD_REQUEST");
  httpClient.defaults.adapter = async () => { throw failure; };
  await assert.rejects(httpClient.get("/test"), (error) => error === failure);
  console.log("HTTP client checks passed: languages, AsyncStorage helpers, headers, token updates/logout, and error propagation.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
