import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
  orderId: z.string().uuid(),
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(1).optional(),
});

export type CreateReviewPayload = z.infer<typeof createReviewSchema>;
export type UpdateReviewPayload = z.infer<typeof updateReviewSchema>;

export const updateReviewStatusSchema = z.object({
  isActive: z.boolean(),
});
