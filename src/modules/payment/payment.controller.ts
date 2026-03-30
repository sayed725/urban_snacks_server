import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { paymentServices } from "./payment.service";

const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentServices.createPayment(req.body);

  res.status(201).json({
    success: true,
    message: "Payment recorded successfully",
    data: result,
  });
});

const getPaymentByOrderId = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    const result = await paymentServices.getPaymentByOrderId(
      orderId as string,
      userId,
      isAdmin,
    );

    res.status(200).json({
      success: true,
      message: "Payment retrieved successfully",
      data: result,
    });
  },
);

const getAllPayments = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentServices.getAllPayments();

  res.status(200).json({
    success: true,
    message: "Payments retrieved successfully",
    data: result,
  });
});

export const paymentControllers = {
  createPayment,
  getPaymentByOrderId,
  getAllPayments,
};
