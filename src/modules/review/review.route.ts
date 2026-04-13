import express from "express";
import { requireAuth } from "../../middlewares";
import { reviewControllers } from "./review.controller";
import { UserRole } from "../../../generated/prisma/enums";

const router = express.Router();

router.get("/", reviewControllers.getReviews);
router.get("/:id", reviewControllers.getReviewById);

router.post("/", requireAuth(), reviewControllers.createReview);
router.patch("/:id", requireAuth(), reviewControllers.updateReview);
router.patch(
  "/:id/status",
  requireAuth(UserRole.ADMIN),
  reviewControllers.updateReviewStatus,
);
router.delete("/:id", requireAuth(), reviewControllers.deleteReview);

export const reviewRouter = router;
