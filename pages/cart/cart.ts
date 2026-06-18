import "../../src/scripts/preloader";
import { showToast } from "../../src/scripts/toast";
import type { ICartItem } from "./types/cart-item.interface";
import { postOrder } from "../../src/api";
import { requireAuth, getUser } from "../../src/auth";
import { initPageControls } from "../../src/scripts/init-page";

initPageControls();

let currentUser = requireAuth();

const BASE_URL = "http://localhost:3000";

const container = document.getElementById("cart-container") as HTMLElement;
const countLabel = document.getElementById("cart-count") as HTMLElement;
const clearCartBtn = document.getElementById(
  "btn-clear-cart",
) as HTMLButtonElement;
const checkoutBtn = document.getElementById(
  "btn-checkout",
) as HTMLButtonElement;
const totalEl = document.getElementById("cart-total") as HTMLElement;
const summaryCount = document.getElementById("summary-count") as HTMLElement;
const summarySubtotal = document.getElementById(
  "summary-subtotal",
) as HTMLElement;

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

async function fetchCart(): Promise<ICartItem[]> {
  const user = getUser();
  return apiFetch<ICartItem[]>(`${BASE_URL}/cart?userId=${user?.id}`);
}

async function patchQuantity(id: number, quantity: number): Promise<ICartItem> {
  return apiFetch<ICartItem>(`${BASE_URL}/cart/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
}

async function deleteCartItem(id: number): Promise<void> {
  await apiFetch<unknown>(`${BASE_URL}/cart/${id}`, { method: "DELETE" });
}

async function clearCart(items: ICartItem[]): Promise<void> {
  await Promise.all(items.map((item) => deleteCartItem(item.id)));
}

function renderSkeletons(count = 3): void {
  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="skeleton-item">
        <div class="skeleton-square"></div>
        <div class="skeleton-lines">
          <div class="skeleton-line w-3/4"></div>
          <div class="skeleton-line w-1/2"></div>
          <div class="skeleton-line w-1/3"></div>
        </div>
      </div>`,
    )
    .join("");

  updateSummary([], true);
}

function renderEmpty(): void {
  container.innerHTML = `
    <div class="empty-state">
      <span class="empty-state__icon">🛒</span>
      <h2 class="empty-state__title">Корзина пуста</h2>
      <p class="empty-state__subtitle">Добавьте товары из каталога</p>
      <a href="../catalog/catalog.html"
         class="mt-6 inline-block px-6 py-3 bg-[#FF4D01] text-white text-sm
                font-semibold rounded-xl hover:bg-[#e04400] transition-colors">
        Перейти в каталог
      </a>
    </div>`;

  countLabel.textContent = "Корзина пуста";
  clearCartBtn.style.display = "none";
  checkoutBtn.disabled = true;
  updateSummary([], false);
}

function renderError(): void {
  container.innerHTML = `
    <div class="empty-state">
      <span class="empty-state__icon">⚠️</span>
      <h2 class="empty-state__title">Ошибка загрузки</h2>
      <p class="empty-state__subtitle">
        Убедитесь, что JSON Server запущен на порту 3000
      </p>
    </div>`;
  countLabel.textContent = "";
  checkoutBtn.disabled = true;
}

function buildCartItemHtml(item: ICartItem): string {
  const rowTotal = item.price * item.quantity;

  return `
    <div class="cart-item" data-cart-id="${item.id}">

      <!-- Image -->
      <img
        src="${item.imageUrl}"
        alt="${item.title}"
        class="cart-item__image"
        loading="lazy"
      />

      <!-- Body -->
      <div class="cart-item__body">
        <div>
          <h3 class="cart-item__title">${item.title}</h3>
          <p class="cart-item__category">${item.category ?? ""}</p>
        </div>
        <span class="cart-item__unit-price">$${item.price} / шт.</span>
      </div>

      <!-- Qty stepper -->
      <div class="qty-stepper">
        <button
          class="qty-btn btn-dec"
          data-cart-id="${item.id}"
          data-qty="${item.quantity}"
          ${item.quantity <= 1 ? "" : ""}
          aria-label="Уменьшить количество"
        >−</button>
        <span class="qty-value">${item.quantity}</span>
        <button
          class="qty-btn btn-inc"
          data-cart-id="${item.id}"
          data-qty="${item.quantity}"
          aria-label="Увеличить количество"
        >+</button>
      </div>

      <!-- Row total + remove -->
      <div class="cart-item__right">
        <span class="cart-item__row-total">$${rowTotal}</span>
        <button
          class="btn-remove-item"
          data-cart-id="${item.id}"
          aria-label="Удалить из корзины"
          title="Удалить"
        >✕</button>
      </div>

    </div>`;
}

function updateSummary(items: ICartItem[], loading = false): void {
  if (loading) {
    summaryCount.textContent = "—";
    summarySubtotal.textContent = "—";
    totalEl.textContent = "$0";
    return;
  }

  // Client-side total is fine — it's a display aggregate, not filtering/sorting
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const noun =
    totalQty === 1
      ? "позиция"
      : totalQty >= 2 && totalQty <= 4
        ? "позиции"
        : "позиций";

  summaryCount.textContent = `${totalQty} ${noun}`;
  summarySubtotal.textContent = `$${totalPrice}`;
  totalEl.textContent = `$${totalPrice}`;
}

function updateCountBar(items: ICartItem[]): void {
  const count = items.length;
  const noun =
    count === 1 ? "товар" : count >= 2 && count <= 4 ? "товара" : "товаров";
  countLabel.textContent = `${count} ${noun} в корзине`;
}

async function renderCart(): Promise<void> {
  renderSkeletons();

  try {
    const items = await fetchCart();

    if (items.length === 0) {
      renderEmpty();
      return;
    }

    container.innerHTML = items.map(buildCartItemHtml).join("");

    updateCountBar(items);
    updateSummary(items);
    checkoutBtn.disabled = false;

    clearCartBtn.style.display = "block";
    attachItemHandlers(items);
    attachClearCartHandler(items);
  } catch (err) {
    console.error("[cart] load error:", err);
    renderError();
  }
}

function attachItemHandlers(items: ICartItem[]): void {
  // ── Decrement ──
  container.querySelectorAll<HTMLButtonElement>(".btn-dec").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cartId = Number(btn.dataset.cartId);
      const current = Number(btn.dataset.qty);

      btn.disabled = true; // prevent double-click

      try {
        if (current <= 1) {
          await deleteCartItem(cartId);
          showToast("Товар удалён из корзины");
        } else {
          await patchQuantity(cartId, current - 1);
        }
        await renderCart();
      } catch {
        showToast("Ошибка при изменении количества", "error");
        btn.disabled = false;
      }
    });
  });

  // ── Increment ──
  container.querySelectorAll<HTMLButtonElement>(".btn-inc").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cartId = Number(btn.dataset.cartId);
      const current = Number(btn.dataset.qty);

      btn.disabled = true;

      try {
        await patchQuantity(cartId, current + 1);
        await renderCart();
      } catch {
        showToast("Ошибка при изменении количества", "error");
        btn.disabled = false;
      }
    });
  });

  // ── Remove ──
  container
    .querySelectorAll<HTMLButtonElement>(".btn-remove-item")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const cartId = Number(btn.dataset.cartId);

        const row = container.querySelector<HTMLElement>(
          `.cart-item[data-cart-id="${cartId}"]`,
        );
        if (row) {
          row.style.transition = "opacity 0.25s, transform 0.25s";
          row.style.opacity = "0";
          row.style.transform = "translateX(16px)";
        }

        try {
          await deleteCartItem(cartId);
          showToast("Товар удалён из корзины");
          await renderCart();
        } catch {
          if (row) {
            row.style.opacity = "1";
            row.style.transform = "none";
          }
          showToast("Ошибка при удалении", "error");
        }
      });
    });
}

function attachClearCartHandler(items: ICartItem[]): void {
  const fresh = clearCartBtn.cloneNode(true) as HTMLButtonElement;
  clearCartBtn.replaceWith(fresh);

  fresh.addEventListener("click", async (e) => {
    e.preventDefault(); // ❗ ВАЖНО — убирает перезагрузку

    fresh.disabled = true;
    fresh.textContent = "Очищаем...";

    try {
      const currentItems = await fetchCart(); // 🔥 актуальные данные
      await clearCart(currentItems);

      showToast("Корзина очищена");
      await renderCart();
    } catch {
      showToast("Ошибка при очистке", "error");
      fresh.disabled = false;
      fresh.textContent = "Очистить корзину";
    }
  });
}

checkoutBtn.addEventListener("click", async () => {
  let items: ICartItem[];
  try {
    items = await fetchCart();
  } catch {
    showToast("Не удалось загрузить корзину", "error");
    return;
  }

  if (items.length === 0) {
    showToast("Корзина уже пуста", "error");
    return;
  }

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Оформляем...";

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  try {
    const user = getUser();
    await postOrder({
      userId: user?.id ?? 0,
      products: items.map(({ productId, title, quantity, price }) => ({
        productId,
        title,
        quantity,
        price,
      })),
      totalPrice,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    await clearCart(items);
    await renderCart();
    showToast("Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.");
  } catch {
    showToast("Ошибка при оформлении заказа", "error");
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "Оформить заказ";
  }
});

renderCart();