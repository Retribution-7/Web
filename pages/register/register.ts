/**
 * register.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Registration page logic.
 * Validation runs on blur; errors clear on input. Submit enabled only when
 * every field is valid. Nickname is generated from name (max 5 attempts),
 * then falls back to manual input with debounced uniqueness check.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { checkNicknameAvailable, postUser } from "../../src/api";
import { getUser, setUser } from "../../src/auth";
import type { IUserPayload } from "./types/user.interface";

// ─── Redirect logged-in users away ────────────────────────────────────────────

if (getUser()) {
  window.location.replace("/");
  throw new Error("already authenticated");
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_REGEN = 5;

const COMMON_PASSWORDS = new Set([
  "password", "password1", "12345678", "123456789", "qwerty123",
  "qwerty1", "admin123", "letmein1", "welcome1", "monkey123",
  "iloveyou", "sunshine1", "princess", "superman1", "abc12345",
  "11111111", "00000000", "passw0rd", "dragon123", "master123",
]);

// Belarus mobile operators: 25 (life:), 29 (A1), 33 (МТС), 44 (МТС)
const BY_PHONE_RE =
  /^\+375[-\s]?\(?(25|29|33|44)\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Cyrillic → Latin transliteration for nickname generation
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
  ж: "zh", з: "z", и: "i", й: "j", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// ─── State ────────────────────────────────────────────────────────────────────

let regenUsed = 0;
let nicknameOk = false;
let debounceTimer = 0;
let isSubmitting = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const form = document.getElementById("register-form") as HTMLFormElement;
const firstNameEl = document.getElementById("firstName") as HTMLInputElement;
const lastNameEl = document.getElementById("lastName") as HTMLInputElement;
const middleNameEl = document.getElementById("middleName") as HTMLInputElement;
const nicknameEl = document.getElementById("nickname") as HTMLInputElement;
const genBtn = document.getElementById("btn-gen-nickname") as HTMLButtonElement;
const regenInfoEl = document.getElementById("regen-info") as HTMLElement;
const nicknameStatusEl = document.getElementById("nickname-status") as HTMLElement;
const phoneEl = document.getElementById("phone") as HTMLInputElement;
const emailEl = document.getElementById("email") as HTMLInputElement;
const birthDateEl = document.getElementById("birthDate") as HTMLInputElement;
const passwordEl = document.getElementById("password") as HTMLInputElement;
const confirmEl = document.getElementById("confirmPassword") as HTMLInputElement;
const togglePwdBtn = document.getElementById("btn-toggle-pwd") as HTMLButtonElement;
const agreementEl = document.getElementById("agreement") as HTMLInputElement;
const submitBtn = document.getElementById("btn-submit") as HTMLButtonElement;

// ─── Validators ───────────────────────────────────────────────────────────────

function errFirstName(v: string): string | null {
  return v.trim().length >= 2
    ? null
    : "Введите имя (минимум 2 символа)";
}

function errLastName(v: string): string | null {
  return v.trim().length >= 2
    ? null
    : "Введите фамилию (минимум 2 символа)";
}

function errNickname(): string | null {
  if (!nicknameEl.value.trim()) return "Сгенерируйте или введите никнейм";
  if (!nicknameOk) return "Проверьте доступность никнейма";
  return null;
}

function errPhone(v: string): string | null {
  if (!v.trim()) return "Введите номер телефона";
  return BY_PHONE_RE.test(v.trim())
    ? null
    : "Формат: +375 (29) XXX-XX-XX  •  Операторы: 25, 29, 33, 44";
}

function errEmail(v: string): string | null {
  if (!v.trim()) return "Введите email";
  return EMAIL_RE.test(v.trim()) ? null : "Некорректный email-адрес";
}

function errBirthDate(v: string): string | null {
  if (!v) return "Введите дату рождения";
  const birth = new Date(v);
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 16);
  return birth <= limit ? null : "Возраст должен быть не менее 16 лет";
}

function errPassword(v: string): string | null {
  if (!v) return "Введите пароль";
  if (v.length < 8 || v.length > 20)
    return "Пароль должен содержать от 8 до 20 символов";
  if (!/[A-Z]/.test(v)) return "Нужна хотя бы одна заглавная буква";
  if (!/[a-z]/.test(v)) return "Нужна хотя бы одна строчная буква";
  if (!/\d/.test(v)) return "Нужна хотя бы одна цифра";
  if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(v))
    return "Нужен хотя бы один специальный символ (!@#$…)";
  if (COMMON_PASSWORDS.has(v.toLowerCase()))
    return "Пароль слишком распространённый, выберите другой";
  return null;
}

function errConfirm(v: string): string | null {
  if (!v) return "Повторите пароль";
  return v === passwordEl.value ? null : "Пароли не совпадают";
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

// ─── Form validity ────────────────────────────────────────────────────────────

function isFormValid(): boolean {
  return (
    errFirstName(firstNameEl.value) === null &&
    errLastName(lastNameEl.value) === null &&
    errNickname() === null &&
    errPhone(phoneEl.value) === null &&
    errEmail(emailEl.value) === null &&
    errBirthDate(birthDateEl.value) === null &&
    errPassword(passwordEl.value) === null &&
    errConfirm(confirmEl.value) === null &&
    agreementEl.checked
  );
}

function updateSubmit(): void {
  submitBtn.disabled = !isFormValid() || isSubmitting;
}

// ─── Nickname helpers ─────────────────────────────────────────────────────────

function translit(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((c) => TRANSLIT[c] ?? c)
    .join("");
}

function buildNickname(first: string, last: string): string {
  const f = translit(first.trim()).replace(/[^a-z]/g, "") || "u";
  const l = translit(last.trim()).replace(/[^a-z]/g, "") || "n";
  const len1 = Math.floor(Math.random() * 3) + 1; // 1–3
  const len2 = Math.floor(Math.random() * 3) + 1; // 1–3
  const num = Math.floor(Math.random() * 990) + 10; // 10–999
  const suffixes = ["", "x", "k", "z", "_dev", "_pro", "q", "w"];
  const sfx = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${f.slice(0, len1)}${l.slice(0, len2)}${num}${sfx}`;
}

function setNicknameStatus(
  state: "ok" | "err" | "checking" | "none",
  text = "",
): void {
  nicknameStatusEl.textContent = text;
  nicknameStatusEl.className = "nickname-status";
  if (state !== "none") nicknameStatusEl.classList.add(`nickname-status--${state}`);
}

function updateRegenUI(): void {
  const remaining = MAX_REGEN - regenUsed;
  const exhausted = regenUsed >= MAX_REGEN;

  if (exhausted) {
    regenInfoEl.textContent = "Лимит исчерпан — введите никнейм вручную";
    genBtn.disabled = true;
    genBtn.textContent = "Лимит исчерпан";
    nicknameEl.readOnly = false;
    nicknameEl.classList.remove("input--readonly");
    nicknameEl.placeholder = "Введите никнейм вручную";
  } else {
    regenInfoEl.textContent = `Осталось попыток: ${remaining} из ${MAX_REGEN}`;
    genBtn.textContent = regenUsed === 0 ? "Сгенерировать" : "Перегенерировать";
    genBtn.disabled = false;
  }
}

function resetNicknameState(): void {
  regenUsed = 0;
  nicknameOk = false;
  nicknameEl.value = "";
  nicknameEl.readOnly = true;
  nicknameEl.classList.add("input--readonly");
  nicknameEl.placeholder = "Будет сгенерирован…";
  genBtn.disabled = false;
  genBtn.textContent = "Сгенерировать";
  regenInfoEl.textContent = `Доступно попыток: ${MAX_REGEN}`;
  setNicknameStatus("none");
  clearError("nickname");
  updateSubmit();
}

// ─── Nickname generation ──────────────────────────────────────────────────────

genBtn.addEventListener("click", async () => {
  const first = firstNameEl.value.trim();
  const last = lastNameEl.value.trim();

  if (!first) {
    setError("firstName", errFirstName(firstNameEl.value));
    return;
  }
  if (!last) {
    setError("lastName", errLastName(lastNameEl.value));
    return;
  }
  if (regenUsed >= MAX_REGEN) return;

  genBtn.disabled = true;
  genBtn.textContent = "Проверяем…";
  nicknameOk = false;
  setNicknameStatus("checking", "Проверяем доступность…");

  const candidate = buildNickname(first, last);
  nicknameEl.value = candidate;

  try {
    const available = await checkNicknameAvailable(candidate);
    nicknameOk = available;

    if (available) {
      setNicknameStatus("ok", "✓ Доступен");
      clearError("nickname");
    } else {
      setNicknameStatus("err", "✗ Занят");
      setError("nickname", "Никнейм занят — попробуйте перегенерировать");
    }
  } catch {
    setNicknameStatus("none");
    setError("nickname", "Не удалось проверить доступность");
  } finally {
    regenUsed++;
    updateRegenUI();
    updateSubmit();
  }
});

// Manual nickname input (after regeneration limit is exhausted)
nicknameEl.addEventListener("input", () => {
  if (nicknameEl.readOnly) return;

  nicknameOk = false;
  setNicknameStatus("none");
  clearError("nickname");
  updateSubmit();

  clearTimeout(debounceTimer);
  const val = nicknameEl.value.trim();
  if (!val) return;

  setNicknameStatus("checking", "Проверяем…");

  debounceTimer = window.setTimeout(async () => {
    try {
      const available = await checkNicknameAvailable(val);
      nicknameOk = available;
      if (available) {
        setNicknameStatus("ok", "✓ Доступен");
        clearError("nickname");
      } else {
        setNicknameStatus("err", "✗ Занят");
        setError("nickname", "Никнейм уже занят");
      }
    } catch {
      setNicknameStatus("none");
    }
    updateSubmit();
  }, 600);
});

// ─── Name fields → reset nickname ─────────────────────────────────────────────

[firstNameEl, lastNameEl].forEach((el) => {
  el.addEventListener("input", () => {
    clearError(el.id);
    resetNicknameState();
  });
  el.addEventListener("blur", () => {
    const err =
      el === firstNameEl
        ? errFirstName(el.value)
        : errLastName(el.value);
    setError(el.id, err);
    updateSubmit();
  });
});

// ─── Other field listeners ────────────────────────────────────────────────────

// Clear error on input, validate on blur
function bindField(
  el: HTMLInputElement,
  validator: (v: string) => string | null,
): void {
  el.addEventListener("input", () => {
    clearError(el.id);
    updateSubmit();
  });
  el.addEventListener("blur", () => {
    setError(el.id, validator(el.value));
    updateSubmit();
  });
}

bindField(phoneEl, errPhone);
bindField(emailEl, errEmail);
bindField(birthDateEl, errBirthDate);

passwordEl.addEventListener("input", () => {
  clearError("password");
  // Re-evaluate confirm live if already filled
  if (confirmEl.value) setError("confirmPassword", errConfirm(confirmEl.value));
  updateSubmit();
});
passwordEl.addEventListener("blur", () => {
  setError("password", errPassword(passwordEl.value));
  if (confirmEl.value) setError("confirmPassword", errConfirm(confirmEl.value));
  updateSubmit();
});

bindField(confirmEl, errConfirm);

// Prevent paste into confirm field
confirmEl.addEventListener("paste", (e) => e.preventDefault());

// Toggle password visibility
togglePwdBtn.addEventListener("click", () => {
  const isText = passwordEl.type === "text";
  passwordEl.type = isText ? "password" : "text";
  togglePwdBtn.textContent = isText ? "👁" : "🙈";
  togglePwdBtn.setAttribute("aria-label", isText ? "Показать пароль" : "Скрыть пароль");
});

// Middle name: no validation, just clear on input
middleNameEl.addEventListener("input", () => updateSubmit());

// Agreement
agreementEl.addEventListener("change", updateSubmit);

// ─── Submit ───────────────────────────────────────────────────────────────────

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Full validation pass (guards against programmatic submit)
  setError("firstName", errFirstName(firstNameEl.value));
  setError("lastName", errLastName(lastNameEl.value));
  setError("nickname", errNickname());
  setError("phone", errPhone(phoneEl.value));
  setError("email", errEmail(emailEl.value));
  setError("birthDate", errBirthDate(birthDateEl.value));
  setError("password", errPassword(passwordEl.value));
  setError("confirmPassword", errConfirm(confirmEl.value));

  if (!isFormValid()) return;

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Регистрируем…";

  const firstName = firstNameEl.value.trim();

  const payload: IUserPayload = {
    firstName,
    lastName: lastNameEl.value.trim(),
    nickname: nicknameEl.value.trim(),
    email: emailEl.value.trim().toLowerCase(),
    phone: phoneEl.value.trim(),
    password: passwordEl.value,
    role: "client",
    birthDate: birthDateEl.value,
    ...(middleNameEl.value.trim() ? { middleName: middleNameEl.value.trim() } : {}),
  };

  try {
    const user = await postUser(payload);
    setUser(user);
    showSuccess(firstName);
  } catch {
    showToast("Ошибка при регистрации. Попробуйте снова.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Зарегистрироваться";
  } finally {
    isSubmitting = false;
  }
});

// ─── Success screen ───────────────────────────────────────────────────────────

function showSuccess(name: string): void {
  form.innerHTML = `
    <div class="success-state">
      <span class="success-state__icon">✅</span>
      <h2 class="success-state__title">Регистрация завершена!</h2>
      <p class="success-state__subtitle">Добро пожаловать, ${name}!</p>
      <a href="../catalog/catalog.html" class="btn-primary">Перейти в каталог</a>
    </div>
  `;
}

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

// Set max date for birthDate to 16 years ago from today
const maxBirthDate = new Date();
maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 16);
birthDateEl.max = maxBirthDate.toISOString().split("T")[0];

// Set min date (no one is older than 120 years)
const minBirthDate = new Date();
minBirthDate.setFullYear(minBirthDate.getFullYear() - 120);
birthDateEl.min = minBirthDate.toISOString().split("T")[0];

updateSubmit();
