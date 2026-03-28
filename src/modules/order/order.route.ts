import express from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { requireAuth } from "../../middlewares";
import { orderControllers } from "./order.controller";

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

export const orderRouter = router;
