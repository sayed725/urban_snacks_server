import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares";
import { buildPaginationAndSort } from "../../utils/pagination-sort";
import { userServices } from "./user.service";
import { UserRole, UserStatus } from "../../../generated/prisma/enums";

const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, role, status } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);

  const result = await userServices.getAllUsers({
    skip,
    take,
    orderBy,
    search: search as string,
    role: role as UserRole,
    status: status as UserStatus,
  });

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip: skip,
    },
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
