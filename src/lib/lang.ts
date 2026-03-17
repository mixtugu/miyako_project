export const APP_LANG_STORAGE_KEY = "app_lang";

export type AppLang = "ja" | "en";

export function parseAppLang(value: string | null | undefined): AppLang | null {
  return value === "ja" || value === "en" ? value : null;
}

export function getBrowserLang(): AppLang {
  const browserLang = navigator.language || navigator.languages?.[0] || "ja";
  return browserLang.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function resolveAppLang(search: string): AppLang {
  const params = new URLSearchParams(search);
  const langFromQuery = parseAppLang(params.get("lang"));
  if (langFromQuery) {
    return langFromQuery;
  }

  try {
    const langFromStorage = parseAppLang(localStorage.getItem(APP_LANG_STORAGE_KEY));
    if (langFromStorage) {
      return langFromStorage;
    }
  } catch {
    // Ignore storage access errors and fall back to browser language.
  }

  return getBrowserLang();
}

export function persistAppLang(lang: AppLang) {
  try {
    localStorage.setItem(APP_LANG_STORAGE_KEY, lang);
  } catch {
    // Ignore storage access errors.
  }

  try {
    document.documentElement.lang = lang;
  } catch {
    // Ignore document access errors.
  }
}

export function buildSearchWithLang(
  lang: AppLang,
  init?: string | URLSearchParams | string[][] | Record<string, string> | undefined,
) {
  const params = new URLSearchParams(init);
  params.set("lang", lang);
  return `?${params.toString()}`;
}
