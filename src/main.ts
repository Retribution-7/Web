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

  const user = getUser();
  const loginEl = document.getElementById("nav-login");
  const registerEl = document.getElementById("nav-register");
  const logoutEl = document.getElementById("nav-logout");
  const adminEl = document.getElementById("nav-admin");

  if (user) {
    loginEl?.classList.add("hidden");
    registerEl?.classList.add("hidden");
    logoutEl?.classList.remove("hidden");
    logoutEl?.addEventListener("click", logout);
    if (user.role === "admin") {
      adminEl?.classList.remove("hidden");
    }
  } else {
    logoutEl?.classList.add("hidden");
    adminEl?.classList.add("hidden");
  }
});
