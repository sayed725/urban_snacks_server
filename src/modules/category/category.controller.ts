import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { buildPaginationAndSort } from "../../utils/pagination-sort";
import { categoryServices } from "./category.service";

const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { search, isFeatured } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await categoryServices.getCategories({
    skip,
    take,
    orderBy,
    search: search as string,
    isFeatured:
      isFeatured !== undefined ? isFeatured === "true" : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
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

const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryServices.createCategory(req.body);

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await categoryServices.updateCategory(id, req.body);

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await categoryServices.deleteCategory(id);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

export const categoryControllers = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
