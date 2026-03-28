import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { buildPaginationAndSort } from "../../utils/pagination-sort";
import { reviewServices } from "./review.service";

const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const { itemId, customerId, rating } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await reviewServices.getReviews({
    skip,
    take,
    orderBy,
    itemId: itemId as string | undefined,
    customerId: customerId as string | undefined,
    rating: rating ? Number(rating) : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Reviews retrieved successfully",
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

export const reviewControllers = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
