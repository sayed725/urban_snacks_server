import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "../config/env";
import { prisma } from "./prisma";

const main = async () => {
  const auth = betterAuth({
    appName: "Urban Snacks",
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: false,
    },
    secret: env.BETTER_AUTH_SECRET,
  });

  const result = await auth.api.signUpEmail({
    body: {
      name: env.APP_ADMIN,
      email: env.APP_ADMIN_EMAIL,
      password: env.APP_ADMIN_PASS,
    },
  });

  if (result.user) {
    await prisma.user.update({
      where: { id: result.user.id },
      data: { role: "ADMIN" },
    });
    console.log("✅ Admin user seeded successfully:", result.user.email);
  } else {
    console.log("❌ Failed to seed admin user.");
  }

  await prisma.$disconnect();
};

main().catch(async (err) => {
  console.error("Seed error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
