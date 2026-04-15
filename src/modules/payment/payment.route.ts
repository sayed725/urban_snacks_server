import express from "express";

import { requireAuth } from "../../middlewares";
import { paymentControllers } from "./payment.controller";
import { UserRole } from "../../generated/enums";

const router = express.Router();

router.post(
  "/create-checkout-session/:orderId",
  requireAuth(UserRole.USER, UserRole.ADMIN),
  paymentControllers.createCheckoutSession,
);

router.get("/all", requireAuth(UserRole.ADMIN), paymentControllers.getAllPayments);

router.get(
  "/order/:orderId",
  requireAuth(UserRole.USER, UserRole.ADMIN),
  paymentControllers.getPaymentByOrderId,
);

export const paymentRouter = router;
