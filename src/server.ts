import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { redisService } from "./lib/redis";

async function server() {
  try {
    await prisma.$connect();
    await redisService.connect().catch(console.error);
    console.log("Database connected successfully!");

    app.listen(env.PORT, () => {
      console.log(`Urban Snacks server is running at PORT: ${env.PORT}`);
    });
  } catch (error) {
    console.log("Error occured", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

server();
