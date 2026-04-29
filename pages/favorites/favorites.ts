/**
 * favorites.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Favorites page logic.
 * All data comes from JSON Server — no local arrays, no client-side filtering.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "../../src/scripts/preloader";
import { IProduct } from "../catalog/types/product.interface";
import type { IFavorite } from "./types/favorites.interface";
import { requireAuth } from "../../src/auth";

requireAuth();

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";

// ─── DOM ─────────────────────────────────────────────────────────────────────

const container = document.getElementById("favorites-container") as HTMLElement;
const countLabel = document.getElementById("favorites-count") as HTMLElement;
const clearAllBtn = document.getElementById(
  "btn-clear-all",
) as HTMLButtonElement;

// ─── API ─────────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

async function fetchFavorites(): Promise<IFavorite[]> {
  return apiFetch<IFavorite[]>(`${BASE_URL}/favorites`);
}

async function fetchProductById(id: number): Promise<IProduct> {
  return apiFetch<IProduct>(`${BASE_URL}/products/${id}`);
}

async function removeFavorite(favoriteId: number): Promise<void> {
  await apiFetch<unknown>(`${BASE_URL}/favorites/${favoriteId}`, {
    method: "DELETE",
  });
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderSkeletons(count = 3): void {
  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line w-3/4"></div>
          <div class="skeleton-line w-full"></div>
          <div class="skeleton-line w-5/6"></div>
        </div>
      </div>`,
    )
    .join("");
}

function renderEmpty(): void {
  container.innerHTML = `
    <div class="empty-state">
      <span class="empty-state__icon">🤍</span>
      <h2 class="empty-state__title">В избранном пусто</h2>
      <p class="empty-state__subtitle">Добавьте понравившиеся услуги из каталога</p>
      <a href="../catalog/catalog.html"
         class="mt-6 inline-block px-6 py-3 bg-[#FF4D01] text-white text-sm
                font-semibold rounded-xl hover:bg-[#e04400] transition-colors">
        Перейти в каталог
      </a>
    </div>`;
  countLabel.textContent = "Нет избранных";
  clearAllBtn.style.display = "none";
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
}

function buildCard(fav: IFavorite, product: IProduct): string {
  return `
    <article class="product-card" data-fav-id="${fav.id}">
      <div class="relative overflow-hidden">
        <img
          src="${product.imageUrl}"
          alt="${product.title}"
          class="product-card__image"
          loading="lazy"
        />
      </div>
      <div class="product-card__content">
        <div class="flex justify-between items-start mb-2 gap-2">
          <h3 class="product-card__title">${product.title}</h3>
          <span class="badge-rating">★ ${product.rating}</span>
        </div>
        <p class="product-card__desc">${product.description}</p>
        <div class="product-card__footer">
          <span class="badge-category">${product.category}</span>
          <span class="product-card__price">$${product.price}</span>
        </div>
        <button
          class="btn-remove-fav"
          data-fav-id="${fav.id}"
          aria-label="Удалить из избранного"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          Удалить из избранного
        </button>
      </div>
    </article>`;
}

// ─── Core render ─────────────────────────────────────────────────────────────

async function renderFavorites(): Promise<void> {
  renderSkeletons();

  try {
    const favorites = await fetchFavorites();

    if (favorites.length === 0) {
      renderEmpty();
      return;
    }

    // Fetch all matching products in parallel
    const products = await Promise.all(
      favorites.map((fav) => fetchProductById(fav.productId)),
    );

    container.innerHTML = favorites
      .map((fav, i) => buildCard(fav, products[i]))
      .join("");

    updateCountBar(favorites.length);
    attachRemoveHandlers();
    attachClearAllHandler(favorites);
  } catch (err) {
    console.error("[favorites] load error:", err);
    renderError();
  }
}

// ─── Interactivity ────────────────────────────────────────────────────────────

function attachRemoveHandlers(): void {
  container
    .querySelectorAll<HTMLButtonElement>(".btn-remove-fav")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const favId = Number(btn.dataset.favId);

        // Optimistic UI — fade the card out immediately
        const card = container.querySelector<HTMLElement>(
          `[data-fav-id="${favId}"]`,
        );
        if (card) {
          card.style.transition = "opacity 0.3s, transform 0.3s";
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
        }

        try {
          await removeFavorite(favId);
          showToast("Удалено из избранного");
          // Full re-render to update the count bar correctly
          await renderFavorites();
        } catch {
          // Restore card on failure
          if (card) {
            card.style.opacity = "1";
            card.style.transform = "scale(1)";
          }
          showToast("Ошибка при удалении", "error");
        }
      });
    });
}

function attachClearAllHandler(favorites: IFavorite[]): void {
  clearAllBtn.style.display = "block";

  // Clone to remove stale listeners
  const fresh = clearAllBtn.cloneNode(true) as HTMLButtonElement;
  clearAllBtn.replaceWith(fresh);

  fresh.addEventListener("click", async (e) => {
    e.preventDefault(); // ❗ блокируем submit формы (если есть)

    fresh.disabled = true;
    fresh.textContent = "Очищаем...";

    try {
      const currentFavorites = await fetchFavorites(); // 🔥 берём актуальные данные
      await Promise.all(currentFavorites.map((fav) => removeFavorite(fav.id)));

      showToast("Избранное очищено");
      await renderFavorites();
    } catch {
      showToast("Ошибка при очистке", "error");
      fresh.disabled = false;
      fresh.textContent = "Очистить всё";
    }
  });
}

function updateCountBar(count: number): void {
  const noun =
    count === 1 ? "товар" : count >= 2 && count <= 4 ? "товара" : "товаров";
  countLabel.textContent = `${count} ${noun} в избранном`;
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

// ─── Bootstrap ────────────────────────────────────────────────────────────────

renderFavorites();
