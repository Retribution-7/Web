/**
 * catalog.ts
 * All data operations go through JSON Server.
 * No .filter() / .sort() / .map() on raw arrays for business logic.
 */

import "../../src/scripts/preloader";
import {
  addFavorite,
  addToCart,
  fetchFavorites,
  fetchProducts,
  removeFavorite,
} from "../../src/api";
import { requireAuth } from "../../src/auth";
import type { IProduct, IProductQuery } from "./types/product.interface";

const currentUser = requireAuth();

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 6;

// ─── State ────────────────────────────────────────────────────────────────────

let currentPage = 1;
let totalItems = 0;
/** Set of productIds the user has favourited (for toggle UI). */
let favoriteIds = new Set<number>();

// ─── DOM References ───────────────────────────────────────────────────────────

const container = document.getElementById("catalog-container") as HTMLElement;
const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const categorySelect = document.getElementById(
  "categorySelect",
) as HTMLSelectElement;
const sortSelect = document.getElementById("sortSelect") as HTMLSelectElement;
const paginationEl = document.getElementById("pagination") as HTMLElement;
const priceMinInput = document.getElementById("priceMin") as HTMLInputElement;
const priceMaxInput = document.getElementById("priceMax") as HTMLInputElement;

// ─── Query Builder ────────────────────────────────────────────────────────────

function buildQuery(): IProductQuery {
  const sortValue = sortSelect.value;
  const sortMap: Record<string, Pick<IProductQuery, "_sort" | "_order">> = {
    "price-asc": { _sort: "price", _order: "asc" },
    "price-desc": { _sort: "price", _order: "desc" },
    "rating-desc": { _sort: "rating", _order: "desc" },
    "name-asc": { _sort: "title", _order: "asc" },
  };

  const query: IProductQuery = {
    q: searchInput.value,
    ...(sortMap[sortValue] ?? {}),
    _page: currentPage,
    _limit: PAGE_LIMIT,
  };

  // Если категория выбрана - добавляем
  if (categorySelect.value && categorySelect.value !== "all") {
    query.category = categorySelect.value;
  }

  // Если введены цены - добавляем в запрос
  if (priceMinInput.value) query.price_gte = Number(priceMinInput.value);
  if (priceMaxInput.value) query.price_lte = Number(priceMaxInput.value);

  return query;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderCards(products: IProduct[]): void {
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state col-span-full">
        <svg class="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01
               M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3 class="text-lg font-semibold text-gray-400 mb-1">Ничего не найдено</h3>
        <p class="text-sm text-gray-300">Попробуйте изменить параметры поиска</p>
      </div>`;
    return;
  }

  container.innerHTML = products
    .map((item) => {
      const discountBadge = item.oldPrice
        ? `<span class="badge-discount">-${Math.round((1 - item.price / item.oldPrice) * 100)}%</span>`
        : "";

      const priceHTML = item.oldPrice
        ? `<div class="flex flex-col">
             <span class="text-xs text-gray-400 line-through">$${item.oldPrice}</span>
             <span class="product-card__price text-[#FF4D01]">$${item.price}</span>
           </div>`
        : `<span class="product-card__price">$${item.price}</span>`;

      const isFav = favoriteIds.has(item.id);
      const favIcon = isFav ? "❤️" : "🤍";
      const favLabel = isFav ? "Удалить из избранного" : "В избранное";

      return `
        <article class="product-card" data-id="${item.id}">
          <div class="relative overflow-hidden">
            <img src="${item.imageUrl}" alt="${item.title}" class="product-card__image">
            ${discountBadge}
          </div>
          <div class="product-card__content">
            <div class="flex justify-between items-start mb-2 gap-2">
              <h3 class="product-card__title">${item.title}</h3>
              <span class="badge-rating">★ ${item.rating}</span>
            </div>
            <p class="product-card__desc">${item.description}</p>
            <div class="product-card__footer">
              <span class="text-[10px] font-black uppercase text-gray-300 tracking-widest">${item.category}</span>
              ${priceHTML}
            </div>
            <div class="flex gap-2 mt-4">
              <button
                class="btn-add-cart flex-1 bg-[#FF4D01] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#e04400] transition-colors"
                data-id="${item.id}"
              >🛒 В корзину</button>
              <button
                class="btn-toggle-fav w-10 h-10 rounded-xl border border-gray-100 bg-white flex items-center justify-center hover:border-[#FF4D01] transition-colors text-base"
                data-id="${item.id}"
                title="${favLabel}"
              >${favIcon}</button>
            </div>
          </div>
        </article>`;
    })
    .join("");

  container.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.closest("button")) {
      e.preventDefault();
    }
  });

  // Delegate click events for cart & favorites
  container
    .querySelectorAll<HTMLButtonElement>(".btn-add-cart")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const product = products.find((p) => p.id === Number(btn.dataset.id));
        if (!product) return;
        try {
          await addToCart(product, currentUser.id);
          showToast("Добавлено в корзину 🛒");
        } catch {
          showToast("Ошибка при добавлении в корзину", "error");
        }
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>(".btn-toggle-fav")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const productId = Number(btn.dataset.id);
        try {
          await toggleFavorite(productId);
          // Re-render only the icon without a full reload
          const isFav = favoriteIds.has(productId);
          btn.textContent = isFav ? "❤️" : "🤍";
          btn.title = isFav ? "Удалить из избранного" : "В избранное";
        } catch {
          showToast("Ошибка при работе с избранным", "error");
        }
      });
    });
}

function renderPagination(): void {
  if (!paginationEl) return;
  const totalPages = Math.ceil(totalItems / PAGE_LIMIT);

  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  paginationEl.innerHTML = `
    <div class="flex items-center gap-3 justify-center py-6">
      <button id="btn-prev"
        class="px-5 py-2 rounded-xl border border-gray-200 text-sm font-medium
               transition-all hover:border-[#FF4D01] hover:text-[#FF4D01]
               disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-inherit"
        ${currentPage === 1 ? "disabled" : ""}
      >← Назад</button>

      <span class="text-sm text-gray-400">
        Страница <strong class="text-[#191919]">${currentPage}</strong> из <strong class="text-[#191919]">${totalPages}</strong>
      </span>

      <button id="btn-next"
        class="px-5 py-2 rounded-xl border border-gray-200 text-sm font-medium
               transition-all hover:border-[#FF4D01] hover:text-[#FF4D01]
               disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-inherit"
        ${currentPage >= totalPages ? "disabled" : ""}
      >Далее →</button>
    </div>`;

  document.getElementById("btn-prev")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadAndRender();
    }
  });
  document.getElementById("btn-next")?.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadAndRender();
    }
  });
}

// ─── Load & Render ────────────────────────────────────────────────────────────

async function loadAndRender(): Promise<void> {
  showLoadingState();
  try {
    const { data, total } = await fetchProducts(buildQuery());
    totalItems = total;
    renderCards(data);
    renderPagination();
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="empty-state col-span-full">
        <p class="text-red-400 font-semibold">Ошибка загрузки данных.</p>
        <p class="text-sm text-gray-400 mt-1">Убедитесь, что JSON Server запущен на порту 3000.</p>
      </div>`;
  }
}

function showLoadingState(): void {
  container.innerHTML = Array.from({ length: PAGE_LIMIT })
    .map(
      () => `
      <div class="product-card animate-pulse">
        <div class="w-full h-64 bg-gray-100 rounded-t-2xl"></div>
        <div class="product-card__content gap-3 flex flex-col">
          <div class="h-4 bg-gray-100 rounded w-3/4"></div>
          <div class="h-3 bg-gray-100 rounded w-full"></div>
          <div class="h-3 bg-gray-100 rounded w-5/6"></div>
        </div>
      </div>`,
    )
    .join("");
}

// ─── Favorites logic ──────────────────────────────────────────────────────────

async function loadFavoriteIds(): Promise<void> {
  const favs = await fetchFavorites();
  favoriteIds = new Set(favs.map((f) => f.productId));
}

async function toggleFavorite(productId: number): Promise<void> {
  if (favoriteIds.has(productId)) {
    // Find the favorite record to get its JSON Server id
    const favs = await fetchFavorites();
    const fav = favs.find((f) => f.productId === productId);
    if (fav) {
      await removeFavorite(fav.id);
      favoriteIds.delete(productId);
    }
  } else {
    await addFavorite(productId);
    favoriteIds.add(productId);
  }
}

// ─── Toast notification ───────────────────────────────────────────────────────

function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  const existing = document.getElementById("toast-notification");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast-notification";
  toast.className = `
    fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold
    shadow-xl transition-all duration-300 opacity-0 translate-y-2
    ${type === "error" ? "bg-red-500" : "bg-[#191919]"}
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
    toast.classList.add("opacity-100", "translate-y-0");
  });

  // Fade out & remove
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, 2500);
}

async function initCategories(): Promise<void> {
  // Получаем товары, чтобы извлечь категории
  const { data } = await fetchProducts({ _limit: 100 });

  // ТРЕБОВАНИЕ: Создать список категорий (использовать тип данных Set)
  const uniqueCategories = new Set(data.map((p) => p.category));

  const categoryMap: Record<string, string> = {
    interior: "Интерьер",
    exterior: "Экстерьер",
    materials: "Материалы",
  };

  categorySelect.innerHTML = '<option value="">Все категории</option>';

  uniqueCategories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = categoryMap[cat] || cat;
    categorySelect.appendChild(option);
  });
}
// ─── Filter / Sort listeners ──────────────────────────────────────────────────
const handlePriceInput = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage = 1;
    loadAndRender();
  }, 350); // Делаем с задержкой, чтобы не спамить запросами при вводе цифр
};

priceMinInput?.addEventListener("input", handlePriceInput);
priceMaxInput?.addEventListener("input", handlePriceInput);

// Debounce search to avoid firing on every keystroke
let debounceTimer: ReturnType<typeof setTimeout>;

searchInput?.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage = 1; // reset to first page on new search
    loadAndRender();
  }, 350);
});

categorySelect?.addEventListener("change", () => {
  currentPage = 1;
  loadAndRender();
});

sortSelect?.addEventListener("change", () => {
  currentPage = 1;
  loadAndRender();
});

// ─── Reset button ─────────────────────────────────────────────────────────────

document.getElementById("btn-reset")?.addEventListener("click", () => {
  searchInput.value = "";
  categorySelect.value = "";
  sortSelect.value = "default";
  priceMinInput.value = "";
  priceMaxInput.value = "";
  currentPage = 1;
  loadAndRender();
});

// ─── Array-method demo buttons (now use server-side equivalents) ──────────────

// .map() → apply 20% discount via query param (client renders oldPrice)
document.getElementById("btn-map")?.addEventListener("click", async () => {
  const { data } = await fetchProducts({ _limit: 100 }); // all items
  const discounted = data.map((item) => ({
    ...item,
    oldPrice: item.price,
    price: Math.floor(item.price * 0.8),
    title: "Акция: " + item.title,
  }));
  renderCards(discounted);
});

// .filter() → server: price_gte=1000
document.getElementById("btn-filter")?.addEventListener("click", async () => {
  const res = await fetch("http://localhost:3000/products?price_gte=1000");
  const data: IProduct[] = await res.json();
  renderCards(data);
});

// .sort() → server: _sort=rating&_order=desc
document.getElementById("btn-sort")?.addEventListener("click", async () => {
  const { data } = await fetchProducts({
    _sort: "rating",
    _order: "desc",
    _limit: 100,
  });
  renderCards(data);
});

// .reduce() → fetch all, sum on client (aggregation not supported by json-server)
document.getElementById("btn-reduce")?.addEventListener("click", async () => {
  const { data } = await fetchProducts({ _limit: 100 });
  const total = data.reduce((sum, item) => sum + item.price, 0);
  alert(`Общая стоимость всех услуг в каталоге: $${total}`);
});

// .slice() → server: _page=1&_limit=3
document.getElementById("btn-slice")?.addEventListener("click", async () => {
  const { data } = await fetchProducts({ _page: 1, _limit: 3 });
  renderCards(data);
});

// .find() → server: price=12000
document.getElementById("btn-find")?.addEventListener("click", async () => {
  const res = await fetch("http://localhost:3000/products?price=12000");
  const data: IProduct[] = await res.json();
  renderCards(data.length ? [data[0]] : []);
});

// .every() → fetch all, check client-side (logical predicate)
document.getElementById("btn-every")?.addEventListener("click", async () => {
  const { data } = await fetchProducts({ _limit: 100 });
  const allAbove10 = data.every((item) => item.price > 10);
  alert(allAbove10 ? "Да, все услуги дороже $10" : "Нет, есть дешевле");
});

// .some() → server: price_lt=50 (check if any exist)
document.getElementById("btn-some")?.addEventListener("click", async () => {
  const res = await fetch("http://localhost:3000/products?price_lt=50");
  const data: IProduct[] = await res.json();
  alert(
    data.length
      ? "В каталоге есть бюджетные товары до $50"
      : "Дешёвых товаров нет",
  );
});

// .reverse() → server: _sort=id&_order=desc
document.getElementById("btn-reverse")?.addEventListener("click", async () => {
  const { data } = await fetchProducts({
    _sort: "id",
    _order: "desc",
    _limit: 100,
  });
  renderCards(data);
});

// .findIndex() → fetch all, find index client-side
document
  .getElementById("btn-findindex")
  ?.addEventListener("click", async () => {
    const { data } = await fetchProducts({ _limit: 100 });
    const index = data.findIndex((item) => item.title === "Бетонная смесь");
    alert(
      index >= 0
        ? `Товар "Бетонная смесь" находится на позиции ${index} в массиве`
        : `Товар "Бетонная смесь" не найден`,
    );
  });

// ─── Bootstrap ────────────────────────────────────────────────────────────────

(async () => {
  await initCategories();
  await loadFavoriteIds();
  await loadAndRender();
})();
