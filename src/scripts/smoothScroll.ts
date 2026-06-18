function getHeaderOffset(): number {
  const header = document.querySelector("header");
  return header ? header.clientHeight : 80;
}

function smoothScrollTo(target: HTMLElement) {
  const offset = getHeaderOffset();
  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top,
    behavior: "smooth",
  });
}

export function initSmoothScroll() {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");

      if (!href || href === "#") return;

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();
        smoothScrollTo(target as HTMLElement);
      }
    });
  });
}

export function handleAnchorOnLoad() {
  const hash = window.location.hash;

  if (hash) {
    const target = document.querySelector(hash);

    if (target) {
      setTimeout(() => {
        smoothScrollTo(target as HTMLElement);
      }, 100);
    }
  }
}
