import express from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { requireAuth } from "../../middlewares";
import { paymentControllers } from "./payment.controller";

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
