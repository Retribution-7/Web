// ─── Core product shape returned by JSON Server ───────────────────────────────
export interface IProduct {
  id: number;
  title: string;
  description: string;
  category: "interior" | "exterior" | "materials";
  price: number;
  oldPrice?: number;
  rating: number;
  imageUrl: string;
}

// ─── Query params accepted by buildProductsUrl() ──────────────────────────────
export interface IProductQuery {
  q?: string;
  category?: string;
  price_gte?: number; // Цена от (JSON Server использует суффикс _gte)
  price_lte?: number; // Цена до (JSON Server использует суффикс _lte)
  _sort?: string;
  _order?: "asc" | "desc";
  _page?: number;
  _limit?: number;
}
