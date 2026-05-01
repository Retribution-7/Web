import Swiper from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

export const initSwiper = () => {
  const swipers = document.querySelectorAll<HTMLElement>(".mySwiper");

  swipers.forEach((swiperEl) => {
    const section = swiperEl.closest("section") ?? document.body;

    const nextEl = section.querySelector<HTMLElement>(".swiper-button-next-custom");
    const prevEl = section.querySelector<HTMLElement>(".swiper-button-prev-custom");
    const paginationEl = swiperEl.querySelector<HTMLElement>(".swiper-pagination");

    const modules = [Navigation, Autoplay];
    if (paginationEl) modules.push(Pagination);

    new Swiper(swiperEl, {
      modules,

      slidesPerView: 1,
      spaceBetween: 64,

      breakpoints: {
        640: { slidesPerView: 1.5, spaceBetween: 64 },
        960: { slidesPerView: 2, spaceBetween: 64 },
        1280: { slidesPerView: 2.2, spaceBetween: 64 },
        1400: { slidesPerView: 2.5, spaceBetween: 64 },
      },

      speed: 600,
      rewind: true,

      ...(nextEl && prevEl ? { navigation: { nextEl, prevEl } } : {}),

      autoplay: {
        delay: 5000,
        pauseOnMouseEnter: true,
        disableOnInteraction: false,
      },

      ...(paginationEl && {
        pagination: {
          el: paginationEl,
          clickable: true,
        },
      }),
    });
  });
};
