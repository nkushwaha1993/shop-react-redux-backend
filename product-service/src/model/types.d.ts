export interface Product {
    id: string,
    title: string,
    description: string,
    price: number,
    category: string,
    images: string,
}

export type ProductsList = Product[]