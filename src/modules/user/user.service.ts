import { UserStatus } from "../../../generated/prisma/enums";
import { UserWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userFilterableFields, userSearchableFields } from "./user.constant";

const getAllUsers = async (queries: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.user, queries, {
    searchableFields: userSearchableFields,
    filterableFields: userFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .where({ isDeleted: false });

  const result = await queryBuilder.execute();
  return result;
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
