import { ItemWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IGetItemsQueries, IItemPayload } from "./item.type";

const getItems = async (queries: IGetItemsQueries) => {
  const { skip, take, orderBy, search, categoryId, isFeatured, isSpicy } =
    queries;

  const whereFilters: ItemWhereInput = {
    isDeleted: false,
    isActive: true,
    AND: [
      {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      {
        ...(categoryId && { categoryId }),
      },
      {
        ...(isFeatured !== undefined && { isFeatured }),
      },
      {
        ...(isSpicy !== undefined && { isSpicy }),
      },
    ],
  };

  const result = await prisma.item.findMany({
    where: whereFilters,
    skip,
    take,
    ...(orderBy && { orderBy }),
    include: {
      category: {
        select: { id: true, name: true, subName: true },
      },
    },
    omit: { isDeleted: true, deletedAt: true },
  });

  const total = await prisma.item.count({ where: whereFilters });

  return { data: result, total };
};

const getItemById = async (id: string) => {
  const result = await prisma.item.findUnique({
    where: { id, isDeleted: false, isActive: true },
    include: {
      category: {
        select: { id: true, name: true, subName: true },
      },
    },
    omit: { isDeleted: true, deletedAt: true },
  });

  if (!result) {
    throw new Error("Item not found!");
  }

  return result;
};

const createItem = async (payload: IItemPayload) => {
  // Validate category exists
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId, isDeleted: false },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Category not found!");
  }

  const result = await prisma.item.create({
    data: payload,
    include: {
      category: { select: { id: true, name: true, subName: true } },
    },
  });

  return result;
};

const updateItem = async (id: string, payload: Partial<IItemPayload>) => {
  const item = await prisma.item.findUnique({
    where: { id, isDeleted: false },
    select: { id: true },
  });

  if (!item) {
    throw new Error("Item not found!");
  }

  const result = await prisma.item.update({
    where: { id },
    data: payload,
    include: {
      category: { select: { id: true, name: true, subName: true } },
    },
  });

  return result;
};

const deleteItem = async (id: string) => {
  await prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!item) {
      throw new Error("Item not found!");
    }

    await tx.item.update({
      where: { id },
      data: { isActive: false, isDeleted: true, deletedAt: new Date() },
    });
  });
};

export const itemServices = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
