var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express8 from "express";

// src/config/env.ts
import { z } from "zod";
var envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number),
  APP_ORIGIN: z.string().url(),
  PROD_APP_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(10),
  BETTER_AUTH_URL: z.string().url(),
  APP_ADMIN: z.string().min(3),
  APP_ADMIN_EMAIL: z.string().email(),
  APP_ADMIN_PASS: z.string().min(8),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string()
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274C Invalid environment variables");
  console.error(parsed.error.format());
  process.exit(1);
}
var env = parsed.data;

// src/lib/auth.ts
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// src/generated/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// src/generated/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.6.0",
  "engineVersion": "75cbdc1eb7150937890ad5465d861175c6624711",
  "activeProvider": "postgresql",
  "inlineSchema": 'enum UserRole {\n  USER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  INACTIVE\n  BANNED\n}\n\nmodel User {\n  id            String     @id\n  name          String\n  email         String\n  emailVerified Boolean    @default(false)\n  phone         String?\n  image         String?\n  createdAt     DateTime   @default(now())\n  updatedAt     DateTime   @updatedAt\n  // additional fields\n  role          UserRole   @default(USER)\n  status        UserStatus @default(ACTIVE)\n  isDeleted     Boolean    @default(false)\n  // relations\n  sessions      Session[]\n  accounts      Account[]\n  orders        Order[]\n  reviews       Review[]\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nenum OrderStatus {\n  PLACED\n  CANCELLED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n}\n\nenum PaymentStatus {\n  PAID\n  UNPAID\n}\n\nmodel Order {\n  id                 String        @id @default(uuid())\n  orderNumber        String\n  status             OrderStatus   @default(PLACED)\n  totalAmount        Float\n  shippingName       String\n  shippingPhone      String\n  shippingEmail      String\n  shippingAddress    String\n  shippingCity       String\n  shippingPostalCode String\n  paymentStatus      PaymentStatus @default(UNPAID)\n  paymentMethod      String // e.g. "STRIPE" or "COD"\n  additionalInfo     String?\n  isDeleted          Boolean       @default(false)\n  deletedAt          DateTime?\n  createdAt          DateTime      @default(now())\n  updatedAt          DateTime      @updatedAt\n\n  // Relationships\n  userId     String\n  user       User        @relation(fields: [userId], references: [id])\n  orderItems OrderItem[]\n  payment    Payment?\n  reviews    Review[]\n\n  @@map("orders")\n}\n\nmodel OrderItem {\n  id        String @id @default(uuid())\n  quantity  Int\n  unitPrice Float\n  subTotal  Float\n\n  // Relationships\n  orderId String\n  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)\n  itemId  String\n  item    Item   @relation(fields: [itemId], references: [id])\n\n  @@map("order_items")\n}\n\nmodel Payment {\n  id                 String        @id @default(uuid())\n  amount             Float\n  transactionId      String?       @unique\n  stripeEventId      String?       @unique\n  status             PaymentStatus @default(UNPAID)\n  invoiceUrl         String?\n  paymentGatewayData Json?\n  createdAt          DateTime      @default(now())\n  updatedAt          DateTime      @updatedAt\n\n  // Relationships\n  orderId String @unique\n  order   Order  @relation(fields: [orderId], references: [id])\n\n  @@map("payments")\n}\n\nmodel Coupon {\n  id             String   @id @default(uuid())\n  code           String   @unique\n  discountAmount Float\n  isActive       Boolean  @default(true)\n  expiryDate     DateTime\n  createdAt      DateTime @default(now())\n\n  @@map("coupons")\n}\n\nmodel Review {\n  id        String    @id @default(uuid())\n  rating    Float // e.g., 1 to 5\n  comment   String\n  isActive  Boolean   @default(false)\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  // Relations\n  orderId String\n  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  customerId String\n  customer   User   @relation(fields: [customerId], references: [id])\n\n  // Prevents a user from reviewing an order multiple times\n  @@unique([orderId, customerId])\n  @@map("reviews")\n}\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Category {\n  id          String    @id @default(uuid())\n  name        String    @unique\n  subName     String?\n  image       String?\n  isFeatured  Boolean   @default(false)\n  description String?\n  isActive    Boolean   @default(true)\n  isDeleted   Boolean   @default(false)\n  deletedAt   DateTime?\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n\n  // Relationships\n  items Item[]\n\n  @@map("categories")\n}\n\nmodel Item {\n  id          String    @id @default(uuid())\n  name        String\n  isFeatured  Boolean   @default(false)\n  packSize    Int?\n  isSpicy     Boolean?\n  weight      String\n  price       Float\n  expiryDate  DateTime?\n  isActive    Boolean   @default(true)\n  isDeleted   Boolean   @default(false)\n  deletedAt   DateTime?\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n  image       String?\n  description String?\n\n  // Relationships\n  categoryId String\n  category   Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)\n  orderItems OrderItem[]\n\n  @@map("items")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"phone","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderNumber","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"totalAmount","kind":"scalar","type":"Float"},{"name":"shippingName","kind":"scalar","type":"String"},{"name":"shippingPhone","kind":"scalar","type":"String"},{"name":"shippingEmail","kind":"scalar","type":"String"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"shippingCity","kind":"scalar","type":"String"},{"name":"shippingPostalCode","kind":"scalar","type":"String"},{"name":"paymentStatus","kind":"enum","type":"PaymentStatus"},{"name":"paymentMethod","kind":"scalar","type":"String"},{"name":"additionalInfo","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"payment","kind":"object","type":"Payment","relationName":"OrderToPayment"},{"name":"reviews","kind":"object","type":"Review","relationName":"OrderToReview"}],"dbName":"orders"},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Float"},{"name":"subTotal","kind":"scalar","type":"Float"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"itemId","kind":"scalar","type":"String"},{"name":"item","kind":"object","type":"Item","relationName":"ItemToOrderItem"}],"dbName":"order_items"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"stripeEventId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"invoiceUrl","kind":"scalar","type":"String"},{"name":"paymentGatewayData","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToPayment"}],"dbName":"payments"},"Coupon":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"code","kind":"scalar","type":"String"},{"name":"discountAmount","kind":"scalar","type":"Float"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"coupons"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Float"},{"name":"comment","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReview"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"ReviewToUser"}],"dbName":"reviews"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"subName","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"description","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"items","kind":"object","type":"Item","relationName":"CategoryToItem"}],"dbName":"categories"},"Item":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"packSize","kind":"scalar","type":"Int"},{"name":"isSpicy","kind":"scalar","type":"Boolean"},{"name":"weight","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"image","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToItem"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"ItemToOrderItem"}],"dbName":"items"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","order","items","_count","category","orderItems","item","payment","customer","reviews","orders","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","_avg","_sum","Order.groupBy","Order.aggregate","OrderItem.findUnique","OrderItem.findUniqueOrThrow","OrderItem.findFirst","OrderItem.findFirstOrThrow","OrderItem.findMany","OrderItem.createOne","OrderItem.createMany","OrderItem.createManyAndReturn","OrderItem.updateOne","OrderItem.updateMany","OrderItem.updateManyAndReturn","OrderItem.upsertOne","OrderItem.deleteOne","OrderItem.deleteMany","OrderItem.groupBy","OrderItem.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Coupon.findUnique","Coupon.findUniqueOrThrow","Coupon.findFirst","Coupon.findFirstOrThrow","Coupon.findMany","Coupon.createOne","Coupon.createMany","Coupon.createManyAndReturn","Coupon.updateOne","Coupon.updateMany","Coupon.updateManyAndReturn","Coupon.upsertOne","Coupon.deleteOne","Coupon.deleteMany","Coupon.groupBy","Coupon.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","Category.upsertOne","Category.deleteOne","Category.deleteMany","Category.groupBy","Category.aggregate","Item.findUnique","Item.findUniqueOrThrow","Item.findFirst","Item.findFirstOrThrow","Item.findMany","Item.createOne","Item.createMany","Item.createManyAndReturn","Item.updateOne","Item.updateMany","Item.updateManyAndReturn","Item.upsertOne","Item.deleteOne","Item.deleteMany","Item.groupBy","Item.aggregate","AND","OR","NOT","id","name","isFeatured","packSize","isSpicy","weight","price","expiryDate","isActive","isDeleted","deletedAt","createdAt","updatedAt","image","description","categoryId","equals","in","notIn","lt","lte","gt","gte","contains","startsWith","endsWith","not","subName","every","some","none","rating","comment","orderId","customerId","code","discountAmount","amount","transactionId","stripeEventId","PaymentStatus","status","invoiceUrl","paymentGatewayData","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","quantity","unitPrice","subTotal","itemId","orderNumber","OrderStatus","totalAmount","shippingName","shippingPhone","shippingEmail","shippingAddress","shippingCity","shippingPostalCode","paymentStatus","paymentMethod","additionalInfo","userId","identifier","value","expiresAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","email","emailVerified","phone","UserRole","role","UserStatus","orderId_customerId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "_ARpsAESBAAA6wIAIAUAAOwCACAOAADuAgAgDwAA7QIAIMgBAADoAgAwyQEAACgAEMoBAADoAgAwywEBAAAAAcwBAQDCAgAh1AEgAMQCACHWAUAAxgIAIdcBQADGAgAh2AEBAMMCACH0AQAA6gKjAiKdAgEAAAABngIgAMQCACGfAgEAwwIAIaECAADpAqECIgEAAAABACAMAwAA8QIAIMgBAAD-AgAwyQEAAAMAEMoBAAD-AgAwywEBAMICACHWAUAAxgIAIdcBQADGAgAhjQIBAMICACGQAkAAxgIAIZoCAQDCAgAhmwIBAMMCACGcAgEAwwIAIQMDAADDBAAgmwIAAP8CACCcAgAA_wIAIAwDAADxAgAgyAEAAP4CADDJAQAAAwAQygEAAP4CADDLAQEAAAAB1gFAAMYCACHXAUAAxgIAIY0CAQDCAgAhkAJAAMYCACGaAgEAAAABmwIBAMMCACGcAgEAwwIAIQMAAAADACABAAAEADACAAAFACARAwAA8QIAIMgBAAD9AgAwyQEAAAcAEMoBAAD9AgAwywEBAMICACHWAUAAxgIAIdcBQADGAgAhjQIBAMICACGRAgEAwgIAIZICAQDCAgAhkwIBAMMCACGUAgEAwwIAIZUCAQDDAgAhlgJAAMUCACGXAkAAxQIAIZgCAQDDAgAhmQIBAMMCACEIAwAAwwQAIJMCAAD_AgAglAIAAP8CACCVAgAA_wIAIJYCAAD_AgAglwIAAP8CACCYAgAA_wIAIJkCAAD_AgAgEQMAAPECACDIAQAA_QIAMMkBAAAHABDKAQAA_QIAMMsBAQAAAAHWAUAAxgIAIdcBQADGAgAhjQIBAMICACGRAgEAwgIAIZICAQDCAgAhkwIBAMMCACGUAgEAwwIAIZUCAQDDAgAhlgJAAMUCACGXAkAAxQIAIZgCAQDDAgAhmQIBAMMCACEDAAAABwAgAQAACAAwAgAACQAgGQMAAPECACAKAAD2AgAgDAAA_AIAIA4AAO4CACDIAQAA-gIAMMkBAAALABDKAQAA-gIAMMsBAQDCAgAh1AEgAMQCACHVAUAAxQIAIdYBQADGAgAh1wFAAMYCACH0AQAA-wKDAiKBAgEAwgIAIYMCCADLAgAhhAIBAMICACGFAgEAwgIAIYYCAQDCAgAhhwIBAMICACGIAgEAwgIAIYkCAQDCAgAhigIAANMC9AEiiwIBAMICACGMAgEAwwIAIY0CAQDCAgAhBgMAAMMEACAKAADFBAAgDAAAxwQAIA4AAMIEACDVAQAA_wIAIIwCAAD_AgAgGQMAAPECACAKAAD2AgAgDAAA_AIAIA4AAO4CACDIAQAA-gIAMMkBAAALABDKAQAA-gIAMMsBAQAAAAHUASAAxAIAIdUBQADFAgAh1gFAAMYCACHXAUAAxgIAIfQBAAD7AoMCIoECAQDCAgAhgwIIAMsCACGEAgEAwgIAIYUCAQDCAgAhhgIBAMICACGHAgEAwgIAIYgCAQDCAgAhiQIBAMICACGKAgAA0wL0ASKLAgEAwgIAIYwCAQDDAgAhjQIBAMICACEDAAAACwAgAQAADAAwAgAADQAgCwYAANUCACALAAD5AgAgyAEAAPcCADDJAQAADwAQygEAAPcCADDLAQEAwgIAIewBAQDCAgAh_QECAPgCACH-AQgAywIAIf8BCADLAgAhgAIBAMICACECBgAAyAMAIAsAAMYEACALBgAA1QIAIAsAAPkCACDIAQAA9wIAMMkBAAAPABDKAQAA9wIAMMsBAQAAAAHsAQEAwgIAIf0BAgD4AgAh_gEIAMsCACH_AQgAywIAIYACAQDCAgAhAwAAAA8AIAEAABAAMAIAABEAIBUJAAD1AgAgCgAA9gIAIMgBAADyAgAwyQEAABMAEMoBAADyAgAwywEBAMICACHMAQEAwgIAIc0BIADEAgAhzgECAPMCACHPASAA9AIAIdABAQDCAgAh0QEIAMsCACHSAUAAxQIAIdMBIADEAgAh1AEgAMQCACHVAUAAxQIAIdYBQADGAgAh1wFAAMYCACHYAQEAwwIAIdkBAQDDAgAh2gEBAMICACEICQAAxAQAIAoAAMUEACDOAQAA_wIAIM8BAAD_AgAg0gEAAP8CACDVAQAA_wIAINgBAAD_AgAg2QEAAP8CACAVCQAA9QIAIAoAAPYCACDIAQAA8gIAMMkBAAATABDKAQAA8gIAMMsBAQAAAAHMAQEAwgIAIc0BIADEAgAhzgECAPMCACHPASAA9AIAIdABAQDCAgAh0QEIAMsCACHSAUAAxQIAIdMBIADEAgAh1AEgAMQCACHVAUAAxQIAIdYBQADGAgAh1wFAAMYCACHYAQEAwwIAIdkBAQDDAgAh2gEBAMICACEDAAAAEwAgAQAAFAAwAgAAFQAgAQAAABMAIAMAAAAPACABAAAQADACAAARACABAAAADwAgDgYAANUCACDIAQAA0gIAMMkBAAAaABDKAQAA0gIAMMsBAQDCAgAh1gFAAMYCACHXAUAAxgIAIewBAQDCAgAh8AEIAMsCACHxAQEAwwIAIfIBAQDDAgAh9AEAANMC9AEi9QEBAMMCACH2AQAA1AIAIAEAAAAaACAPBgAA1QIAIA0AAPECACDIAQAA8AIAMMkBAAAcABDKAQAA8AIAMMsBAQDCAgAh0wEgAMQCACHUASAAxAIAIdUBQADFAgAh1gFAAMYCACHXAUAAxgIAIeoBCADLAgAh6wEBAMICACHsAQEAwgIAIe0BAQDCAgAhAwYAAMgDACANAADDBAAg1QEAAP8CACAQBgAA1QIAIA0AAPECACDIAQAA8AIAMMkBAAAcABDKAQAA8AIAMMsBAQAAAAHTASAAxAIAIdQBIADEAgAh1QFAAMUCACHWAUAAxgIAIdcBQADGAgAh6gEIAMsCACHrAQEAwgIAIewBAQDCAgAh7QEBAMICACGjAgAA7wIAIAMAAAAcACABAAAdADACAAAeACABAAAADwAgAQAAABwAIAMAAAAcACABAAAdADACAAAeACABAAAAAwAgAQAAAAcAIAEAAAALACABAAAAHAAgAQAAAAEAIBIEAADrAgAgBQAA7AIAIA4AAO4CACAPAADtAgAgyAEAAOgCADDJAQAAKAAQygEAAOgCADDLAQEAwgIAIcwBAQDCAgAh1AEgAMQCACHWAUAAxgIAIdcBQADGAgAh2AEBAMMCACH0AQAA6gKjAiKdAgEAwgIAIZ4CIADEAgAhnwIBAMMCACGhAgAA6QKhAiIGBAAAvwQAIAUAAMAEACAOAADCBAAgDwAAwQQAINgBAAD_AgAgnwIAAP8CACADAAAAKAAgAQAAKQAwAgAAAQAgAwAAACgAIAEAACkAMAIAAAEAIAMAAAAoACABAAApADACAAABACAPBAAAuwQAIAUAALwEACAOAAC-BAAgDwAAvQQAIMsBAQAAAAHMAQEAAAAB1AEgAAAAAdYBQAAAAAHXAUAAAAAB2AEBAAAAAfQBAAAAowICnQIBAAAAAZ4CIAAAAAGfAgEAAAABoQIAAAChAgIBFQAALQAgC8sBAQAAAAHMAQEAAAAB1AEgAAAAAdYBQAAAAAHXAUAAAAAB2AEBAAAAAfQBAAAAowICnQIBAAAAAZ4CIAAAAAGfAgEAAAABoQIAAAChAgIBFQAALwAwARUAAC8AMA8EAACKBAAgBQAAiwQAIA4AAI0EACAPAACMBAAgywEBAIUDACHMAQEAhQMAIdQBIACGAwAh1gFAAIsDACHXAUAAiwMAIdgBAQCMAwAh9AEAAIkEowIinQIBAIUDACGeAiAAhgMAIZ8CAQCMAwAhoQIAAIgEoQIiAgAAAAEAIBUAADIAIAvLAQEAhQMAIcwBAQCFAwAh1AEgAIYDACHWAUAAiwMAIdcBQACLAwAh2AEBAIwDACH0AQAAiQSjAiKdAgEAhQMAIZ4CIACGAwAhnwIBAIwDACGhAgAAiAShAiICAAAAKAAgFQAANAAgAgAAACgAIBUAADQAIAMAAAABACAcAAAtACAdAAAyACABAAAAAQAgAQAAACgAIAUIAACFBAAgIgAAhwQAICMAAIYEACDYAQAA_wIAIJ8CAAD_AgAgDsgBAADhAgAwyQEAADsAEMoBAADhAgAwywEBAKYCACHMAQEApgIAIdQBIACnAgAh1gFAAKwCACHXAUAArAIAIdgBAQCtAgAh9AEAAOMCowIinQIBAKYCACGeAiAApwIAIZ8CAQCtAgAhoQIAAOICoQIiAwAAACgAIAEAADoAMCEAADsAIAMAAAAoACABAAApADACAAABACABAAAABQAgAQAAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAkDAACEBAAgywEBAAAAAdYBQAAAAAHXAUAAAAABjQIBAAAAAZACQAAAAAGaAgEAAAABmwIBAAAAAZwCAQAAAAEBFQAAQwAgCMsBAQAAAAHWAUAAAAAB1wFAAAAAAY0CAQAAAAGQAkAAAAABmgIBAAAAAZsCAQAAAAGcAgEAAAABARUAAEUAMAEVAABFADAJAwAAgwQAIMsBAQCFAwAh1gFAAIsDACHXAUAAiwMAIY0CAQCFAwAhkAJAAIsDACGaAgEAhQMAIZsCAQCMAwAhnAIBAIwDACECAAAABQAgFQAASAAgCMsBAQCFAwAh1gFAAIsDACHXAUAAiwMAIY0CAQCFAwAhkAJAAIsDACGaAgEAhQMAIZsCAQCMAwAhnAIBAIwDACECAAAAAwAgFQAASgAgAgAAAAMAIBUAAEoAIAMAAAAFACAcAABDACAdAABIACABAAAABQAgAQAAAAMAIAUIAACABAAgIgAAggQAICMAAIEEACCbAgAA_wIAIJwCAAD_AgAgC8gBAADgAgAwyQEAAFEAEMoBAADgAgAwywEBAKYCACHWAUAArAIAIdcBQACsAgAhjQIBAKYCACGQAkAArAIAIZoCAQCmAgAhmwIBAK0CACGcAgEArQIAIQMAAAADACABAABQADAhAABRACADAAAAAwAgAQAABAAwAgAABQAgAQAAAAkAIAEAAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACAOAwAA_wMAIMsBAQAAAAHWAUAAAAAB1wFAAAAAAY0CAQAAAAGRAgEAAAABkgIBAAAAAZMCAQAAAAGUAgEAAAABlQIBAAAAAZYCQAAAAAGXAkAAAAABmAIBAAAAAZkCAQAAAAEBFQAAWQAgDcsBAQAAAAHWAUAAAAAB1wFAAAAAAY0CAQAAAAGRAgEAAAABkgIBAAAAAZMCAQAAAAGUAgEAAAABlQIBAAAAAZYCQAAAAAGXAkAAAAABmAIBAAAAAZkCAQAAAAEBFQAAWwAwARUAAFsAMA4DAAD-AwAgywEBAIUDACHWAUAAiwMAIdcBQACLAwAhjQIBAIUDACGRAgEAhQMAIZICAQCFAwAhkwIBAIwDACGUAgEAjAMAIZUCAQCMAwAhlgJAAIoDACGXAkAAigMAIZgCAQCMAwAhmQIBAIwDACECAAAACQAgFQAAXgAgDcsBAQCFAwAh1gFAAIsDACHXAUAAiwMAIY0CAQCFAwAhkQIBAIUDACGSAgEAhQMAIZMCAQCMAwAhlAIBAIwDACGVAgEAjAMAIZYCQACKAwAhlwJAAIoDACGYAgEAjAMAIZkCAQCMAwAhAgAAAAcAIBUAAGAAIAIAAAAHACAVAABgACADAAAACQAgHAAAWQAgHQAAXgAgAQAAAAkAIAEAAAAHACAKCAAA-wMAICIAAP0DACAjAAD8AwAgkwIAAP8CACCUAgAA_wIAIJUCAAD_AgAglgIAAP8CACCXAgAA_wIAIJgCAAD_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_wIAIIwCAAD_AgAgFcgBAADZAgAwyQEAAJYBABDKAQAA2QIAMMsBAQCmAgAh1AEgAKcCACHVAUAAqwIAIdYBQACsAgAh1wFAAKwCACH0AQAA2gKDAiKBAgEApgIAIYMCCACqAgAhhAIBAKYCACGFAgEApgIAIYYCAQCmAgAhhwIBAKYCACGIAgEApgIAIYkCAQCmAgAhigIAAM0C9AEiiwIBAKYCACGMAgEArQIAIY0CAQCmAgAhAwAAAAsAIAEAAJUBADAhAACWAQAgAwAAAAsAIAEAAAwAMAIAAA0AIAEAAAARACABAAAAEQAgAwAAAA8AIAEAABAAMAIAABEAIAMAAAAPACABAAAQADACAAARACADAAAADwAgAQAAEAAwAgAAEQAgCAYAAJ0DACALAADPAwAgywEBAAAAAewBAQAAAAH9AQIAAAAB_gEIAAAAAf8BCAAAAAGAAgEAAAABARUAAJ4BACAGywEBAAAAAewBAQAAAAH9AQIAAAAB_gEIAAAAAf8BCAAAAAGAAgEAAAABARUAAKABADABFQAAoAEAMAgGAACbAwAgCwAAzgMAIMsBAQCFAwAh7AEBAIUDACH9AQIAmQMAIf4BCACJAwAh_wEIAIkDACGAAgEAhQMAIQIAAAARACAVAACjAQAgBssBAQCFAwAh7AEBAIUDACH9AQIAmQMAIf4BCACJAwAh_wEIAIkDACGAAgEAhQMAIQIAAAAPACAVAAClAQAgAgAAAA8AIBUAAKUBACADAAAAEQAgHAAAngEAIB0AAKMBACABAAAAEQAgAQAAAA8AIAUIAADJAwAgIgAAzAMAICMAAMsDACBkAADKAwAgZQAAzQMAIAnIAQAA1gIAMMkBAACsAQAQygEAANYCADDLAQEApgIAIewBAQCmAgAh_QECANcCACH-AQgAqgIAIf8BCACqAgAhgAIBAKYCACEDAAAADwAgAQAAqwEAMCEAAKwBACADAAAADwAgAQAAEAAwAgAAEQAgDgYAANUCACDIAQAA0gIAMMkBAAAaABDKAQAA0gIAMMsBAQAAAAHWAUAAxgIAIdcBQADGAgAh7AEBAAAAAfABCADLAgAh8QEBAAAAAfIBAQAAAAH0AQAA0wL0ASL1AQEAwwIAIfYBAADUAgAgAQAAAK8BACABAAAArwEAIAUGAADIAwAg8QEAAP8CACDyAQAA_wIAIPUBAAD_AgAg9gEAAP8CACADAAAAGgAgAQAAsgEAMAIAAK8BACADAAAAGgAgAQAAsgEAMAIAAK8BACADAAAAGgAgAQAAsgEAMAIAAK8BACALBgAAxwMAIMsBAQAAAAHWAUAAAAAB1wFAAAAAAewBAQAAAAHwAQgAAAAB8QEBAAAAAfIBAQAAAAH0AQAAAPQBAvUBAQAAAAH2AYAAAAABARUAALYBACAKywEBAAAAAdYBQAAAAAHXAUAAAAAB7AEBAAAAAfABCAAAAAHxAQEAAAAB8gEBAAAAAfQBAAAA9AEC9QEBAAAAAfYBgAAAAAEBFQAAuAEAMAEVAAC4AQAwCwYAAMYDACDLAQEAhQMAIdYBQACLAwAh1wFAAIsDACHsAQEAhQMAIfABCACJAwAh8QEBAIwDACHyAQEAjAMAIfQBAADFA_QBIvUBAQCMAwAh9gGAAAAAAQIAAACvAQAgFQAAuwEAIArLAQEAhQMAIdYBQACLAwAh1wFAAIsDACHsAQEAhQMAIfABCACJAwAh8QEBAIwDACHyAQEAjAMAIfQBAADFA_QBIvUBAQCMAwAh9gGAAAAAAQIAAAAaACAVAAC9AQAgAgAAABoAIBUAAL0BACADAAAArwEAIBwAALYBACAdAAC7AQAgAQAAAK8BACABAAAAGgAgCQgAAMADACAiAADDAwAgIwAAwgMAIGQAAMEDACBlAADEAwAg8QEAAP8CACDyAQAA_wIAIPUBAAD_AgAg9gEAAP8CACANyAEAAMwCADDJAQAAxAEAEMoBAADMAgAwywEBAKYCACHWAUAArAIAIdcBQACsAgAh7AEBAKYCACHwAQgAqgIAIfEBAQCtAgAh8gEBAK0CACH0AQAAzQL0ASL1AQEArQIAIfYBAADOAgAgAwAAABoAIAEAAMMBADAhAADEAQAgAwAAABoAIAEAALIBADACAACvAQAgCcgBAADKAgAwyQEAAMoBABDKAQAAygIAMMsBAQAAAAHSAUAAxgIAIdMBIADEAgAh1gFAAMYCACHuAQEAAAAB7wEIAMsCACEBAAAAxwEAIAEAAADHAQAgCcgBAADKAgAwyQEAAMoBABDKAQAAygIAMMsBAQDCAgAh0gFAAMYCACHTASAAxAIAIdYBQADGAgAh7gEBAMICACHvAQgAywIAIQADAAAAygEAIAEAAMsBADACAADHAQAgAwAAAMoBACABAADLAQAwAgAAxwEAIAMAAADKAQAgAQAAywEAMAIAAMcBACAGywEBAAAAAdIBQAAAAAHTASAAAAAB1gFAAAAAAe4BAQAAAAHvAQgAAAABARUAAM8BACAGywEBAAAAAdIBQAAAAAHTASAAAAAB1gFAAAAAAe4BAQAAAAHvAQgAAAABARUAANEBADABFQAA0QEAMAbLAQEAhQMAIdIBQACLAwAh0wEgAIYDACHWAUAAiwMAIe4BAQCFAwAh7wEIAIkDACECAAAAxwEAIBUAANQBACAGywEBAIUDACHSAUAAiwMAIdMBIACGAwAh1gFAAIsDACHuAQEAhQMAIe8BCACJAwAhAgAAAMoBACAVAADWAQAgAgAAAMoBACAVAADWAQAgAwAAAMcBACAcAADPAQAgHQAA1AEAIAEAAADHAQAgAQAAAMoBACAFCAAAuwMAICIAAL4DACAjAAC9AwAgZAAAvAMAIGUAAL8DACAJyAEAAMkCADDJAQAA3QEAEMoBAADJAgAwywEBAKYCACHSAUAArAIAIdMBIACnAgAh1gFAAKwCACHuAQEApgIAIe8BCACqAgAhAwAAAMoBACABAADcAQAwIQAA3QEAIAMAAADKAQAgAQAAywEAMAIAAMcBACABAAAAHgAgAQAAAB4AIAMAAAAcACABAAAdADACAAAeACADAAAAHAAgAQAAHQAwAgAAHgAgAwAAABwAIAEAAB0AMAIAAB4AIAwGAAC5AwAgDQAAugMAIMsBAQAAAAHTASAAAAAB1AEgAAAAAdUBQAAAAAHWAUAAAAAB1wFAAAAAAeoBCAAAAAHrAQEAAAAB7AEBAAAAAe0BAQAAAAEBFQAA5QEAIArLAQEAAAAB0wEgAAAAAdQBIAAAAAHVAUAAAAAB1gFAAAAAAdcBQAAAAAHqAQgAAAAB6wEBAAAAAewBAQAAAAHtAQEAAAABARUAAOcBADABFQAA5wEAMAwGAAC3AwAgDQAAuAMAIMsBAQCFAwAh0wEgAIYDACHUASAAhgMAIdUBQACKAwAh1gFAAIsDACHXAUAAiwMAIeoBCACJAwAh6wEBAIUDACHsAQEAhQMAIe0BAQCFAwAhAgAAAB4AIBUAAOoBACAKywEBAIUDACHTASAAhgMAIdQBIACGAwAh1QFAAIoDACHWAUAAiwMAIdcBQACLAwAh6gEIAIkDACHrAQEAhQMAIewBAQCFAwAh7QEBAIUDACECAAAAHAAgFQAA7AEAIAIAAAAcACAVAADsAQAgAwAAAB4AIBwAAOUBACAdAADqAQAgAQAAAB4AIAEAAAAcACAGCAAAsgMAICIAALUDACAjAAC0AwAgZAAAswMAIGUAALYDACDVAQAA_wIAIA3IAQAAyAIAMMkBAADzAQAQygEAAMgCADDLAQEApgIAIdMBIACnAgAh1AEgAKcCACHVAUAAqwIAIdYBQACsAgAh1wFAAKwCACHqAQgAqgIAIesBAQCmAgAh7AEBAKYCACHtAQEApgIAIQMAAAAcACABAADyAQAwIQAA8wEAIAMAAAAcACABAAAdADACAAAeACAPBwAAxwIAIMgBAADBAgAwyQEAAPkBABDKAQAAwQIAMMsBAQAAAAHMAQEAAAABzQEgAMQCACHTASAAxAIAIdQBIADEAgAh1QFAAMUCACHWAUAAxgIAIdcBQADGAgAh2AEBAMMCACHZAQEAwwIAIeYBAQDDAgAhAQAAAPYBACABAAAA9gEAIA8HAADHAgAgyAEAAMECADDJAQAA-QEAEMoBAADBAgAwywEBAMICACHMAQEAwgIAIc0BIADEAgAh0wEgAMQCACHUASAAxAIAIdUBQADFAgAh1gFAAMYCACHXAUAAxgIAIdgBAQDDAgAh2QEBAMMCACHmAQEAwwIAIQUHAACxAwAg1QEAAP8CACDYAQAA_wIAINkBAAD_AgAg5gEAAP8CACADAAAA-QEAIAEAAPoBADACAAD2AQAgAwAAAPkBACABAAD6AQAwAgAA9gEAIAMAAAD5AQAgAQAA-gEAMAIAAPYBACAMBwAAsAMAIMsBAQAAAAHMAQEAAAABzQEgAAAAAdMBIAAAAAHUASAAAAAB1QFAAAAAAdYBQAAAAAHXAUAAAAAB2AEBAAAAAdkBAQAAAAHmAQEAAAABARUAAP4BACALywEBAAAAAcwBAQAAAAHNASAAAAAB0wEgAAAAAdQBIAAAAAHVAUAAAAAB1gFAAAAAAdcBQAAAAAHYAQEAAAAB2QEBAAAAAeYBAQAAAAEBFQAAgAIAMAEVAACAAgAwDAcAAKMDACDLAQEAhQMAIcwBAQCFAwAhzQEgAIYDACHTASAAhgMAIdQBIACGAwAh1QFAAIoDACHWAUAAiwMAIdcBQACLAwAh2AEBAIwDACHZAQEAjAMAIeYBAQCMAwAhAgAAAPYBACAVAACDAgAgC8sBAQCFAwAhzAEBAIUDACHNASAAhgMAIdMBIACGAwAh1AEgAIYDACHVAUAAigMAIdYBQACLAwAh1wFAAIsDACHYAQEAjAMAIdkBAQCMAwAh5gEBAIwDACECAAAA-QEAIBUAAIUCACACAAAA-QEAIBUAAIUCACADAAAA9gEAIBwAAP4BACAdAACDAgAgAQAAAPYBACABAAAA-QEAIAcIAACgAwAgIgAAogMAICMAAKEDACDVAQAA_wIAINgBAAD_AgAg2QEAAP8CACDmAQAA_wIAIA7IAQAAwAIAMMkBAACMAgAQygEAAMACADDLAQEApgIAIcwBAQCmAgAhzQEgAKcCACHTASAApwIAIdQBIACnAgAh1QFAAKsCACHWAUAArAIAIdcBQACsAgAh2AEBAK0CACHZAQEArQIAIeYBAQCtAgAhAwAAAPkBACABAACLAgAwIQAAjAIAIAMAAAD5AQAgAQAA-gEAMAIAAPYBACABAAAAFQAgAQAAABUAIAMAAAATACABAAAUADACAAAVACADAAAAEwAgAQAAFAAwAgAAFQAgAwAAABMAIAEAABQAMAIAABUAIBIJAACeAwAgCgAAnwMAIMsBAQAAAAHMAQEAAAABzQEgAAAAAc4BAgAAAAHPASAAAAAB0AEBAAAAAdEBCAAAAAHSAUAAAAAB0wEgAAAAAdQBIAAAAAHVAUAAAAAB1gFAAAAAAdcBQAAAAAHYAQEAAAAB2QEBAAAAAdoBAQAAAAEBFQAAlAIAIBDLAQEAAAABzAEBAAAAAc0BIAAAAAHOAQIAAAABzwEgAAAAAdABAQAAAAHRAQgAAAAB0gFAAAAAAdMBIAAAAAHUASAAAAAB1QFAAAAAAdYBQAAAAAHXAUAAAAAB2AEBAAAAAdkBAQAAAAHaAQEAAAABARUAAJYCADABFQAAlgIAMBIJAACNAwAgCgAAjgMAIMsBAQCFAwAhzAEBAIUDACHNASAAhgMAIc4BAgCHAwAhzwEgAIgDACHQAQEAhQMAIdEBCACJAwAh0gFAAIoDACHTASAAhgMAIdQBIACGAwAh1QFAAIoDACHWAUAAiwMAIdcBQACLAwAh2AEBAIwDACHZAQEAjAMAIdoBAQCFAwAhAgAAABUAIBUAAJkCACAQywEBAIUDACHMAQEAhQMAIc0BIACGAwAhzgECAIcDACHPASAAiAMAIdABAQCFAwAh0QEIAIkDACHSAUAAigMAIdMBIACGAwAh1AEgAIYDACHVAUAAigMAIdYBQACLAwAh1wFAAIsDACHYAQEAjAMAIdkBAQCMAwAh2gEBAIUDACECAAAAEwAgFQAAmwIAIAIAAAATACAVAACbAgAgAwAAABUAIBwAAJQCACAdAACZAgAgAQAAABUAIAEAAAATACALCAAAgAMAICIAAIMDACAjAACCAwAgZAAAgQMAIGUAAIQDACDOAQAA_wIAIM8BAAD_AgAg0gEAAP8CACDVAQAA_wIAINgBAAD_AgAg2QEAAP8CACATyAEAAKUCADDJAQAAogIAEMoBAAClAgAwywEBAKYCACHMAQEApgIAIc0BIACnAgAhzgECAKgCACHPASAAqQIAIdABAQCmAgAh0QEIAKoCACHSAUAAqwIAIdMBIACnAgAh1AEgAKcCACHVAUAAqwIAIdYBQACsAgAh1wFAAKwCACHYAQEArQIAIdkBAQCtAgAh2gEBAKYCACEDAAAAEwAgAQAAoQIAMCEAAKICACADAAAAEwAgAQAAFAAwAgAAFQAgE8gBAAClAgAwyQEAAKICABDKAQAApQIAMMsBAQCmAgAhzAEBAKYCACHNASAApwIAIc4BAgCoAgAhzwEgAKkCACHQAQEApgIAIdEBCACqAgAh0gFAAKsCACHTASAApwIAIdQBIACnAgAh1QFAAKsCACHWAUAArAIAIdcBQACsAgAh2AEBAK0CACHZAQEArQIAIdoBAQCmAgAhDggAALICACAiAAC_AgAgIwAAvwIAINsBAQAAAAHcAQEAAAAE3QEBAAAABN4BAQAAAAHfAQEAAAAB4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wEBAAAAAeQBAQAAAAHlAQEAvgIAIQUIAACyAgAgIgAAvQIAICMAAL0CACDbASAAAAAB5QEgALwCACENCAAArwIAICIAAK8CACAjAACvAgAgZAAAuwIAIGUAAK8CACDbAQIAAAAB3AECAAAABd0BAgAAAAXeAQIAAAAB3wECAAAAAeABAgAAAAHhAQIAAAAB5QECALoCACEFCAAArwIAICIAALkCACAjAAC5AgAg2wEgAAAAAeUBIAC4AgAhDQgAALICACAiAAC3AgAgIwAAtwIAIGQAALcCACBlAAC3AgAg2wEIAAAAAdwBCAAAAATdAQgAAAAE3gEIAAAAAd8BCAAAAAHgAQgAAAAB4QEIAAAAAeUBCAC2AgAhCwgAAK8CACAiAAC1AgAgIwAAtQIAINsBQAAAAAHcAUAAAAAF3QFAAAAABd4BQAAAAAHfAUAAAAAB4AFAAAAAAeEBQAAAAAHlAUAAtAIAIQsIAACyAgAgIgAAswIAICMAALMCACDbAUAAAAAB3AFAAAAABN0BQAAAAATeAUAAAAAB3wFAAAAAAeABQAAAAAHhAUAAAAAB5QFAALECACEOCAAArwIAICIAALACACAjAACwAgAg2wEBAAAAAdwBAQAAAAXdAQEAAAAF3gEBAAAAAd8BAQAAAAHgAQEAAAAB4QEBAAAAAeIBAQAAAAHjAQEAAAAB5AEBAAAAAeUBAQCuAgAhDggAAK8CACAiAACwAgAgIwAAsAIAINsBAQAAAAHcAQEAAAAF3QEBAAAABd4BAQAAAAHfAQEAAAAB4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wEBAAAAAeQBAQAAAAHlAQEArgIAIQjbAQIAAAAB3AECAAAABd0BAgAAAAXeAQIAAAAB3wECAAAAAeABAgAAAAHhAQIAAAAB5QECAK8CACEL2wEBAAAAAdwBAQAAAAXdAQEAAAAF3gEBAAAAAd8BAQAAAAHgAQEAAAAB4QEBAAAAAeIBAQAAAAHjAQEAAAAB5AEBAAAAAeUBAQCwAgAhCwgAALICACAiAACzAgAgIwAAswIAINsBQAAAAAHcAUAAAAAE3QFAAAAABN4BQAAAAAHfAUAAAAAB4AFAAAAAAeEBQAAAAAHlAUAAsQIAIQjbAQIAAAAB3AECAAAABN0BAgAAAATeAQIAAAAB3wECAAAAAeABAgAAAAHhAQIAAAAB5QECALICACEI2wFAAAAAAdwBQAAAAATdAUAAAAAE3gFAAAAAAd8BQAAAAAHgAUAAAAAB4QFAAAAAAeUBQACzAgAhCwgAAK8CACAiAAC1AgAgIwAAtQIAINsBQAAAAAHcAUAAAAAF3QFAAAAABd4BQAAAAAHfAUAAAAAB4AFAAAAAAeEBQAAAAAHlAUAAtAIAIQjbAUAAAAAB3AFAAAAABd0BQAAAAAXeAUAAAAAB3wFAAAAAAeABQAAAAAHhAUAAAAAB5QFAALUCACENCAAAsgIAICIAALcCACAjAAC3AgAgZAAAtwIAIGUAALcCACDbAQgAAAAB3AEIAAAABN0BCAAAAATeAQgAAAAB3wEIAAAAAeABCAAAAAHhAQgAAAAB5QEIALYCACEI2wEIAAAAAdwBCAAAAATdAQgAAAAE3gEIAAAAAd8BCAAAAAHgAQgAAAAB4QEIAAAAAeUBCAC3AgAhBQgAAK8CACAiAAC5AgAgIwAAuQIAINsBIAAAAAHlASAAuAIAIQLbASAAAAAB5QEgALkCACENCAAArwIAICIAAK8CACAjAACvAgAgZAAAuwIAIGUAAK8CACDbAQIAAAAB3AECAAAABd0BAgAAAAXeAQIAAAAB3wECAAAAAeABAgAAAAHhAQIAAAAB5QECALoCACEI2wEIAAAAAdwBCAAAAAXdAQgAAAAF3gEIAAAAAd8BCAAAAAHgAQgAAAAB4QEIAAAAAeUBCAC7AgAhBQgAALICACAiAAC9AgAgIwAAvQIAINsBIAAAAAHlASAAvAIAIQLbASAAAAAB5QEgAL0CACEOCAAAsgIAICIAAL8CACAjAAC_AgAg2wEBAAAAAdwBAQAAAATdAQEAAAAE3gEBAAAAAd8BAQAAAAHgAQEAAAAB4QEBAAAAAeIBAQAAAAHjAQEAAAAB5AEBAAAAAeUBAQC-AgAhC9sBAQAAAAHcAQEAAAAE3QEBAAAABN4BAQAAAAHfAQEAAAAB4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wEBAAAAAeQBAQAAAAHlAQEAvwIAIQ7IAQAAwAIAMMkBAACMAgAQygEAAMACADDLAQEApgIAIcwBAQCmAgAhzQEgAKcCACHTASAApwIAIdQBIACnAgAh1QFAAKsCACHWAUAArAIAIdcBQACsAgAh2AEBAK0CACHZAQEArQIAIeYBAQCtAgAhDwcAAMcCACDIAQAAwQIAMMkBAAD5AQAQygEAAMECADDLAQEAwgIAIcwBAQDCAgAhzQEgAMQCACHTASAAxAIAIdQBIADEAgAh1QFAAMUCACHWAUAAxgIAIdcBQADGAgAh2AEBAMMCACHZAQEAwwIAIeYBAQDDAgAhC9sBAQAAAAHcAQEAAAAE3QEBAAAABN4BAQAAAAHfAQEAAAAB4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wEBAAAAAeQBAQAAAAHlAQEAvwIAIQvbAQEAAAAB3AEBAAAABd0BAQAAAAXeAQEAAAAB3wEBAAAAAeABAQAAAAHhAQEAAAAB4gEBAAAAAeMBAQAAAAHkAQEAAAAB5QEBALACACEC2wEgAAAAAeUBIAC9AgAhCNsBQAAAAAHcAUAAAAAF3QFAAAAABd4BQAAAAAHfAUAAAAAB4AFAAAAAAeEBQAAAAAHlAUAAtQIAIQjbAUAAAAAB3AFAAAAABN0BQAAAAATeAUAAAAAB3wFAAAAAAeABQAAAAAHhAUAAAAAB5QFAALMCACED5wEAABMAIOgBAAATACDpAQAAEwAgDcgBAADIAgAwyQEAAPMBABDKAQAAyAIAMMsBAQCmAgAh0wEgAKcCACHUASAApwIAIdUBQACrAgAh1gFAAKwCACHXAUAArAIAIeoBCACqAgAh6wEBAKYCACHsAQEApgIAIe0BAQCmAgAhCcgBAADJAgAwyQEAAN0BABDKAQAAyQIAMMsBAQCmAgAh0gFAAKwCACHTASAApwIAIdYBQACsAgAh7gEBAKYCACHvAQgAqgIAIQnIAQAAygIAMMkBAADKAQAQygEAAMoCADDLAQEAwgIAIdIBQADGAgAh0wEgAMQCACHWAUAAxgIAIe4BAQDCAgAh7wEIAMsCACEI2wEIAAAAAdwBCAAAAATdAQgAAAAE3gEIAAAAAd8BCAAAAAHgAQgAAAAB4QEIAAAAAeUBCAC3AgAhDcgBAADMAgAwyQEAAMQBABDKAQAAzAIAMMsBAQCmAgAh1gFAAKwCACHXAUAArAIAIewBAQCmAgAh8AEIAKoCACHxAQEArQIAIfIBAQCtAgAh9AEAAM0C9AEi9QEBAK0CACH2AQAAzgIAIAcIAACyAgAgIgAA0QIAICMAANECACDbAQAAAPQBAtwBAAAA9AEI3QEAAAD0AQjlAQAA0AL0ASIPCAAArwIAICIAAM8CACAjAADPAgAg2wGAAAAAAd4BgAAAAAHfAYAAAAAB4AGAAAAAAeEBgAAAAAHlAYAAAAAB9wEBAAAAAfgBAQAAAAH5AQEAAAAB-gGAAAAAAfsBgAAAAAH8AYAAAAABDNsBgAAAAAHeAYAAAAAB3wGAAAAAAeABgAAAAAHhAYAAAAAB5QGAAAAAAfcBAQAAAAH4AQEAAAAB-QEBAAAAAfoBgAAAAAH7AYAAAAAB_AGAAAAAAQcIAACyAgAgIgAA0QIAICMAANECACDbAQAAAPQBAtwBAAAA9AEI3QEAAAD0AQjlAQAA0AL0ASIE2wEAAAD0AQLcAQAAAPQBCN0BAAAA9AEI5QEAANEC9AEiDgYAANUCACDIAQAA0gIAMMkBAAAaABDKAQAA0gIAMMsBAQDCAgAh1gFAAMYCACHXAUAAxgIAIewBAQDCAgAh8AEIAMsCACHxAQEAwwIAIfIBAQDDAgAh9AEAANMC9AEi9QEBAMMCACH2AQAA1AIAIATbAQAAAPQBAtwBAAAA9AEI3QEAAAD0AQjlAQAA0QL0ASIM2wGAAAAAAd4BgAAAAAHfAYAAAAAB4AGAAAAAAeEBgAAAAAHlAYAAAAAB9wEBAAAAAfgBAQAAAAH5AQEAAAAB-gGAAAAAAfsBgAAAAAH8AYAAAAABGwMAAPECACAKAAD2AgAgDAAA_AIAIA4AAO4CACDIAQAA-gIAMMkBAAALABDKAQAA-gIAMMsBAQDCAgAh1AEgAMQCACHVAUAAxQIAIdYBQADGAgAh1wFAAMYCACH0AQAA-wKDAiKBAgEAwgIAIYMCCADLAgAhhAIBAMICACGFAgEAwgIAIYYCAQDCAgAhhwIBAMICACGIAgEAwgIAIYkCAQDCAgAhigIAANMC9AEiiwIBAMICACGMAgEAwwIAIY0CAQDCAgAhpAIAAAsAIKUCAAALACAJyAEAANYCADDJAQAArAEAEMoBAADWAgAwywEBAKYCACHsAQEApgIAIf0BAgDXAgAh_gEIAKoCACH_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-AIAIf4BCADLAgAh_wEIAMsCACGAAgEAwgIAIQjbAQIAAAAB3AECAAAABN0BAgAAAATeAQIAAAAB3wECAAAAAeABAgAAAAHhAQIAAAAB5QECALICACEXCQAA9QIAIAoAAPYCACDIAQAA8gIAMMkBAAATABDKAQAA8gIAMMsBAQDCAgAhzAEBAMICACHNASAAxAIAIc4BAgDzAgAhzwEgAPQCACHQAQEAwgIAIdEBCADLAgAh0gFAAMUCACHTASAAxAIAIdQBIADEAgAh1QFAAMUCACHWAUAAxgIAIdcBQADGAgAh2AEBAMMCACHZAQEAwwIAIdoBAQDCAgAhpAIAABMAIKUCAAATACAZAwAA8QIAIAoAAPYCACAMAAD8AgAgDgAA7gIAIMgBAAD6AgAwyQEAAAsAEMoBAAD6AgAwywEBAMICACHUASAAxAIAIdUBQADFAgAh1gFAAMYCACHXAUAAxgIAIfQBAAD7AoMCIoECAQDCAgAhgwIIAMsCACGEAgEAwgIAIYUCAQDCAgAhhgIBAMICACGHAgEAwgIAIYgCAQDCAgAhiQIBAMICACGKAgAA0wL0ASKLAgEAwgIAIYwCAQDDAgAhjQIBAMICACEE2wEAAACDAgLcAQAAAIMCCN0BAAAAgwII5QEAANwCgwIiEAYAANUCACDIAQAA0gIAMMkBAAAaABDKAQAA0gIAMMsBAQDCAgAh1gFAAMYCACHXAUAAxgIAIewBAQDCAgAh8AEIAMsCACHxAQEAwwIAIfIBAQDDAgAh9AEAANMC9AEi9QEBAMMCACH2AQAA1AIAIKQCAAAaACClAgAAGgAgEQMAAPECACDIAQAA_QIAMMkBAAAHABDKAQAA_QIAMMsBAQDCAgAh1gFAAMYCACHXAUAAxgIAIY0CAQDCAgAhkQIBAMICACGSAgEAwgIAIZMCAQDDAgAhlAIBAMMCACGVAgEAwwIAIZYCQADFAgAhlwJAAMUCACGYAgEAwwIAIZkCAQDDAgAhDAMAAPECACDIAQAA_gIAMMkBAAADABDKAQAA_gIAMMsBAQDCAgAh1gFAAMYCACHXAUAAxgIAIY0CAQDCAgAhkAJAAMYCACGaAgEAwgIAIZsCAQDDAgAhnAIBAMMCACEAAAAAAAABqQIBAAAAAQGpAiAAAAABBakCAgAAAAGvAgIAAAABsAICAAAAAbECAgAAAAGyAgIAAAABAakCIAAAAAEFqQIIAAAAAa8CCAAAAAGwAggAAAABsQIIAAAAAbICCAAAAAEBqQJAAAAAAQGpAkAAAAABAakCAQAAAAEFHAAA8gQAIB0AAPsEACCmAgAA8wQAIKcCAAD6BAAgrAIAAPYBACALHAAAjwMAMB0AAJQDADCmAgAAkAMAMKcCAACRAwAwqAIAAJIDACCpAgAAkwMAMKoCAACTAwAwqwIAAJMDADCsAgAAkwMAMK0CAACVAwAwrgIAAJYDADAGBgAAnQMAIMsBAQAAAAHsAQEAAAAB_QECAAAAAf4BCAAAAAH_AQgAAAABAgAAABEAIBwAAJwDACADAAAAEQAgHAAAnAMAIB0AAJoDACABFQAA-QQAMAsGAADVAgAgCwAA-QIAIMgBAAD3AgAwyQEAAA8AEMoBAAD3AgAwywEBAAAAAewBAQDCAgAh_QECAPgCACH-AQgAywIAIf8BCADLAgAhgAIBAMICACECAAAAEQAgFQAAmgMAIAIAAACXAwAgFQAAmAMAIAnIAQAAlgMAMMkBAACXAwAQygEAAJYDADDLAQEAwgIAIewBAQDCAgAh_QECAPgCACH-AQgAywIAIf8BCADLAgAhgAIBAMICACEJyAEAAJYDADDJAQAAlwMAEMoBAACWAwAwywEBAMICACHsAQEAwgIAIf0BAgD4AgAh_gEIAMsCACH_AQgAywIAIYACAQDCAgAhBcsBAQCFAwAh7AEBAIUDACH9AQIAmQMAIf4BCACJAwAh_wEIAIkDACEFqQICAAAAAa8CAgAAAAGwAgIAAAABsQICAAAAAbICAgAAAAEGBgAAmwMAIMsBAQCFAwAh7AEBAIUDACH9AQIAmQMAIf4BCACJAwAh_wEIAIkDACEFHAAA9AQAIB0AAPcEACCmAgAA9QQAIKcCAAD2BAAgrAIAAA0AIAYGAACdAwAgywEBAAAAAewBAQAAAAH9AQIAAAAB_gEIAAAAAf8BCAAAAAEDHAAA9AQAIKYCAAD1BAAgrAIAAA0AIAMcAADyBAAgpgIAAPMEACCsAgAA9gEAIAQcAACPAwAwpgIAAJADADCoAgAAkgMAIKwCAACTAwAwAAAACxwAAKQDADAdAACpAwAwpgIAAKUDADCnAgAApgMAMKgCAACnAwAgqQIAAKgDADCqAgAAqAMAMKsCAACoAwAwrAIAAKgDADCtAgAAqgMAMK4CAACrAwAwEAoAAJ8DACDLAQEAAAABzAEBAAAAAc0BIAAAAAHOAQIAAAABzwEgAAAAAdABAQAAAAHRAQgAAAAB0gFAAAAAAdMBIAAAAAHUASAAAAAB1QFAAAAAAdYBQAAAAAHXAUAAAAAB2AEBAAAAAdkBAQAAAAECAAAAFQAgHAAArwMAIAMAAAAVACAcAACvAwAgHQAArgMAIAEVAADxBAAwFQkAAPUCACAKAAD2AgAgyAEAAPICADDJAQAAEwAQygEAAPICADDLAQEAAAABzAEBAMICACHNASAAxAIAIc4BAgDzAgAhzwEgAPQCACHQAQEAwgIAIdEBCADLAgAh0gFAAMUCACHTASAAxAIAIdQBIADEAgAh1QFAAMUCACHWAUAAxgIAIdcBQADGAgAh2AEBAMMCACHZAQEAwwIAIdoBAQDCAgAhAgAAABUAIBUAAK4DACACAAAArAMAIBUAAK0DACATyAEAAKsDADDJAQAArAMAEMoBAACrAwAwywEBAMICACHMAQEAwgIAIc0BIADEAgAhzgECAPMCACHPASAA9AIAIdABAQDCAgAh0QEIAMsCACHSAUAAxQIAIdMBIADEAgAh1AEgAMQCACHVAUAAxQIAIdYBQADGAgAh1wFAAMYCACHYAQEAwwIAIdkBAQDDAgAh2gEBAMICACETyAEAAKsDADDJAQAArAMAEMoBAACrAwAwywEBAMICACHMAQEAwgIAIc0BIADEAgAhzgECAPMCACHPASAA9AIAIdABAQDCAgAh0QEIAMsCACHSAUAAxQIAIdMBIADEAgAh1AEgAMQCACHVAUAAxQIAIdYBQADGAgAh1wFAAMYCACHYAQEAwwIAIdkBAQDDAgAh2gEBAMICACEPywEBAIUDACHMAQEAhQMAIc0BIACGAwAhzgECAIcDACHPASAAiAMAIdABAQCFAwAh0QEIAIkDACHSAUAAigMAIdMBIACGAwAh1AEgAIYDACHVAUAAigMAIdYBQACLAwAh1wFAAIsDACHYAQEAjAMAIdkBAQCMAwAhEAoAAI4DACDLAQEAhQMAIcwBAQCFAwAhzQEgAIYDACHOAQIAhwMAIc8BIACIAwAh0AEBAIUDACHRAQgAiQMAIdIBQACKAwAh0wEgAIYDACHUASAAhgMAIdUBQACKAwAh1gFAAIsDACHXAUAAiwMAIdgBAQCMAwAh2QEBAIwDACEQCgAAnwMAIMsBAQAAAAHMAQEAAAABzQEgAAAAAc4BAgAAAAHPASAAAAAB0AEBAAAAAdEBCAAAAAHSAUAAAAAB0wEgAAAAAdQBIAAAAAHVAUAAAAAB1gFAAAAAAdcBQAAAAAHYAQEAAAAB2QEBAAAAAQQcAACkAwAwpgIAAKUDADCoAgAApwMAIKwCAACoAwAwAAAAAAAABRwAAOkEACAdAADvBAAgpgIAAOoEACCnAgAA7gQAIKwCAAANACAFHAAA5wQAIB0AAOwEACCmAgAA6AQAIKcCAADrBAAgrAIAAAEAIAMcAADpBAAgpgIAAOoEACCsAgAADQAgAxwAAOcEACCmAgAA6AQAIKwCAAABACAAAAAAAAAAAAAAAakCAAAA9AECBRwAAOIEACAdAADlBAAgpgIAAOMEACCnAgAA5AQAIKwCAAANACADHAAA4gQAIKYCAADjBAAgrAIAAA0AIAYDAADDBAAgCgAAxQQAIAwAAMcEACAOAADCBAAg1QEAAP8CACCMAgAA_wIAIAAAAAAABRwAAN0EACAdAADgBAAgpgIAAN4EACCnAgAA3wQAIKwCAAAVACADHAAA3QQAIKYCAADeBAAgrAIAABUAIAAAAAAAAakCAAAAgwICBRwAANYEACAdAADbBAAgpgIAANcEACCnAgAA2gQAIKwCAAABACALHAAA6wMAMB0AAO8DADCmAgAA7AMAMKcCAADtAwAwqAIAAO4DACCpAgAAkwMAMKoCAACTAwAwqwIAAJMDADCsAgAAkwMAMK0CAADwAwAwrgIAAJYDADAHHAAA5gMAIB0AAOkDACCmAgAA5wMAIKcCAADoAwAgqgIAABoAIKsCAAAaACCsAgAArwEAIAscAADaAwAwHQAA3wMAMKYCAADbAwAwpwIAANwDADCoAgAA3QMAIKkCAADeAwAwqgIAAN4DADCrAgAA3gMAMKwCAADeAwAwrQIAAOADADCuAgAA4QMAMAoNAAC6AwAgywEBAAAAAdMBIAAAAAHUASAAAAAB1QFAAAAAAdYBQAAAAAHXAUAAAAAB6gEIAAAAAesBAQAAAAHtAQEAAAABAgAAAB4AIBwAAOUDACADAAAAHgAgHAAA5QMAIB0AAOQDACABFQAA2QQAMBAGAADVAgAgDQAA8QIAIMgBAADwAgAwyQEAABwAEMoBAADwAgAwywEBAAAAAdMBIADEAgAh1AEgAMQCACHVAUAAxQIAIdYBQADGAgAh1wFAAMYCACHqAQgAywIAIesBAQDCAgAh7AEBAMICACHtAQEAwgIAIaMCAADvAgAgAgAAAB4AIBUAAOQDACACAAAA4gMAIBUAAOMDACANyAEAAOEDADDJAQAA4gMAEMoBAADhAwAwywEBAMICACHTASAAxAIAIdQBIADEAgAh1QFAAMUCACHWAUAAxgIAIdcBQADGAgAh6gEIAMsCACHrAQEAwgIAIewBAQDCAgAh7QEBAMICACENyAEAAOEDADDJAQAA4gMAEMoBAADhAwAwywEBAMICACHTASAAxAIAIdQBIADEAgAh1QFAAMUCACHWAUAAxgIAIdcBQADGAgAh6gEIAMsCACHrAQEAwgIAIewBAQDCAgAh7QEBAMICACEJywEBAIUDACHTASAAhgMAIdQBIACGAwAh1QFAAIoDACHWAUAAiwMAIdcBQACLAwAh6gEIAIkDACHrAQEAhQMAIe0BAQCFAwAhCg0AALgDACDLAQEAhQMAIdMBIACGAwAh1AEgAIYDACHVAUAAigMAIdYBQACLAwAh1wFAAIsDACHqAQgAiQMAIesBAQCFAwAh7QEBAIUDACEKDQAAugMAIMsBAQAAAAHTASAAAAAB1AEgAAAAAdUBQAAAAAHWAUAAAAAB1wFAAAAAAeoBCAAAAAHrAQEAAAAB7QEBAAAAAQnLAQEAAAAB1gFAAAAAAdcBQAAAAAHwAQgAAAAB8QEBAAAAAfIBAQAAAAH0AQAAAPQBAvUBAQAAAAH2AYAAAAABAgAAAK8BACAcAADmAwAgAwAAABoAIBwAAOYDACAdAADqAwAgCwAAABoAIBUAAOoDACDLAQEAhQMAIdYBQACLAwAh1wFAAIsDACHwAQgAiQMAIfEBAQCMAwAh8gEBAIwDACH0AQAAxQP0ASL1AQEAjAMAIfYBgAAAAAEJywEBAIUDACHWAUAAiwMAIdcBQACLAwAh8AEIAIkDACHxAQEAjAMAIfIBAQCMAwAh9AEAAMUD9AEi9QEBAIwDACH2AYAAAAABBgsAAM8DACDLAQEAAAAB_QECAAAAAf4BCAAAAAH_AQgAAAABgAIBAAAAAQIAAAARACAcAADzAwAgAwAAABEAIBwAAPMDACAdAADyAwAgARUAANgEADACAAAAEQAgFQAA8gMAIAIAAACXAwAgFQAA8QMAIAXLAQEAhQMAIf0BAgCZAwAh_gEIAIkDACH_AQgAiQMAIYACAQCFAwAhBgsAAM4DACDLAQEAhQMAIf0BAgCZAwAh_gEIAIkDACH_AQgAiQMAIYACAQCFAwAhBgsAAM8DACDLAQEAAAAB_QECAAAAAf4BCAAAAAH_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_gIAMMkBAAADABDKAQAA_gIAMMsBAQAAAAHWAUAAxgIAIdcBQADGAgAhjQIBAMICACGQAkAAxgIAIZoCAQAAAAGbAgEAwwIAIZwCAQDDAgAhAgAAAAUAIBUAALkEACACAAAAtwQAIBUAALgEACALyAEAALYEADDJAQAAtwQAEMoBAAC2BAAwywEBAMICACHWAUAAxgIAIdcBQADGAgAhjQIBAMICACGQAkAAxgIAIZoCAQDCAgAhmwIBAMMCACGcAgEAwwIAIQvIAQAAtgQAMMkBAAC3BAAQygEAALYEADDLAQEAwgIAIdYBQADGAgAh1wFAAMYCACGNAgEAwgIAIZACQADGAgAhmgIBAMICACGbAgEAwwIAIZwCAQDDAgAhB8sBAQCFAwAh1gFAAIsDACHXAUAAiwMAIZACQACLAwAhmgIBAIUDACGbAgEAjAMAIZwCAQCMAwAhB8sBAQCFAwAh1gFAAIsDACHXAUAAiwMAIZACQACLAwAhmgIBAIUDACGbAgEAjAMAIZwCAQCMAwAhB8sBAQAAAAHWAUAAAAAB1wFAAAAAAZACQAAAAAGaAgEAAAABmwIBAAAAAZwCAQAAAAEEHAAArwQAMKYCAACwBAAwqAIAALIEACCsAgAAswQAMAQcAACjBAAwpgIAAKQEADCoAgAApgQAIKwCAACnBAAwBBwAAJcEADCmAgAAmAQAMKgCAACaBAAgrAIAAJsEADAEHAAAjgQAMKYCAACPBAAwqAIAAJEEACCsAgAA3gMAMAAAAAAGBAAAvwQAIAUAAMAEACAOAADCBAAgDwAAwQQAINgBAAD_AgAgnwIAAP8CACAFBwAAsQMAINUBAAD_AgAg2AEAAP8CACDZAQAA_wIAIOYBAAD_AgAgAAgJAADEBAAgCgAAxQQAIM4BAAD_AgAgzwEAAP8CACDSAQAA_wIAINUBAAD_AgAg2AEAAP8CACDZAQAA_wIAIAUGAADIAwAg8QEAAP8CACDyAQAA_wIAIPUBAAD_AgAg9gEAAP8CACAHywEBAAAAAdYBQAAAAAHXAUAAAAABkAJAAAAAAZoCAQAAAAGbAgEAAAABnAIBAAAAAQzLAQEAAAAB1gFAAAAAAdcBQAAAAAGRAgEAAAABkgIBAAAAAZMCAQAAAAGUAgEAAAABlQIBAAAAAZYCQAAAAAGXAkAAAAABmAIBAAAAAZkCAQAAAAERywEBAAAAAdQBIAAAAAHVAUAAAAAB1gFAAAAAAdcBQAAAAAH0AQAAAIMCAoECAQAAAAGDAggAAAABhAIBAAAAAYUCAQAAAAGGAgEAAAABhwIBAAAAAYgCAQAAAAGJAgEAAAABigIAAAD0AQKLAgEAAAABjAIBAAAAAQnLAQEAAAAB0wEgAAAAAdQBIAAAAAHVAUAAAAAB1gFAAAAAAdcBQAAAAAHqAQgAAAAB6wEBAAAAAewBAQAAAAEOBQAAvAQAIA4AAL4EACAPAAC9BAAgywEBAAAAAcwBAQAAAAHUASAAAAAB1gFAAAAAAdcBQAAAAAHYAQEAAAAB9AEAAACjAgKdAgEAAAABngIgAAAAAZ8CAQAAAAGhAgAAAKECAgIAAAABACAcAADMBAAgAwAAACgAIBwAAMwEACAdAADQBAAgEAAAACgAIAUAAIsEACAOAACNBAAgDwAAjAQAIBUAANAEACDLAQEAhQMAIcwBAQCFAwAh1AEgAIYDACHWAUAAiwMAIdcBQACLAwAh2AEBAIwDACH0AQAAiQSjAiKdAgEAhQMAIZ4CIACGAwAhnwIBAIwDACGhAgAAiAShAiIOBQAAiwQAIA4AAI0EACAPAACMBAAgywEBAIUDACHMAQEAhQMAIdQBIACGAwAh1gFAAIsDACHXAUAAiwMAIdgBAQCMAwAh9AEAAIkEowIinQIBAIUDACGeAiAAhgMAIZ8CAQCMAwAhoQIAAIgEoQIiDgQAALsEACAOAAC-BAAgDwAAvQQAIMsBAQAAAAHMAQEAAAAB1AEgAAAAAdYBQAAAAAHXAUAAAAAB2AEBAAAAAfQBAAAAowICnQIBAAAAAZ4CIAAAAAGfAgEAAAABoQIAAAChAgICAAAAAQAgHAAA0QQAIAMAAAAoACAcAADRBAAgHQAA1QQAIBAAAAAoACAEAACKBAAgDgAAjQQAIA8AAIwEACAVAADVBAAgywEBAIUDACHMAQEAhQMAIdQBIACGAwAh1gFAAIsDACHXAUAAiwMAIdgBAQCMAwAh9AEAAIkEowIinQIBAIUDACGeAiAAhgMAIZ8CAQCMAwAhoQIAAIgEoQIiDgQAAIoEACAOAACNBAAgDwAAjAQAIMsBAQCFAwAhzAEBAIUDACHUASAAhgMAIdYBQACLAwAh1wFAAIsDACHYAQEAjAMAIfQBAACJBKMCIp0CAQCFAwAhngIgAIYDACGfAgEAjAMAIaECAACIBKECIg4EAAC7BAAgBQAAvAQAIA4AAL4EACDLAQEAAAABzAEBAAAAAdQBIAAAAAHWAUAAAAAB1wFAAAAAAdgBAQAAAAH0AQAAAKMCAp0CAQAAAAGeAiAAAAABnwIBAAAAAaECAAAAoQICAgAAAAEAIBwAANYEACAFywEBAAAAAf0BAgAAAAH-AQgAAAAB_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_QBIosCAQCFAwAhjAIBAIwDACGNAgEAhQMAIRUDAADWAwAgDAAA2AMAIA4AANkDACDLAQEAhQMAIdQBIACGAwAh1QFAAIoDACHWAUAAiwMAIdcBQACLAwAh9AEAANUDgwIigQIBAIUDACGDAggAiQMAIYQCAQCFAwAhhQIBAIUDACGGAgEAhQMAIYcCAQCFAwAhiAIBAIUDACGJAgEAhQMAIYoCAADFA_QBIosCAQCFAwAhjAIBAIwDACGNAgEAhQMAIQXLAQEAAAAB7AEBAAAAAf0BAgAAAAH-AQgAAAAB_wEIAAAAAQMAAAD5AQAgHAAA8gQAIB0AAPwEACANAAAA-QEAIBUAAPwEACDLAQEAhQMAIcwBAQCFAwAhzQEgAIYDACHTASAAhgMAIdQBIACGAwAh1QFAAIoDACHWAUAAiwMAIdcBQACLAwAh2AEBAIwDACHZAQEAjAMAIeYBAQCMAwAhC8sBAQCFAwAhzAEBAIUDACHNASAAhgMAIdMBIACGAwAh1AEgAIYDACHVAUAAigMAIdYBQACLAwAh1wFAAIsDACHYAQEAjAMAIdkBAQCMAwAh5gEBAIwDACEFBAYCBQoDCAANDiILDw4EAQMAAQEDAAEFAwABCAAMChIFDBsKDh8LAgYABAsABgMIAAkJAAcKGAUCBxYGCAAIAQcXAAEKGQABBgAEAgYABA0AAQIKIAAOIQAEBCMABSQADiYADyUAAAAAAwgAEiIAEyMAFAAAAAMIABIiABMjABQBAwABAQMAAQMIABkiABojABsAAAADCAAZIgAaIwAbAQMAAQEDAAEDCAAgIgAhIwAiAAAAAwgAICIAISMAIgAAAAMIACgiACkjACoAAAADCAAoIgApIwAqAQMAAQEDAAEFCAAvIgAyIwAzZAAwZQAxAAAAAAAFCAAvIgAyIwAzZAAwZQAxAgYABAsABgIGAAQLAAYFCAA4IgA7IwA8ZAA5ZQA6AAAAAAAFCAA4IgA7IwA8ZAA5ZQA6AQYABAEGAAQFCABBIgBEIwBFZABCZQBDAAAAAAAFCABBIgBEIwBFZABCZQBDAAAABQgASyIATiMAT2QATGUATQAAAAAABQgASyIATiMAT2QATGUATQIGAAQNAAECBgAEDQABBQgAVCIAVyMAWGQAVWUAVgAAAAAABQgAVCIAVyMAWGQAVWUAVgAAAwgAXSIAXiMAXwAAAAMIAF0iAF4jAF8BCQAHAQkABwUIAGQiAGcjAGhkAGVlAGYAAAAAAAUIAGQiAGcjAGhkAGVlAGYQAgERJwESKgETKwEULAEWLgEXMA4YMQ8ZMwEaNQ4bNhAeNwEfOAEgOQ4kPBElPRUmPgInPwIoQAIpQQIqQgIrRAIsRg4tRxYuSQIvSw4wTBcxTQIyTgIzTw40Uhg1Uxw2VAM3VQM4VgM5VwM6WAM7WgM8XA49XR0-XwM_YQ5AYh5BYwNCZANDZQ5EaB9FaSNGayRHbCRIbyRJcCRKcSRLcyRMdQ5NdiVOeCRPeg5QeyZRfCRSfSRTfg5UgQEnVYIBK1aDAQRXhAEEWIUBBFmGAQRahwEEW4kBBFyLAQ5djAEsXo4BBF-QAQ5gkQEtYZIBBGKTAQRjlAEOZpcBLmeYATRomQEFaZoBBWqbAQVrnAEFbJ0BBW2fAQVuoQEOb6IBNXCkAQVxpgEOcqcBNnOoAQV0qQEFdaoBDnatATd3rgE9eLABCnmxAQp6swEKe7QBCny1AQp9twEKfrkBDn-6AT6AAbwBCoEBvgEOggG_AT-DAcABCoQBwQEKhQHCAQ6GAcUBQIcBxgFGiAHIAUeJAckBR4oBzAFHiwHNAUeMAc4BR40B0AFHjgHSAQ6PAdMBSJAB1QFHkQHXAQ6SAdgBSZMB2QFHlAHaAUeVAdsBDpYB3gFKlwHfAVCYAeABC5kB4QELmgHiAQubAeMBC5wB5AELnQHmAQueAegBDp8B6QFRoAHrAQuhAe0BDqIB7gFSowHvAQukAfABC6UB8QEOpgH0AVOnAfUBWagB9wEHqQH4AQeqAfsBB6sB_AEHrAH9AQetAf8BB64BgQIOrwGCAlqwAYQCB7EBhgIOsgGHAluzAYgCB7QBiQIHtQGKAg62AY0CXLcBjgJguAGPAga5AZACBroBkQIGuwGSAga8AZMCBr0BlQIGvgGXAg6_AZgCYcABmgIGwQGcAg7CAZ0CYsMBngIGxAGfAgbFAaACDsYBowJjxwGkAmk"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  CouponScalarFieldEnum: () => CouponScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  ItemScalarFieldEnum: () => ItemScalarFieldEnum,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  ModelName: () => ModelName,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  OrderItemScalarFieldEnum: () => OrderItemScalarFieldEnum,
  OrderScalarFieldEnum: () => OrderScalarFieldEnum,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.6.0",
  engine: "75cbdc1eb7150937890ad5465d861175c6624711"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  Order: "Order",
  OrderItem: "OrderItem",
  Payment: "Payment",
  Coupon: "Coupon",
  Review: "Review",
  Category: "Category",
  Item: "Item"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  phone: "phone",
  image: "image",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  role: "role",
  status: "status",
  isDeleted: "isDeleted"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var OrderScalarFieldEnum = {
  id: "id",
  orderNumber: "orderNumber",
  status: "status",
  totalAmount: "totalAmount",
  shippingName: "shippingName",
  shippingPhone: "shippingPhone",
  shippingEmail: "shippingEmail",
  shippingAddress: "shippingAddress",
  shippingCity: "shippingCity",
  shippingPostalCode: "shippingPostalCode",
  paymentStatus: "paymentStatus",
  paymentMethod: "paymentMethod",
  additionalInfo: "additionalInfo",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  userId: "userId"
};
var OrderItemScalarFieldEnum = {
  id: "id",
  quantity: "quantity",
  unitPrice: "unitPrice",
  subTotal: "subTotal",
  orderId: "orderId",
  itemId: "itemId"
};
var PaymentScalarFieldEnum = {
  id: "id",
  amount: "amount",
  transactionId: "transactionId",
  stripeEventId: "stripeEventId",
  status: "status",
  invoiceUrl: "invoiceUrl",
  paymentGatewayData: "paymentGatewayData",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  orderId: "orderId"
};
var CouponScalarFieldEnum = {
  id: "id",
  code: "code",
  discountAmount: "discountAmount",
  isActive: "isActive",
  expiryDate: "expiryDate",
  createdAt: "createdAt"
};
var ReviewScalarFieldEnum = {
  id: "id",
  rating: "rating",
  comment: "comment",
  isActive: "isActive",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  orderId: "orderId",
  customerId: "customerId"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  subName: "subName",
  image: "image",
  isFeatured: "isFeatured",
  description: "description",
  isActive: "isActive",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ItemScalarFieldEnum = {
  id: "id",
  name: "name",
  isFeatured: "isFeatured",
  packSize: "packSize",
  isSpicy: "isSpicy",
  weight: "weight",
  price: "price",
  expiryDate: "expiryDate",
  isActive: "isActive",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  image: "image",
  description: "description",
  categoryId: "categoryId"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/enums.ts
var UserRole = {
  USER: "USER",
  ADMIN: "ADMIN"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BANNED: "BANNED"
};
var OrderStatus = {
  PLACED: "PLACED",
  CANCELLED: "CANCELLED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED"
};

// src/generated/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = `${env.DATABASE_URL}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
var auth = betterAuth({
  appName: "Urban Snacks",
  trustedOrigins: [env.APP_ORIGIN, env.PROD_APP_ORIGIN],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 3
      // 3 days
    }
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false
    },
    disableCSRFCheck: true
    // Allow requests without Origin header (Postman, mobile apps, etc.)
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: UserRole.USER
      },
      status: {
        type: "string",
        defaultValue: UserStatus.ACTIVE
      },
      phone: {
        type: "string",
        required: false
      },
      isDeleted: {
        type: "boolean",
        defaultValue: false
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    }
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }
      if (ctx.body.role && ctx.body.role === UserRole.ADMIN) {
        throw new APIError("BAD_REQUEST", {
          message: "Admin role cannot be assigned during sign-up!"
        });
      }
      if (ctx.body.status && ctx.body.status === UserStatus.BANNED || ctx.body.status === UserStatus.INACTIVE) {
        throw new APIError("BAD_REQUEST", {
          message: "Invalid status for new users, must be ACTIVE!"
        });
      }
    })
  },
  secret: env.BETTER_AUTH_SECRET
});

// src/middlewares/logger.ts
var logger = (req, res, next) => {
  const time = (/* @__PURE__ */ new Date()).toLocaleString();
  const method = req.method.padEnd(6);
  const url = req.originalUrl.padEnd(30);
  const status = `${res.statusCode}`.padEnd(3);
  console.log(`${time} | ${status} - ${method} ${url}`);
  next();
};
var logger_default = logger;

// src/middlewares/error-handler.ts
var errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails = null;
  if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "Validation Error";
    errorDetails = err.message;
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = 409;
        errorMessage = "Conflict: Unique constraint failed";
        errorDetails = err.message;
        break;
      case "P2025":
        statusCode = 404;
        errorMessage = "Not Found: Record not found";
        errorDetails = err.message;
        break;
      default:
        statusCode = 400;
        errorMessage = "Bad Request";
        errorDetails = err.message;
        break;
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "Internal Server Error";
    errorDetails = err.message;
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    statusCode = 500;
    errorMessage = "Internal Server Error: Initialization Error";
    errorDetails = err.message;
  } else if (err instanceof prismaNamespace_exports.PrismaClientRustPanicError) {
    statusCode = 500;
    errorMessage = "Internal Server Error: Rust Panic";
    errorDetails = err.message;
  } else if (err instanceof Error) {
    errorMessage = err.message || "Internal Server Error";
  }
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: errorDetails
  });
};
var error_handler_default = errorHandler;

// src/middlewares/not-found.ts
var notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "API Not Found!",
    path: req.originalUrl
  });
};
var not_found_default = notFound;

// src/middlewares/auth.ts
import { fromNodeHeaders } from "better-auth/node";
var requireAuth = (...roles) => {
  return async (req, res, next) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Authentication required, Please log in to continue!"
      });
    }
    const { id, email, name, role, status } = session.user;
    if (status === UserStatus.BANNED) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Your account has been banned. Please contact support for more information!"
      });
    }
    req.user = { id, email, name, role, status };
    if (roles.length && !roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You don't have permissions to access this resource!"
      });
    }
    next();
  };
};
var auth_default = requireAuth;

// src/middlewares/async-handler.ts
var asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
var async_handler_default = asyncHandler;

// src/modules/category/category.route.ts
import express from "express";

// src/utils/QueryBuilder.ts
var QueryBuilder = class {
  constructor(model, queryParams, config2 = {}) {
    this.model = model;
    this.queryParams = queryParams;
    this.config = config2;
    this.query = {
      where: {},
      include: {},
      orderBy: {},
      skip: this.skip,
      take: this.limit
    };
    this.countQuery = {
      where: {}
    };
  }
  query;
  countQuery;
  page = 1;
  limit = 10;
  skip = 0;
  sortBy = "createdAt";
  sortOrder = "desc";
  selectFields;
  // Helper to determine if we should wrap in 'some'
  getRelationContext(relation) {
    const isMany = this.config.relationConfig?.[relation] === "many";
    return {
      isMany,
      operator: isMany ? "some" : null
    };
  }
  search() {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;
    if (searchTerm && searchableFields && searchableFields.length > 0) {
      const searchCondition = searchableFields.map(
        (field) => {
          const stringFilter = {
            contains: searchTerm,
            mode: "insensitive"
          };
          if (field.includes(".")) {
            const parts = field.split(".");
            const relation = parts[0];
            const { operator } = this.getRelationContext(relation);
            if (parts.length === 2) {
              const relationField = parts[1];
              const content = { [relationField]: stringFilter };
              return {
                [relation]: operator ? { [operator]: content } : content
              };
            } else if (parts.length === 3) {
              const nestedRelation = parts[1];
              const relationField = parts[2];
              const nestedContent = {
                [nestedRelation]: { [relationField]: stringFilter }
              };
              return {
                [relation]: operator ? { [operator]: nestedContent } : nestedContent
              };
            }
          }
          return { [field]: stringFilter };
        }
      );
      const whereConditions = this.query.where;
      whereConditions.OR = searchCondition;
      const countWhereCondition = this.countQuery.where;
      countWhereCondition.OR = searchCondition;
    }
    return this;
  }
  filter() {
    const { filterableFields } = this.config;
    const excludeFields = [
      "searchTerm",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "fields",
      "include"
    ];
    const filterParams = {};
    Object.keys(this.queryParams).forEach((key) => {
      if (!excludeFields.includes(key)) {
        filterParams[key] = this.queryParams[key];
      }
    });
    const queryWhere = this.query.where;
    const countQueryWhere = this.countQuery.where;
    Object.keys(filterParams).forEach((key) => {
      const value = filterParams[key];
      if (value === void 0 || value === null || value === "") return;
      if (filterableFields && !filterableFields.includes(key)) return;
      if (key.includes(".")) {
        const parts = key.split(".");
        const relation = parts[0];
        const { operator } = this.getRelationContext(relation);
        if (!queryWhere[relation]) {
          queryWhere[relation] = operator ? { [operator]: {} } : {};
          countQueryWhere[relation] = operator ? { [operator]: {} } : {};
        }
        const targetQuery = operator ? queryWhere[relation][operator] : queryWhere[relation];
        const targetCount = operator ? countQueryWhere[relation][operator] : countQueryWhere[relation];
        if (parts.length === 2) {
          const field = parts[1];
          targetQuery[field] = this.parseFilterValue(value);
          targetCount[field] = this.parseFilterValue(value);
        } else if (parts.length === 3) {
          const nestedRelation = parts[1];
          const field = parts[2];
          if (!targetQuery[nestedRelation]) {
            targetQuery[nestedRelation] = {};
            targetCount[nestedRelation] = {};
          }
          targetQuery[nestedRelation][field] = this.parseFilterValue(value);
          targetCount[nestedRelation][field] = this.parseFilterValue(value);
        }
        return;
      }
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const parsedRange = this.parseRangeFilter(value);
        queryWhere[key] = parsedRange;
        countQueryWhere[key] = parsedRange;
        return;
      }
      queryWhere[key] = this.parseFilterValue(value);
      countQueryWhere[key] = this.parseFilterValue(value);
    });
    return this;
  }
  // --- Methods below remain structurally consistent but utilize the dynamic logic above ---
  paginate() {
    const page = Number(this.queryParams.page) || 1;
    const limit = Number(this.queryParams.limit) || 10;
    this.skip = (page - 1) * limit;
    this.limit = limit;
    this.page = page;
    this.query.skip = this.skip;
    this.query.take = this.limit;
    return this;
  }
  sort() {
    const sortBy = this.queryParams.sortBy || "createdAt";
    const sortOrder = this.queryParams.sortOrder || "desc";
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");
      if (parts.length === 2) {
        const relation = parts[0];
        const field = parts[1];
        this.query.orderBy = { [relation]: { [field]: sortOrder } };
      } else if (parts.length === 3) {
        const rel = parts[0];
        const nested = parts[1];
        const field = parts[2];
        this.query.orderBy = { [rel]: { [nested]: { [field]: sortOrder } } };
      }
    } else {
      this.query.orderBy = { [sortBy]: sortOrder };
    }
    return this;
  }
  fields() {
    const fieldsParam = this.queryParams.fields || "";
    if (fieldsParam && typeof fieldsParam === "string") {
      const fieldsArray = fieldsParam.split(",").map((f) => f.trim());
      this.selectFields = {};
      fieldsArray.forEach((f) => {
        if (this.selectFields) this.selectFields[f] = true;
      });
      this.query.select = this.selectFields;
      delete this.query.include;
    }
    return this;
  }
  include(relation) {
    if (this.selectFields) return this;
    this.query.include = { ...this.query.include, ...relation };
    return this;
  }
  omit(fields) {
    this.query.omit = { ...this.query.omit, ...fields };
    return this;
  }
  where(conditions) {
    this.query.where = this.deepMerge(
      this.query.where,
      conditions
    );
    this.countQuery.where = this.deepMerge(
      this.countQuery.where,
      conditions
    );
    return this;
  }
  async execute() {
    const [total, data] = await Promise.all([
      this.model.count({ where: this.countQuery.where }),
      this.model.findMany(this.query)
    ]);
    return {
      data,
      meta: {
        limit: this.limit,
        page: this.page,
        total,
        totalPage: Math.ceil(total / this.limit),
        sortBy: this.sortBy,
        sortOrder: this.sortOrder
      }
    };
  }
  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
  parseFilterValue(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    if (typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))) {
      return Number(value);
    }
    if (Array.isArray(value)) return value.map((v) => this.parseFilterValue(v));
    return value;
  }
  parseRangeFilter(value) {
    const rangeQuery = {};
    const operators = [
      "lt",
      "lte",
      "gt",
      "gte",
      "equals",
      "not",
      "contains",
      "startsWith",
      "endsWith",
      "in",
      "notIn"
    ];
    Object.keys(value).forEach((op) => {
      if (operators.includes(op)) {
        rangeQuery[op] = this.parseFilterValue(value[op]);
      }
    });
    return rangeQuery;
  }
};

// src/modules/category/category.constant.ts
var categorySearchableFields = ["name", "subName", "description"];
var categoryFilterableFields = ["isDeleted", "isActive", "isFeatured"];

// src/modules/category/category.service.ts
var getCategories = async (queries) => {
  const queryBuilder = new QueryBuilder(prisma.category, queries, {
    searchableFields: categorySearchableFields,
    filterableFields: categoryFilterableFields
  }).search().filter().sort().paginate().include({ _count: true }).omit({ isDeleted: true, deletedAt: true }).where({ isDeleted: false, isActive: true });
  const result = await queryBuilder.execute();
  return result;
};
var createCategory = async (payload) => {
  const result = await prisma.category.create({
    data: payload
  });
  return result;
};
var updateCategory = async (id, payload) => {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true }
  });
  if (!category) {
    throw new Error("Category not found!");
  }
  const result = await prisma.category.update({
    where: { id },
    data: payload
  });
  return result;
};
var deleteCategory = async (id) => {
  await prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({
      where: { id },
      select: { id: true, _count: { select: { items: true } } }
    });
    if (!category) {
      throw new Error("Category not found!");
    }
    const hasItems = category._count.items > 0;
    if (hasItems) {
      throw new Error(
        "Can't delete category with associated items, delete or move them first!"
      );
    }
    await tx.category.update({
      where: { id },
      data: { isActive: false, isDeleted: true, deletedAt: /* @__PURE__ */ new Date() }
    });
  });
};
var categoryServices = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};

// src/modules/category/category.controller.ts
var getCategories2 = async_handler_default(async (req, res) => {
  const result = await categoryServices.getCategories(req.query);
  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});
var createCategory2 = async_handler_default(async (req, res) => {
  const result = await categoryServices.createCategory(req.body);
  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: result
  });
});
var updateCategory2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await categoryServices.updateCategory(id, req.body);
  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: result
  });
});
var deleteCategory2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  await categoryServices.deleteCategory(id);
  res.status(200).json({
    success: true,
    message: "Category deleted successfully"
  });
});
var categoryControllers = {
  getCategories: getCategories2,
  createCategory: createCategory2,
  updateCategory: updateCategory2,
  deleteCategory: deleteCategory2
};

// src/modules/category/category.route.ts
var router = express.Router();
router.get("/", categoryControllers.getCategories);
router.post(
  "/",
  auth_default(UserRole.ADMIN),
  categoryControllers.createCategory
);
router.patch(
  "/:id",
  auth_default(UserRole.ADMIN),
  categoryControllers.updateCategory
);
router.delete(
  "/:id",
  auth_default(UserRole.ADMIN),
  categoryControllers.deleteCategory
);
var categoryRouter = router;

// src/modules/order/order.route.ts
import express2 from "express";

// src/modules/order/order.constant.ts
var orderSearchableFields = ["orderNumber", "shippingName", "shippingEmail", "shippingPhone", "shippingAddress", "shippingCity", "shippingPostalCode"];
var orderFilterableFields = ["status", "paymentMethod", "paymentStatus", "isDeleted"];

// src/modules/order/order.status.service.ts
var updateOrderStatus = async (orderId, updatedStatus, tx) => {
  const result = await (tx ?? prisma).order.update({
    where: { id: orderId },
    data: { status: updatedStatus },
    select: { id: true, status: true }
  });
  return result;
};
var orderStatusServices = {
  updateOrderStatus
};

// src/modules/order/order.service.ts
var getOrders = async (queries) => {
  const queryBuilder = new QueryBuilder(prisma.order, queries, {
    searchableFields: orderSearchableFields,
    filterableFields: orderFilterableFields
  }).search().filter().sort().paginate().include({
    orderItems: {
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        subTotal: true,
        item: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true
          }
        }
      }
    },
    user: {
      select: { id: true, name: true, email: true, image: true }
    }
  }).omit({
    userId: true
  }).where({ isDeleted: false });
  const result = await queryBuilder.execute();
  return result;
};
var getOrderById = async (orderId, userId, isAdmin) => {
  const orderCheck = await prisma.order.findUnique({
    where: { id: orderId, isDeleted: false },
    select: { id: true, userId: true }
  });
  if (!orderCheck) {
    throw new Error(`Order with ID ${orderId} not found!`);
  }
  if (!isAdmin && orderCheck.userId !== userId) {
    throw new Error("You are not authorized to view this order!");
  }
  const result = await prisma.order.findUnique({
    where: { id: orderId, isDeleted: false },
    include: {
      orderItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subTotal: true,
          item: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              category: { select: { id: true, name: true } }
            }
          }
        }
      },
      payment: {
        select: {
          id: true,
          amount: true,
          transactionId: true,
          status: true,
          invoiceUrl: true,
          createdAt: true
        }
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true
        }
      },
      ...isAdmin && {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    },
    omit: {
      userId: true
    }
  });
  return result;
};
var getUserOrders = async (userId, queries) => {
  const queryBuilder = new QueryBuilder(prisma.order, queries, {
    searchableFields: orderSearchableFields,
    filterableFields: orderFilterableFields
  }).search().filter().sort().paginate().include({
    orderItems: {
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        subTotal: true,
        item: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true
          }
        }
      }
    }
  }).omit({
    userId: true
  }).where({ userId, isDeleted: false });
  const result = await queryBuilder.execute();
  return result;
};
function generateOrderNumber() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1e3).toString().padStart(3, "0");
  return `ORD-${year}${month}${day}-${random}`;
}
var createOrder = async (userId, payload) => {
  const {
    shippingName,
    shippingPhone,
    shippingEmail,
    shippingAddress,
    shippingCity,
    shippingPostalCode,
    paymentMethod,
    additionalInfo,
    orderItems
  } = payload;
  const orderNumber = generateOrderNumber();
  const getItems3 = async (tx) => {
    return Promise.all(
      orderItems.map(async (orderItem) => {
        const result2 = await tx.item.findUnique({
          where: { id: orderItem.itemId },
          select: {
            id: true,
            price: true,
            isActive: true,
            isDeleted: true
          }
        });
        if (!result2) {
          throw new Error(`Item with ID ${orderItem.itemId} not found`);
        }
        if (!result2.isActive || result2.isDeleted) {
          throw new Error(`Item with ID ${orderItem.itemId} is not available`);
        }
        if (isNaN(orderItem.quantity)) {
          throw new Error(`Invalid quantity for item ID ${orderItem.itemId}`);
        }
        const totalPrice = result2.price * orderItem.quantity;
        return {
          itemId: result2.id,
          quantity: orderItem.quantity,
          unitPrice: result2.price,
          subTotal: totalPrice
        };
      })
    );
  };
  const result = await prisma.$transaction(async (tx) => {
    const items = await getItems3(tx);
    const totalAmount = items.reduce((sum, item) => sum + item.subTotal, 0);
    const newOrder = await tx.order.create({
      data: {
        userId,
        orderNumber,
        totalAmount,
        shippingName,
        shippingPhone,
        shippingEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        paymentMethod,
        ...additionalInfo && { additionalInfo }
      },
      select: { id: true }
    });
    await tx.orderItem.createMany({
      data: items.map((item) => ({ ...item, orderId: newOrder.id }))
    });
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: totalAmount,
        status: "UNPAID"
      }
    });
    const orderData = await tx.order.findUnique({
      where: { id: newOrder.id },
      include: {
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            subTotal: true,
            itemId: true
          }
        }
      }
    });
    return orderData;
  });
  return result;
};
var changeOrderStatus = async (orderId, updatedStatus) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentMethod: true, totalAmount: true, orderNumber: true }
    });
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }
    if (order.status === updatedStatus) {
      throw new Error(`Order status is already ${updatedStatus}!`);
    }
    if (order.status === "CANCELLED" || order.status === "DELIVERED") {
      throw new Error(`Cannot change status of a ${order.status.toLowerCase()} order.`);
    }
    if (updatedStatus === "DELIVERED") {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: updatedStatus,
          paymentStatus: "PAID"
          // Mark as PAID automatically on delivery
        }
      });
      const existingPayment = await tx.payment.findUnique({
        where: { orderId }
      });
      if (existingPayment) {
        await tx.payment.update({
          where: { orderId },
          data: {
            status: "PAID",
            ...!existingPayment.transactionId && { transactionId: `MANUAL-${order.orderNumber}-${Date.now()}` }
          }
        });
      } else {
        await tx.payment.create({
          data: {
            orderId,
            amount: order.totalAmount,
            status: "PAID",
            transactionId: `MANUAL-${order.orderNumber}-${Date.now()}`
          }
        });
      }
    } else {
      await tx.order.update({
        where: { id: orderId },
        data: { status: updatedStatus }
      });
    }
    return await orderStatusServices.updateOrderStatus(orderId, updatedStatus, tx);
  });
  return result;
};
var cancelOrder = async (userId, orderId) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          select: { id: true, itemId: true, quantity: true }
        }
      }
    });
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }
    if (order.userId !== userId) {
      throw new Error("You are not authorized to cancel this order!");
    }
    if (order.status === OrderStatus.PROCESSING || order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new Error(
        `Order cannot be cancelled because it is already ${order.status}!`
      );
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new Error("Order is already CANCELLED!");
    }
    await orderStatusServices.updateOrderStatus(orderId, OrderStatus.CANCELLED, tx);
    const updatedOrder = await tx.order.findUnique({
      where: { id: orderId },
      omit: { userId: true }
    });
    return updatedOrder;
  });
  return result;
};
var deleteOrder = async (orderId) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { select: { itemId: true, quantity: true } }
      }
    });
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }
    if (order.isDeleted) {
      throw new Error("Order is already deleted!");
    }
    await tx.order.update({
      where: { id: orderId },
      data: { isDeleted: true, deletedAt: /* @__PURE__ */ new Date() }
    });
    return { id: orderId, success: true };
  });
  return result;
};
var orderServices = {
  getOrders,
  getOrderById,
  getUserOrders,
  createOrder,
  changeOrderStatus,
  cancelOrder,
  deleteOrder
};

// src/modules/order/order.controller.ts
var getOrders2 = async_handler_default(async (req, res) => {
  const result = await orderServices.getOrders(req.query);
  res.status(200).json({
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});
var getOrderById2 = async_handler_default(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === "ADMIN";
  const result = await orderServices.getOrderById(orderId, userId, isAdmin);
  res.status(200).json({
    success: true,
    message: "Order retrieved successfully",
    data: result
  });
});
var getUserOrders2 = async_handler_default(async (req, res) => {
  const userId = req.user.id;
  const result = await orderServices.getUserOrders(userId, req.query);
  res.status(200).json({
    success: true,
    message: "Your orders retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});
var createOrder2 = async_handler_default(async (req, res) => {
  const userId = req.user.id;
  const result = await orderServices.createOrder(userId, req.body);
  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: result
  });
});
var changeOrderStatus2 = async_handler_default(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const result = await orderServices.changeOrderStatus(orderId, status);
  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: result
  });
});
var cancelOrder2 = async_handler_default(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const result = await orderServices.cancelOrder(userId, orderId);
  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: result
  });
});
var deleteOrder2 = async_handler_default(async (req, res) => {
  const { orderId } = req.params;
  const result = await orderServices.deleteOrder(orderId);
  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
    data: result
  });
});
var orderControllers = {
  getOrders: getOrders2,
  getOrderById: getOrderById2,
  getUserOrders: getUserOrders2,
  createOrder: createOrder2,
  changeOrderStatus: changeOrderStatus2,
  cancelOrder: cancelOrder2,
  deleteOrder: deleteOrder2
};

// src/modules/order/order.route.ts
var router2 = express2.Router();
router2.get("/all", auth_default(UserRole.ADMIN), orderControllers.getOrders);
router2.get(
  "/my-orders",
  auth_default(UserRole.USER, UserRole.ADMIN),
  orderControllers.getUserOrders
);
router2.get("/:orderId", auth_default(), orderControllers.getOrderById);
router2.post(
  "/",
  auth_default(UserRole.USER, UserRole.ADMIN),
  orderControllers.createOrder
);
router2.patch(
  "/cancel/:orderId",
  auth_default(UserRole.USER, UserRole.ADMIN),
  orderControllers.cancelOrder
);
router2.patch(
  "/change-status/:orderId",
  auth_default(UserRole.ADMIN),
  orderControllers.changeOrderStatus
);
router2.delete(
  "/:orderId",
  auth_default(UserRole.ADMIN),
  orderControllers.deleteOrder
);
var orderRouter = router2;

// src/modules/user/user.route.ts
import express3 from "express";

// src/modules/user/user.constant.ts
var userSearchableFields = ["name", "email"];
var userFilterableFields = ["role", "status", "isDeleted"];

// src/modules/user/user.service.ts
var getAllUsers = async (queries) => {
  const queryBuilder = new QueryBuilder(prisma.user, queries, {
    searchableFields: userSearchableFields,
    filterableFields: userFilterableFields
  }).search().filter().sort().paginate().where({ isDeleted: false });
  const result = await queryBuilder.execute();
  return result;
};
var updateUserStatus = async (userId, status) => {
  if (!Object.values(UserStatus).includes(status)) {
    throw new Error("Invalid status value!");
  }
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true }
    });
    if (!user) {
      throw new Error("User not found!");
    }
    if (user.status === status) {
      throw new Error("User already has this status!");
    }
    return await tx.user.update({
      where: { id: userId },
      data: { status }
    });
  });
  return result;
};
var userServices = {
  getAllUsers,
  updateUserStatus
};

// src/modules/user/user.controller.ts
var getAllUsers2 = async_handler_default(async (req, res) => {
  const result = await userServices.getAllUsers(req.query);
  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});
var updateUserStatus2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await userServices.updateUserStatus(id, status);
  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: result
  });
});
var userControllers = {
  getAllUsers: getAllUsers2,
  updateUserStatus: updateUserStatus2
};

// src/modules/user/user.route.ts
var router3 = express3.Router();
router3.get("/", auth_default(UserRole.ADMIN), userControllers.getAllUsers);
router3.patch(
  "/status/:id",
  auth_default(UserRole.ADMIN),
  userControllers.updateUserStatus
);
var userRouter = router3;

// src/modules/item/item.route.ts
import express4 from "express";

// src/modules/item/item.constant.ts
var itemSearchableFields = ["name", "description", "category.name"];
var itemFilterableFields = ["isDeleted", "isFeatured", "isSpicy", "weight", "isActive", "price", "category.id", "category.name"];

// src/modules/item/item.service.ts
var getItems = async (queries) => {
  const queryBuilder = new QueryBuilder(prisma.item, queries, {
    searchableFields: itemSearchableFields,
    filterableFields: itemFilterableFields
  }).search().filter().sort().paginate().include({
    category: {
      select: { id: true, name: true, subName: true }
    }
  }).omit({ isDeleted: true, deletedAt: true }).where({ isDeleted: false, isActive: true });
  const result = await queryBuilder.execute();
  return result;
};
var getItemById = async (id) => {
  const result = await prisma.item.findUnique({
    where: { id, isDeleted: false, isActive: true },
    include: {
      category: {
        select: { id: true, name: true, subName: true }
      }
    },
    omit: { isDeleted: true, deletedAt: true }
  });
  if (!result) {
    throw new Error("Item not found!");
  }
  return result;
};
var createItem = async (payload) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId, isDeleted: false },
    select: { id: true }
  });
  if (!category) {
    throw new Error("Category not found!");
  }
  const result = await prisma.item.create({
    data: payload,
    include: {
      category: { select: { id: true, name: true, subName: true } }
    }
  });
  return result;
};
var updateItem = async (id, payload) => {
  const item = await prisma.item.findUnique({
    where: { id, isDeleted: false },
    select: { id: true }
  });
  if (!item) {
    throw new Error("Item not found!");
  }
  const result = await prisma.item.update({
    where: { id },
    data: payload,
    include: {
      category: { select: { id: true, name: true, subName: true } }
    }
  });
  return result;
};
var deleteItem = async (id) => {
  await prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!item) {
      throw new Error("Item not found!");
    }
    await tx.item.update({
      where: { id },
      data: { isActive: false, isDeleted: true, deletedAt: /* @__PURE__ */ new Date() }
    });
  });
};
var itemServices = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};

// src/modules/item/item.controller.ts
var getItems2 = async_handler_default(async (req, res) => {
  const result = await itemServices.getItems(req.query);
  res.status(200).json({
    success: true,
    message: "Items retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});
var getItemById2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await itemServices.getItemById(id);
  res.status(200).json({
    success: true,
    message: "Item retrieved successfully",
    data: result
  });
});
var createItem2 = async_handler_default(async (req, res) => {
  const result = await itemServices.createItem(req.body);
  res.status(201).json({
    success: true,
    message: "Item created successfully",
    data: result
  });
});
var updateItem2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await itemServices.updateItem(id, req.body);
  res.status(200).json({
    success: true,
    message: "Item updated successfully",
    data: result
  });
});
var deleteItem2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  await itemServices.deleteItem(id);
  res.status(200).json({
    success: true,
    message: "Item deleted successfully"
  });
});
var itemControllers = {
  getItems: getItems2,
  getItemById: getItemById2,
  createItem: createItem2,
  updateItem: updateItem2,
  deleteItem: deleteItem2
};

// src/modules/item/item.route.ts
var router4 = express4.Router();
router4.get("/", itemControllers.getItems);
router4.get("/:id", itemControllers.getItemById);
router4.post("/", auth_default(UserRole.ADMIN), itemControllers.createItem);
router4.patch("/:id", auth_default(UserRole.ADMIN), itemControllers.updateItem);
router4.delete("/:id", auth_default(UserRole.ADMIN), itemControllers.deleteItem);
var itemRouter = router4;

// src/modules/review/review.route.ts
import express5 from "express";

// src/modules/review/review.constant.ts
var reviewSearchableFields = ["comment", "customer.name", "order.id", "order.orderNumber"];
var reviewFilterableFields = ["customerId", "rating", "isActive"];
var reviewIncludeConfig = {
  customer: true,
  order: true
};

// src/modules/review/review.service.ts
var getReviews = async (queries, isAdmin = false) => {
  const queryBuilder = new QueryBuilder(prisma.review, queries, {
    searchableFields: reviewSearchableFields,
    filterableFields: reviewFilterableFields
  }).search().filter().sort().paginate().include(reviewIncludeConfig).where({
    isDeleted: false
  });
  const result = await queryBuilder.execute();
  return result;
};
var getReviewById = async (id) => {
  const result = await prisma.review.findUnique({
    where: { id },
    include: reviewIncludeConfig
  });
  if (!result) {
    throw new Error("Review not found!");
  }
  return result;
};
var createReview = async (payload) => {
  const order = await prisma.order.findUnique({
    where: { id: payload.orderId, userId: payload.customerId }
  });
  if (!order) {
    throw new Error("Order not found or does not belong to the customer!");
  }
  const existingReview = await prisma.review.findUnique({
    where: {
      orderId_customerId: {
        orderId: payload.orderId,
        customerId: payload.customerId
      }
    }
  });
  if (existingReview) {
    throw new Error("You have already reviewed this order!");
  }
  const result = await prisma.review.create({
    data: payload,
    include: reviewIncludeConfig
  });
  return result;
};
var updateReview = async (id, customerId, payload) => {
  const review = await prisma.review.findUnique({
    where: { id, customerId }
  });
  if (!review) {
    throw new Error("Review not found or you are not authorized to update it!");
  }
  const result = await prisma.review.update({
    where: { id },
    data: payload,
    include: reviewIncludeConfig
  });
  return result;
};
var deleteReview = async (id, customerId) => {
  const review = await prisma.review.findUnique({
    where: { id, customerId }
  });
  if (!review) {
    throw new Error("Review not found or you are not authorized to delete it!");
  }
  await prisma.review.delete({
    where: { id }
  });
};
var updateReviewStatus = async (id, isActive) => {
  const review = await prisma.review.findUnique({
    where: { id }
  });
  if (!review) {
    throw new Error("Review not found!");
  }
  const result = await prisma.review.update({
    where: { id },
    data: { isActive },
    include: reviewIncludeConfig
  });
  return result;
};
var reviewServices = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  updateReviewStatus
};

// src/modules/review/review.controller.ts
var getReviews2 = async_handler_default(async (req, res) => {
  const user = req.user;
  const isAdmin = user?.role === "ADMIN";
  const result = await reviewServices.getReviews(req.query, isAdmin);
  res.status(200).json({
    success: true,
    message: "Reviews retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});
var getReviewById2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await reviewServices.getReviewById(id);
  res.status(200).json({
    success: true,
    message: "Review retrieved successfully",
    data: result
  });
});
var createReview2 = async_handler_default(async (req, res) => {
  const user = req.user;
  const result = await reviewServices.createReview({
    ...req.body,
    customerId: user.id
  });
  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: result
  });
});
var updateReview2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const result = await reviewServices.updateReview(id, user.id, req.body);
  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    data: result
  });
});
var deleteReview2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  await reviewServices.deleteReview(id, user.id);
  res.status(200).json({
    success: true,
    message: "Review deleted successfully"
  });
});
var updateReviewStatus2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const result = await reviewServices.updateReviewStatus(id, isActive);
  res.status(200).json({
    success: true,
    message: "Review status updated successfully",
    data: result
  });
});
var reviewControllers = {
  getReviews: getReviews2,
  getReviewById: getReviewById2,
  createReview: createReview2,
  updateReview: updateReview2,
  deleteReview: deleteReview2,
  updateReviewStatus: updateReviewStatus2
};

// src/modules/review/review.route.ts
var router5 = express5.Router();
router5.get("/", reviewControllers.getReviews);
router5.get("/:id", reviewControllers.getReviewById);
router5.post("/", auth_default(), reviewControllers.createReview);
router5.patch("/:id", auth_default(), reviewControllers.updateReview);
router5.patch(
  "/:id/status",
  auth_default(UserRole.ADMIN),
  reviewControllers.updateReviewStatus
);
router5.delete("/:id", auth_default(), reviewControllers.deleteReview);
var reviewRouter = router5;

// src/modules/payment/payment.route.ts
import express6 from "express";

// src/config/stripe.config.ts
import Stripe from "stripe";
var stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia"
});

// src/modules/payment/payment.service.ts
var createCheckoutSession = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId, isDeleted: false },
    include: {
      orderItems: {
        include: {
          item: true
        }
      }
    }
  });
  if (!order) {
    throw new Error("Order not found!");
  }
  if (order.userId !== userId) {
    throw new Error("You are not authorized to pay for this order!");
  }
  if (order.paymentStatus === "PAID") {
    throw new Error("Order is already paid!");
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: order.orderItems.map((orderItem) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: orderItem.item.name,
          images: orderItem.item.image ? [orderItem.item.image] : []
        },
        unit_amount: Math.round(orderItem.unitPrice * 100)
      },
      quantity: orderItem.quantity
    })),
    success_url: `${env.APP_ORIGIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_ORIGIN}/payment/cancel`,
    client_reference_id: orderId,
    customer_email: order.shippingEmail,
    metadata: {
      orderId: order.id
    }
  });
  return { url: session.url };
};
var handleStripeWebhookEvent = async (signature, rawBody) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    throw new Error(`Webhook Error: ${err.message}`);
  }
  const existingPayment = await prisma.payment.findFirst({
    where: { stripeEventId: event.id }
  });
  if (existingPayment) {
    console.log(`Event ${event.id} already processed. Skipping`);
    return { message: `Event ${event.id} already processed. Skipping` };
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.client_reference_id;
      if (!orderId) {
        console.error("No orderId found in session client_reference_id");
        break;
      }
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId }
        });
        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }
        if (order.paymentStatus === "PAID") {
          return;
        }
        await tx.payment.upsert({
          where: { orderId },
          update: {
            transactionId: session.id,
            stripeEventId: event.id,
            amount: (session.amount_total || 0) / 100,
            status: "PAID",
            paymentGatewayData: session
          },
          create: {
            orderId,
            transactionId: session.id,
            stripeEventId: event.id,
            amount: (session.amount_total || 0) / 100,
            status: "PAID",
            paymentGatewayData: session
          }
        });
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "PAID", paymentMethod: "STRIPE" }
        });
      });
      break;
    }
    case "checkout.session.expired": {
      break;
    }
    case "payment_intent.payment_failed": {
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  return { message: "Webhook processed successfully" };
};
var createPayment = async (payload) => {
  const {
    orderId,
    transactionId,
    stripeEventId,
    amount,
    invoiceUrl,
    paymentGatewayData
  } = payload;
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentStatus: true }
    });
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }
    if (order.paymentStatus === "PAID") {
      throw new Error("Order is already paid!");
    }
    const payment = await tx.payment.upsert({
      where: { orderId },
      update: {
        transactionId,
        ...stripeEventId && { stripeEventId },
        amount,
        status: "PAID",
        ...invoiceUrl && { invoiceUrl },
        ...paymentGatewayData && { paymentGatewayData }
      },
      create: {
        orderId,
        transactionId,
        ...stripeEventId && { stripeEventId },
        amount,
        status: "PAID",
        ...invoiceUrl && { invoiceUrl },
        ...paymentGatewayData && { paymentGatewayData }
      }
    });
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", paymentMethod: "STRIPE" }
    });
    return payment;
  });
  return result;
};
var getPaymentByOrderId = async (orderId, userId, isAdmin) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true }
  });
  if (!order) {
    throw new Error("Order not found!");
  }
  if (!isAdmin && order.userId !== userId) {
    throw new Error("You are not authorized to view this payment!");
  }
  const payment = await prisma.payment.findUnique({
    where: { orderId }
  });
  if (!payment) {
    throw new Error("Payment not found for this order!");
  }
  return payment;
};
var getAllPayments = async () => {
  const result = await prisma.payment.findMany({
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          shippingName: true,
          shippingEmail: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return result;
};
var paymentServices = {
  createPayment,
  getPaymentByOrderId,
  getAllPayments,
  createCheckoutSession,
  handleStripeWebhookEvent
};

// src/modules/payment/payment.controller.ts
var createPayment2 = async_handler_default(async (req, res) => {
  const result = await paymentServices.createPayment(req.body);
  res.status(201).json({
    success: true,
    message: "Payment recorded successfully",
    data: result
  });
});
var getPaymentByOrderId2 = async_handler_default(
  async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    const result = await paymentServices.getPaymentByOrderId(
      orderId,
      userId,
      isAdmin
    );
    res.status(200).json({
      success: true,
      message: "Payment retrieved successfully",
      data: result
    });
  }
);
var getAllPayments2 = async_handler_default(async (req, res) => {
  const result = await paymentServices.getAllPayments();
  res.status(200).json({
    success: true,
    message: "Payments retrieved successfully",
    data: result
  });
});
var createCheckoutSession2 = async_handler_default(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const result = await paymentServices.createCheckoutSession(
    orderId,
    userId
  );
  res.status(200).json({
    success: true,
    message: "Checkout session created successfully",
    data: result
  });
});
var webhook = async_handler_default(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const result = await paymentServices.handleStripeWebhookEvent(
    signature,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "Webhook processed successfully",
    data: result
  });
});
var paymentControllers = {
  createPayment: createPayment2,
  getPaymentByOrderId: getPaymentByOrderId2,
  getAllPayments: getAllPayments2,
  createCheckoutSession: createCheckoutSession2,
  webhook
};

// src/modules/payment/payment.route.ts
var router6 = express6.Router();
router6.post(
  "/create-checkout-session/:orderId",
  auth_default(UserRole.USER, UserRole.ADMIN),
  paymentControllers.createCheckoutSession
);
router6.get("/all", auth_default(UserRole.ADMIN), paymentControllers.getAllPayments);
router6.get(
  "/order/:orderId",
  auth_default(UserRole.USER, UserRole.ADMIN),
  paymentControllers.getPaymentByOrderId
);
var paymentRouter = router6;

// src/modules/stats/stats.route.ts
import express7 from "express";

// src/modules/stats/stats.service.ts
var getAdminStats = async () => {
  const [
    totalItems,
    totalOrders,
    totalPayments,
    totalReviews,
    orderStatusCounts,
    paymentMethodCounts,
    totalRevenueResult,
    mostOrderedItemsRaw,
    recentOrders
  ] = await Promise.all([
    prisma.item.count({ where: { isDeleted: false } }),
    prisma.order.count({ where: { isDeleted: false } }),
    prisma.payment.count(),
    prisma.review.count(),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { isDeleted: false }
    }),
    prisma.order.groupBy({
      by: ["paymentMethod"],
      _count: { id: true },
      where: { isDeleted: false }
    }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true }
    }),
    prisma.orderItem.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    }),
    prisma.order.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        user: { select: { name: true, email: true, image: true } }
      }
    })
  ]);
  const mostOrderedItems = await Promise.all(
    mostOrderedItemsRaw.map(async (item) => {
      const itemData = await prisma.item.findUnique({
        where: { id: item.itemId },
        select: { name: true }
      });
      return {
        name: itemData?.name || "Unknown",
        count: item._sum.quantity || 0
      };
    })
  );
  const sevenDaysAgo = /* @__PURE__ */ new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const recentPayments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      createdAt: { gte: sevenDaysAgo }
    },
    select: { amount: true, createdAt: true }
  });
  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dailyRevenue = recentPayments.filter((p) => p.createdAt.toISOString().split("T")[0] === dateStr).reduce((sum, p) => sum + p.amount, 0);
    return { date: dateStr, revenue: dailyRevenue };
  }).reverse();
  const statusSummary = {
    PLACED: 0,
    CANCELLED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0
  };
  orderStatusCounts.forEach((count) => {
    if (count.status in statusSummary) {
      statusSummary[count.status] = count._count.id;
    }
  });
  const paymentMethodSummary = {};
  paymentMethodCounts.forEach((count) => {
    paymentMethodSummary[count.paymentMethod] = count._count.id;
  });
  return {
    summary: {
      totalItems,
      totalOrders,
      totalPayments,
      totalRevenue: totalRevenueResult._sum.amount || 0,
      totalReviews
    },
    orderStats: {
      byStatus: statusSummary,
      byPaymentMethod: paymentMethodSummary
    },
    mostOrderedItems,
    revenueData,
    recentOrders
  };
};
var statsServices = {
  getAdminStats
};

// src/modules/stats/stats.controller.ts
var getAdminStats2 = async_handler_default(async (req, res) => {
  const result = await statsServices.getAdminStats();
  res.status(200).json({
    success: true,
    message: "Admin statistics retrieved successfully",
    data: result
  });
});
var statsControllers = {
  getAdminStats: getAdminStats2
};

// src/modules/stats/stats.route.ts
var router7 = express7.Router();
router7.get(
  "/admin",
  auth_default(UserRole.ADMIN),
  statsControllers.getAdminStats
);
var statsRouter = router7;

// src/app.ts
var app = express8();
app.use(logger_default);
app.post(
  "/webhook",
  express8.raw({ type: "application/json" }),
  paymentControllers.webhook
);
var allowed_origins = [
  env.APP_ORIGIN,
  env.PROD_APP_ORIGIN
  // Production frontend URL
].filter(Boolean);
app.use(express8.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowed_origins.includes(origin) || /^https:\/\/pharmetix-client.*\.vercel\.app$/.test(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"]
  })
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/items", itemRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/stats", statsRouter);
app.get("/", (req, res) => {
  res.send("Urban Snacks Server Is Running!");
});
app.use(not_found_default);
app.use(error_handler_default);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
