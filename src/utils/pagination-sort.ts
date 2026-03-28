type IPaginationAndSort = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const buildPaginationAndSort = (options: IPaginationAndSort) => {
  const page = Math.max(1, Number(options.page) || DEFAULT_PAGE);
  const limit = Math.max(1, Number(options.limit) || DEFAULT_LIMIT);
  const skip = (page - 1) * limit;

  const orderBy =
    options.sortBy && options.sortOrder
      ? { [options.sortBy]: options.sortOrder }
      : undefined;

  return {
    skip: skip,
    take: limit,
    orderBy,
  };
};

export { buildPaginationAndSort, type IPaginationAndSort };
