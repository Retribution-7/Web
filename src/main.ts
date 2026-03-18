import { initSwiper } from "./swiper/swiper";

document.addEventListener("DOMContentLoaded", () => {
  const swiper = initSwiper();
  document
    .querySelector(".swiper-button-next-custom")
    ?.addEventListener("click", () => {
      if (swiper.isEnd) {
        swiper.slideTo(0);
      }
    });
  document
    .querySelector(".swiper-button-prev-custom")
    ?.addEventListener("click", () => {
      if (swiper.isBeginning) {
        swiper.slideTo(swiper.slides.length - 1);
      }
    });
});
