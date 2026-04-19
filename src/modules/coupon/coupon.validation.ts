import { z } from "zod";
import { DiscountType } from "../../generated/client";

const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20),
    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().positive(),
    minOrderAmount: z.number().nonnegative().optional().default(0),
    maxDiscountAmount: z.number().positive().optional(),
    expiryDate: z.string().datetime(),
    usageLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

const updateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).optional(),
    discountType: z.nativeEnum(DiscountType).optional(),
    discountValue: z.number().positive().optional(),
    minOrderAmount: z.number().nonnegative().optional(),
    maxDiscountAmount: z.number().positive().optional(),
    expiryDate: z.string().datetime().optional(),
    usageLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

export const couponValidations = {
  createCouponSchema,
  updateCouponSchema,
};
