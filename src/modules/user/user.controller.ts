import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { IQueryParams } from "../../interfaces/query.interface";
import { userServices } from "./user.service";

const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userServices.getAllUsers(req.query as IQueryParams);

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await userServices.updateUserStatus(id as string, status);

  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

export const userControllers = {
  getAllUsers,
  updateUserStatus,
};
