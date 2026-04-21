import { Prisma } from "../../generated/client";


export const reviewSearchableFields = ["comment", "customer.name", "order.id", "order.orderNumber"];

export const reviewFilterableFields = ["customerId", "rating", "isActive", "itemId"];

export const reviewIncludeConfig: Prisma.ReviewInclude = {
  customer: true,
  order: true,
};
