export let currentTheme: "light" | "dark" = "dark";

const lightVars: Record<string, string> = {
  "--body-color": "#f3f4f6",
  "--text-color": "#191919",
  "--hover-color": "#FF4D01",
  "--card-bg": "#ffffff",
  "--border-color": "#e5e7eb",
  "--input-bg": "#ffffff",
  "--header-bg": "#ffffff",
  "--header-text": "#191919",
  "--footer-bg": "#f3f4f6",
  "--section-alt-bg": "#f9fafb",
  "--text-secondary": "#605E5D",
  "--text-muted": "#989899",
  "--surface-alt": "#f9fafb",
};

const darkVars: Record<string, string> = {
  "--body-color": "#191919",
  "--text-color": "#ffffff",
  "--hover-color": "#FF4D01",
  "--card-bg": "#262626",
  "--border-color": "#404040",
  "--input-bg": "#262626",
  "--header-bg": "#191919",
  "--header-text": "#ffffff",
  "--footer-bg": "#000000",
  "--section-alt-bg": "#0f0f0f",
  "--text-secondary": "#b0b0b0",
  "--text-muted": "#888888",
  "--surface-alt": "#1f1f1f",
};

const themeImages: Record<string, Record<string, string>> = {
  light: {
    "/backgrounds/wrapper-img.png": "/backgrounds/wrapper-img-light.png",
  },
  dark: {
    "/backgrounds/wrapper-img.png": "/backgrounds/wrapper-img.png",
  },
};

function applyVars(vars: Record<string, string>): void {
  for (const [key, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function swapImages(theme: "light" | "dark"): void {
  const mapping = themeImages[theme];
  if (!mapping) return;
  document.querySelectorAll<HTMLImageElement>(".theme-img").forEach((img) => {
    const src = img.getAttribute("src");
    if (src && mapping[src]) {
      img.src = mapping[src];
    }
  });
  document.querySelectorAll<HTMLElement>("[data-theme-bg]").forEach((el) => {
    const original = el.getAttribute("data-theme-bg");
    if (original && mapping[original]) {
      el.style.backgroundImage = `url('${mapping[original]}')`;
    }
  });
}

export function setTheme(theme: "light" | "dark"): void {
  currentTheme = theme;
  applyVars(theme === "light" ? lightVars : darkVars);
  swapImages(theme);
  document.body.classList.toggle("dark-theme", theme === "dark");
  document.body.classList.toggle("light-theme", theme === "light");
}

export function toggleTheme(): void {
  setTheme(currentTheme === "light" ? "dark" : "light");
}
