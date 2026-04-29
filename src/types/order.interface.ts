export interface IOrderProduct {
  productId: number;
  title: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  id: number;
  userId: number;
  products: IOrderProduct[];
  totalPrice: number;
  status?: "pending" | "in_progress" | "completed";
  createdAt: string;
}

export type IOrderPayload = Omit<IOrder, "id">;
