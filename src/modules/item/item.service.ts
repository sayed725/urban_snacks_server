import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  itemFilterableFields,
  itemSearchableFields,
} from "./item.constant";
import { IItemPayload } from "./item.type";

const getItems = async (queries: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.item, queries, {
    searchableFields: itemSearchableFields,
    filterableFields: itemFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      category: {
        select: { id: true, name: true, subName: true },
      },
    })
    .omit({ isDeleted: true, deletedAt: true })
    .where({ isDeleted: false, isActive: true });

  const result = await queryBuilder.execute();
  return result;
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
