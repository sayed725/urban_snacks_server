import { prisma } from "../../lib/prisma";
import { IGetReviewsQueries, IReviewPayload } from "./review.type";

const getReviews = async (queries: IGetReviewsQueries) => {
  const { skip, take, orderBy, itemId, customerId, rating } = queries;

  const whereFilters = {
    ...(itemId && { itemId }),
    ...(customerId && { customerId }),
    ...(rating && { rating }),
  };

  const result = await prisma.review.findMany({
    where: whereFilters,
    skip,
    take,
    ...(orderBy && { orderBy }),
    include: {
      customer: {
        select: { id: true, name: true, image: true },
      },
      item: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  const total = await prisma.review.count({ where: whereFilters });

  return { data: result, total };
};

const getReviewById = async (id: string) => {
  const result = await prisma.review.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, image: true },
      },
      item: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  if (!result) {
    throw new Error("Review not found!");
  }

  return result;
};

const createReview = async (payload: IReviewPayload) => {
  // Check if order exists and belongs to the customer
  const order = await prisma.order.findUnique({
    where: { id: payload.orderId, userId: payload.customerId },
  });

  if (!order) {
    throw new Error("Order not found or does not belong to the customer!");
  }

  // Check if item was part of the order
  const orderItem = await prisma.orderItem.findFirst({
    where: { orderId: payload.orderId, itemId: payload.itemId },
  });

  if (!orderItem) {
    throw new Error("Item was not part of this order!");
  }

  // Check if user already reviewed this item for this order
  const existingReview = await prisma.review.findUnique({
    where: {
      orderId_itemId_customerId: {
        orderId: payload.orderId,
        itemId: payload.itemId,
        customerId: payload.customerId,
      },
    },
  });

  if (existingReview) {
    throw new Error("You have already reviewed this item for this order!");
  }

  const result = await prisma.review.create({
    data: payload,
    include: {
      customer: { select: { id: true, name: true, image: true } },
      item: { select: { id: true, name: true, image: true } },
    },
  });

  return result;
};

const updateReview = async (id: string, customerId: string, payload: Partial<IReviewPayload>) => {
  const review = await prisma.review.findUnique({
    where: { id, customerId },
  });

  if (!review) {
    throw new Error("Review not found or you are not authorized to update it!");
  }

  const result = await prisma.review.update({
    where: { id },
    data: payload,
    include: {
      customer: { select: { id: true, name: true, image: true } },
      item: { select: { id: true, name: true, image: true } },
    },
  });

  return result;
};

const deleteReview = async (id: string, customerId: string) => {
  const review = await prisma.review.findUnique({
    where: { id, customerId },
  });

  if (!review) {
    throw new Error("Review not found or you are not authorized to delete it!");
  }

  await prisma.review.delete({
    where: { id },
  });
};

export const reviewServices = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
