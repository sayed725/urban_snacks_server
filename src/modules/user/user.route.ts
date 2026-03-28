import express from "express";
import { requireAuth } from "../../middlewares";
import { UserRole } from "../../../generated/prisma/enums";
import { userControllers } from "./user.controller";

const router = express.Router();

router.get("/", requireAuth(UserRole.ADMIN), userControllers.getAllUsers);

router.patch(
  "/status/:id",
  requireAuth(UserRole.ADMIN),
  userControllers.updateUserStatus,
);

export const userRouter = router;
