import { Request, Response } from "express";
import { OrderStatus } from "../../../generated/prisma/enums";
import { asyncHandler } from "../../middlewares";
import { buildPaginationAndSort } from "../../utils/pagination-sort";
import { orderServices } from "./order.service";

const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await orderServices.getOrders({
    skip,
    take,
    orderBy,
    status: status
      ? (status as string).split(",").map((s) => s as OrderStatus)
      : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Orders retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip,
    },
    data: result.data,
  });
});

const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";

  const result = await orderServices.getOrderById(orderId as string, userId, isAdmin);

  res.status(200).json({
    success: true,
    message: "Order retrieved successfully",
    data: result,
  });
});

const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await orderServices.getUserOrders(userId, {
    skip,
    take,
    orderBy,
  });

  res.status(200).json({
    success: true,
    message: "Your orders retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip,
    },
    data: result.data,
  });
});

const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await orderServices.createOrder(userId, req.body);

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: result,
  });
});

const changeOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const result = await orderServices.changeOrderStatus(orderId as string, status);

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: result,
  });
});

const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const userId = req.user!.id;

  const result = await orderServices.cancelOrder(userId, orderId as string);

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: result,
  });
});

const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const result = await orderServices.deleteOrder(orderId as string);

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
    data: result,
  });
});

export const orderControllers = {
  getOrders,
  getOrderById,
  getUserOrders,
  createOrder,
  changeOrderStatus,
  cancelOrder,
  deleteOrder,
};
