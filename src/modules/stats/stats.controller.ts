import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { statsServices } from "./stats.service";

const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
 
});

export const statsControllers = {
  getAdminStats,
};
