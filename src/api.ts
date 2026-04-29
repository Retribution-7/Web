/**
 * api.ts
 * Thin wrapper around JSON Server.
 * Every function is async and returns typed data – no .filter()/.sort() anywhere.
 */

import { ICartItem } from "../pages/cart/types/cart-item.interface";
import type {
  IProduct,
  IProductQuery,
} from "../pages/catalog/types/product.interface";
import { IFavorite } from "../pages/favorites/types/favorites.interface";
import type { IFeedback, IFeedbackPayload } from "../pages/feedback/types/feedback.interface";
import type { IUser, IUserPayload } from "../pages/register/types/user.interface";
import type { IOrder, IOrderPayload } from "./types/order.interface";

export type { IOrder, IOrderPayload };

const BASE_URL = "http://localhost:3000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a URL with query-string params for /products.
 * Универсальная сборка: проходит по всем ключам объекта query.
 */
export function buildProductsUrl(query: IProductQuery): string {
  const params = new URLSearchParams();

  // Итерируемся по всем ключам объекта query
  Object.entries(query).forEach(([key, value]) => {
    // Добавляем параметр, если значение не пустое, не null и не равно "all"/"default"
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all" &&
      value !== "default"
    ) {
      // Если это строка поиска, удаляем лишние пробелы
      const finalValue =
        typeof value === "string" ? value.trim() : String(value);

      if (finalValue) {
        params.set(key, finalValue);
      }
    }
  });

  const qs = params.toString();
  return qs ? `${BASE_URL}/products?${qs}` : `${BASE_URL}/products`;
}

/** Generic JSON fetch – throws on non-2xx. */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * Fetch a page of products. Returns the array AND total count
 */
export async function fetchProducts(
  query: IProductQuery,
): Promise<{ data: IProduct[]; total: number }> {
  const url = buildProductsUrl(query);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);

  // JSON Server возвращает общее количество в заголовке X-Total-Count
  const total = parseInt(res.headers.get("X-Total-Count") ?? "0", 10);
  const data: IProduct[] = await res.json();

  return { data, total };
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function fetchFavorites(): Promise<IFavorite[]> {
  return apiFetch<IFavorite[]>(`${BASE_URL}/favorites`);
}

export async function addFavorite(productId: number): Promise<IFavorite> {
  return apiFetch<IFavorite>(`${BASE_URL}/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
}

export async function removeFavorite(favoriteId: number): Promise<void> {
  await apiFetch<unknown>(`${BASE_URL}/favorites/${favoriteId}`, {
    method: "DELETE",
  });
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function fetchCart(userId: number): Promise<ICartItem[]> {
  return apiFetch<ICartItem[]>(`${BASE_URL}/cart?userId=${userId}`);
}

export async function addToCart(product: IProduct, userId: number): Promise<ICartItem> {
  const existing = await apiFetch<ICartItem[]>(
    `${BASE_URL}/cart?productId=${product.id}&userId=${userId}`,
  );
  if (existing.length > 0) {
    return updateCartQuantity(existing[0].id, existing[0].quantity + 1);
  }

  return apiFetch<ICartItem>(`${BASE_URL}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      productId: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      quantity: 1,
    } satisfies Omit<ICartItem, "id">),
  });
}

export async function updateCartQuantity(
  cartItemId: number,
  quantity: number,
): Promise<ICartItem> {
  return apiFetch<ICartItem>(`${BASE_URL}/cart/${cartItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCart(cartItemId: number): Promise<void> {
  await apiFetch<unknown>(`${BASE_URL}/cart/${cartItemId}`, {
    method: "DELETE",
  });
}

/** Clears the current user's cart (used on checkout). */
export async function clearCart(userId: number): Promise<void> {
  const items = await fetchCart(userId);
  await Promise.all(items.map((item) => removeFromCart(item.id)));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function postOrder(payload: IOrderPayload): Promise<IOrder> {
  return apiFetch<IOrder>(`${BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchOrdersByUser(userId: number): Promise<IOrder[]> {
  return apiFetch<IOrder[]>(`${BASE_URL}/orders?userId=${userId}`);
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function postFeedback(payload: IFeedbackPayload): Promise<IFeedback> {
  return apiFetch<IFeedback>(`${BASE_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchFeedbackByProduct(productId: number): Promise<IFeedback[]> {
  return apiFetch<IFeedback[]>(`${BASE_URL}/feedback?productId=${productId}`);
}

export async function fetchFeedbackByUser(userId: number): Promise<IFeedback[]> {
  return apiFetch<IFeedback[]>(`${BASE_URL}/feedback?userId=${userId}`);
}

export async function deleteFeedback(id: number): Promise<void> {
  await apiFetch<unknown>(`${BASE_URL}/feedback/${id}`, { method: "DELETE" });
}

// ─── Products CRUD ────────────────────────────────────────────────────────────

export async function fetchAllProducts(): Promise<IProduct[]> {
  return apiFetch<IProduct[]>(`${BASE_URL}/products`);
}

export async function createProduct(
  payload: Omit<IProduct, "id">,
): Promise<IProduct> {
  return apiFetch<IProduct>(`${BASE_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  id: number,
  payload: Omit<IProduct, "id">,
): Promise<IProduct> {
  return apiFetch<IProduct>(`${BASE_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  await apiFetch<unknown>(`${BASE_URL}/products/${id}`, { method: "DELETE" });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchAllUsers(): Promise<IUser[]> {
  return apiFetch<IUser[]>(`${BASE_URL}/users`);
}

export async function fetchUserByEmail(email: string): Promise<IUser | null> {
  const matches = await apiFetch<IUser[]>(
    `${BASE_URL}/users?email=${encodeURIComponent(email)}`,
  );
  return matches[0] ?? null;
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const matches = await apiFetch<IUser[]>(
    `${BASE_URL}/users?nickname=${encodeURIComponent(nickname)}`,
  );
  return matches.length === 0;
}

export async function postUser(payload: IUserPayload): Promise<IUser> {
  return apiFetch<IUser>(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
