import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IQueryParams } from "../../interfaces/query.interface";
import { orderServices } from "./order.service";

const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderServices.getOrders(req.query as IQueryParams);

  res.status(200).json({
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
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
  
  const result = await orderServices.getUserOrders(userId, req.query as IQueryParams);

  res.status(200).json({
    success: true,
    message: "Your orders retrieved successfully",
    meta: result.meta,
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
