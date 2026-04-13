import {
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryWhereInput,
} from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { categoryFilterableFields, categorySearchableFields } from "./category.constant";

const getCategories = async (queries: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.category, queries, {
    searchableFields: categorySearchableFields,
    filterableFields: categoryFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({ _count: true })
    .omit({ isDeleted: true, deletedAt: true })
    .where({ isDeleted: false, isActive: true });

  const result = await queryBuilder.execute();
  return result;
};

const createCategory = async (payload: CategoryCreateInput) => {
  const result = await prisma.category.create({
    data: payload,
  });

  return result;
};

const updateCategory = async (id: string, payload: CategoryUpdateInput) => {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!category) {
    throw new Error("Category not found!");
  }

  const result = await prisma.category.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteCategory = async (id: string) => {
  await prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({
      where: { id },
      select: { id: true, _count: { select: { items: true } } },
    });

    if (!category) {
      throw new Error("Category not found!");
    }

    const hasItems = category._count.items > 0;
    if (hasItems) {
      throw new Error(
        "Can't delete category with associated items, delete or move them first!",
      );
    }

    await tx.category.update({
      where: { id },
      data: { isActive: false, isDeleted: true, deletedAt: new Date() },
    });
  });
};

export const categoryServices = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
