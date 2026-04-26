// ─── Favorite record stored in /favorites ─────────────────────────────────────
export interface IFavorite {
  id: number; // JSON Server auto-assigns this
  productId: number; // references IProduct.id
}
