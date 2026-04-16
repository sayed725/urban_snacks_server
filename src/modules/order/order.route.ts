import express from "express";

import { requireAuth } from "../../middlewares";
import { orderControllers } from "./order.controller";
import { UserRole } from "../../generated/enums";

const router = express.Router();

router.get("/all", requireAuth(UserRole.ADMIN), orderControllers.getOrders);

router.get(
  "/my-orders",
  requireAuth(UserRole.USER, UserRole.ADMIN),
  orderControllers.getUserOrders,
);

router.get("/:orderId", requireAuth(), orderControllers.getOrderById);

router.post(
  "/",
  requireAuth(UserRole.USER, UserRole.ADMIN),
  orderControllers.createOrder,
);

router.patch(
  "/cancel/:orderId",
  requireAuth(UserRole.USER, UserRole.ADMIN),
  orderControllers.cancelOrder,
);

router.patch(
  "/change-status/:orderId",
  requireAuth(UserRole.ADMIN),
  orderControllers.changeOrderStatus,
);

router.patch(
  "/update-payment-method/:orderId",
  requireAuth(UserRole.USER, UserRole.ADMIN),
  orderControllers.updatePaymentMethod,
);

router.delete(
  "/:orderId",
  requireAuth(UserRole.ADMIN),
  orderControllers.deleteOrder,
);

export const orderRouter = router;
