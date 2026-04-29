import "../../src/scripts/preloader";
import type { IProduct } from "../catalog/types/product.interface";
import type { IFeedback } from "../feedback/types/feedback.interface";
import type { IUser } from "../register/types/user.interface";
import { requireAdmin } from "../../src/auth";
import {
  fetchAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchAllUsers,
  fetchFeedbackByProduct,
  fetchFeedbackByUser,
  deleteFeedback,
} from "../../src/api";

// ─── Admin guard ──────────────────────────────────────────────────────────────

const currentUser = requireAdmin();

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const tableContainer = document.getElementById(
  "products-table-container",
) as HTMLElement;
const btnNew = document.getElementById("btn-new-product") as HTMLButtonElement;
const modalOverlay = document.getElementById("modal-overlay") as HTMLElement;
const modalTitle = document.getElementById("modal-title") as HTMLElement;
const btnModalClose = document.getElementById(
  "btn-modal-close",
) as HTMLButtonElement;
const form = document.getElementById("product-form") as HTMLFormElement;
const btnSubmit = document.getElementById("btn-submit") as HTMLButtonElement;

const fTitle = document.getElementById("f-title") as HTMLInputElement;
const fDesc = document.getElementById("f-desc") as HTMLTextAreaElement;
const fCategory = document.getElementById("f-category") as HTMLSelectElement;
const fPrice = document.getElementById("f-price") as HTMLInputElement;
const fRating = document.getElementById("f-rating") as HTMLInputElement;
const fImage = document.getElementById("f-image") as HTMLInputElement;

const errTitle = document.getElementById("err-title") as HTMLElement;
const errDesc = document.getElementById("err-desc") as HTMLElement;
const errCategory = document.getElementById("err-category") as HTMLElement;
const errPrice = document.getElementById("err-price") as HTMLElement;
const errRating = document.getElementById("err-rating") as HTMLElement;
const errImage = document.getElementById("err-image") as HTMLElement;

// ─── State ────────────────────────────────────────────────────────────────────

let editingId: number | null = null;

// ─── Validation ───────────────────────────────────────────────────────────────

interface FieldResult {
  valid: boolean;
  message: string;
}

const validators: Array<{
  validate: () => FieldResult;
  errEl: HTMLElement;
  inputEl: HTMLElement;
}> = [
  {
    validate: () => {
      const v = fTitle.value.trim();
      if (!v) return { valid: false, message: "Обязательное поле" };
      if (v.length < 3) return { valid: false, message: "Минимум 3 символа" };
      return { valid: true, message: "" };
    },
    errEl: errTitle,
    inputEl: fTitle,
  },
  {
    validate: () => {
      const v = fDesc.value.trim();
      if (!v) return { valid: false, message: "Обязательное поле" };
      return { valid: true, message: "" };
    },
    errEl: errDesc,
    inputEl: fDesc,
  },
  {
    validate: () => {
      if (!fCategory.value)
        return { valid: false, message: "Выберите категорию" };
      return { valid: true, message: "" };
    },
    errEl: errCategory,
    inputEl: fCategory,
  },
  {
    validate: () => {
      const v = parseFloat(fPrice.value);
      if (!fPrice.value.trim()) return { valid: false, message: "Обязательное поле" };
      if (isNaN(v) || v <= 0) return { valid: false, message: "Цена должна быть больше 0" };
      return { valid: true, message: "" };
    },
    errEl: errPrice,
    inputEl: fPrice,
  },
  {
    validate: () => {
      const v = parseFloat(fRating.value);
      if (!fRating.value.trim()) return { valid: false, message: "Обязательное поле" };
      if (isNaN(v) || v < 1 || v > 5) return { valid: false, message: "Рейтинг от 1 до 5" };
      return { valid: true, message: "" };
    },
    errEl: errRating,
    inputEl: fRating,
  },
  {
    validate: () => {
      if (!fImage.value.trim()) return { valid: false, message: "Обязательное поле" };
      return { valid: true, message: "" };
    },
    errEl: errImage,
    inputEl: fImage,
  },
];

function applyError(
  errEl: HTMLElement,
  inputEl: HTMLElement,
  message: string,
): void {
  errEl.textContent = message;
  if (message) {
    inputEl.classList.add("input--error");
  } else {
    inputEl.classList.remove("input--error");
  }
}

function runValidation(showErrors = true): boolean {
  let allValid = true;
  for (const { validate, errEl, inputEl } of validators) {
    const result = validate();
    if (!result.valid) allValid = false;
    if (showErrors) applyError(errEl, inputEl, result.message);
  }
  return allValid;
}

function syncSubmitBtn(): void {
  btnSubmit.disabled = !runValidation(false);
}

[fTitle, fDesc, fCategory, fPrice, fRating, fImage].forEach((el) =>
  el.addEventListener("input", syncSubmitBtn),
);

// ─── Modal ────────────────────────────────────────────────────────────────────

function openModal(product?: IProduct): void {
  editingId = product?.id ?? null;

  modalTitle.textContent = product ? "Редактировать товар" : "Новый товар";
  btnSubmit.textContent = product ? "Сохранить изменения" : "Создать";

  form.reset();
  for (const { errEl, inputEl } of validators) {
    errEl.textContent = "";
    inputEl.classList.remove("input--error");
  }

  if (product) {
    fTitle.value = product.title;
    fDesc.value = product.description;
    fCategory.value = product.category;
    fPrice.value = String(product.price);
    fRating.value = String(product.rating);
    fImage.value = product.imageUrl;
  }

  syncSubmitBtn();
  modalOverlay.classList.remove("hidden");
  modalOverlay.removeAttribute("aria-hidden");
  fTitle.focus();
}

function closeModal(): void {
  modalOverlay.classList.add("hidden");
  modalOverlay.setAttribute("aria-hidden", "true");
  editingId = null;
}

btnNew.addEventListener("click", () => openModal());
btnModalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.classList.contains("hidden"))
    closeModal();
});

// ─── Table render ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  interior: "Интерьер",
  exterior: "Экстерьер",
  materials: "Материалы",
};

function categoryBadge(cat: string): string {
  const label = CATEGORY_LABELS[cat] ?? cat;
  return `<span class="category-badge category-badge--${cat}">${label}</span>`;
}

function renderTable(products: IProduct[]): void {
  if (products.length === 0) {
    tableContainer.innerHTML = `
      <div class="state-box">
        <span class="state-box__icon">📦</span>
        <h3 class="state-box__title">Нет товаров</h3>
        <p class="state-box__subtitle">Создайте первый товар, нажав кнопку выше</p>
      </div>`;
    return;
  }

  tableContainer.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Фото</th>
            <th>Название</th>
            <th>Категория</th>
            <th>Цена</th>
            <th>Рейтинг</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          ${products
            .map(
              (p) => `
            <tr>
              <td class="text-gray-400 text-xs">${p.id}</td>
              <td>
                <img src="${p.imageUrl}" alt="${p.title}" class="product-thumb" loading="lazy" />
              </td>
              <td>
                <div class="font-semibold">${p.title}</div>
                <div class="text-xs text-[#989899] mt-0.5 max-w-[200px] truncate">${p.description}</div>
              </td>
              <td>${categoryBadge(p.category)}</td>
              <td class="font-semibold whitespace-nowrap">$${p.price}</td>
              <td>
                <span class="inline-flex items-center gap-1 font-semibold text-[#FF4D01]">
                  ★ ${p.rating}
                </span>
              </td>
              <td class="whitespace-nowrap">
                <button class="btn-edit" data-action="edit" data-id="${p.id}">
                  Изменить
                </button>
                <button class="btn-delete" data-action="delete" data-id="${p.id}">
                  Удалить
                </button>
              </td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  tableContainer
    .querySelectorAll<HTMLButtonElement>("[data-action]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === "edit") {
          const product = products.find((p) => p.id === id);
          if (product) openModal(product);
        } else {
          handleDelete(id, btn);
        }
      });
    });
}

// ─── Load products ────────────────────────────────────────────────────────────

async function loadProducts(): Promise<void> {
  tableContainer.innerHTML = `
    <div class="state-box">
      <span class="state-box__icon">⏳</span>
      <h3 class="state-box__title">Загрузка...</h3>
    </div>`;

  try {
    const products = await fetchAllProducts();
    renderTable(products);
  } catch {
    tableContainer.innerHTML = `
      <div class="state-box">
        <span class="state-box__icon">⚠️</span>
        <h3 class="state-box__title">Ошибка загрузки</h3>
        <p class="state-box__subtitle">Убедитесь, что JSON Server запущен на порту 3000</p>
      </div>`;
  }
}

// ─── Form submit ──────────────────────────────────────────────────────────────

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!runValidation(true)) return;

  const payload: Omit<IProduct, "id"> = {
    title: fTitle.value.trim(),
    description: fDesc.value.trim(),
    category: fCategory.value as IProduct["category"],
    price: parseFloat(fPrice.value),
    rating: parseFloat(fRating.value),
    imageUrl: fImage.value.trim(),
  };

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Сохраняем...";

  try {
    if (editingId !== null) {
      await updateProduct(editingId, payload);
      showToast("Товар обновлён");
    } else {
      await createProduct(payload);
      showToast("Товар создан");
    }
    closeModal();
    await loadProducts();
  } catch {
    showToast("Ошибка при сохранении", "error");
    btnSubmit.disabled = false;
    btnSubmit.textContent =
      editingId !== null ? "Сохранить изменения" : "Создать";
  }
});

// ─── Delete ───────────────────────────────────────────────────────────────────

async function handleDelete(id: number, btn: HTMLButtonElement): Promise<void> {
  if (!confirm("Удалить этот товар? Это действие необратимо.")) return;

  btn.disabled = true;
  btn.textContent = "...";

  try {
    await deleteProduct(id);
    showToast("Товар удалён");
    await loadProducts();
  } catch {
    showToast("Ошибка при удалении", "error");
    btn.disabled = false;
    btn.textContent = "Удалить";
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  document.getElementById("__toast")?.remove();
  const toast = document.createElement("div");
  toast.id = "__toast";
  toast.className = `toast opacity-0 translate-y-2 ${
    type === "error" ? "bg-red-500" : "bg-[#191919]"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.replace("opacity-0", "opacity-100");
    toast.classList.replace("translate-y-2", "translate-y-0");
  });

  setTimeout(() => {
    toast.classList.replace("opacity-100", "opacity-0");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, 2600);
}

// ─── Feedback management ──────────────────────────────────────────────────────

const filterProduct = document.getElementById("filter-product") as HTMLSelectElement;
const filterUser = document.getElementById("filter-user") as HTMLSelectElement;
const feedbackContainer = document.getElementById("feedback-table-container") as HTMLElement;

let cachedProducts: IProduct[] = [];
let cachedUsers: IUser[] = [];

// ─── Boot ─────────────────────────────────────────────────────────────────────

loadProducts();
initFeedbackSection();

async function initFeedbackSection(): Promise<void> {
  feedbackContainer.innerHTML = `
    <div class="state-box">
      <span class="state-box__icon">💬</span>
      <h3 class="state-box__title">Выберите фильтр</h3>
      <p class="state-box__subtitle">Выберите товар или пользователя для просмотра отзывов</p>
    </div>`;

  try {
    const [products, users] = await Promise.all([fetchAllProducts(), fetchAllUsers()]);
    cachedProducts = products;
    cachedUsers = users;

    products.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = String(p.id);
      opt.textContent = p.title;
      filterProduct.appendChild(opt);
    });

    users.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = String(u.id);
      opt.textContent = `${u.nickname} (${u.firstName} ${u.lastName})`;
      filterUser.appendChild(opt);
    });
  } catch {
    showToast("Ошибка загрузки данных для фильтров", "error");
  }

  filterProduct.addEventListener("change", () => {
    if (filterProduct.value) {
      filterUser.value = "";
      loadFeedback("product", Number(filterProduct.value));
    } else {
      showFeedbackPlaceholder();
    }
  });

  filterUser.addEventListener("change", () => {
    if (filterUser.value) {
      filterProduct.value = "";
      loadFeedback("user", Number(filterUser.value));
    } else {
      showFeedbackPlaceholder();
    }
  });
}

function showFeedbackPlaceholder(): void {
  feedbackContainer.innerHTML = `
    <div class="state-box">
      <span class="state-box__icon">💬</span>
      <h3 class="state-box__title">Выберите фильтр</h3>
      <p class="state-box__subtitle">Выберите товар или пользователя для просмотра отзывов</p>
    </div>`;
}

async function loadFeedback(by: "product" | "user", id: number): Promise<void> {
  feedbackContainer.innerHTML = `
    <div class="state-box">
      <span class="state-box__icon">⏳</span>
      <h3 class="state-box__title">Загрузка...</h3>
    </div>`;

  try {
    const items =
      by === "product"
        ? await fetchFeedbackByProduct(id)
        : await fetchFeedbackByUser(id);
    renderFeedbackTable(items);
  } catch {
    feedbackContainer.innerHTML = `
      <div class="state-box">
        <span class="state-box__icon">⚠️</span>
        <h3 class="state-box__title">Ошибка загрузки отзывов</h3>
      </div>`;
  }
}

function renderFeedbackTable(items: IFeedback[]): void {
  if (items.length === 0) {
    feedbackContainer.innerHTML = `
      <div class="state-box">
        <span class="state-box__icon">🔍</span>
        <h3 class="state-box__title">Отзывов нет</h3>
        <p class="state-box__subtitle">По выбранному фильтру отзывов не найдено</p>
      </div>`;
    return;
  }

  const rows = items
    .map((fb) => {
      const product = cachedProducts.find((p) => p.id === fb.productId);
      const user = cachedUsers.find((u) => u.id === fb.userId);
      const rating = fb.rating ?? 0;
      const stars = rating > 0
        ? "★".repeat(rating) + "☆".repeat(5 - rating)
        : "—";
      const date = new Date(fb.createdAt).toLocaleDateString("ru-RU");

      return `
        <tr data-feedback-id="${fb.id}">
          <td class="text-gray-400 text-xs">${fb.id}</td>
          <td class="font-semibold">${product?.title ?? `#${fb.productId}`}</td>
          <td>
            <div class="font-semibold">${user?.nickname ?? `#${fb.userId}`}</div>
            <div class="text-xs text-[#989899]">${user ? `${user.firstName} ${user.lastName}` : ""}</div>
          </td>
          <td><span class="rating-stars">${stars}</span></td>
          <td class="max-w-[260px]">
            <div class="text-sm truncate" title="${fb.message.replace(/"/g, "&quot;")}">${fb.message}</div>
          </td>
          <td class="text-xs text-[#989899] whitespace-nowrap">${date}</td>
          <td>
            <button class="btn-delete" data-action="delete-feedback" data-id="${fb.id}">
              Удалить
            </button>
          </td>
        </tr>`;
    })
    .join("");

  feedbackContainer.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Товар</th>
            <th>Пользователь</th>
            <th>Рейтинг</th>
            <th>Сообщение</th>
            <th>Дата</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  feedbackContainer
    .querySelectorAll<HTMLButtonElement>("[data-action='delete-feedback']")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        handleDeleteFeedback(id, btn);
      });
    });
}

async function handleDeleteFeedback(id: number, btn: HTMLButtonElement): Promise<void> {
  if (!confirm("Удалить этот отзыв? Это действие необратимо.")) return;

  btn.disabled = true;
  btn.textContent = "...";

  try {
    await deleteFeedback(id);
    const row = feedbackContainer.querySelector(`tr[data-feedback-id="${id}"]`);
    row?.remove();

    const remaining = feedbackContainer.querySelectorAll("tbody tr").length;
    if (remaining === 0) {
      feedbackContainer.innerHTML = `
        <div class="state-box">
          <span class="state-box__icon">🔍</span>
          <h3 class="state-box__title">Отзывов нет</h3>
          <p class="state-box__subtitle">По выбранному фильтру отзывов не найдено</p>
        </div>`;
    }

    showToast("Отзыв удалён");
  } catch {
    showToast("Ошибка при удалении отзыва", "error");
    btn.disabled = false;
    btn.textContent = "Удалить";
  }
}
