import { getTranslate } from "./translate";
import { setTheme, toggleTheme, currentTheme } from "./theme";
import { saveLang, saveTheme, loadSettings } from "./settings";

export function initPageControls(): void {
  const settings = loadSettings();
  getTranslate(settings.lang);
  setTheme(settings.theme);

  document.querySelectorAll<HTMLElement>(".lang-toggle").forEach((btn) => {
    btn.classList.toggle("lang-toggle--active", btn.dataset.lang === settings.lang);
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang || "en";
      getTranslate(lang);
      saveLang(lang);
      document.querySelectorAll<HTMLElement>(".lang-toggle").forEach((b) => {
        b.classList.toggle("lang-toggle--active", b.dataset.lang === lang);
      });
    });
  });

  document.querySelectorAll<HTMLButtonElement>(".theme-toggle").forEach((btn) => {
    btn.textContent = settings.theme === "dark" ? "☀" : "☾";
    btn.addEventListener("click", () => {
      toggleTheme();
      const t = currentTheme;
      saveTheme(t);
      document.querySelectorAll<HTMLButtonElement>(".theme-toggle").forEach((b) => {
        b.textContent = t === "dark" ? "☀" : "☾";
      });
    });
  });
}
