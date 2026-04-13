import {
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryWhereInput,
} from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IGetCategoriesQueries } from "./category.type";

const getCategories = async (queries: IGetCategoriesQueries) => {
  const { skip, take, orderBy, search, isFeatured } = queries;

  const whereFilters: CategoryWhereInput = {
    isDeleted: false,
    isActive: true,
    AND: [
      // search filters
      {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { subName: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      // attribute filters
      {
        ...(isFeatured !== undefined && { isFeatured }),
      },
    ],
  };

  const result = await prisma.category.findMany({
    // filters
    where: whereFilters,
    // sorting
    orderBy: orderBy || { createdAt: "asc" },
    // pagination
    skip: skip,
    take: take,
    // includes & omissions
    include: { _count: true },
    omit: { isDeleted: true, deletedAt: true },
  });

  const total = await prisma.category.count({
    where: whereFilters,
  });

  return { data: result, total };
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
