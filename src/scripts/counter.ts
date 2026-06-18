interface CounterElement extends HTMLElement {
  startTime?: number;
}

export const initCounters = (): void => {
  const animationDuration: number = 1000;

  const startCounter = (el: HTMLElement): void => {
    const targetAttr = el.getAttribute("data-target");
    if (!targetAttr) return;

    const target = parseInt(targetAttr, 10);
    let startTime: number | null = null;

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

          el.setAttribute("data-target", el.innerText);
          el.innerText = "0";

          startCounter(el);
          observer.unobserve(el);
        }
      });
    },
    observerOptions,
  );

  const counterNodes = document.querySelectorAll<HTMLElement>(".count-me");
  counterNodes.forEach((n) => observer.observe(n));
};
