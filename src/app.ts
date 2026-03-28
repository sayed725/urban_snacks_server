import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { Express, Request, Response } from "express";
import { env } from "./config/env";
import { auth } from "./lib/auth";
import { errorHandler, logger, notFound } from "./middlewares";
import { categoryRouter } from "./modules/category/category.route";

import { orderRouter } from "./modules/order/order.route";

import { userRouter } from "./modules/user/user.route";
import { itemRouter } from "./modules/item/item.route";

const app: Express = express();

app.use(express.json());
app.use(logger);

const allowed_origins = [
  env.APP_ORIGIN,
  env.PROD_APP_ORIGIN, // Production frontend URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowedOrigins or matches Vercel preview pattern
      const isAllowed =
        allowed_origins.includes(origin) ||
        /^https:\/\/pharmetix-client.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin); // Any Vercel deployment

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/v1/users", userRouter);

// app.use("/api/v1/categories", categoryRouter);
// app.use("/api/v1/items", itemRouter);
// app.use("/api/v1/orders", orderRouter);


app.get("/", (req: Request, res: Response) => {
  res.send("Urban Snacks Server Is Running!");
});

app.use(notFound);

app.use(errorHandler);

export default app;
