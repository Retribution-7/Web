export interface ICartItem {
  id: number;
  productId: number;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  category: "interior" | "exterior" | "materials"; // ← add this
}
