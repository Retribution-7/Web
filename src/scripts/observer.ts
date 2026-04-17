export const initScrollObserver = (
  targetSelector: string = ".animate-typing",
  activeClass: string = "active",
  threshold: number = 0.5,
): void => {
  const observerOptions: IntersectionObserverInit = {
    root: null,
    threshold: threshold,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(activeClass);

        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const targets = document.querySelectorAll(targetSelector);
  targets.forEach((el) => observer.observe(el));
};
