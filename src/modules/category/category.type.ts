export interface IGetCategoriesQueries {
  // pagination
  skip: number;
  take: number;
  // sorting
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  // filters
  search: string | undefined;
  isFeatured: boolean | undefined;
}
