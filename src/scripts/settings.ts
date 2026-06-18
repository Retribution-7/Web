import { getTranslate, setCurrentLang } from "./translate";
import { setTheme } from "./theme";

const LANG_KEY = "lang";
const THEME_KEY = "theme";

export function loadSettings(): { lang: string; theme: "light" | "dark" } {
  const lang = localStorage.getItem(LANG_KEY) || "en";
  const theme = (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
  return { lang, theme };
}

export function saveLang(lang: string): void {
  localStorage.setItem(LANG_KEY, lang);
}

export function saveTheme(theme: string): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function resetSettings(): void {
  localStorage.removeItem(LANG_KEY);
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem("currentUser");
  getTranslate("en");
  setTheme("light");
  window.location.href = "/";
}

export function applySavedSettings(): void {
  const { lang, theme } = loadSettings();
  setCurrentLang(lang);
  setTheme(theme);
  getTranslate(lang);
}

export function initSettingsSave(): void {
  window.addEventListener("beforeunload", () => {
    const { lang, theme } = loadSettings();
    localStorage.setItem(LANG_KEY, lang);
    localStorage.setItem(THEME_KEY, theme);
  });
}
