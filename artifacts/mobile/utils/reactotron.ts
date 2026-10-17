import Constants from "expo-constants";
import { Platform } from "react-native";
import type ReactotronClient from "reactotron-react-native";

const Reactotron: typeof ReactotronClient | null = __DEV__ && Platform.OS !== "web"
  ? require("reactotron-react-native").default
  : null;

if (Reactotron) {
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";

  Reactotron.configure({
    name: "Mind Wealth",
    host,
    onConnect: () => console.log(`[Reactotron] Connected to ${host}:9090`),
    onDisconnect: () => console.log("[Reactotron] Disconnected"),
  })
    .useReactNative({ asyncStorage: false, networking: false })
    .connect();
}

type ApiRequestDetails = {
  method: string;
  endpoint: string;
  status: number | null;
  durationMs: number;
  error?: string;
  request?: unknown;
  response?: unknown;
};

export function reportApiRequest(details: ApiRequestDetails): void {
  if (!Reactotron) return;

  const request = details.request as {
    data?: unknown;
    headers?: Record<string, string>;
    params?: unknown;
  } | undefined;
  const response = details.response as {
    data?: unknown;
    headers?: Record<string, string>;
  } | undefined;

  Reactotron.apiResponse(
    {
      data: request?.data ?? null,
      headers: request?.headers ?? {},
      method: details.method,
      params: request?.params ?? {},
      url: details.endpoint,
    },
    {
      body: JSON.stringify(response?.data ?? details.error ?? ""),
      headers: response?.headers ?? {},
      status: details.status ?? 0,
    },
    details.durationMs,
  );

  Reactotron.display({
    name: details.error ? "API Error" : "API Response",
    preview: `${details.method} ${details.endpoint} - ${details.status ?? "Network Error"} (${details.durationMs}ms)`,
    value: details,
  });
}
