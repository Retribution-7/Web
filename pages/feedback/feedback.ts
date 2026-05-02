import "../../src/scripts/preloader";
import { showToast } from "../../src/scripts/toast";
import { fetchOrdersByUser, postFeedback } from "../../src/api";
import { requireAuth } from "../../src/auth";
import type { IFeedbackPayload } from "./types/feedback.interface";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_MESSAGE_LEN = 20;

// ─── Auth guard ───────────────────────────────────────────────────────────────

const currentUser = requireAuth();

// ─── DOM root ─────────────────────────────────────────────────────────────────

const root = document.getElementById("fb-content") as HTMLElement;

// ─── State ────────────────────────────────────────────────────────────────────

let isSubmitting = false;

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderState(icon: string, title: string, subtitle: string, actions = ""): void {
  root.innerHTML = `
    <div class="state-box">
      <span class="state-box__icon">${icon}</span>
      <h2 class="state-box__title">${title}</h2>
      <p class="state-box__subtitle">${subtitle}</p>
      ${actions}
    </div>
  `;
}

function renderAdminBlocked(): void {
  renderState(
    "🚫",
    "Доступ запрещён",
    "Администраторы не могут оставлять отзывы.",
    `<a href="/index.html" class="btn-secondary">На главную</a>`,
  );
}

function renderNoOrders(): void {
  renderState(
    "🛒",
    "Нет покупок",
    "Вы ещё не приобрели ни одного товара. Отзыв можно оставить только на купленный товар.",
    `<a href="/pages/catalog/catalog.html" class="btn-primary">Перейти в каталог</a>`,
  );
}

function renderSuccess(productTitle: string): void {
  renderState(
    "✅",
    "Отзыв отправлен!",
    `Спасибо за отзыв на «${productTitle}». Ваше мнение важно для нас.`,
    `<a href="/index.html" class="btn-primary">На главную</a>`,
  );
}

// ─── Error helpers ────────────────────────────────────────────────────────────

function setError(id: string, msg: string | null): void {
  const errEl = document.getElementById(`err-${id}`);
  const fieldEl = document.getElementById(id);
  if (errEl) {
    errEl.textContent = msg ?? "";
    errEl.classList.toggle("hidden", !msg);
  }
  fieldEl?.classList.toggle("input--error", !!msg);
}

function clearError(id: string): void {
  setError(id, null);
}

// ─── Validators ───────────────────────────────────────────────────────────────

function errProduct(v: string): string | null {
  return v ? null : "Выберите товар из списка";
}

function errMessage(v: string): string | null {
  if (!v.trim()) return "Введите текст отзыва";
  if (v.trim().length < MIN_MESSAGE_LEN)
    return `Отзыв должен содержать не менее ${MIN_MESSAGE_LEN} символов (сейчас: ${v.trim().length})`;
  return null;
}

function errRating(v: string): string | null {
  return v ? null : "Поставьте оценку";
}

// ─── Toast ────────────────────────────────────────────────────────────────────


// ─── Form renderer ────────────────────────────────────────────────────────────

interface PurchasedProduct {
  productId: number;
  title: string;
}

function renderForm(products: PurchasedProduct[]): void {
  const optionsHtml = products
    .map((p) => `<option value="${p.productId}">${p.title}</option>`)
    .join("");

  root.innerHTML = `
    <div class="fb-card__header">
      <h2 class="fb-card__title">Оставить отзыв</h2>
      <p class="fb-card__subtitle">
        Вы можете оставить отзыв только на приобретённые товары
      </p>
    </div>

    <form id="fb-form" novalidate class="fb-form">

      <!-- Product select -->
      <div class="field-group">
        <label class="field-label" for="product">
          Товар <span class="required-mark">*</span>
        </label>
        <select class="field-select" id="product">
          <option value="">— Выберите товар —</option>
          ${optionsHtml}
        </select>
        <p class="field-error hidden" id="err-product" role="alert"></p>
      </div>

      <!-- Rating -->
      <div class="field-group star-group">
        <span class="field-label">
          Оценка <span class="required-mark">*</span>
        </span>
        <div class="star-row" id="rating-row" role="radiogroup" aria-label="Оценка">
          <input type="radio" id="star5" name="rating" value="5" />
          <label for="star5" title="5 — Отлично">★</label>
          <input type="radio" id="star4" name="rating" value="4" />
          <label for="star4" title="4 — Хорошо">★</label>
          <input type="radio" id="star3" name="rating" value="3" />
          <label for="star3" title="3 — Нормально">★</label>
          <input type="radio" id="star2" name="rating" value="2" />
          <label for="star2" title="2 — Плохо">★</label>
          <input type="radio" id="star1" name="rating" value="1" />
          <label for="star1" title="1 — Очень плохо">★</label>
        </div>
        <p class="field-error hidden" id="err-rating" role="alert"></p>
      </div>

      <!-- Message -->
      <div class="field-group">
        <label class="field-label" for="message">
          Отзыв <span class="required-mark">*</span>
        </label>
        <textarea
          class="field-textarea"
          id="message"
          rows="5"
          placeholder="Поделитесь впечатлениями о товаре…"
          maxlength="1000"
        ></textarea>
        <p class="field-hint">Минимум ${MIN_MESSAGE_LEN} символов</p>
        <p class="field-error hidden" id="err-message" role="alert"></p>
      </div>

      <button id="btn-submit" type="submit" class="btn-submit" disabled>
        Отправить отзыв
      </button>

    </form>
  `;

  bindFormListeners(products);
}

// ─── Form listeners ───────────────────────────────────────────────────────────

function bindFormListeners(products: PurchasedProduct[]): void {
  const form = document.getElementById("fb-form") as HTMLFormElement;
  const productEl = document.getElementById("product") as HTMLSelectElement;
  const messageEl = document.getElementById("message") as HTMLTextAreaElement;
  const submitBtn = document.getElementById("btn-submit") as HTMLButtonElement;

  function selectedRating(): string {
    const checked = form.querySelector<HTMLInputElement>("input[name='rating']:checked");
    return checked ? checked.value : "";
  }

  function isFormValid(): boolean {
    return (
      errProduct(productEl.value) === null &&
      errMessage(messageEl.value) === null &&
      errRating(selectedRating()) === null
    );
  }

  function updateSubmit(): void {
    submitBtn.disabled = !isFormValid() || isSubmitting;
  }

  // Product select
  productEl.addEventListener("change", () => {
    clearError("product");
    updateSubmit();
  });
  productEl.addEventListener("blur", () => {
    setError("product", errProduct(productEl.value));
    updateSubmit();
  });

  // Rating
  form.querySelectorAll<HTMLInputElement>("input[name='rating']").forEach((radio) => {
    radio.addEventListener("change", () => {
      clearError("rating");
      updateSubmit();
    });
  });

  // Message
  messageEl.addEventListener("input", () => {
    clearError("message");
    updateSubmit();
  });
  messageEl.addEventListener("blur", () => {
    setError("message", errMessage(messageEl.value));
    updateSubmit();
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    setError("product", errProduct(productEl.value));
    setError("rating", errRating(selectedRating()));
    setError("message", errMessage(messageEl.value));

    if (!isFormValid()) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем…";

    const productId = Number(productEl.value);
    const productTitle =
      products.find((p) => p.productId === productId)?.title ?? "";

    const payload: IFeedbackPayload = {
      userId: currentUser.id,
      productId,
      message: messageEl.value.trim(),
      rating: Number(selectedRating()),
      createdAt: new Date().toISOString(),
    };

    try {
      await postFeedback(payload);
      renderSuccess(productTitle);
    } catch {
      showToast("Ошибка при отправке. Попробуйте снова.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Отправить отзыв";
    } finally {
      isSubmitting = false;
    }
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  if (currentUser.role === "admin") {
    renderAdminBlocked();
    return;
  }

  let orders;
  try {
    orders = await fetchOrdersByUser(currentUser.id);
  } catch {
    renderState("⚠️", "Ошибка загрузки", "Не удалось загрузить ваши заказы. Попробуйте позже.");
    return;
  }

  // Collect unique purchased products from all orders
  const seen = new Set<number>();
  const purchased: PurchasedProduct[] = [];

  for (const order of orders) {
    for (const item of order.products) {
      if (!seen.has(item.productId)) {
        seen.add(item.productId);
        purchased.push({ productId: item.productId, title: item.title });
      }
    }
  }

  if (purchased.length === 0) {
    renderNoOrders();
    return;
  }

  renderForm(purchased);
}

init();
