import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { buildPaginationAndSort } from "../../utils/pagination-sort";
import { itemServices } from "./item.service";

const getItems = asyncHandler(async (req: Request, res: Response) => {
  const { search, categoryId, isFeatured, isSpicy } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await itemServices.getItems({
    skip,
    take,
    orderBy,
    search: search as string,
    categoryId: categoryId as string,
    isFeatured: isFeatured !== undefined ? isFeatured === "true" : undefined,
    isSpicy: isSpicy !== undefined ? isSpicy === "true" : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Items retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip: skip,
    },
    data: result.data,
  });
});

const getItemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await itemServices.getItemById(id as string);

  res.status(200).json({
    success: true,
    message: "Item retrieved successfully",
    data: result,
  });
});

const createItem = asyncHandler(async (req: Request, res: Response) => {
  const result = await itemServices.createItem(req.body);

  res.status(201).json({
    success: true,
    message: "Item created successfully",
    data: result,
  });
});

const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await itemServices.updateItem(id as string, req.body);

  res.status(200).json({
    success: true,
    message: "Item updated successfully",
    data: result,
  });
});

const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await itemServices.deleteItem(id as string);

  res.status(200).json({
    success: true,
    message: "Item deleted successfully",
  });
});

export const itemControllers = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
