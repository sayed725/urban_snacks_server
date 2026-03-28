import { UserRole, UserStatus } from "../../generated/prisma/enums";

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
