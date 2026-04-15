import express from "express";
import { requireAuth } from "../../middlewares";

import { userControllers } from "./user.controller";
import { UserRole } from "../../generated/enums";

const router = express.Router();

router.get("/", requireAuth(UserRole.ADMIN), userControllers.getAllUsers);

router.patch(
  "/status/:id",
  requireAuth(UserRole.ADMIN),
  userControllers.updateUserStatus,
);

export const userRouter = router;
