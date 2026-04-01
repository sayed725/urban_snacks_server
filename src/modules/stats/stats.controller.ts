import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { statsServices } from "./stats.service";

const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await statsServices.getAdminStats();

  res.status(200).json({
    success: true,
    message: "Admin statistics retrieved successfully",
    data: result,
  });
});

export const statsControllers = {
  getAdminStats,
};
