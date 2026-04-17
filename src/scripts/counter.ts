/**
 * Скрипт для анимации счетчиков чисел на TypeScript
 */

interface CounterElement extends HTMLElement {
  startTime?: number;
}

export const initCounters = (): void => {
  const animationDuration: number = 1000; // 2 секунды

  const startCounter = (el: HTMLElement): void => {
    // Можно просто HTMLElement
    const targetAttr = el.getAttribute("data-target");
    if (!targetAttr) return;

    const target = parseInt(targetAttr, 10);
    let startTime: number | null = null; // Локальная переменная вместо свойства объекта

    const countIt = (timestamp: number): void => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / animationDuration, 1);

      el.innerText = Math.floor(progress * target).toString();

      if (progress < 1) {
        window.requestAnimationFrame(countIt);
      } else {
        el.innerText = target.toString();
      }
    };

    window.requestAnimationFrame(countIt);
  };

  const observerOptions: IntersectionObserverInit = {
    threshold: 0.8,
  };

  const observer = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as CounterElement;

          // Сохраняем целевое число и обнуляем текст
          el.setAttribute("data-target", el.innerText);
          el.innerText = "0";

          startCounter(el);
          observer.unobserve(el);
        }
      });
    },
    observerOptions,
  );

  // Выбираем все элементы с классом .count-me
  const counterNodes = document.querySelectorAll<HTMLElement>(".count-me");
  counterNodes.forEach((n) => observer.observe(n));
};
