import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { itemServices } from "./item.service";
import { IQueryParams } from "../../interfaces/query.interface";

const getItems = asyncHandler(async (req: Request, res: Response) => {
  const result = await itemServices.getItems(req.query as IQueryParams);

  res.status(200).json({
    success: true,
    message: "Items retrieved successfully",
    meta: result.meta,
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
