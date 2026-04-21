import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { reviewFilterableFields, reviewIncludeConfig, reviewSearchableFields } from "./review.constant";
import { IReviewPayload } from "./review.type";

const getReviews = async (queries: IQueryParams, isAdmin: boolean = false) => {
  const { itemId, ...remainingQueries } = queries;

  const queryBuilder = new QueryBuilder(prisma.review, remainingQueries, {
    searchableFields: reviewSearchableFields,
    filterableFields: reviewFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
        ...reviewIncludeConfig,
        order: {
            include: {
                orderItems: {
                    include: {
                        item: true
                    }
                }
            }
        }
    })
    .where({
      isDeleted: false,
      ...(itemId && {
        order: {
          orderItems: {
            some: {
              itemId: itemId as string,
            },
          },
        },
      }),
    });

  const result = await queryBuilder.execute();
  return result;
};

const getReviewById = async (id: string) => {
  const result = await prisma.review.findUnique({
    where: { id },
    include: reviewIncludeConfig,
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

  // Check if user already reviewed this order
  const existingReview = await prisma.review.findUnique({
    where: {
      orderId_customerId: {
        orderId: payload.orderId,
        customerId: payload.customerId,
      },
    },
  });

  if (existingReview) {
    throw new Error("You have already reviewed this order!");
  }

  const result = await prisma.review.create({
    data: payload,
    include: reviewIncludeConfig,
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
    include: reviewIncludeConfig,
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

const updateReviewStatus = async (id: string, isActive: boolean) => {
  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) {
    throw new Error("Review not found!");
  }

  const result = await prisma.review.update({
    where: { id },
    data: { isActive },
    include: reviewIncludeConfig,
  });

  return result;
};

export const reviewServices = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  updateReviewStatus,
};
