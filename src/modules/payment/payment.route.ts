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

router.post(
  "/initiate-ssl/:orderId",
  requireAuth(UserRole.USER, UserRole.ADMIN),
  paymentControllers.initiateSslCheckout,
);

router.post("/ssl-success", paymentControllers.sslSuccess);
router.post("/ssl-fail", paymentControllers.sslFail);
router.post("/ssl-cancel", paymentControllers.sslCancel);

router.get("/all", requireAuth(UserRole.ADMIN), paymentControllers.getAllPayments);

router.get(
  "/order/:orderId",
  requireAuth(UserRole.USER, UserRole.ADMIN),
  paymentControllers.getPaymentByOrderId,
);

export const paymentRouter = router;
