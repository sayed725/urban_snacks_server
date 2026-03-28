import { UserStatus } from "../../../generated/prisma/enums";
import { UserWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IGetAllUsersQueries } from "./user.type";

const getAllUsers = async (queries: IGetAllUsersQueries) => {
  const { skip, take, orderBy, search, status, role } = queries;

  const whereFilters: UserWhereInput = {
    AND: [
      // search filters
      {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      // attribute filters
      {
        ...(status && { status }),
      },
      {
        ...(role && { role }),
      },
    ],
  };

  const result = await prisma.user.findMany({
    // filters
    where: whereFilters,
    // pagination
    skip: skip,
    take: take,
    // sorting
    ...(orderBy && { orderBy }),
  });

  const total = await prisma.user.count({
    where: whereFilters,
  });

  return { data: result, total };
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  if (!Object.values(UserStatus).includes(status)) {
    throw new Error("Invalid status value!");
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new Error("User not found!");
    }

    if (user.status === status) {
      throw new Error("User already has this status!");
    }

    return await tx.user.update({
      where: { id: userId },
      data: { status },
    });
  });

  return result;
};

export const userServices = {
  getAllUsers,
  updateUserStatus,
};
