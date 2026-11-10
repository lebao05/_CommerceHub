import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
  type ReactNode,
} from 'react';
import { en } from './en';
import { vi } from './vi';

export type Locale = 'en' | 'vi';

export const LOCALES: Locale[] = ['en', 'vi'];

type Translations = typeof en;

const dictionaries: Record<Locale, Translations> = { en, vi };

const LOCALE_KEY = 'ch-locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Translations) => string;
  /** All available translations for the current locale */
  dict: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === 'en' || stored === 'vi') return stored;
  } catch {
    // localStorage may be unavailable (SSR / private mode)
  }
  // Default: browser language if Vietnamese, else English
  if (typeof navigator !== 'undefined' && /^vi/.test(navigator.language)) return 'vi';
  return 'en';
}

interface I18nProviderProps {
  children: ReactNode;
  /** Override the initial locale (useful for SSR / testing) */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    initialLocale ?? getStoredLocale()
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: keyof Translations): string => {
      return dictionaries[locale][key] ?? key;
    },
    [locale]
  );

  // Sync <html lang> attribute
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dict: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Returns { locale, setLocale, t, dict }. Must be called inside <I18nProvider>. */
export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an <I18nProvider>');
  }
  return ctx;
}
