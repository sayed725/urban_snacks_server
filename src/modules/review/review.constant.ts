import { Prisma } from "../../../generated/prisma/client";

export const reviewSearchableFields = ["comment", "customer.name", "order.id"];

export const reviewFilterableFields = ["customerId", "rating", "isActive"];

export const reviewIncludeConfig: Prisma.ReviewInclude = {
  customer: true,
  order: true,
};
