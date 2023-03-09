export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

export type ProductsList = Product[];

export type Stock = {
  product_id: string;
  count: number;
};
