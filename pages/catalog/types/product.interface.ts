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
