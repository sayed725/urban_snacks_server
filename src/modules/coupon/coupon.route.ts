import { Router } from "express";
import requireAuth from "../../middlewares/auth";
import { UserRole } from "../../generated/client";
import { couponControllers } from "./coupon.controller";
 // Assuming this exists, based on usual patterns
import { couponValidations } from "./coupon.validation";

const router = Router();

// Public/User verification
router.get(
  "/verify/:code",
  couponControllers.verifyCoupon
);

// Admin management
router.post(
  "/",
  requireAuth(UserRole.ADMIN),
  // validateRequest(couponValidations.createCouponSchema), // Uncomment if validateRequest middleware exists
  couponControllers.createCoupon
);

router.get(
  "/",
  couponControllers.getCoupons
);

router.get(
  "/:id",
  requireAuth(UserRole.ADMIN),
  couponControllers.getCouponById
);

router.patch(
  "/:id",
  requireAuth(UserRole.ADMIN),
  // validateRequest(couponValidations.updateCouponSchema), // Uncomment if validateRequest middleware exists
  couponControllers.updateCoupon
);

router.delete(
  "/:id",
  requireAuth(UserRole.ADMIN),
  couponControllers.deleteCoupon
);

export const couponRouter = router;
