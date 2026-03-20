import Swiper from "swiper";
import { Navigation } from "swiper/modules";

export const initSwiper = () => {
  const swipers = document.querySelectorAll<HTMLElement>(".mySwiper");

  swipers.forEach((swiperEl) => {
    const section = swiperEl.closest("section") ?? document.body;

    const nextEl = section.querySelector<HTMLElement>(
      ".swiper-button-next-custom",
    );
    const prevEl = section.querySelector<HTMLElement>(
      ".swiper-button-prev-custom",
    );

    if (!nextEl || !prevEl) return;

    new Swiper(swiperEl, {
      modules: [Navigation],

      slidesPerView: 1,
      spaceBetween: 64,

      breakpoints: {
        1024: {
          slidesPerView: 2,
        },
      },

      speed: 600,
      rewind: true,

      navigation: {
        nextEl,
        prevEl,
      },
    });
  });
};
