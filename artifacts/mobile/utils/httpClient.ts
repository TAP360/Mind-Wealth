import axios from "axios";

import { getRequestLanguage } from "@/localization/preferences";
import { getAuthToken } from "@/storage/authToken";

// Reserved, non-routable placeholder. Replace this before using real endpoints.
export const HTTP_BASE_URL = "https://api.example.invalid";

export const httpClient = axios.create({
  baseURL: HTTP_BASE_URL,
  timeout: 30_000,
});

httpClient.interceptors.request.use(
  async (config) => {
    config.headers.set("Content-Type", "application/json");
    config.headers.set("Accept-Language", await getRequestLanguage());

    // Read on each request so a login, token update, or logout takes effect immediately.
    const token = await getAuthToken();
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
