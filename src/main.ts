import { initCounters } from "./scripts/counter";
import { initMagneticButtons } from "./scripts/magnetic-buttons";
import { initScrollObserver } from "./scripts/observer";
import { initScrollProgress } from "./scripts/scroll-progress";
import { initSwiper } from "./swiper/swiper";

document.addEventListener("DOMContentLoaded", () => {
  initSwiper();
  initCounters();
  initScrollProgress();
  initMagneticButtons();
  initScrollObserver(".animate-typing", "active", 0.7);
});
