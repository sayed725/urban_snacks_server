import { z } from "zod";

const createBannerSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    badge: z.string().optional(),
    image: z.string().optional(),
    order: z.number().int().optional(),
    banner: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateBannerSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    badge: z.string().optional(),
    image: z.string().optional(),
    order: z.number().int().optional(),
    banner: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const bannerValidations = {
  createBannerSchema,
  updateBannerSchema,
};
