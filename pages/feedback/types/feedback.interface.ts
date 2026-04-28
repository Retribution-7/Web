export interface IFeedback {
  id: number;
  userId: number;
  productId: number;
  message: string;
  rating: number;
  createdAt: string;
}

export type IFeedbackPayload = Omit<IFeedback, "id">;
