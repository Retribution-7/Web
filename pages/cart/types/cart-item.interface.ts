export interface ICartItem {
  id: number;
  userId: number;
  productId: number;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  category: "interior" | "exterior" | "materials";
}
