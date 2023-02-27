import { productList } from "../mocks/productList.mock";
import { Product } from "../model/types";
import asyncAction from "../mocks/mockAsyncAction";

export default class ProductService {
  constructor() {}

  async getProductsList(): Promise<Product[]> {
    return asyncAction(productList);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return asyncAction(productList.find((item) => item.id === id));
  }
}
