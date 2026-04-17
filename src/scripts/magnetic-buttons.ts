/**
 * Эффект магнитного притяжения кнопок
 */
export const initMagneticButtons = (): void => {
  const buttons = document.querySelectorAll<HTMLElement>(".btn-magnetic");

  buttons.forEach((btn) => {
    btn.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();

      // Находим центр кнопки
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Расстояние от курсора до центра
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      // Сила притяжения (0.3 - кнопка смещается на 30% от расстояния до курсора)
      const strength = 0.3;

      // Применяем трансформацию
      btn.style.transform = `translate(${distanceX * strength}px, ${distanceY * strength}px)`;
    });

    // Возвращаем на место, когда курсор уходит
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = `translate(0px, 0px)`;
    });
  });
};
