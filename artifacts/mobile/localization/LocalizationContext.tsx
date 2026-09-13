import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ar, arExtra } from './ar';
import { en, type TranslationKey } from './en';

export type Language = 'en' | 'ar';
export type TranslateParams = Record<string, string | number>;

export const LANGUAGE_STORAGE_KEY = '@bassera_language';

interface LocalizationContextValue {
  language: Language;
  isRTL: boolean;
  isReady: boolean;
  t: (key: TranslationKey | string, params?: TranslateParams) => string;
  setLanguage: (language: Language) => Promise<void>;
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

function applyDirection(language: Language) {
  const isRTL = language === 'ar';
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.body?.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.body?.setAttribute('lang', language);
  }
}

function interpolate(value: string, params?: TranslateParams) {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] === undefined ? `{${key}}` : String(params[key]),
  );
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const deviceLanguage = Localization.getLocales()[0]?.languageCode;
        const selected: Language =
          saved === 'ar' || saved === 'en'
            ? saved
            : deviceLanguage?.toLowerCase().startsWith('ar')
              ? 'ar'
              : 'en';
        applyDirection(selected);
        if (mounted) setLanguageState(selected);
      } catch {
        applyDirection('en');
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (next: Language) => {
    // Persist before changing direction/reloading. This ensures the next
    // native root starts in the selected direction even if reload is delayed.
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    setLanguageState(next);
    applyDirection(next);

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.location.reload();
      return;
    }

    try {
      await reloadAppAsync();
    } catch {
      // Some Expo Go/web runtimes do not expose a native reload implementation.
      // The direction and dictionary are already applied, so leave the current
      // tree usable rather than throwing from a language selector.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, params?: TranslateParams) => {
      const translated =
        language === 'ar'
          ? arExtra[key] ?? ar[key as TranslationKey]
          : en[key as TranslationKey] ?? key;
      return interpolate(translated ?? key, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      isRTL: language === 'ar',
      isReady,
      t,
      setLanguage,
    }),
    [language, isReady, t, setLanguage],
  );

  if (!isReady) return null;
  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error(
      'useLocalization must be used within LocalizationProvider',
    );
  }
  return context;
}

export const useTranslation = useLocalization;