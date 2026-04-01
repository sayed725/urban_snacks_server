import express from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { requireAuth } from "../../middlewares";
import { statsControllers } from "./stats.controller";

const router = express.Router();

router.get(
  "/admin",
  requireAuth(UserRole.ADMIN),
  statsControllers.getAdminStats,
);

export const statsRouter = router;
