/**
 * T = model
 * TWhereInput = ModelWhereInput
 * TInclude = ModelInclude
 */

import {
  iQueryConfig,
  IQueryParams,
  IQueryResult,
  PrismaCountArgs,
  PrismaFindManyArgs,
  PrismaModelDelegate,
  PrismaNumberFilter,
  PrismaOmit,
  PrismaStringFilter,
  PrismaWhereConditions,
} from "../interfaces/query.interface";



export class QueryBuilder<
  T,
  TWhereInput = Record<string, unknown>,
  TInclude = Record<string, unknown>,
> {
  private query: PrismaFindManyArgs;
  private countQuery: PrismaCountArgs;
  private page: number = 1;
  private limit: number = 10;
  private skip: number = 0;
  private sortBy: string = "createdAt";
  private sortOrder: "asc" | "desc" = "desc";
  private selectFields: Record<string, boolean> | undefined;

  constructor(
    private model: PrismaModelDelegate,
    private queryParams: IQueryParams,
    private config: iQueryConfig = {},
  ) {
    this.query = {
      where: {},
      include: {},
      orderBy: {},
      skip: this.skip,
      take: this.limit,
    };
    this.countQuery = {
      where: {},
    };
  }

  // Helper to determine if we should wrap in 'some'
  private getRelationContext(relation: string) {
    const isMany = this.config.relationConfig?.[relation] === "many";
    return {
      isMany,
      operator: isMany ? "some" : null,
    };
  }

  search(): this {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;

    if (searchTerm && searchableFields && searchableFields.length > 0) {
      const searchCondition: Record<string, unknown>[] = searchableFields.map(
        (field) => {
          const stringFilter: PrismaStringFilter = {
            contains: searchTerm,
            mode: "insensitive",
          };

          if (field.includes(".")) {
            const parts = field.split(".");
            const relation = parts[0] as string;
            const { operator } = this.getRelationContext(relation);

            if (parts.length === 2) {
              const relationField = parts[1] as string;
              const content = { [relationField]: stringFilter };
              return {
                [relation]: operator ? { [operator]: content } : content,
              };
            } else if (parts.length === 3) {
              const nestedRelation = parts[1] as string;
              const relationField = parts[2] as string;
              const nestedContent = {
                [nestedRelation]: { [relationField]: stringFilter },
              };
              return {
                [relation]: operator
                  ? { [operator]: nestedContent }
                  : nestedContent,
              };
            }
          }

          return { [field]: stringFilter };
        },
      );

      const whereConditions = this.query.where as PrismaWhereConditions;
      whereConditions.OR = searchCondition;

      const countWhereCondition = this.countQuery
        .where as PrismaWhereConditions;
      countWhereCondition.OR = searchCondition;
    }

    return this;
  }

  filter(): this {
    const { filterableFields } = this.config;
    const excludeFields = [
      "searchTerm",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "fields",
      "include",
    ];

    const filterParams: Record<string, unknown> = {};
    Object.keys(this.queryParams).forEach((key) => {
      if (!excludeFields.includes(key)) {
        filterParams[key] = this.queryParams[key];
      }
    });

    const queryWhere = this.query.where as Record<string, any>;
    const countQueryWhere = this.countQuery.where as Record<string, any>;

    Object.keys(filterParams).forEach((key) => {
      const value = filterParams[key];
      if (value === undefined || value === null || value === "") return;

      if (filterableFields && !filterableFields.includes(key)) return;

      if (key.includes(".")) {
        const parts = key.split(".");
        const relation = parts[0] as string;
        const { operator } = this.getRelationContext(relation);

        // Initialize relation object
        if (!queryWhere[relation]) {
          queryWhere[relation] = operator ? { [operator]: {} } : {};
          countQueryWhere[relation] = operator ? { [operator]: {} } : {};
        }

        const targetQuery = operator
          ? queryWhere[relation][operator]
          : queryWhere[relation];
        const targetCount = operator
          ? countQueryWhere[relation][operator]
          : countQueryWhere[relation];

        if (parts.length === 2) {
          const field = parts[1] as string;
          targetQuery[field] = this.parseFilterValue(value);
          targetCount[field] = this.parseFilterValue(value);
        } else if (parts.length === 3) {
          const nestedRelation = parts[1] as string;
          const field = parts[2] as string;
          if (!targetQuery[nestedRelation]) {
            targetQuery[nestedRelation] = {};
            targetCount[nestedRelation] = {};
          }
          targetQuery[nestedRelation][field] = this.parseFilterValue(value);
          targetCount[nestedRelation][field] = this.parseFilterValue(value);
        }
        return;
      }

      // Range Filter Logic
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const parsedRange = this.parseRangeFilter(value as any);
        queryWhere[key] = parsedRange;
        countQueryWhere[key] = parsedRange;
        return;
      }

      queryWhere[key] = this.parseFilterValue(value);
      countQueryWhere[key] = this.parseFilterValue(value);
    });

    return this;
  }

  // --- Methods below remain structurally consistent but utilize the dynamic logic above ---

  paginate(): this {
    const page = Number(this.queryParams.page) || 1;
    const limit = Number(this.queryParams.limit) || 10;
    this.skip = (page - 1) * limit;
    this.limit = limit;
    this.page = page;
    this.query.skip = this.skip;
    this.query.take = this.limit;
    return this;
  }

  sort(): this {
    const sortBy = this.queryParams.sortBy || "createdAt";
    const sortOrder = (this.queryParams.sortOrder as "asc" | "desc") || "desc";
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;

    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");
      if (parts.length === 2) {
        const relation = parts[0] as string;
        const field = parts[1] as string;
        this.query.orderBy = { [relation]: { [field]: sortOrder } };
      } else if (parts.length === 3) {
        const rel = parts[0] as string;
        const nested = parts[1] as string;
        const field = parts[2] as string;
        this.query.orderBy = { [rel]: { [nested]: { [field]: sortOrder } } };
      }
    } else {
      this.query.orderBy = { [sortBy]: sortOrder };
    }
    return this;
  }

  fields(): this {
    const fieldsParam = this.queryParams.fields || "";
    if (fieldsParam && typeof fieldsParam === "string") {
      const fieldsArray = fieldsParam.split(",").map((f) => f.trim());
      this.selectFields = {};
      fieldsArray.forEach((f) => {
        if (this.selectFields) this.selectFields[f] = true;
      });
      this.query.select = this.selectFields;
      delete this.query.include;
    }
    return this;
  }

  include(relation: TInclude): this {
    if (this.selectFields) return this;
    this.query.include = { ...this.query.include, ...relation };
    return this;
  }

  omit(fields: PrismaOmit): this {
    this.query.omit = { ...this.query.omit, ...fields };
    return this;
  }

  where(conditions: TWhereInput): this {
    this.query.where = this.deepMerge(
      this.query.where as any,
      conditions as any,
    );
    this.countQuery.where = this.deepMerge(
      this.countQuery.where as any,
      conditions as any,
    );
    return this;
  }

  async execute(): Promise<IQueryResult<T>> {
    const [total, data] = await Promise.all([
      this.model.count({ where: this.countQuery.where }),
      this.model.findMany(this.query),
    ]);

    return {
      data: data as T[],
      meta: {
        limit: this.limit,
        page: this.page,
        total,
        totalPage: Math.ceil(total / this.limit),
        sortBy: this.sortBy,
        sortOrder: this.sortOrder,
      },
    };
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  private parseFilterValue(value: unknown): unknown {
    if (value === "true") return true;
    if (value === "false") return false;
    // Prevent empty string converting to 0
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      !isNaN(Number(value))
    ) {
      return Number(value);
    }
    if (Array.isArray(value)) return value.map((v) => this.parseFilterValue(v));
    return value;
  }

  private parseRangeFilter(value: Record<string, any>): any {
    const rangeQuery: any = {};
    const operators = [
      "lt",
      "lte",
      "gt",
      "gte",
      "equals",
      "not",
      "contains",
      "startsWith",
      "endsWith",
      "in",
      "notIn",
    ];

    Object.keys(value).forEach((op) => {
      if (operators.includes(op)) {
        rangeQuery[op] = this.parseFilterValue(value[op]);
      }
    });
    return rangeQuery;
  }
}