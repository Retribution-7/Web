/**
 * Скрипт индикатора прогресса чтения
 */
export const initScrollProgress = (): void => {
  const progressBar = document.createElement("div");
  progressBar.id = "scroll-progress";

  Object.assign(progressBar.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "0%",
    height: "3px",
    backgroundColor: "#FF4D01",
    zIndex: "9999",
    transition: "width 0.1s ease-out",
  });

  document.body.appendChild(progressBar);

  window.addEventListener("scroll", () => {
    const scroll = window.scrollY;
    const totalHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;

    // Расчет процента
    const percentage = (scroll / (totalHeight - viewportHeight)) * 100;

    progressBar.style.width = `${percentage}%`;
  });
};
