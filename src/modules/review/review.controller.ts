import { Request, Response } from "express";
import { IQueryParams } from "../../interfaces/query.interface";
import { asyncHandler } from "../../middlewares";
import { reviewServices } from "./review.service";

const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const isAdmin = user?.role === "ADMIN";

  const result = await reviewServices.getReviews(req.query as IQueryParams, isAdmin);

  res.status(200).json({
    success: true,
    message: "Reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getReviewById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await reviewServices.getReviewById(id as string);

  res.status(200).json({
    success: true,
    message: "Review retrieved successfully",
    data: result,
  });
});

const createReview = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await reviewServices.createReview({
    ...req.body,
    customerId: user.id,
  });

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const result = await reviewServices.updateReview(id as string, user.id, req.body);

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  await reviewServices.deleteReview(id as string, user.id);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

const updateReviewStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const result = await reviewServices.updateReviewStatus(id as string, isActive);

  res.status(200).json({
    success: true,
    message: "Review status updated successfully",
    data: result,
  });
});

export const reviewControllers = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  updateReviewStatus,
};
