import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";

import { auth as betterAuth } from "../lib/auth";
import { IUser } from "../types/express.d";
import { UserRole, UserStatus } from "../generated/enums";


const requireAuth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // get user session
    const session = await betterAuth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    // session validation
    if (!session) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized: Authentication required, Please log in to continue!",
      });
    }

    const { id, email, name, role, status } = session.user;

    // check if user is banned
    if (status === UserStatus.BANNED) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: Your account has been banned. Please contact support for more information!",
      });
    }

    // set user in request
    req.user = { id, email, name, role, status } as IUser;

    // check for roles
    if (roles.length && !roles.includes(role as UserRole)) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You don't have permissions to access this resource!",
      });
    }

    next();
  };
};

export default requireAuth;
