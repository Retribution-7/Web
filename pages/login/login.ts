import "../../src/scripts/preloader";
import { fetchUserByEmail } from "../../src/api";
import { getUser, setUser } from "../../src/auth";

// ─── Redirect logged-in users away ────────────────────────────────────────────

if (getUser()) {
  window.location.replace("/");
  throw new Error("already authenticated");
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ─── State ────────────────────────────────────────────────────────────────────

let isSubmitting = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const form = document.getElementById("login-form") as HTMLFormElement;
const emailEl = document.getElementById("email") as HTMLInputElement;
const passwordEl = document.getElementById("password") as HTMLInputElement;
const togglePwdBtn = document.getElementById("btn-toggle-pwd") as HTMLButtonElement;
const submitBtn = document.getElementById("btn-submit") as HTMLButtonElement;
const credentialsErrEl = document.getElementById("err-credentials") as HTMLElement;

// ─── Validators ───────────────────────────────────────────────────────────────

function errEmail(v: string): string | null {
  if (!v.trim()) return "Введите email";
  return EMAIL_RE.test(v.trim()) ? null : "Некорректный email-адрес";
}

function errPassword(v: string): string | null {
  return v ? null : "Введите пароль";
}

// ─── Error helpers ────────────────────────────────────────────────────────────

function setError(id: string, msg: string | null): void {
  const errEl = document.getElementById(`err-${id}`);
  const inputEl = document.getElementById(id);
  if (errEl) {
    errEl.textContent = msg ?? "";
    errEl.classList.toggle("hidden", !msg);
  }
  inputEl?.classList.toggle("input--error", !!msg);
}

function clearError(id: string): void {
  setError(id, null);
}

function setCredentialsError(msg: string | null): void {
  credentialsErrEl.textContent = msg ?? "";
  credentialsErrEl.classList.toggle("hidden", !msg);
}

// ─── Form validity ────────────────────────────────────────────────────────────

function isFormValid(): boolean {
  return errEmail(emailEl.value) === null && errPassword(passwordEl.value) === null;
}

function updateSubmit(): void {
  submitBtn.disabled = !isFormValid() || isSubmitting;
}

// ─── Field listeners ──────────────────────────────────────────────────────────

function bindField(
  el: HTMLInputElement,
  validator: (v: string) => string | null,
): void {
  el.addEventListener("input", () => {
    clearError(el.id);
    setCredentialsError(null);
    updateSubmit();
  });
  el.addEventListener("blur", () => {
    setError(el.id, validator(el.value));
    updateSubmit();
  });
}

bindField(emailEl, errEmail);
bindField(passwordEl, errPassword);

// Toggle password visibility
togglePwdBtn.addEventListener("click", () => {
  const isText = passwordEl.type === "text";
  passwordEl.type = isText ? "password" : "text";
  togglePwdBtn.textContent = isText ? "👁" : "🙈";
  togglePwdBtn.setAttribute("aria-label", isText ? "Показать пароль" : "Скрыть пароль");
});

// ─── Submit ───────────────────────────────────────────────────────────────────

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  setError("email", errEmail(emailEl.value));
  setError("password", errPassword(passwordEl.value));
  setCredentialsError(null);

  if (!isFormValid()) return;

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Входим…";

  try {
    const user = await fetchUserByEmail(emailEl.value.trim().toLowerCase());

    if (!user || user.password !== passwordEl.value) {
      setCredentialsError("Неверный email или пароль");
      return;
    }

    setUser(user);
    window.location.replace("/");
  } catch {
    showToast("Ошибка соединения. Попробуйте снова.", "error");
  } finally {
    isSubmitting = false;
    submitBtn.disabled = !isFormValid();
    submitBtn.textContent = "Войти";
  }
});

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg: string, type: "success" | "error" = "success"): void {
  document.getElementById("__toast")?.remove();
  const t = document.createElement("div");
  t.id = "__toast";
  t.className = `toast opacity-0 translate-y-2 ${
    type === "error" ? "bg-red-500" : "bg-[#191919]"
  }`;
  t.textContent = msg;
  document.body.appendChild(t);

  requestAnimationFrame(() => {
    t.classList.replace("opacity-0", "opacity-100");
    t.classList.replace("translate-y-2", "translate-y-0");
  });

  setTimeout(() => {
    t.classList.replace("opacity-100", "opacity-0");
    t.addEventListener("transitionend", () => t.remove(), { once: true });
  }, 2600);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

updateSubmit();
