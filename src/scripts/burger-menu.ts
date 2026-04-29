import { getUser, logout } from "../auth";

export function initBurgerMenu(): void {
  const btn = document.getElementById("burger-btn") as HTMLButtonElement | null;
  const menu = document.getElementById("mobile-menu") as HTMLElement | null;
  const overlay = document.getElementById("nav-overlay") as HTMLElement | null;

  if (!btn || !menu || !overlay) return;

  function open(): void {
    menu!.classList.add("is-open");
    menu!.setAttribute("aria-hidden", "false");
    overlay!.classList.add("is-visible");
    btn!.classList.add("is-open");
    btn!.setAttribute("aria-expanded", "true");
    btn!.setAttribute("aria-label", "Close navigation menu");
    document.body.style.overflow = "hidden";
  }

  function close(): void {
    menu!.classList.remove("is-open");
    menu!.setAttribute("aria-hidden", "true");
    overlay!.classList.remove("is-visible");
    btn!.classList.remove("is-open");
    btn!.setAttribute("aria-expanded", "false");
    btn!.setAttribute("aria-label", "Open navigation menu");
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", () => {
    menu!.classList.contains("is-open") ? close() : open();
  });

  overlay.addEventListener("click", close);

  menu.querySelectorAll<HTMLAnchorElement>(".mobile-menu__link").forEach((link) => {
    link.addEventListener("click", close);
  });

  const user = getUser();
  const mobLogin = document.getElementById("mob-nav-login");
  const mobRegister = document.getElementById("mob-nav-register");
  const mobAdmin = document.getElementById("mob-nav-admin");
  const mobLogout = document.getElementById("mob-nav-logout") as HTMLButtonElement | null;

  if (user) {
    mobLogin?.classList.add("hidden");
    mobRegister?.classList.add("hidden");
    mobLogout?.classList.remove("hidden");
    mobLogout?.addEventListener("click", () => {
      logout();
      close();
    });
    if (user.role === "admin") {
      mobAdmin?.classList.remove("hidden");
    }
  } else {
    mobLogout?.classList.add("hidden");
    mobAdmin?.classList.add("hidden");
  }
}
