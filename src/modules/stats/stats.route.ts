import express from "express";

import { requireAuth } from "../../middlewares";
import { statsControllers } from "./stats.controller";
import { UserRole } from "../../generated/enums";

const router = express.Router();

router.get(
  "/admin",
  requireAuth(UserRole.ADMIN),
  statsControllers.getAdminStats,
);

export const statsRouter = router;
