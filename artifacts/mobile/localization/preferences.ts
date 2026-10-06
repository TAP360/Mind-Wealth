import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

export type Language = "ar" | "en";
export const LANGUAGE_STORAGE_KEY = "@bassera_language";

export function resolveLanguage(saved: string | null, deviceLanguage?: string | null): Language {
  if (saved === "ar" || saved === "en") return saved;
  return deviceLanguage?.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export async function getRequestLanguage(): Promise<Language> {
  const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  return resolveLanguage(saved, Localization.getLocales()[0]?.languageCode);
}
