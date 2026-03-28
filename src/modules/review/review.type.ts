export interface IGetReviewsQueries {
  // pagination
  skip: number;
  take: number;
  // sorting
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  // filters
  itemId?: string | undefined;
  customerId?: string | undefined;
  rating?: number | undefined;
}

export interface IReviewPayload {
  rating: number;
  comment: string;
  orderId: string;
  itemId: string;
  customerId: string;
}
