export interface PrismaFindManyArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | undefined | Record<string, unknown>>;
  orderBy?: Record<string, unknown | Record<string, unknown>>;
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: Record<string, unknown>;
  omit?: PrismaOmit;
  [key: string]: unknown;
}

export interface PrismaOmit {
  [key: string]: boolean;
}

export interface PrismaCountArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | undefined | Record<string, unknown>>;
  orderBy?: Record<string, unknown | Record<string, unknown>>;
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: Record<string, unknown>;
  omit?: PrismaOmit;
  [key: string]: unknown;
}

export interface PrismaModelDelegate {
  findMany: (args?: any) => Promise<any[]>;
  count: (args?: any) => Promise<number>;
}

export interface IQueryParams {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  fields?: string;
  include?: string;
  [key: string]: string | undefined;
}

export interface iQueryConfig {
  searchableFields?: string[];
  filterableFields?: string[];
  relationConfig?: Record<string, "one" | "many">;
}

export interface PrismaStringFilter {
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: "insensitive" | "default";
  equals?: string;
  in?: string[];
  notIn?: string[];
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  not?: PrismaStringFilter | string;
}

export interface PrismaNumberFilter {
  equals?: number;
  in?: number[];
  notIn?: number[];
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  not?: PrismaNumberFilter | number;
}

export interface PrismaWhereConditions {
  AND?: Record<string, unknown>[];
  OR?: Record<string, unknown>[];
  NOT?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface IQueryResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
}