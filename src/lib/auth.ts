import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";

import { env } from "../config/env";
import { prisma } from "./prisma";
import { UserRole, UserStatus } from "../generated/enums";
import { oAuthProxy } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "Urban Snacks",

  baseURL: env.PROD_APP_ORIGIN || env.APP_ORIGIN,
  secret: env.BETTER_AUTH_SECRET,

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 3, // 3 days
    },
  },


  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: UserRole.USER,
      },
      status: {
        type: "string",
        defaultValue: UserStatus.ACTIVE,
      },
      phone: {
        type: "string",
        required: false,
      },
      isDeleted: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
  },

  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      // 🚫 Block admin role assignment on sign-up
      if (ctx.body.role && ctx.body.role === UserRole.ADMIN) {
        throw new APIError("BAD_REQUEST", {
          message: "Admin role cannot be assigned during sign-up!",
        });
      }

      // 🚫 Block invalid initial status
      if (
        (ctx.body.status && ctx.body.status === UserStatus.BANNED) ||
        ctx.body.status === UserStatus.INACTIVE
      ) {
        throw new APIError("BAD_REQUEST", {
          message: "Invalid status for new users, must be ACTIVE!",
        });
      }
    }),
  },

  trustedOrigins: [
    env.APP_ORIGIN,
    env.PROD_APP_ORIGIN,
  ].filter(Boolean) as string[],

  advanced: {
    disableCSRFCheck: true,
    cookiePrefix: "urban_snacks",
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        },
      },
    },
  },


  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
          });

          if (user && user.status === UserStatus.BANNED) {
            throw new APIError("UNAUTHORIZED", {
              message: "Your account has been banned. Please contact support.",
            });
          }
        },
      },
    },
  },

  plugins: [oAuthProxy()]
});
