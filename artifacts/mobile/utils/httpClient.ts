import axios from "axios";

import { getRequestLanguage } from "@/localization/preferences";
import { getAuthToken } from "@/storage/authToken";

// Owner-supplied test URL; override with the real identity service when ready.
export const HTTP_BASE_URL = process.env.EXPO_PUBLIC_IDENTITY_API_URL || "https://DymmyTest.com";

export const httpClient = axios.create({
  baseURL: HTTP_BASE_URL,
  timeout: 30_000,
});

httpClient.interceptors.request.use(
  async (config) => {
    config.headers.set("Content-Type", "application/json");
    config.headers.set("Accept-Language", await getRequestLanguage());

    // Read on each request so a login, token update, or logout takes effect immediately.
    const isPublicAuth = config.url?.split("?")[0]?.startsWith("/v1/identity/consumer/auth/");
    const token = isPublicAuth ? null : await getAuthToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    else config.headers.delete("Authorization");

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (response) => response,
  // Preserve Axios errors and status codes; do not swallow failures or log tokens.
  (error: unknown) => Promise.reject(error),
);

export default httpClient;
