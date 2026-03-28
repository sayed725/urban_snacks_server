import { UserRole, UserStatus } from "../../../generated/prisma/enums";

export interface IGetAllUsersQueries {
  // pagination
  skip: number;
  take: number;
  // sorting
  orderBy: { [key: string]: "asc" | "desc" } | undefined;
  // filters
  search: string | undefined;
  role: UserRole | undefined;
  status: UserStatus | undefined;
}
