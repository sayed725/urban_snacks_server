import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IQueryParams } from "../../interfaces/query.interface";
import { categoryServices } from "./category.service";

const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryServices.getCategories(req.query as IQueryParams);

  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    meta: result.meta,
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

  const result = await categoryServices.updateCategory(id as string, req.body);

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await categoryServices.deleteCategory(id as string);

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
