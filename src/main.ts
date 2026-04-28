import { getUser, logout } from "./auth";
import { initCounters } from "./scripts/counter";
import { initMagneticButtons } from "./scripts/magnetic-buttons";
import { initScrollObserver } from "./scripts/observer";
import { initScrollProgress } from "./scripts/scroll-progress";
import { initSwiper } from "./scripts/swiper";

document.addEventListener("DOMContentLoaded", () => {
  initSwiper();
  initCounters();
  initScrollProgress();
  initMagneticButtons();
  initScrollObserver(".animate-typing", "active", 0.7);

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
