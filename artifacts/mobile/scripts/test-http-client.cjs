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
  const countries = loadSource("utils/countries.ts", {});
  const options = countries.getCountryOptions("en");
  assert.ok(options.length >= 240, "Include all supported worldwide calling-code countries and territories");
  assert.equal(new Set(options.map((item) => item.country)).size, options.length);
  for (const country of ["EG", "US", "CA", "GB", "SA", "IN", "JP", "ZA", "BR", "AU"]) {
    assert.ok(options.some((option) => option.country === country));
  }
  assert.equal(countries.getCountryOptions("ar").find((o) => o.country === "EG").name, "مصر");
  assert.deepEqual(countries.splitInternationalInput("+20 01012345678", "EG"), {
    identifier: "01012345678", countryCode: "+20", country: "EG",
  });
  assert.equal(countries.splitInternationalInput("00966501234567", "EG").countryCode, "+966");
  assert.equal(countries.splitInternationalInput("+١٢٠٢٥٥٥٠١٢٣", "EG").countryCode, "+1");
  assert.equal(countries.splitInternationalInput("201012345678", "EG").countryCode, "+20");
  assert.equal(countries.splitInternationalInput("+12425550123", "EG").country, "BS");
  assert.equal(countries.splitInternationalInput("01012345678", "EG").identifier, "01012345678");
  assert.equal(countries.splitInternationalInput("person@example.invalid", "EG").identifier, "person@example.invalid");
  assert.equal(countries.splitInternationalInput("+4", "EG").identifier, "+4", "Preserve incomplete calling codes while typing");

  const values = new Map();
  let writeError;
  let readError;
  let writeGate;
  const asyncStorage = {
    setItem: async (key, value) => {
      if (writeGate) await writeGate;
      if (writeError) throw writeError;
      values.set(key, value);
    },
    getItem: async (key) => {
      if (readError) throw readError;
      return values.get(key) ?? null;
    },
    removeItem: async (key) => { values.delete(key); },
  };
  const createStoreModule = () => loadSource("stores/authStore.ts", {
    "@react-native-async-storage/async-storage": asyncStorage,
  });
  const storeModule = createStoreModule();
  const tokenStore = loadSource("storage/authToken.ts", {
    "@/stores/authStore": storeModule,
  });
  const tokens = (accessToken = "test-token-only") => ({
    accessToken, refreshToken: "test-refresh-only", userId: "test-consumer",
    userType: "CONSUMER", expiresIn: 900,
  });
  assert.throws(() => storeModule.sessionFromVerification({ mfaRequired: true, tokens: tokens() }), /MFA_REQUIRED/);
  assert.throws(() => storeModule.sessionFromVerification({ mfaRequired: false }), /INVALID_SESSION/);
  assert.deepEqual(storeModule.sessionFromVerification({ mfaRequired: false, tokens: tokens() }), tokens());
  assert.equal(await tokenStore.getAuthToken(), null);
  await tokenStore.setAuthTokens(tokens("Bearer test-token-only"));
  assert.equal(await tokenStore.getAuthToken(), "test-token-only");
  const persisted = JSON.parse(values.get(storeModule.AUTH_STORAGE_KEY));
  assert.deepEqual(Object.keys(persisted.state), ["tokens"]);
  assert.equal(persisted.state.tokens.refreshToken, "test-refresh-only");
  const restoredModule = createStoreModule();
  await restoredModule.ensureAuthHydrated();
  assert.equal(restoredModule.useAuthStore.getState().tokens.accessToken, "test-token-only");
  assert.equal(restoredModule.useAuthStore.getState().tokens.refreshToken, "test-refresh-only");
  assert.equal(restoredModule.useAuthStore.getState().sessionReady, true);
  await tokenStore.setAuthTokens(tokens("updated-test-token"));
  assert.equal(await tokenStore.getAuthToken(), "updated-test-token");
  await tokenStore.clearAuthToken();
  assert.equal(await tokenStore.getAuthToken(), null);
  await assert.rejects(tokenStore.setAuthTokens(tokens(" ")), /INVALID_SESSION/);
  await assert.rejects(tokenStore.setAuthTokens(tokens("bad\nvalue")), /INVALID_SESSION/);
  await assert.rejects(tokenStore.setAuthTokens({ ...tokens(), refreshToken: "" }), /INVALID_SESSION/);
  writeError = new Error("Storage unavailable");
  await assert.rejects(tokenStore.setAuthTokens(tokens("not-saved")), /SESSION_STORAGE_FAILED/);
  assert.equal(storeModule.useAuthStore.getState().tokens, null);
  assert.equal(storeModule.useAuthStore.getState().sessionReady, false);
  writeError = undefined;
  let releaseWrite;
  writeGate = new Promise((resolve) => { releaseWrite = resolve; });
  const saving = tokenStore.setAuthTokens(tokens());
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(storeModule.useAuthStore.getState().sessionReady, false);
  assert.equal(await tokenStore.getAuthToken(), null, "Unsaved sessions cannot authorize requests");
  releaseWrite();
  await saving;
  writeGate = undefined;
  assert.equal(storeModule.useAuthStore.getState().sessionReady, true);

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
  assert.equal(HTTP_BASE_URL, process.env.EXPO_PUBLIC_IDENTITY_API_URL || "https://DymmyTest.com");
  let requestCount = 0;
  httpClient.defaults.adapter = async (config) => {
    requestCount++;
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
  };
  await tokenStore.setAuthTokens(tokens("test-token-only"));
  const first = await httpClient.get("/test", { headers: { "Content-Type": "text/plain" } });
  assert.equal(first.config.headers.get("Content-Type"), "application/json");
  assert.equal(first.config.headers.get("Accept-Language"), "ar");
  assert.equal(first.config.headers.get("Authorization"), "Bearer test-token-only");
  assert.equal(first.status, 200);
  assert.deepEqual(first.data, { ok: true });
  language = "en";
  await tokenStore.setAuthTokens(tokens("second-test-token"));
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
  const failedHydrationModule = createStoreModule();
  const failedTokens = loadSource("storage/authToken.ts", { "@/stores/authStore": failedHydrationModule });
  const failedClient = loadSource("utils/httpClient.ts", {
    "@/localization/preferences": { getRequestLanguage: async () => "en" },
    "@/storage/authToken": failedTokens,
  }).httpClient;
  failedClient.defaults.adapter = () => { throw new Error("A hydration failure must prevent dispatch"); };
  readError = new Error("Storage unavailable");
  await assert.rejects(failedClient.get("/test"), /SESSION_STORAGE_FAILED/);
  readError = undefined;
  await failedHydrationModule.ensureAuthHydrated();
  await tokenStore.setAuthTokens(tokens("stale-token"));
  const publicRequest = await httpClient.post("/v1/identity/consumer/auth/otp/request", {});
  assert.equal(publicRequest.config.headers.has("Authorization"), false, "Public auth calls must not leak old tokens");
  assert.equal(publicRequest.config.headers.get("Accept-Language"), "en");
  const failure = new axios.AxiosError("Unauthorized", "ERR_BAD_REQUEST");
  httpClient.defaults.adapter = async () => { throw failure; };
  await assert.rejects(httpClient.get("/test"), (error) => error === failure);
  const errorMessages = loadSource("utils/authErrors.ts", {});
  assert.match(errorMessages.authErrorMessage(new Error("MFA_REQUIRED"), "en"), /additional verification/);
  assert.match(errorMessages.authErrorMessage(new Error("OTP_EXPIRED"), "en"), /expired/);
  assert.match(errorMessages.authErrorMessage(new Error("OTP_EXPIRED"), "ar"), /انتهت/);
  await tokenStore.clearAuthToken();

  const transport = loadSource("../../lib/api-client-react/src/identity-request.ts", {});
  transport.setIdentityTransport(async (config) => (await httpClient.request(config)).data);
  const api = loadSource("../../lib/api-client-react/src/identity-generated/identity.ts", {
    "../identity-request": transport,
  });
  const calls = [];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config);
    let data;
    if (config.url.endsWith("/phone/validate")) data = { valid: true, e164: "+201012345678" };
    else if (config.url.endsWith("/otp/request")) data = { expiresIn: 300, resendAfter: 60 };
    else if (config.url.endsWith("/otp/verify")) data = { newUser: false, mfaRequired: false, tokens: tokens("verified-token") };
    else if (config.url.endsWith("/me")) data = { id: "test-consumer", name: "Test Consumer" };
    else throw new Error("Unexpected test request");
    return { data, status: config.url.endsWith("/otp/request") ? 202 : 200, statusText: "OK", headers: {}, config };
  };
  const validated = await api.validateConsumerPhone({ countryCode: "+20", phone: "01012345678" });
  const requested = await api.requestConsumerOtp({ businessCode: "NW-EG", phone: validated.e164, language: "en" });
  assert.equal(requested.resendAfter, 60);
  const verified = await api.verifyConsumerOtp({ businessCode: "NW-EG", phone: validated.e164, otp: "123456" });
  await tokenStore.setAuthTokens(verified.tokens);
  const { QueryClient } = require("@tanstack/react-query");
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const session = loadSource("hooks/useConsumerSession.ts", {
    "@workspace/api-client-react": api,
    "@/stores/authStore": storeModule,
    "@/utils/identityTransport": {},
  });
  const me = await cache.fetchQuery(session.consumerQueryOptions(storeModule.useAuthStore.getState().tokens));
  assert.equal(me.name, "Test Consumer");
  assert.equal(cache.getQueryData(session.consumerQueryKey("test-consumer")).id, "test-consumer");
  assert.notDeepEqual(session.consumerQueryKey("test-consumer"), session.consumerQueryKey("another-consumer"));
  assert.deepEqual(calls.map((c) => c.method), ["post", "post", "post", "get"]);
  assert.deepEqual(JSON.parse(calls[0].data), { countryCode: "+20", phone: "01012345678" });
  assert.deepEqual(JSON.parse(calls[1].data), { businessCode: "NW-EG", phone: "+201012345678", language: "en" });
  assert.deepEqual(JSON.parse(calls[2].data), { businessCode: "NW-EG", phone: "+201012345678", otp: "123456" });
  for (const call of calls.slice(0, 3)) assert.equal(call.headers.has("Authorization"), false);
  assert.equal(calls[3].headers.get("Authorization"), "Bearer verified-token");
  await assert.rejects(cache.fetchQuery(session.consumerQueryOptions({ ...tokens(), userId: "wrong-consumer" })), /INVALID_PROFILE/);
  await session.logoutSession(cache);
  assert.equal(await tokenStore.getAuthToken(), null);
  assert.equal(JSON.parse(values.get(storeModule.AUTH_STORAGE_KEY)).state.tokens, null);
  assert.equal(cache.getQueryData(session.consumerQueryKey("test-consumer")), undefined);
  cache.clear();
  const emailCalls = [];
  httpClient.defaults.adapter = async (config) => {
    emailCalls.push(config);
    const path = config.url;
    const data = path.endsWith("/register") ? { userId: "test-consumer", message: "Code requested" }
      : path.endsWith("/login") ? { mfaRequired: true, userId: "test-consumer" }
      : tokens("flat-session-token");
    return { data, status: path.endsWith("/register") ? 201 : 200, statusText: "OK", headers: {}, config };
  };
  const credentials = { email: "person@example.invalid", password: "test-only-password", businessCode: "NW-EG" };
  const registration = await api.registerConsumer(credentials);
  assert.equal(registration.userId, "test-consumer");
  const activated = await api.verifyConsumerRegistrationOtp({ userId: registration.userId, otp: "123456" });
  assert.equal(storeModule.validateSession(activated).accessToken, "flat-session-token");
  assert.equal(activated.tokens, undefined, "Registration verification returns a flat token object");
  const needsMfa = await api.loginConsumer(credentials);
  assert.equal(needsMfa.mfaRequired, true);
  assert.equal(needsMfa.tokens, undefined);
  const challenged = await api.challengeConsumerMfa({ userId: needsMfa.userId, totpCode: "123456" });
  const recovered = await api.recoverConsumerMfa({ userId: needsMfa.userId, recoveryCode: "TEST-ONLY" });
  assert.equal(storeModule.validateSession(challenged).userId, "test-consumer");
  assert.equal(storeModule.validateSession(recovered).userId, "test-consumer");
  assert.deepEqual(emailCalls.map((c) => c.url), [
    "/v1/identity/consumer/auth/register", "/v1/identity/consumer/auth/verify-otp",
    "/v1/identity/consumer/auth/login", "/v1/identity/consumer/auth/mfa/challenge",
    "/v1/identity/consumer/auth/mfa/recovery",
  ]);
  assert.deepEqual(JSON.parse(emailCalls[0].data), credentials);
  assert.deepEqual(JSON.parse(emailCalls[1].data), { userId: "test-consumer", otp: "123456" });
  assert.deepEqual(JSON.parse(emailCalls[2].data), credentials);
  assert.deepEqual(JSON.parse(emailCalls[3].data), { userId: "test-consumer", totpCode: "123456" });
  assert.deepEqual(JSON.parse(emailCalls[4].data), { userId: "test-consumer", recoveryCode: "TEST-ONLY" });
  for (const call of emailCalls) {
    assert.equal(call.headers.has("Authorization"), false);
    assert.equal(call.headers.get("Accept-Language"), "en");
  }
  console.log("Mobile auth checks passed: API contracts, languages, persisted token pairs, hydration, persistence failures, headers, query cache isolation/logout, and errors.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
