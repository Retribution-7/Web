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
        640: {
          slidesPerView: 1.5,
          spaceBetween: 64,
        },
        960: {
          slidesPerView: 2,
          spaceBetween: 64,
        },
        1280: {
          slidesPerView: 2.2,
          spaceBetween: 64,
        },
        1400: {
          slidesPerView: 2.5,
          spaceBetween: 64,
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
