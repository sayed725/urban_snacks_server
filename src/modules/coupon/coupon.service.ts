import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IQueryParams } from "../../interfaces/query.interface";
import { couponFilterableFields, couponSearchableFields } from "./coupon.constant";
import { Prisma } from "../../generated/client";

const createCoupon = async (payload: any) => {
  const result = await prisma.coupon.create({
    data: payload,
  });
  return result;
};

const getCoupons = async (queries: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.coupon, queries, {
    searchableFields: couponSearchableFields,
    filterableFields: couponFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .where({ isDeleted: false });

  const result = await queryBuilder.execute();
  return result;
};

const getCouponById = async (id: string) => {
  const result = await prisma.coupon.findUnique({
    where: { id, isDeleted: false },
  });
  if (!result) {
    throw new Error("Coupon not found!");
  }
  return result;
};

const updateCoupon = async (id: string, payload: any) => {
  await getCouponById(id);
  const result = await prisma.coupon.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteCoupon = async (id: string) => {
  await getCouponById(id);
  const result = await prisma.coupon.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return result;
};

/**
 * Verifies if a coupon is valid for a given order amount
 */
const verifyCoupon = async (code: string, amount: number) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code, isDeleted: false, isActive: true },
  });

  if (!coupon) {
    throw new Error("Invalid or inactive coupon code!");
  }

  // Check expiry
  if (new Date(coupon.expiryDate) < new Date()) {
    throw new Error("Coupon has expired!");
  }

  // Check usage limit
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached!");
  }

  // Check min order amount
  if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
    throw new Error(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "FIXED") {
    discountAmount = coupon.discountValue;
  } else if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (amount * coupon.discountValue) / 100;
    // Apply max discount cap if defined
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  }

  // Ensure discount doesn't exceed order amount
  discountAmount = Math.min(discountAmount, amount);

  return {
    coupon,
    discountAmount,
  };
};

export const couponServices = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  verifyCoupon,
};
