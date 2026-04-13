export interface IGetReviewsQueries {
  // pagination
  skip: number;
  take: number;
  // sorting
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  // filters
  customerId?: string | undefined;
  rating?: number | undefined;
  isActive?: boolean | undefined;
  isAdmin?: boolean;
}

export interface IReviewPayload {
  rating: number;
  comment: string;
  orderId: string;
  customerId: string;
}
