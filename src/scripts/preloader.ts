const preloader = document.getElementById("preloader");

function hidePreloader(): void {
  if (!preloader) return;
  preloader.classList.add("is-hidden");
  preloader.addEventListener("transitionend", () => preloader.remove(), { once: true });
}

if (document.readyState === "complete") {
  hidePreloader();
} else {
  window.addEventListener("load", hidePreloader, { once: true });
}
