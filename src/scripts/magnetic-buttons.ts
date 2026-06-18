export const initMagneticButtons = (): void => {
  const buttons = document.querySelectorAll<HTMLElement>(".btn-magnetic");

  buttons.forEach((btn) => {
    btn.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      const strength = 0.3;

      btn.style.transform = `translate(${distanceX * strength}px, ${distanceY * strength}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = `translate(0px, 0px)`;
    });
  });
};
