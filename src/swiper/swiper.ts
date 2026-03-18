import Swiper from "swiper";
import { Navigation } from "swiper/modules";

export const initSwiper = () =>
  new Swiper(".mySwiper", {
    modules: [Navigation],

    slidesPerView: 2,
    spaceBetween: 64,

    speed: 600,
    rewind: true,

    navigation: {
      nextEl: ".swiper-button-next-custom",
      prevEl: ".swiper-button-prev-custom",
    },
  });
