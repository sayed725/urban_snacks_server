import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { couponServices } from "./coupon.service";
import { IQueryParams } from "../../interfaces/query.interface";

const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const result = await couponServices.createCoupon(req.body);
  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    data: result,
  });
});

const getCoupons = asyncHandler(async (req: Request, res: Response) => {
  const result = await couponServices.getCoupons(req.query as IQueryParams);
  res.status(200).json({
    success: true,
    message: "Coupons retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getCouponById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await couponServices.getCouponById(id as string);
  res.status(200).json({
    success: true,
    message: "Coupon retrieved successfully",
    data: result,
  });
});

const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await couponServices.updateCoupon(id as string, req.body);
  res.status(200).json({
    success: true,
    message: "Coupon updated successfully",
    data: result,
  });
});

const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await couponServices.deleteCoupon(id as string);
  res.status(200).json({
    success: true,
    message: "Coupon deleted successfully",
    data: result,
  });
});

const verifyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const { amount } = req.query;

  if (!amount) {
    return res.status(400).json({
      success: false,
      message: "Order amount is required for verification!",
    });
  }

  const result = await couponServices.verifyCoupon(code as string, Number(amount));
  res.status(200).json({
    success: true,
    message: "Coupon is valid",
    data: result,
  });
});

export const couponControllers = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  verifyCoupon,
};
