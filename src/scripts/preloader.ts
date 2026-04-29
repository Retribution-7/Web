const preloader = document.getElementById("preloader");

function hidePreloader(): void {
  if (!preloader) return;
  preloader.classList.add("is-hidden");
  preloader.addEventListener("transitionend", () => preloader.remove(), { once: true });
}

// If the page already finished loading (fast connection / cached assets)
// hide immediately; otherwise wait for the load event.
if (document.readyState === "complete") {
  hidePreloader();
} else {
  window.addEventListener("load", hidePreloader, { once: true });
}
