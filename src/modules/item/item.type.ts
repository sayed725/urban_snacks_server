export interface IGetItemsQueries {
  // pagination
  skip: number;
  take: number;
  // sorting
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  // filters
  search: string | undefined;
  categoryId: string | undefined;

  isFeatured: boolean | undefined;
  isSpicy: boolean | undefined;
}

export interface IItemPayload {
  name: string;
  categoryId: string;
  isFeatured?: boolean;
  packSize?: number;
  isSpicy?: boolean;
  weight: string;
  price: number;
  expiryDate?: Date;
  image?: string;
  description?: string;
}
