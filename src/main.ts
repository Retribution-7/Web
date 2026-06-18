import { getUser, logout } from "./auth";
import { initBurgerMenu } from "./scripts/burger-menu";
import { initCounters } from "./scripts/counter";
import { initMagneticButtons } from "./scripts/magnetic-buttons";
import { initMap } from "./scripts/map";
import { initScrollObserver } from "./scripts/observer";
import { initScrollProgress } from "./scripts/scroll-progress";
import { initSwiper } from "./scripts/swiper";
import { initParallax } from "./scripts/parallax";
import "./styles/style.css";

import "./scripts/preloader";
import { handleAnchorOnLoad, initSmoothScroll } from "./scripts/smoothScroll";
import { getTranslate } from "./scripts/translate";
import { setTheme, toggleTheme, currentTheme } from "./scripts/theme";
import { applySavedSettings, saveLang, saveTheme, loadSettings } from "./scripts/settings";
import { initProfileModal } from "./scripts/profile-modal";

function initLangThemeControls(): void {
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

document.addEventListener("DOMContentLoaded", () => {
  initSwiper();
  initCounters();
  initMap();
  initScrollProgress();
  initMagneticButtons();
  initScrollObserver(".animate-typing", "active", 0.7);
  initBurgerMenu();
  initParallax();
  initSmoothScroll();
  handleAnchorOnLoad();
  initLangThemeControls();
  initProfileModal();

  const user = getUser();
  const loginEl = document.getElementById("nav-login");
  const registerEl = document.getElementById("nav-register");
  const logoutEl = document.getElementById("nav-logout");
  const adminEl = document.getElementById("nav-admin");
  const userIcon = document.getElementById("nav-user-icon");

  if (user) {
    loginEl?.classList.add("hidden");
    registerEl?.classList.add("hidden");
    logoutEl?.classList.remove("hidden");
    userIcon?.classList.remove("hidden");
    logoutEl?.addEventListener("click", logout);
    if (user.role === "admin") {
      adminEl?.classList.remove("hidden");
    }
  } else {
    logoutEl?.classList.add("hidden");
    adminEl?.classList.add("hidden");
    userIcon?.classList.add("hidden");
  }
});
