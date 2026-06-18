export function initParallax(): void {
  const section = document.getElementById("parallax-scene");
  if (!section) return;

  const layers = section.querySelectorAll<HTMLElement>(
    "[data-parallax-strength]",
  );
  if (!layers.length) return;

  let ticking = false;

  const sectionEl = section;
  function update(): void {
    const rect = sectionEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const sectionH = sectionEl.offsetHeight;

    const progress = (vh - rect.top) / (vh + sectionH);
    const t = progress - 0.5;

    const scale = window.innerWidth < 768 ? 0.4 : 1;

    layers.forEach((layer) => {
      const strength = parseFloat(layer.dataset.parallaxStrength ?? "0");
      layer.style.transform = `translateY(${t * strength * scale}px)`;
    });

    ticking = false;
  }

  function onScroll(): void {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  // Add/remove the scroll listener only while the section is in (or near) the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        update();
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    },
    { rootMargin: "200px" },
  );

  observer.observe(section);
}
