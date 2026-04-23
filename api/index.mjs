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
  "inlineSchema": 'enum UserRole {\n  USER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  INACTIVE\n  BANNED\n}\n\nmodel User {\n  id            String     @id\n  name          String\n  email         String\n  emailVerified Boolean    @default(false)\n  phone         String?\n  image         String?\n  createdAt     DateTime   @default(now())\n  updatedAt     DateTime   @updatedAt\n  // additional fields\n  role          UserRole   @default(USER)\n  status        UserStatus @default(ACTIVE)\n  isDeleted     Boolean    @default(false)\n  // relations\n  sessions      Session[]\n  accounts      Account[]\n  orders        Order[]\n  reviews       Review[]\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel Banner {\n  id         String    @id @default(uuid())\n  title      String?\n  subtitle   String?\n  badge      String?\n  image      String?\n  order      Int?\n  banner     Boolean   @default(true)\n  isActive   Boolean   @default(true)\n  categoryId String?\n  buttonText String?\n  isDeleted  Boolean   @default(false)\n  deletedAt  DateTime?\n  createdAt  DateTime  @default(now())\n  updatedAt  DateTime  @updatedAt\n\n  @@map("banners")\n}\n\nenum OrderStatus {\n  PLACED\n  CANCELLED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n}\n\nenum PaymentStatus {\n  PAID\n  UNPAID\n}\n\nenum DiscountType {\n  FIXED\n  PERCENTAGE\n}\n\nmodel Order {\n  id                 String        @id @default(uuid())\n  orderNumber        String\n  status             OrderStatus   @default(PLACED)\n  totalAmount        Float\n  shippingName       String\n  shippingPhone      String\n  shippingEmail      String\n  shippingAddress    String\n  shippingCity       String\n  shippingPostalCode String\n  paymentStatus      PaymentStatus @default(UNPAID)\n  paymentMethod      String // e.g. "STRIPE" or "COD" or "MANUAL"\n  additionalInfo     String?\n  cancelReason       String?\n  extrainfo          String?\n\n  discountAmount Float   @default(0)\n  couponId       String?\n  coupon         Coupon? @relation(fields: [couponId], references: [id])\n\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  // Relationships\n  userId     String\n  user       User        @relation(fields: [userId], references: [id])\n  orderItems OrderItem[]\n  payment    Payment?\n  reviews    Review[]\n\n  @@map("orders")\n}\n\nmodel OrderItem {\n  id        String @id @default(uuid())\n  quantity  Int\n  unitPrice Float\n  subTotal  Float\n\n  // Relationships\n  orderId String\n  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)\n  itemId  String\n  item    Item   @relation(fields: [itemId], references: [id])\n\n  @@map("order_items")\n}\n\nmodel Payment {\n  id                 String        @id @default(uuid())\n  amount             Float\n  transactionId      String?       @unique\n  stripeEventId      String?       @unique\n  status             PaymentStatus @default(UNPAID)\n  invoiceUrl         String?\n  paymentGatewayData Json?\n  createdAt          DateTime      @default(now())\n  updatedAt          DateTime      @updatedAt\n  isDeleted          Boolean       @default(false)\n  deletedAt          DateTime?\n\n  // Relationships\n  orderId String @unique\n  order   Order  @relation(fields: [orderId], references: [id])\n\n  @@map("payments")\n}\n\nmodel Coupon {\n  id                String       @id @default(uuid())\n  code              String       @unique\n  discountType      DiscountType @default(FIXED)\n  discountValue     Float\n  minOrderAmount    Float?       @default(0)\n  maxDiscountAmount Float?\n  expiryDate        DateTime\n  usageLimit        Int?\n  usedCount         Int          @default(0)\n  isActive          Boolean      @default(true)\n  description       String?\n\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  // Relationships\n  orders Order[]\n\n  @@map("coupons")\n}\n\nmodel Review {\n  id        String    @id @default(uuid())\n  rating    Float // e.g., 1 to 5\n  comment   String\n  isActive  Boolean   @default(false)\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n\n  // Relations\n  orderId String\n  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  customerId String\n  customer   User   @relation(fields: [customerId], references: [id])\n\n  // Prevents a user from reviewing an order multiple times\n  @@unique([orderId, customerId])\n  @@map("reviews")\n}\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../src/generated"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Category {\n  id          String    @id @default(uuid())\n  name        String    @unique\n  subName     String?\n  image       String?\n  isFeatured  Boolean   @default(false)\n  description String?\n  isActive    Boolean   @default(true)\n  isDeleted   Boolean   @default(false)\n  deletedAt   DateTime?\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n\n  // Relationships\n  items Item[]\n\n  @@map("categories")\n}\n\nmodel Item {\n  id          String    @id @default(uuid())\n  name        String\n  isFeatured  Boolean   @default(false)\n  packSize    Int?\n  isSpicy     Boolean?\n  weight      String\n  price       Float\n  expiryDate  DateTime?\n  isActive    Boolean   @default(true)\n  isDeleted   Boolean   @default(false)\n  deletedAt   DateTime?\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n  mainImage   String?\n  semiTitle   String?\n  image       String[]  @default([])\n  description String?\n\n  // Relationships\n  categoryId String\n  category   Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)\n  orderItems OrderItem[]\n\n  @@map("items")\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"phone","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Banner":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"subtitle","kind":"scalar","type":"String"},{"name":"badge","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"order","kind":"scalar","type":"Int"},{"name":"banner","kind":"scalar","type":"Boolean"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"buttonText","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"banners"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderNumber","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"totalAmount","kind":"scalar","type":"Float"},{"name":"shippingName","kind":"scalar","type":"String"},{"name":"shippingPhone","kind":"scalar","type":"String"},{"name":"shippingEmail","kind":"scalar","type":"String"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"shippingCity","kind":"scalar","type":"String"},{"name":"shippingPostalCode","kind":"scalar","type":"String"},{"name":"paymentStatus","kind":"enum","type":"PaymentStatus"},{"name":"paymentMethod","kind":"scalar","type":"String"},{"name":"additionalInfo","kind":"scalar","type":"String"},{"name":"cancelReason","kind":"scalar","type":"String"},{"name":"extrainfo","kind":"scalar","type":"String"},{"name":"discountAmount","kind":"scalar","type":"Float"},{"name":"couponId","kind":"scalar","type":"String"},{"name":"coupon","kind":"object","type":"Coupon","relationName":"CouponToOrder"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"payment","kind":"object","type":"Payment","relationName":"OrderToPayment"},{"name":"reviews","kind":"object","type":"Review","relationName":"OrderToReview"}],"dbName":"orders"},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Float"},{"name":"subTotal","kind":"scalar","type":"Float"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"itemId","kind":"scalar","type":"String"},{"name":"item","kind":"object","type":"Item","relationName":"ItemToOrderItem"}],"dbName":"order_items"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"stripeEventId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"invoiceUrl","kind":"scalar","type":"String"},{"name":"paymentGatewayData","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToPayment"}],"dbName":"payments"},"Coupon":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"code","kind":"scalar","type":"String"},{"name":"discountType","kind":"enum","type":"DiscountType"},{"name":"discountValue","kind":"scalar","type":"Float"},{"name":"minOrderAmount","kind":"scalar","type":"Float"},{"name":"maxDiscountAmount","kind":"scalar","type":"Float"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"usageLimit","kind":"scalar","type":"Int"},{"name":"usedCount","kind":"scalar","type":"Int"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"description","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orders","kind":"object","type":"Order","relationName":"CouponToOrder"}],"dbName":"coupons"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Float"},{"name":"comment","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReview"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"ReviewToUser"}],"dbName":"reviews"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"subName","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"description","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"items","kind":"object","type":"Item","relationName":"CategoryToItem"}],"dbName":"categories"},"Item":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"packSize","kind":"scalar","type":"Int"},{"name":"isSpicy","kind":"scalar","type":"Boolean"},{"name":"weight","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"mainImage","kind":"scalar","type":"String"},{"name":"semiTitle","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToItem"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"ItemToOrderItem"}],"dbName":"items"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","orders","_count","coupon","order","items","category","orderItems","item","payment","customer","reviews","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Banner.findUnique","Banner.findUniqueOrThrow","Banner.findFirst","Banner.findFirstOrThrow","Banner.findMany","Banner.createOne","Banner.createMany","Banner.createManyAndReturn","Banner.updateOne","Banner.updateMany","Banner.updateManyAndReturn","Banner.upsertOne","Banner.deleteOne","Banner.deleteMany","_avg","_sum","Banner.groupBy","Banner.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","Order.groupBy","Order.aggregate","OrderItem.findUnique","OrderItem.findUniqueOrThrow","OrderItem.findFirst","OrderItem.findFirstOrThrow","OrderItem.findMany","OrderItem.createOne","OrderItem.createMany","OrderItem.createManyAndReturn","OrderItem.updateOne","OrderItem.updateMany","OrderItem.updateManyAndReturn","OrderItem.upsertOne","OrderItem.deleteOne","OrderItem.deleteMany","OrderItem.groupBy","OrderItem.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Coupon.findUnique","Coupon.findUniqueOrThrow","Coupon.findFirst","Coupon.findFirstOrThrow","Coupon.findMany","Coupon.createOne","Coupon.createMany","Coupon.createManyAndReturn","Coupon.updateOne","Coupon.updateMany","Coupon.updateManyAndReturn","Coupon.upsertOne","Coupon.deleteOne","Coupon.deleteMany","Coupon.groupBy","Coupon.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","Category.upsertOne","Category.deleteOne","Category.deleteMany","Category.groupBy","Category.aggregate","Item.findUnique","Item.findUniqueOrThrow","Item.findFirst","Item.findFirstOrThrow","Item.findMany","Item.createOne","Item.createMany","Item.createManyAndReturn","Item.updateOne","Item.updateMany","Item.updateManyAndReturn","Item.upsertOne","Item.deleteOne","Item.deleteMany","Item.groupBy","Item.aggregate","AND","OR","NOT","id","name","isFeatured","packSize","isSpicy","weight","price","expiryDate","isActive","isDeleted","deletedAt","createdAt","updatedAt","mainImage","semiTitle","image","description","categoryId","equals","has","hasEvery","hasSome","in","notIn","lt","lte","gt","gte","contains","startsWith","endsWith","not","subName","every","some","none","rating","comment","orderId","customerId","code","DiscountType","discountType","discountValue","minOrderAmount","maxDiscountAmount","usageLimit","usedCount","amount","transactionId","stripeEventId","PaymentStatus","status","invoiceUrl","paymentGatewayData","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","quantity","unitPrice","subTotal","itemId","orderNumber","OrderStatus","totalAmount","shippingName","shippingPhone","shippingEmail","shippingAddress","shippingCity","shippingPostalCode","paymentStatus","paymentMethod","additionalInfo","cancelReason","extrainfo","discountAmount","couponId","userId","title","subtitle","badge","banner","buttonText","identifier","value","expiresAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","email","emailVerified","phone","UserRole","role","UserStatus","orderId_customerId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide","push"]'),
  graph: "wgV0wAESBAAAlgMAIAUAAJcDACAGAAD2AgAgEAAAmAMAINkBAACTAwAw2gEAACwAENsBAACTAwAw3AEBAAAAAd0BAQDhAgAh5QEgAOMCACHnAUAA5QIAIegBQADlAgAh6wEBAOICACGQAgAAlQPIAiLCAgEAAAABwwIgAOMCACHEAgEA4gIAIcYCAACUA8YCIgEAAAABACAMAwAAmwMAINkBAACnAwAw2gEAAAMAENsBAACnAwAw3AEBAOECACHnAUAA5QIAIegBQADlAgAhrQIBAOECACG1AkAA5QIAIb8CAQDhAgAhwAIBAOICACHBAgEA4gIAIQMDAACCBQAgwAIAAKgDACDBAgAAqAMAIAwDAACbAwAg2QEAAKcDADDaAQAAAwAQ2wEAAKcDADDcAQEAAAAB5wFAAOUCACHoAUAA5QIAIa0CAQDhAgAhtQJAAOUCACG_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_gKQAiKRAgEA4gIAIZICAAD_AgAgAQAAAB4AIA8JAACAAwAgDwAAmwMAINkBAACaAwAw2gEAACAAENsBAACaAwAw3AEBAOECACHkASAA4wIAIeUBIADjAgAh5gFAAOQCACHnAUAA5QIAIegBQADlAgAhgAIIAPICACGBAgEA4QIAIYICAQDhAgAhgwIBAOECACEDCQAAqQQAIA8AAIIFACDmAQAAqAMAIBAJAACAAwAgDwAAmwMAINkBAACaAwAw2gEAACAAENsBAACaAwAw3AEBAAAAAeQBIADjAgAh5QEgAOMCACHmAUAA5AIAIecBQADlAgAh6AFAAOUCACGAAggA8gIAIYECAQDhAgAhggIBAOECACGDAgEA4QIAIcgCAACZAwAgAwAAACAAIAEAACEAMAIAACIAIAEAAAATACABAAAAIAAgAwAAACAAIAEAACEAMAIAACIAIAEAAAADACABAAAABwAgAQAAAAsAIAEAAAAgACABAAAAAQAgEgQAAJYDACAFAACXAwAgBgAA9gIAIBAAAJgDACDZAQAAkwMAMNoBAAAsABDbAQAAkwMAMNwBAQDhAgAh3QEBAOECACHlASAA4wIAIecBQADlAgAh6AFAAOUCACHrAQEA4gIAIZACAACVA8gCIsICAQDhAgAhwwIgAOMCACHEAgEA4gIAIcYCAACUA8YCIgYEAAD_BAAgBQAAgAUAIAYAAKEEACAQAACBBQAg6wEAAKgDACDEAgAAqAMAIAMAAAAsACABAAAtADACAAABACADAAAALAAgAQAALQAwAgAAAQAgAwAAACwAIAEAAC0AMAIAAAEAIA8EAAD7BAAgBQAA_AQAIAYAAP0EACAQAAD-BAAg3AEBAAAAAd0BAQAAAAHlASAAAAAB5wFAAAAAAegBQAAAAAHrAQEAAAABkAIAAADIAgLCAgEAAAABwwIgAAAAAcQCAQAAAAHGAgAAAMYCAgEWAAAxACAL3AEBAAAAAd0BAQAAAAHlASAAAAAB5wFAAAAAAegBQAAAAAHrAQEAAAABkAIAAADIAgLCAgEAAAABwwIgAAAAAcQCAQAAAAHGAgAAAMYCAgEWAAAzADABFgAAMwAwDwQAAM0EACAFAADOBAAgBgAAzwQAIBAAANAEACDcAQEArgMAId0BAQCuAwAh5QEgAK8DACHnAUAAtAMAIegBQAC0AwAh6wEBALUDACGQAgAAzATIAiLCAgEArgMAIcMCIACvAwAhxAIBALUDACHGAgAAywTGAiICAAAAAQAgFgAANgAgC9wBAQCuAwAh3QEBAK4DACHlASAArwMAIecBQAC0AwAh6AFAALQDACHrAQEAtQMAIZACAADMBMgCIsICAQCuAwAhwwIgAK8DACHEAgEAtQMAIcYCAADLBMYCIgIAAAAsACAWAAA4ACACAAAALAAgFgAAOAAgAwAAAAEAIB0AADEAIB4AADYAIAEAAAABACABAAAALAAgBQcAAMgEACAjAADKBAAgJAAAyQQAIOsBAACoAwAgxAIAAKgDACAO2QEAAIwDADDaAQAAPwAQ2wEAAIwDADDcAQEAxAIAId0BAQDEAgAh5QEgAMUCACHnAUAAygIAIegBQADKAgAh6wEBAMsCACGQAgAAjgPIAiLCAgEAxAIAIcMCIADFAgAhxAIBAMsCACHGAgAAjQPGAiIDAAAALAAgAQAAPgAwIgAAPwAgAwAAACwAIAEAAC0AMAIAAAEAIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgCQMAAMcEACDcAQEAAAAB5wFAAAAAAegBQAAAAAGtAgEAAAABtQJAAAAAAb8CAQAAAAHAAgEAAAABwQIBAAAAAQEWAABHACAI3AEBAAAAAecBQAAAAAHoAUAAAAABrQIBAAAAAbUCQAAAAAG_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-wMAIAgAALQEACAMAAD8AwAgDgAA_QMAIBAAAP4DACDcAQEArgMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAhkAIAAPgDnwIinQIBAK4DACGfAggAsgMAIaACAQCuAwAhoQIBAK4DACGiAgEArgMAIaMCAQCuAwAhpAIBAK4DACGlAgEArgMAIaYCAAD5A5ACIqcCAQCuAwAhqAIBALUDACGpAgEAtQMAIaoCAQC1AwAhqwIIALIDACGsAgEAtQMAIa0CAQCuAwAhAgAAAA0AIBYAAKsBACAW3AEBAK4DACHlASAArwMAIeYBQACzAwAh5wFAALQDACHoAUAAtAMAIZACAAD4A58CIp0CAQCuAwAhnwIIALIDACGgAgEArgMAIaECAQCuAwAhogIBAK4DACGjAgEArgMAIaQCAQCuAwAhpQIBAK4DACGmAgAA-QOQAiKnAgEArgMAIagCAQC1AwAhqQIBALUDACGqAgEAtQMAIasCCACyAwAhrAIBALUDACGtAgEArgMAIQIAAAALACAWAACtAQAgAgAAAAsAIBYAAK0BACABAAAADwAgAwAAAA0AIB0AAKUBACAeAACrAQAgAQAAAA0AIAEAAAALACAKBwAArwQAICMAALIEACAkAACxBAAgZQAAsAQAIGYAALMEACDmAQAAqAMAIKgCAACoAwAgqQIAAKgDACCqAgAAqAMAIKwCAACoAwAgGdkBAACCAwAw2gEAALUBABDbAQAAggMAMNwBAQDEAgAh5QEgAMUCACHmAUAAyQIAIecBQADKAgAh6AFAAMoCACGQAgAAgwOfAiKdAgEAxAIAIZ8CCADIAgAhoAIBAMQCACGhAgEAxAIAIaICAQDEAgAhowIBAMQCACGkAgEAxAIAIaUCAQDEAgAhpgIAAPgCkAIipwIBAMQCACGoAgEAywIAIakCAQDLAgAhqgIBAMsCACGrAggAyAIAIawCAQDLAgAhrQIBAMQCACEDAAAACwAgAQAAtAEAMCIAALUBACADAAAACwAgAQAADAAwAgAADQAgAQAAABUAIAEAAAAVACADAAAAEwAgAQAAFAAwAgAAFQAgAwAAABMAIAEAABQAMAIAABUAIAMAAAATACABAAAUADACAAAVACAICQAAxwMAIA0AAJoEACDcAQEAAAABggIBAAAAAZkCAgAAAAGaAggAAAABmwIIAAAAAZwCAQAAAAEBFgAAvQEAIAbcAQEAAAABggIBAAAAAZkCAgAAAAGaAggAAAABmwIIAAAAAZwCAQAAAAEBFgAAvwEAMAEWAAC_AQAwCAkAAMUDACANAACYBAAg3AEBAK4DACGCAgEArgMAIZkCAgDDAwAhmgIIALIDACGbAggAsgMAIZwCAQCuAwAhAgAAABUAIBYAAMIBACAG3AEBAK4DACGCAgEArgMAIZkCAgDDAwAhmgIIALIDACGbAggAsgMAIZwCAQCuAwAhAgAAABMAIBYAAMQBACACAAAAEwAgFgAAxAEAIAMAAAAVACAdAAC9AQAgHgAAwgEAIAEAAAAVACABAAAAEwAgBQcAAKoEACAjAACtBAAgJAAArAQAIGUAAKsEACBmAACuBAAgCdkBAACBAwAw2gEAAMsBABDbAQAAgQMAMNwBAQDEAgAhggIBAMQCACGZAgIA6wIAIZoCCADIAgAhmwIIAMgCACGcAgEAxAIAIQMAAAATACABAADKAQAwIgAAywEAIAMAAAATACABAAAUADACAAAVACAQCQAAgAMAINkBAAD9AgAw2gEAAB4AENsBAAD9AgAw3AEBAAAAAeUBIADjAgAh5gFAAOQCACHnAUAA5QIAIegBQADlAgAhggIBAAAAAYwCCADyAgAhjQIBAAAAAY4CAQAAAAGQAgAA_gKQAiKRAgEA4gIAIZICAAD_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_AEBAOICACEFCgAA3AMAIOYBAACoAwAg6wEAAKgDACDsAQAAqAMAIPwBAACoAwAgAwAAAJcCACABAACYAgAwAgAAlAIAIAMAAACXAgAgAQAAmAIAMAIAAJQCACADAAAAlwIAIAEAAJgCADACAACUAgAgDAoAANsDACDcAQEAAAAB3QEBAAAAAd4BIAAAAAHkASAAAAAB5QEgAAAAAeYBQAAAAAHnAUAAAAAB6AFAAAAAAesBAQAAAAHsAQEAAAAB_AEBAAAAAQEWAACcAgAgC9wBAQAAAAHdAQEAAAAB3gEgAAAAAeQBIAAAAAHlASAAAAAB5gFAAAAAAecBQAAAAAHoAUAAAAAB6wEBAAAAAewBAQAAAAH8AQEAAAABARYAAJ4CADABFgAAngIAMAwKAADOAwAg3AEBAK4DACHdAQEArgMAId4BIACvAwAh5AEgAK8DACHlASAArwMAIeYBQACzAwAh5wFAALQDACHoAUAAtAMAIesBAQC1AwAh7AEBALUDACH8AQEAtQMAIQIAAACUAgAgFgAAoQIAIAvcAQEArgMAId0BAQCuAwAh3gEgAK8DACHkASAArwMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAh6wEBALUDACHsAQEAtQMAIfwBAQC1AwAhAgAAAJcCACAWAACjAgAgAgAAAJcCACAWAACjAgAgAwAAAJQCACAdAACcAgAgHgAAoQIAIAEAAACUAgAgAQAAAJcCACAHBwAAywMAICMAAM0DACAkAADMAwAg5gEAAKgDACDrAQAAqAMAIOwBAACoAwAg_AEAAKgDACAO2QEAAN8CADDaAQAAqgIAENsBAADfAgAw3AEBAMQCACHdAQEAxAIAId4BIADFAgAh5AEgAMUCACHlASAAxQIAIeYBQADJAgAh5wFAAMoCACHoAUAAygIAIesBAQDLAgAh7AEBAMsCACH8AQEAywIAIQMAAACXAgAgAQAAqQIAMCIAAKoCACADAAAAlwIAIAEAAJgCADACAACUAgAgAQAAABkAIAEAAAAZACADAAAAFwAgAQAAGAAwAgAAGQAgAwAAABcAIAEAABgAMAIAABkAIAMAAAAXACABAAAYADACAAAZACAUCwAAyQMAIAwAAMoDACDcAQEAAAAB3QEBAAAAAd4BIAAAAAHfAQIAAAAB4AEgAAAAAeEBAQAAAAHiAQgAAAAB4wFAAAAAAeQBIAAAAAHlASAAAAAB5gFAAAAAAecBQAAAAAHoAUAAAAAB6QEBAAAAAeoBAQAAAAHrAQAAyAMAIOwBAQAAAAHtAQEAAAABARYAALICACAS3AEBAAAAAd0BAQAAAAHeASAAAAAB3wECAAAAAeABIAAAAAHhAQEAAAAB4gEIAAAAAeMBQAAAAAHkASAAAAAB5QEgAAAAAeYBQAAAAAHnAUAAAAAB6AFAAAAAAekBAQAAAAHqAQEAAAAB6wEAAMgDACDsAQEAAAAB7QEBAAAAAQEWAAC0AgAwARYAALQCADAUCwAAtwMAIAwAALgDACDcAQEArgMAId0BAQCuAwAh3gEgAK8DACHfAQIAsAMAIeABIACxAwAh4QEBAK4DACHiAQgAsgMAIeMBQACzAwAh5AEgAK8DACHlASAArwMAIeYBQACzAwAh5wFAALQDACHoAUAAtAMAIekBAQC1AwAh6gEBALUDACHrAQAAtgMAIOwBAQC1AwAh7QEBAK4DACECAAAAGQAgFgAAtwIAIBLcAQEArgMAId0BAQCuAwAh3gEgAK8DACHfAQIAsAMAIeABIACxAwAh4QEBAK4DACHiAQgAsgMAIeMBQACzAwAh5AEgAK8DACHlASAArwMAIeYBQACzAwAh5wFAALQDACHoAUAAtAMAIekBAQC1AwAh6gEBALUDACHrAQAAtgMAIOwBAQC1AwAh7QEBAK4DACECAAAAFwAgFgAAuQIAIAIAAAAXACAWAAC5AgAgAwAAABkAIB0AALICACAeAAC3AgAgAQAAABkAIAEAAAAXACAMBwAAqQMAICMAAKwDACAkAACrAwAgZQAAqgMAIGYAAK0DACDfAQAAqAMAIOABAACoAwAg4wEAAKgDACDmAQAAqAMAIOkBAACoAwAg6gEAAKgDACDsAQAAqAMAIBXZAQAAwwIAMNoBAADAAgAQ2wEAAMMCADDcAQEAxAIAId0BAQDEAgAh3gEgAMUCACHfAQIAxgIAIeABIADHAgAh4QEBAMQCACHiAQgAyAIAIeMBQADJAgAh5AEgAMUCACHlASAAxQIAIeYBQADJAgAh5wFAAMoCACHoAUAAygIAIekBAQDLAgAh6gEBAMsCACHrAQAAzAIAIOwBAQDLAgAh7QEBAMQCACEDAAAAFwAgAQAAvwIAMCIAAMACACADAAAAFwAgAQAAGAAwAgAAGQAgFdkBAADDAgAw2gEAAMACABDbAQAAwwIAMNwBAQDEAgAh3QEBAMQCACHeASAAxQIAId8BAgDGAgAh4AEgAMcCACHhAQEAxAIAIeIBCADIAgAh4wFAAMkCACHkASAAxQIAIeUBIADFAgAh5gFAAMkCACHnAUAAygIAIegBQADKAgAh6QEBAMsCACHqAQEAywIAIesBAADMAgAg7AEBAMsCACHtAQEAxAIAIQ4HAADRAgAgIwAA3gIAICQAAN4CACDuAQEAAAAB8gEBAAAABPMBAQAAAAT0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AQEAAAAB-AEBAAAAAfkBAQAAAAH6AQEAAAAB-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-gEBAAAAAfsBAQDdAgAhC-4BAQAAAAHyAQEAAAAE8wEBAAAABPQBAQAAAAH1AQEAAAAB9gEBAAAAAfcBAQAAAAH4AQEAAAAB-QEBAAAAAfoBAQAAAAH7AQEA3gIAIQ7ZAQAA3wIAMNoBAACqAgAQ2wEAAN8CADDcAQEAxAIAId0BAQDEAgAh3gEgAMUCACHkASAAxQIAIeUBIADFAgAh5gFAAMkCACHnAUAAygIAIegBQADKAgAh6wEBAMsCACHsAQEAywIAIfwBAQDLAgAhDwoAAOYCACDZAQAA4AIAMNoBAACXAgAQ2wEAAOACADDcAQEA4QIAId0BAQDhAgAh3gEgAOMCACHkASAA4wIAIeUBIADjAgAh5gFAAOQCACHnAUAA5QIAIegBQADlAgAh6wEBAOICACHsAQEA4gIAIfwBAQDiAgAhC-4BAQAAAAHyAQEAAAAE8wEBAAAABPQBAQAAAAH1AQEAAAAB9gEBAAAAAfcBAQAAAAH4AQEAAAAB-QEBAAAAAfoBAQAAAAH7AQEA3gIAIQvuAQEAAAAB8gEBAAAABfMBAQAAAAX0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AQEAAAAB-AEBAAAAAfkBAQAAAAH6AQEAAAAB-wEBAM8CACEC7gEgAAAAAfsBIADcAgAhCO4BQAAAAAHyAUAAAAAF8wFAAAAABfQBQAAAAAH1AUAAAAAB9gFAAAAAAfcBQAAAAAH7AUAA1AIAIQjuAUAAAAAB8gFAAAAABPMBQAAAAAT0AUAAAAAB9QFAAAAAAfYBQAAAAAH3AUAAAAAB-wFAANICACED_QEAABcAIP4BAAAXACD_AQAAFwAgDdkBAADnAgAw2gEAAJECABDbAQAA5wIAMNwBAQDEAgAh5AEgAMUCACHlASAAxQIAIeYBQADJAgAh5wFAAMoCACHoAUAAygIAIYACCADIAgAhgQIBAMQCACGCAgEAxAIAIYMCAQDEAgAhEtkBAADoAgAw2gEAAPsBABDbAQAA6AIAMNwBAQDEAgAh4wFAAMoCACHkASAAxQIAIeUBIADFAgAh5gFAAMkCACHnAUAAygIAIegBQADKAgAh7AEBAMsCACGEAgEAxAIAIYYCAADpAoYCIocCCADIAgAhiAIIAOoCACGJAggA6gIAIYoCAgDGAgAhiwICAOsCACEHBwAA0QIAICMAAO8CACAkAADvAgAg7gEAAACGAgLyAQAAAIYCCPMBAAAAhgII-wEAAO4ChgIiDQcAAM4CACAjAADaAgAgJAAA2gIAIGUAANoCACBmAADaAgAg7gEIAAAAAfIBCAAAAAXzAQgAAAAF9AEIAAAAAfUBCAAAAAH2AQgAAAAB9wEIAAAAAfsBCADtAgAhDQcAANECACAjAADRAgAgJAAA0QIAIGUAANYCACBmAADRAgAg7gECAAAAAfIBAgAAAATzAQIAAAAE9AECAAAAAfUBAgAAAAH2AQIAAAAB9wECAAAAAfsBAgDsAgAhDQcAANECACAjAADRAgAgJAAA0QIAIGUAANYCACBmAADRAgAg7gECAAAAAfIBAgAAAATzAQIAAAAE9AECAAAAAfUBAgAAAAH2AQIAAAAB9wECAAAAAfsBAgDsAgAhDQcAAM4CACAjAADaAgAgJAAA2gIAIGUAANoCACBmAADaAgAg7gEIAAAAAfIBCAAAAAXzAQgAAAAF9AEIAAAAAfUBCAAAAAH2AQgAAAAB9wEIAAAAAfsBCADtAgAhBwcAANECACAjAADvAgAgJAAA7wIAIO4BAAAAhgIC8gEAAACGAgjzAQAAAIYCCPsBAADuAoYCIgTuAQAAAIYCAvIBAAAAhgII8wEAAACGAgj7AQAA7wKGAiITBgAA9gIAINkBAADwAgAw2gEAAA8AENsBAADwAgAw3AEBAOECACHjAUAA5QIAIeQBIADjAgAh5QEgAOMCACHmAUAA5AIAIecBQADlAgAh6AFAAOUCACHsAQEA4gIAIYQCAQDhAgAhhgIAAPEChgIihwIIAPICACGIAggA8wIAIYkCCADzAgAhigICAPQCACGLAgIA9QIAIQTuAQAAAIYCAvIBAAAAhgII8wEAAACGAgj7AQAA7wKGAiII7gEIAAAAAfIBCAAAAATzAQgAAAAE9AEIAAAAAfUBCAAAAAH2AQgAAAAB9wEIAAAAAfsBCADWAgAhCO4BCAAAAAHyAQgAAAAF8wEIAAAABfQBCAAAAAH1AQgAAAAB9gEIAAAAAfcBCAAAAAH7AQgA2gIAIQjuAQIAAAAB8gECAAAABfMBAgAAAAX0AQIAAAAB9QECAAAAAfYBAgAAAAH3AQIAAAAB-wECAM4CACEI7gECAAAAAfIBAgAAAATzAQIAAAAE9AECAAAAAfUBAgAAAAH2AQIAAAAB9wECAAAAAfsBAgDRAgAhA_0BAAALACD-AQAACwAg_wEAAAsAIA_ZAQAA9wIAMNoBAADjAQAQ2wEAAPcCADDcAQEAxAIAIeUBIADFAgAh5gFAAMkCACHnAUAAygIAIegBQADKAgAhggIBAMQCACGMAggAyAIAIY0CAQDLAgAhjgIBAMsCACGQAgAA-AKQAiKRAgEAywIAIZICAAD5AgAgBwcAANECACAjAAD8AgAgJAAA_AIAIO4BAAAAkAIC8gEAAACQAgjzAQAAAJACCPsBAAD7ApACIg8HAADOAgAgIwAA-gIAICQAAPoCACDuAYAAAAAB9AGAAAAAAfUBgAAAAAH2AYAAAAAB9wGAAAAAAfsBgAAAAAGTAgEAAAABlAIBAAAAAZUCAQAAAAGWAoAAAAABlwKAAAAAAZgCgAAAAAEM7gGAAAAAAfQBgAAAAAH1AYAAAAAB9gGAAAAAAfcBgAAAAAH7AYAAAAABkwIBAAAAAZQCAQAAAAGVAgEAAAABlgKAAAAAAZcCgAAAAAGYAoAAAAABBwcAANECACAjAAD8AgAgJAAA_AIAIO4BAAAAkAIC8gEAAACQAgjzAQAAAJACCPsBAAD7ApACIgTuAQAAAJACAvIBAAAAkAII8wEAAACQAgj7AQAA_AKQAiIQCQAAgAMAINkBAAD9AgAw2gEAAB4AENsBAAD9AgAw3AEBAOECACHlASAA4wIAIeYBQADkAgAh5wFAAOUCACHoAUAA5QIAIYICAQDhAgAhjAIIAPICACGNAgEA4gIAIY4CAQDiAgAhkAIAAP4CkAIikQIBAOICACGSAgAA_wIAIATuAQAAAJACAvIBAAAAkAII8wEAAACQAgj7AQAA_AKQAiIM7gGAAAAAAfQBgAAAAAH1AYAAAAAB9gGAAAAAAfcBgAAAAAH7AYAAAAABkwIBAAAAAZQCAQAAAAGVAgEAAAABlgKAAAAAAZcCgAAAAAGYAoAAAAABIAMAAJsDACAIAACkAwAgDAAAnwMAIA4AAKUDACAQAACYAwAg2QEAAKIDADDaAQAACwAQ2wEAAKIDADDcAQEA4QIAIeUBIADjAgAh5gFAAOQCACHnAUAA5QIAIegBQADlAgAhkAIAAKMDnwIinQIBAOECACGfAggA8gIAIaACAQDhAgAhoQIBAOECACGiAgEA4QIAIaMCAQDhAgAhpAIBAOECACGlAgEA4QIAIaYCAAD-ApACIqcCAQDhAgAhqAIBAOICACGpAgEA4gIAIaoCAQDiAgAhqwIIAPICACGsAgEA4gIAIa0CAQDhAgAhyQIAAAsAIMoCAAALACAJ2QEAAIEDADDaAQAAywEAENsBAACBAwAw3AEBAMQCACGCAgEAxAIAIZkCAgDrAgAhmgIIAMgCACGbAggAyAIAIZwCAQDEAgAhGdkBAACCAwAw2gEAALUBABDbAQAAggMAMNwBAQDEAgAh5QEgAMUCACHmAUAAyQIAIecBQADKAgAh6AFAAMoCACGQAgAAgwOfAiKdAgEAxAIAIZ8CCADIAgAhoAIBAMQCACGhAgEAxAIAIaICAQDEAgAhowIBAMQCACGkAgEAxAIAIaUCAQDEAgAhpgIAAPgCkAIipwIBAMQCACGoAgEAywIAIakCAQDLAgAhqgIBAMsCACGrAggAyAIAIawCAQDLAgAhrQIBAMQCACEHBwAA0QIAICMAAIUDACAkAACFAwAg7gEAAACfAgLyAQAAAJ8CCPMBAAAAnwII-wEAAIQDnwIiBwcAANECACAjAACFAwAgJAAAhQMAIO4BAAAAnwIC8gEAAACfAgjzAQAAAJ8CCPsBAACEA58CIgTuAQAAAJ8CAvIBAAAAnwII8wEAAACfAgj7AQAAhQOfAiIRCQIAxgIAIdkBAACGAwAw2gEAAJ0BABDbAQAAhgMAMNwBAQDEAgAh5AEgAMUCACHlASAAxQIAIeYBQADJAgAh5wFAAMoCACHoAUAAygIAIesBAQDLAgAh7QEBAMsCACGuAgEAywIAIa8CAQDLAgAhsAIBAMsCACGxAiAAxQIAIbICAQDLAgAhEQkCAPQCACHZAQAAhwMAMNoBAACKAQAQ2wEAAIcDADDcAQEA4QIAIeQBIADjAgAh5QEgAOMCACHmAUAA5AIAIecBQADlAgAh6AFAAOUCACHrAQEA4gIAIe0BAQDiAgAhrgIBAOICACGvAgEA4gIAIbACAQDiAgAhsQIgAOMCACGyAgEA4gIAIQnZAQAAiAMAMNoBAACEAQAQ2wEAAIgDADDcAQEAxAIAIecBQADKAgAh6AFAAMoCACGzAgEAxAIAIbQCAQDEAgAhtQJAAMoCACEJ2QEAAIkDADDaAQAAcQAQ2wEAAIkDADDcAQEA4QIAIecBQADlAgAh6AFAAOUCACGzAgEA4QIAIbQCAQDhAgAhtQJAAOUCACEQ2QEAAIoDADDaAQAAawAQ2wEAAIoDADDcAQEAxAIAIecBQADKAgAh6AFAAMoCACGtAgEAxAIAIbYCAQDEAgAhtwIBAMQCACG4AgEAywIAIbkCAQDLAgAhugIBAMsCACG7AkAAyQIAIbwCQADJAgAhvQIBAMsCACG-AgEAywIAIQvZAQAAiwMAMNoBAABVABDbAQAAiwMAMNwBAQDEAgAh5wFAAMoCACHoAUAAygIAIa0CAQDEAgAhtQJAAMoCACG_AgEAxAIAIcACAQDLAgAhwQIBAMsCACEO2QEAAIwDADDaAQAAPwAQ2wEAAIwDADDcAQEAxAIAId0BAQDEAgAh5QEgAMUCACHnAUAAygIAIegBQADKAgAh6wEBAMsCACGQAgAAjgPIAiLCAgEAxAIAIcMCIADFAgAhxAIBAMsCACHGAgAAjQPGAiIHBwAA0QIAICMAAJIDACAkAACSAwAg7gEAAADGAgLyAQAAAMYCCPMBAAAAxgII-wEAAJEDxgIiBwcAANECACAjAACQAwAgJAAAkAMAIO4BAAAAyAIC8gEAAADIAgjzAQAAAMgCCPsBAACPA8gCIgcHAADRAgAgIwAAkAMAICQAAJADACDuAQAAAMgCAvIBAAAAyAII8wEAAADIAgj7AQAAjwPIAiIE7gEAAADIAgLyAQAAAMgCCPMBAAAAyAII-wEAAJADyAIiBwcAANECACAjAACSAwAgJAAAkgMAIO4BAAAAxgIC8gEAAADGAgjzAQAAAMYCCPsBAACRA8YCIgTuAQAAAMYCAvIBAAAAxgII8wEAAADGAgj7AQAAkgPGAiISBAAAlgMAIAUAAJcDACAGAAD2AgAgEAAAmAMAINkBAACTAwAw2gEAACwAENsBAACTAwAw3AEBAOECACHdAQEA4QIAIeUBIADjAgAh5wFAAOUCACHoAUAA5QIAIesBAQDiAgAhkAIAAJUDyAIiwgIBAOECACHDAiAA4wIAIcQCAQDiAgAhxgIAAJQDxgIiBO4BAAAAxgIC8gEAAADGAgjzAQAAAMYCCPsBAACSA8YCIgTuAQAAAMgCAvIBAAAAyAII8wEAAADIAgj7AQAAkAPIAiID_QEAAAMAIP4BAAADACD_AQAAAwAgA_0BAAAHACD-AQAABwAg_wEAAAcAIAP9AQAAIAAg_gEAACAAIP8BAAAgACACggIBAAAAAYMCAQAAAAEPCQAAgAMAIA8AAJsDACDZAQAAmgMAMNoBAAAgABDbAQAAmgMAMNwBAQDhAgAh5AEgAOMCACHlASAA4wIAIeYBQADkAgAh5wFAAOUCACHoAUAA5QIAIYACCADyAgAhgQIBAOECACGCAgEA4QIAIYMCAQDhAgAhFAQAAJYDACAFAACXAwAgBgAA9gIAIBAAAJgDACDZAQAAkwMAMNoBAAAsABDbAQAAkwMAMNwBAQDhAgAh3QEBAOECACHlASAA4wIAIecBQADlAgAh6AFAAOUCACHrAQEA4gIAIZACAACVA8gCIsICAQDhAgAhwwIgAOMCACHEAgEA4gIAIcYCAACUA8YCIskCAAAsACDKAgAALAAgFwsAAJ4DACAMAACfAwAg2QEAAJwDADDaAQAAFwAQ2wEAAJwDADDcAQEA4QIAId0BAQDhAgAh3gEgAOMCACHfAQIA9AIAIeABIACdAwAh4QEBAOECACHiAQgA8gIAIeMBQADkAgAh5AEgAOMCACHlASAA4wIAIeYBQADkAgAh5wFAAOUCACHoAUAA5QIAIekBAQDiAgAh6gEBAOICACHrAQAAzAIAIOwBAQDiAgAh7QEBAOECACEC7gEgAAAAAfsBIADYAgAhEQoAAOYCACDZAQAA4AIAMNoBAACXAgAQ2wEAAOACADDcAQEA4QIAId0BAQDhAgAh3gEgAOMCACHkASAA4wIAIeUBIADjAgAh5gFAAOQCACHnAUAA5QIAIegBQADlAgAh6wEBAOICACHsAQEA4gIAIfwBAQDiAgAhyQIAAJcCACDKAgAAlwIAIAP9AQAAEwAg_gEAABMAIP8BAAATACALCQAAgAMAIA0AAKEDACDZAQAAoAMAMNoBAAATABDbAQAAoAMAMNwBAQDhAgAhggIBAOECACGZAgIA9QIAIZoCCADyAgAhmwIIAPICACGcAgEA4QIAIRkLAACeAwAgDAAAnwMAINkBAACcAwAw2gEAABcAENsBAACcAwAw3AEBAOECACHdAQEA4QIAId4BIADjAgAh3wECAPQCACHgASAAnQMAIeEBAQDhAgAh4gEIAPICACHjAUAA5AIAIeQBIADjAgAh5QEgAOMCACHmAUAA5AIAIecBQADlAgAh6AFAAOUCACHpAQEA4gIAIeoBAQDiAgAh6wEAAMwCACDsAQEA4gIAIe0BAQDhAgAhyQIAABcAIMoCAAAXACAeAwAAmwMAIAgAAKQDACAMAACfAwAgDgAApQMAIBAAAJgDACDZAQAAogMAMNoBAAALABDbAQAAogMAMNwBAQDhAgAh5QEgAOMCACHmAUAA5AIAIecBQADlAgAh6AFAAOUCACGQAgAAowOfAiKdAgEA4QIAIZ8CCADyAgAhoAIBAOECACGhAgEA4QIAIaICAQDhAgAhowIBAOECACGkAgEA4QIAIaUCAQDhAgAhpgIAAP4CkAIipwIBAOECACGoAgEA4gIAIakCAQDiAgAhqgIBAOICACGrAggA8gIAIawCAQDiAgAhrQIBAOECACEE7gEAAACfAgLyAQAAAJ8CCPMBAAAAnwII-wEAAIUDnwIiFQYAAPYCACDZAQAA8AIAMNoBAAAPABDbAQAA8AIAMNwBAQDhAgAh4wFAAOUCACHkASAA4wIAIeUBIADjAgAh5gFAAOQCACHnAUAA5QIAIegBQADlAgAh7AEBAOICACGEAgEA4QIAIYYCAADxAoYCIocCCADyAgAhiAIIAPMCACGJAggA8wIAIYoCAgD0AgAhiwICAPUCACHJAgAADwAgygIAAA8AIBIJAACAAwAg2QEAAP0CADDaAQAAHgAQ2wEAAP0CADDcAQEA4QIAIeUBIADjAgAh5gFAAOQCACHnAUAA5QIAIegBQADlAgAhggIBAOECACGMAggA8gIAIY0CAQDiAgAhjgIBAOICACGQAgAA_gKQAiKRAgEA4gIAIZICAAD_AgAgyQIAAB4AIMoCAAAeACARAwAAmwMAINkBAACmAwAw2gEAAAcAENsBAACmAwAw3AEBAOECACHnAUAA5QIAIegBQADlAgAhrQIBAOECACG2AgEA4QIAIbcCAQDhAgAhuAIBAOICACG5AgEA4gIAIboCAQDiAgAhuwJAAOQCACG8AkAA5AIAIb0CAQDiAgAhvgIBAOICACEMAwAAmwMAINkBAACnAwAw2gEAAAMAENsBAACnAwAw3AEBAOECACHnAUAA5QIAIegBQADlAgAhrQIBAOECACG1AkAA5QIAIb8CAQDhAgAhwAIBAOICACHBAgEA4gIAIQAAAAAAAAHOAgEAAAABAc4CIAAAAAEFzgICAAAAAdQCAgAAAAHVAgIAAAAB1gICAAAAAdcCAgAAAAEBzgIgAAAAAQXOAggAAAAB1AIIAAAAAdUCCAAAAAHWAggAAAAB1wIIAAAAAQHOAkAAAAABAc4CQAAAAAEBzgIBAAAAAQLOAgEAAAAE2AIBAAAABQUdAAC4BQAgHgAAwQUAIMsCAAC5BQAgzAIAAMAFACDRAgAAlAIAIAsdAAC5AwAwHgAAvgMAMMsCAAC6AwAwzAIAALsDADDNAgAAvAMAIM4CAAC9AwAwzwIAAL0DADDQAgAAvQMAMNECAAC9AwAw0gIAAL8DADDTAgAAwAMAMAYJAADHAwAg3AEBAAAAAYICAQAAAAGZAgIAAAABmgIIAAAAAZsCCAAAAAECAAAAFQAgHQAAxgMAIAMAAAAVACAdAADGAwAgHgAAxAMAIAEWAAC_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AADTAwAwAAAAAAAABR0AAK8FACAeAAC1BQAgywIAALAFACDMAgAAtAUAINECAAANACAFHQAArQUAIB4AALIFACDLAgAArgUAIMwCAACxBQAg0QIAAAEAIAMdAACvBQAgywIAALAFACDRAgAADQAgAx0AAK0FACDLAgAArgUAINECAAABACAAAAAAAAHOAgAAAIYCAgXOAggAAAAB1AIIAAAAAdUCCAAAAAHWAggAAAAB1wIIAAAAAQsdAADuAwAwHgAA8wMAMMsCAADvAwAwzAIAAPADADDNAgAA8QMAIM4CAADyAwAwzwIAAPIDADDQAgAA8gMAMNECAADyAwAw0gIAAPQDADDTAgAA9QMAMBkDAACcBAAgDAAAnQQAIA4AAJ4EACAQAACfBAAg3AEBAAAAAeUBIAAAAAHmAUAAAAAB5wFAAAAAAegBQAAAAAGQAgAAAJ8CAp0CAQAAAAGfAggAAAABoAIBAAAAAaECAQAAAAGiAgEAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIAAACQAgKnAgEAAAABqAIBAAAAAakCAQAAAAGqAgEAAAABqwIIAAAAAa0CAQAAAAECAAAADQAgHQAAmwQAIAMAAAANACAdAACbBAAgHgAA-gMAIAEWAACsBQAwHgMAAJsDACAIAACkAwAgDAAAnwMAIA4AAKUDACAQAACYAwAg2QEAAKIDADDaAQAACwAQ2wEAAKIDADDcAQEAAAAB5QEgAOMCACHmAUAA5AIAIecBQADlAgAh6AFAAOUCACGQAgAAowOfAiKdAgEA4QIAIZ8CCADyAgAhoAIBAOECACGhAgEA4QIAIaICAQDhAgAhowIBAOECACGkAgEA4QIAIaUCAQDhAgAhpgIAAP4CkAIipwIBAOECACGoAgEA4gIAIakCAQDiAgAhqgIBAOICACGrAggA8gIAIawCAQDiAgAhrQIBAOECACECAAAADQAgFgAA-gMAIAIAAAD2AwAgFgAA9wMAIBnZAQAA9QMAMNoBAAD2AwAQ2wEAAPUDADDcAQEA4QIAIeUBIADjAgAh5gFAAOQCACHnAUAA5QIAIegBQADlAgAhkAIAAKMDnwIinQIBAOECACGfAggA8gIAIaACAQDhAgAhoQIBAOECACGiAgEA4QIAIaMCAQDhAgAhpAIBAOECACGlAgEA4QIAIaYCAAD-ApACIqcCAQDhAgAhqAIBAOICACGpAgEA4gIAIaoCAQDiAgAhqwIIAPICACGsAgEA4gIAIa0CAQDhAgAhGdkBAAD1AwAw2gEAAPYDABDbAQAA9QMAMNwBAQDhAgAh5QEgAOMCACHmAUAA5AIAIecBQADlAgAh6AFAAOUCACGQAgAAowOfAiKdAgEA4QIAIZ8CCADyAgAhoAIBAOECACGhAgEA4QIAIaICAQDhAgAhowIBAOECACGkAgEA4QIAIaUCAQDhAgAhpgIAAP4CkAIipwIBAOECACGoAgEA4gIAIakCAQDiAgAhqgIBAOICACGrAggA8gIAIawCAQDiAgAhrQIBAOECACEV3AEBAK4DACHlASAArwMAIeYBQACzAwAh5wFAALQDACHoAUAAtAMAIZACAAD4A58CIp0CAQCuAwAhnwIIALIDACGgAgEArgMAIaECAQCuAwAhogIBAK4DACGjAgEArgMAIaQCAQCuAwAhpQIBAK4DACGmAgAA-QOQAiKnAgEArgMAIagCAQC1AwAhqQIBALUDACGqAgEAtQMAIasCCACyAwAhrQIBAK4DACEBzgIAAACfAgIBzgIAAACQAgIZAwAA-wMAIAwAAPwDACAOAAD9AwAgEAAA_gMAINwBAQCuAwAh5QEgAK8DACHmAUAAswMAIecBQAC0AwAh6AFAALQDACGQAgAA-AOfAiKdAgEArgMAIZ8CCACyAwAhoAIBAK4DACGhAgEArgMAIaICAQCuAwAhowIBAK4DACGkAgEArgMAIaUCAQCuAwAhpgIAAPkDkAIipwIBAK4DACGoAgEAtQMAIakCAQC1AwAhqgIBALUDACGrAggAsgMAIa0CAQCuAwAhBR0AAKAFACAeAACqBQAgywIAAKEFACDMAgAAqQUAINECAAABACALHQAAkAQAMB4AAJQEADDLAgAAkQQAMMwCAACSBAAwzQIAAJMEACDOAgAAvQMAMM8CAAC9AwAw0AIAAL0DADDRAgAAvQMAMNICAACVBAAw0wIAAMADADAHHQAAiwQAIB4AAI4EACDLAgAAjAQAIMwCAACNBAAgzwIAAB4AINACAAAeACDRAgAAzgEAIAsdAAD_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_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_gMAINwBAQCuAwAh5QEgAK8DACHmAUAAswMAIecBQAC0AwAh6AFAALQDACGQAgAA-AOfAiKdAgEArgMAIZ8CCACyAwAhoAIBAK4DACGhAgEArgMAIaICAQCuAwAhowIBAK4DACGkAgEArgMAIaUCAQCuAwAhpgIAAPkDkAIipwIBAK4DACGoAgEAtQMAIakCAQC1AwAhqgIBALUDACGrAggAsgMAIawCAQC1AwAhGQgAALUEACAMAACdBAAgDgAAngQAIBAAAJ8EACDcAQEAAAAB5QEgAAAAAeYBQAAAAAHnAUAAAAAB6AFAAAAAAZACAAAAnwICnQIBAAAAAZ8CCAAAAAGgAgEAAAABoQIBAAAAAaICAQAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAGmAgAAAJACAqcCAQAAAAGoAgEAAAABqQIBAAAAAaoCAQAAAAGrAggAAAABrAIBAAAAAQzcAQEAAAAB5wFAAAAAAegBQAAAAAG2AgEAAAABtwIBAAAAAbgCAQAAAAG5AgEAAAABugIBAAAAAbsCQAAAAAG8AkAAAAABvQIBAAAAAb4CAQAAAAECAAAACQAgHQAA7gQAIAMAAAAJACAdAADuBAAgHgAA7QQAIAEWAACJBQAwEQMAAJsDACDZAQAApgMAMNoBAAAHABDbAQAApgMAMNwBAQAAAAHnAUAA5QIAIegBQADlAgAhrQIBAOECACG2AgEA4QIAIbcCAQDhAgAhuAIBAOICACG5AgEA4gIAIboCAQDiAgAhuwJAAOQCACG8AkAA5AIAIb0CAQDiAgAhvgIBAOICACECAAAACQAgFgAA7QQAIAIAAADrBAAgFgAA7AQAIBDZAQAA6gQAMNoBAADrBAAQ2wEAAOoEADDcAQEA4QIAIecBQADlAgAh6AFAAOUCACGtAgEA4QIAIbYCAQDhAgAhtwIBAOECACG4AgEA4gIAIbkCAQDiAgAhugIBAOICACG7AkAA5AIAIbwCQADkAgAhvQIBAOICACG-AgEA4gIAIRDZAQAA6gQAMNoBAADrBAAQ2wEAAOoEADDcAQEA4QIAIecBQADlAgAh6AFAAOUCACGtAgEA4QIAIbYCAQDhAgAhtwIBAOECACG4AgEA4gIAIbkCAQDiAgAhugIBAOICACG7AkAA5AIAIbwCQADkAgAhvQIBAOICACG-AgEA4gIAIQzcAQEArgMAIecBQAC0AwAh6AFAALQDACG2AgEArgMAIbcCAQCuAwAhuAIBALUDACG5AgEAtQMAIboCAQC1AwAhuwJAALMDACG8AkAAswMAIb0CAQC1AwAhvgIBALUDACEM3AEBAK4DACHnAUAAtAMAIegBQAC0AwAhtgIBAK4DACG3AgEArgMAIbgCAQC1AwAhuQIBALUDACG6AgEAtQMAIbsCQACzAwAhvAJAALMDACG9AgEAtQMAIb4CAQC1AwAhDNwBAQAAAAHnAUAAAAAB6AFAAAAAAbYCAQAAAAG3AgEAAAABuAIBAAAAAbkCAQAAAAG6AgEAAAABuwJAAAAAAbwCQAAAAAG9AgEAAAABvgIBAAAAAQfcAQEAAAAB5wFAAAAAAegBQAAAAAG1AkAAAAABvwIBAAAAAcACAQAAAAHBAgEAAAABAgAAAAUAIB0AAPoEACADAAAABQAgHQAA-gQAIB4AAPkEACABFgAAiAUAMAwDAACbAwAg2QEAAKcDADDaAQAAAwAQ2wEAAKcDADDcAQEAAAAB5wFAAOUCACHoAUAA5QIAIa0CAQDhAgAhtQJAAOUCACG_AgEAAAABwAIBAOICACHBAgEA4gIAIQIAAAAFACAWAAD5BAAgAgAAAPcEACAWAAD4BAAgC9kBAAD2BAAw2gEAAPcEABDbAQAA9gQAMNwBAQDhAgAh5wFAAOUCACHoAUAA5QIAIa0CAQDhAgAhtQJAAOUCACG_AgEA4QIAIcACAQDiAgAhwQIBAOICACEL2QEAAPYEADDaAQAA9wQAENsBAAD2BAAw3AEBAOECACHnAUAA5QIAIegBQADlAgAhrQIBAOECACG1AkAA5QIAIb8CAQDhAgAhwAIBAOICACHBAgEA4gIAIQfcAQEArgMAIecBQAC0AwAh6AFAALQDACG1AkAAtAMAIb8CAQCuAwAhwAIBALUDACHBAgEAtQMAIQfcAQEArgMAIecBQAC0AwAh6AFAALQDACG1AkAAtAMAIb8CAQCuAwAhwAIBALUDACHBAgEAtQMAIQfcAQEAAAAB5wFAAAAAAegBQAAAAAG1AkAAAAABvwIBAAAAAcACAQAAAAHBAgEAAAABBB0AAO8EADDLAgAA8AQAMM0CAADyBAAg0QIAAPMEADAEHQAA4wQAMMsCAADkBAAwzQIAAOYEACDRAgAA5wQAMAQdAADaBAAwywIAANsEADDNAgAA3QQAINECAADyAwAwBB0AANEEADDLAgAA0gQAMM0CAADUBAAg0QIAAIMEADAAAAAGBAAA_wQAIAUAAIAFACAGAAChBAAgEAAAgQUAIOsBAACoAwAgxAIAAKgDACAFCgAA3AMAIOYBAACoAwAg6wEAAKgDACDsAQAAqAMAIPwBAACoAwAgAAkLAACDBQAgDAAAhAUAIN8BAACoAwAg4AEAAKgDACDjAQAAqAMAIOYBAACoAwAg6QEAAKgDACDqAQAAqAMAIOwBAACoAwAgBgYAAKEEACDmAQAAqAMAIOwBAACoAwAgiAIAAKgDACCJAgAAqAMAIIoCAACoAwAgBgkAAKkEACDmAQAAqAMAII0CAACoAwAgjgIAAKgDACCRAgAAqAMAIJICAACoAwAgB9wBAQAAAAHnAUAAAAAB6AFAAAAAAbUCQAAAAAG_AgEAAAABwAIBAAAAAcECAQAAAAEM3AEBAAAAAecBQAAAAAHoAUAAAAABtgIBAAAAAbcCAQAAAAG4AgEAAAABuQIBAAAAAboCAQAAAAG7AkAAAAABvAJAAAAAAb0CAQAAAAG-AgEAAAABFdwBAQAAAAHlASAAAAAB5gFAAAAAAecBQAAAAAHoAUAAAAABkAIAAACfAgKdAgEAAAABnwIIAAAAAaACAQAAAAGhAgEAAAABogIBAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAaYCAAAAkAICpwIBAAAAAagCAQAAAAGpAgEAAAABqgIBAAAAAasCCAAAAAGsAgEAAAABCdwBAQAAAAHkASAAAAAB5QEgAAAAAeYBQAAAAAHnAUAAAAAB6AFAAAAAAYACCAAAAAGBAgEAAAABggIBAAAAAQ4FAAD8BAAgBgAA_QQAIBAAAP4EACDcAQEAAAAB3QEBAAAAAeUBIAAAAAHnAUAAAAAB6AFAAAAAAesBAQAAAAGQAgAAAMgCAsICAQAAAAHDAiAAAAABxAIBAAAAAcYCAAAAxgICAgAAAAEAIB0AAIwFACADAAAALAAgHQAAjAUAIB4AAJAFACAQAAAALAAgBQAAzgQAIAYAAM8EACAQAADQBAAgFgAAkAUAINwBAQCuAwAh3QEBAK4DACHlASAArwMAIecBQAC0AwAh6AFAALQDACHrAQEAtQMAIZACAADMBMgCIsICAQCuAwAhwwIgAK8DACHEAgEAtQMAIcYCAADLBMYCIg4FAADOBAAgBgAAzwQAIBAAANAEACDcAQEArgMAId0BAQCuAwAh5QEgAK8DACHnAUAAtAMAIegBQAC0AwAh6wEBALUDACGQAgAAzATIAiLCAgEArgMAIcMCIACvAwAhxAIBALUDACHGAgAAywTGAiIOBAAA-wQAIAYAAP0EACAQAAD-BAAg3AEBAAAAAd0BAQAAAAHlASAAAAAB5wFAAAAAAegBQAAAAAHrAQEAAAABkAIAAADIAgLCAgEAAAABwwIgAAAAAcQCAQAAAAHGAgAAAMYCAgIAAAABACAdAACRBQAgAwAAACwAIB0AAJEFACAeAACVBQAgEAAAACwAIAQAAM0EACAGAADPBAAgEAAA0AQAIBYAAJUFACDcAQEArgMAId0BAQCuAwAh5QEgAK8DACHnAUAAtAMAIegBQAC0AwAh6wEBALUDACGQAgAAzATIAiLCAgEArgMAIcMCIACvAwAhxAIBALUDACHGAgAAywTGAiIOBAAAzQQAIAYAAM8EACAQAADQBAAg3AEBAK4DACHdAQEArgMAIeUBIACvAwAh5wFAALQDACHoAUAAtAMAIesBAQC1AwAhkAIAAMwEyAIiwgIBAK4DACHDAiAArwMAIcQCAQC1AwAhxgIAAMsExgIiD9wBAQAAAAHjAUAAAAAB5AEgAAAAAeUBIAAAAAHmAUAAAAAB5wFAAAAAAegBQAAAAAHsAQEAAAABhAIBAAAAAYYCAAAAhgIChwIIAAAAAYgCCAAAAAGJAggAAAABigICAAAAAYsCAgAAAAECAAAA5gEAIB0AAJYFACADAAAADwAgHQAAlgUAIB4AAJoFACARAAAADwAgFgAAmgUAINwBAQCuAwAh4wFAALQDACHkASAArwMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAh7AEBALUDACGEAgEArgMAIYYCAADrA4YCIocCCACyAwAhiAIIAOwDACGJAggA7AMAIYoCAgCwAwAhiwICAMMDACEP3AEBAK4DACHjAUAAtAMAIeQBIACvAwAh5QEgAK8DACHmAUAAswMAIecBQAC0AwAh6AFAALQDACHsAQEAtQMAIYQCAQCuAwAhhgIAAOsDhgIihwIIALIDACGIAggA7AMAIYkCCADsAwAhigICALADACGLAgIAwwMAIRoDAACcBAAgCAAAtQQAIAwAAJ0EACAQAACfBAAg3AEBAAAAAeUBIAAAAAHmAUAAAAAB5wFAAAAAAegBQAAAAAGQAgAAAJ8CAp0CAQAAAAGfAggAAAABoAIBAAAAAaECAQAAAAGiAgEAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIAAACQAgKnAgEAAAABqAIBAAAAAakCAQAAAAGqAgEAAAABqwIIAAAAAawCAQAAAAGtAgEAAAABAgAAAA0AIB0AAJsFACADAAAACwAgHQAAmwUAIB4AAJ8FACAcAAAACwAgAwAA-wMAIAgAALQEACAMAAD8AwAgEAAA_gMAIBYAAJ8FACDcAQEArgMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAhkAIAAPgDnwIinQIBAK4DACGfAggAsgMAIaACAQCuAwAhoQIBAK4DACGiAgEArgMAIaMCAQCuAwAhpAIBAK4DACGlAgEArgMAIaYCAAD5A5ACIqcCAQCuAwAhqAIBALUDACGpAgEAtQMAIaoCAQC1AwAhqwIIALIDACGsAgEAtQMAIa0CAQCuAwAhGgMAAPsDACAIAAC0BAAgDAAA_AMAIBAAAP4DACDcAQEArgMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAhkAIAAPgDnwIinQIBAK4DACGfAggAsgMAIaACAQCuAwAhoQIBAK4DACGiAgEArgMAIaMCAQCuAwAhpAIBAK4DACGlAgEArgMAIaYCAAD5A5ACIqcCAQCuAwAhqAIBALUDACGpAgEAtQMAIaoCAQC1AwAhqwIIALIDACGsAgEAtQMAIa0CAQCuAwAhDgQAAPsEACAFAAD8BAAgEAAA_gQAINwBAQAAAAHdAQEAAAAB5QEgAAAAAecBQAAAAAHoAUAAAAAB6wEBAAAAAZACAAAAyAICwgIBAAAAAcMCIAAAAAHEAgEAAAABxgIAAADGAgICAAAAAQAgHQAAoAUAIBMLAADJAwAg3AEBAAAAAd0BAQAAAAHeASAAAAAB3wECAAAAAeABIAAAAAHhAQEAAAAB4gEIAAAAAeMBQAAAAAHkASAAAAAB5QEgAAAAAeYBQAAAAAHnAUAAAAAB6AFAAAAAAekBAQAAAAHqAQEAAAAB6wEAAMgDACDsAQEAAAAB7QEBAAAAAQIAAAAZACAdAACiBQAgAwAAABcAIB0AAKIFACAeAACmBQAgFQAAABcAIAsAALcDACAWAACmBQAg3AEBAK4DACHdAQEArgMAId4BIACvAwAh3wECALADACHgASAAsQMAIeEBAQCuAwAh4gEIALIDACHjAUAAswMAIeQBIACvAwAh5QEgAK8DACHmAUAAswMAIecBQAC0AwAh6AFAALQDACHpAQEAtQMAIeoBAQC1AwAh6wEAALYDACDsAQEAtQMAIe0BAQCuAwAhEwsAALcDACDcAQEArgMAId0BAQCuAwAh3gEgAK8DACHfAQIAsAMAIeABIACxAwAh4QEBAK4DACHiAQgAsgMAIeMBQACzAwAh5AEgAK8DACHlASAArwMAIeYBQACzAwAh5wFAALQDACHoAUAAtAMAIekBAQC1AwAh6gEBALUDACHrAQAAtgMAIOwBAQC1AwAh7QEBAK4DACEF3AEBAAAAAZkCAgAAAAGaAggAAAABmwIIAAAAAZwCAQAAAAEJ3AEBAAAAAeQBIAAAAAHlASAAAAAB5gFAAAAAAecBQAAAAAHoAUAAAAABgAIIAAAAAYECAQAAAAGDAgEAAAABAwAAACwAIB0AAKAFACAeAACrBQAgEAAAACwAIAQAAM0EACAFAADOBAAgEAAA0AQAIBYAAKsFACDcAQEArgMAId0BAQCuAwAh5QEgAK8DACHnAUAAtAMAIegBQAC0AwAh6wEBALUDACGQAgAAzATIAiLCAgEArgMAIcMCIACvAwAhxAIBALUDACHGAgAAywTGAiIOBAAAzQQAIAUAAM4EACAQAADQBAAg3AEBAK4DACHdAQEArgMAIeUBIACvAwAh5wFAALQDACHoAUAAtAMAIesBAQC1AwAhkAIAAMwEyAIiwgIBAK4DACHDAiAArwMAIcQCAQC1AwAhxgIAAMsExgIiFdwBAQAAAAHlASAAAAAB5gFAAAAAAecBQAAAAAHoAUAAAAABkAIAAACfAgKdAgEAAAABnwIIAAAAAaACAQAAAAGhAgEAAAABogIBAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAaYCAAAAkAICpwIBAAAAAagCAQAAAAGpAgEAAAABqgIBAAAAAasCCAAAAAGtAgEAAAABDgQAAPsEACAFAAD8BAAgBgAA_QQAINwBAQAAAAHdAQEAAAAB5QEgAAAAAecBQAAAAAHoAUAAAAAB6wEBAAAAAZACAAAAyAICwgIBAAAAAcMCIAAAAAHEAgEAAAABxgIAAADGAgICAAAAAQAgHQAArQUAIBoDAACcBAAgCAAAtQQAIAwAAJ0EACAOAACeBAAg3AEBAAAAAeUBIAAAAAHmAUAAAAAB5wFAAAAAAegBQAAAAAGQAgAAAJ8CAp0CAQAAAAGfAggAAAABoAIBAAAAAaECAQAAAAGiAgEAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIAAACQAgKnAgEAAAABqAIBAAAAAakCAQAAAAGqAgEAAAABqwIIAAAAAawCAQAAAAGtAgEAAAABAgAAAA0AIB0AAK8FACADAAAALAAgHQAArQUAIB4AALMFACAQAAAALAAgBAAAzQQAIAUAAM4EACAGAADPBAAgFgAAswUAINwBAQCuAwAh3QEBAK4DACHlASAArwMAIecBQAC0AwAh6AFAALQDACHrAQEAtQMAIZACAADMBMgCIsICAQCuAwAhwwIgAK8DACHEAgEAtQMAIcYCAADLBMYCIg4EAADNBAAgBQAAzgQAIAYAAM8EACDcAQEArgMAId0BAQCuAwAh5QEgAK8DACHnAUAAtAMAIegBQAC0AwAh6wEBALUDACGQAgAAzATIAiLCAgEArgMAIcMCIACvAwAhxAIBALUDACHGAgAAywTGAiIDAAAACwAgHQAArwUAIB4AALYFACAcAAAACwAgAwAA-wMAIAgAALQEACAMAAD8AwAgDgAA_QMAIBYAALYFACDcAQEArgMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAhkAIAAPgDnwIinQIBAK4DACGfAggAsgMAIaACAQCuAwAhoQIBAK4DACGiAgEArgMAIaMCAQCuAwAhpAIBAK4DACGlAgEArgMAIaYCAAD5A5ACIqcCAQCuAwAhqAIBALUDACGpAgEAtQMAIaoCAQC1AwAhqwIIALIDACGsAgEAtQMAIa0CAQCuAwAhGgMAAPsDACAIAAC0BAAgDAAA_AMAIA4AAP0DACDcAQEArgMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAhkAIAAPgDnwIinQIBAK4DACGfAggAsgMAIaACAQCuAwAhoQIBAK4DACGiAgEArgMAIaMCAQCuAwAhpAIBAK4DACGlAgEArgMAIaYCAAD5A5ACIqcCAQCuAwAhqAIBALUDACGpAgEAtQMAIaoCAQC1AwAhqwIIALIDACGsAgEAtQMAIa0CAQCuAwAhEdwBAQAAAAHdAQEAAAAB3gEgAAAAAd8BAgAAAAHgASAAAAAB4QEBAAAAAeIBCAAAAAHjAUAAAAAB5AEgAAAAAeUBIAAAAAHmAUAAAAAB5wFAAAAAAegBQAAAAAHpAQEAAAAB6gEBAAAAAesBAADIAwAg7AEBAAAAAQvcAQEAAAAB3QEBAAAAAd4BIAAAAAHkASAAAAAB5QEgAAAAAeYBQAAAAAHnAUAAAAAB6AFAAAAAAesBAQAAAAHsAQEAAAAB_AEBAAAAAQIAAACUAgAgHQAAuAUAIBoDAACcBAAgCAAAtQQAIA4AAJ4EACAQAACfBAAg3AEBAAAAAeUBIAAAAAHmAUAAAAAB5wFAAAAAAegBQAAAAAGQAgAAAJ8CAp0CAQAAAAGfAggAAAABoAIBAAAAAaECAQAAAAGiAgEAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIAAACQAgKnAgEAAAABqAIBAAAAAakCAQAAAAGqAgEAAAABqwIIAAAAAawCAQAAAAGtAgEAAAABAgAAAA0AIB0AALoFACADAAAACwAgHQAAugUAIB4AAL4FACAcAAAACwAgAwAA-wMAIAgAALQEACAOAAD9AwAgEAAA_gMAIBYAAL4FACDcAQEArgMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAhkAIAAPgDnwIinQIBAK4DACGfAggAsgMAIaACAQCuAwAhoQIBAK4DACGiAgEArgMAIaMCAQCuAwAhpAIBAK4DACGlAgEArgMAIaYCAAD5A5ACIqcCAQCuAwAhqAIBALUDACGpAgEAtQMAIaoCAQC1AwAhqwIIALIDACGsAgEAtQMAIa0CAQCuAwAhGgMAAPsDACAIAAC0BAAgDgAA_QMAIBAAAP4DACDcAQEArgMAIeUBIACvAwAh5gFAALMDACHnAUAAtAMAIegBQAC0AwAhkAIAAPgDnwIinQIBAK4DACGfAggAsgMAIaACAQCuAwAhoQIBAK4DACGiAgEArgMAIaMCAQCuAwAhpAIBAK4DACGlAgEArgMAIaYCAAD5A5ACIqcCAQCuAwAhqAIBALUDACGpAgEAtQMAIaoCAQC1AwAhqwIIALIDACGsAgEAtQMAIa0CAQCuAwAhBdwBAQAAAAGCAgEAAAABmQICAAAAAZoCCAAAAAGbAggAAAABAwAAAJcCACAdAAC4BQAgHgAAwgUAIA0AAACXAgAgFgAAwgUAINwBAQCuAwAh3QEBAK4DACHeASAArwMAIeQBIACvAwAh5QEgAK8DACHmAUAAswMAIecBQAC0AwAh6AFAALQDACHrAQEAtQMAIewBAQC1AwAh_AEBALUDACEL3AEBAK4DACHdAQEArgMAId4BIACvAwAh5AEgAK8DACHlASAArwMAIeYBQACzAwAh5wFAALQDACHoAUAAtAMAIesBAQC1AwAh7AEBALUDACH8AQEAtQMAIQUEBgIFCgMGDgQHAA8QJg0BAwABAQMAAQYDAAEHAA4IEAUMFgcOHwwQIw0CBhEEBwAGAQYSAAIJAAQNAAgDBwALCwAJDBwHAgcACgoaCAEKGwABDB0AAQkABAIJAAQPAAECDCQAECUABAQnAAUoAAYpABAqAAAAAAMHABQjABUkABYAAAADBwAUIwAVJAAWAQMAAQEDAAEDBwAbIwAcJAAdAAAAAwcAGyMAHCQAHQEDAAEBAwABAwcAIiMAIyQAJAAAAAMHACIjACMkACQAAAADBwAqIwArJAAsAAAAAwcAKiMAKyQALAAAAAUHADIjADUkADZlADNmADQAAAAAAAUHADIjADUkADZlADNmADQCAwABCKoBBQIDAAEIsAEFBQcAOyMAPiQAP2UAPGYAPQAAAAAABQcAOyMAPiQAP2UAPGYAPQIJAAQNAAgCCQAEDQAIBQcARCMARyQASGUARWYARgAAAAAABQcARCMARyQASGUARWYARgEJAAQBCQAEBQcATSMAUCQAUWUATmYATwAAAAAABQcATSMAUCQAUWUATmYATwAABQcAViMAWSQAWmUAV2YAWAAAAAAABQcAViMAWSQAWmUAV2YAWAIJAAQPAAECCQAEDwABBQcAXyMAYiQAY2UAYGYAYQAAAAAABQcAXyMAYiQAY2UAYGYAYQAAAwcAaCMAaSQAagAAAAMHAGgjAGkkAGoBCwAJAQsACQUHAG8jAHIkAHNlAHBmAHEAAAAAAAUHAG8jAHIkAHNlAHBmAHERAgESKwETLgEULwEVMAEXMgEYNBAZNREaNwEbORAcOhIfOwEgPAEhPRAlQBMmQRcnQgIoQwIpRAIqRQIrRgIsSAItShAuSxgvTQIwTxAxUBkyUQIzUgI0UxA1Vho2Vx43WAM4WQM5WgM6WwM7XAM8XgM9YBA-YR8_YwNAZRBBZiBCZwNDaANEaRBFbCFGbSVHbyZIcCZJcyZKdCZLdSZMdyZNeRBOeidPfCZQfhBRfyhSgAEmU4EBJlSCARBVhQEpVoYBLVeIAS5YiQEuWYwBLlqNAS5bjgEuXJABLl2SARBekwEvX5UBLmCXARBhmAEwYpkBLmOaAS5kmwEQZ54BMWifATdpoAEEaqEBBGuiAQRsowEEbaQBBG6mAQRvqAEQcKkBOHGsAQRyrgEQc68BOXSxAQR1sgEEdrMBEHe2ATp4twFAebgBB3q5AQd7ugEHfLsBB328AQd-vgEHf8ABEIABwQFBgQHDAQeCAcUBEIMBxgFChAHHAQeFAcgBB4YByQEQhwHMAUOIAc0BSYkBzwEMigHQAQyLAdIBDIwB0wEMjQHUAQyOAdYBDI8B2AEQkAHZAUqRAdsBDJIB3QEQkwHeAUuUAd8BDJUB4AEMlgHhARCXAeQBTJgB5QFSmQHnAQWaAegBBZsB6gEFnAHrAQWdAewBBZ4B7gEFnwHwARCgAfEBU6EB8wEFogH1ARCjAfYBVKQB9wEFpQH4AQWmAfkBEKcB_AFVqAH9AVupAf4BDaoB_wENqwGAAg2sAYECDa0BggINrgGEAg2vAYYCELABhwJcsQGJAg2yAYsCELMBjAJdtAGNAg21AY4CDbYBjwIQtwGSAl64AZMCZLkBlQIJugGWAgm7AZkCCbwBmgIJvQGbAgm-AZ0CCb8BnwIQwAGgAmXBAaICCcIBpAIQwwGlAmbEAaYCCcUBpwIJxgGoAhDHAasCZ8gBrAJryQGtAgjKAa4CCMsBrwIIzAGwAgjNAbECCM4BswIIzwG1AhDQAbYCbNEBuAII0gG6AhDTAbsCbdQBvAII1QG9AgjWAb4CENcBwQJu2AHCAnQ"
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
  BannerScalarFieldEnum: () => BannerScalarFieldEnum,
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
  Banner: "Banner",
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
var BannerScalarFieldEnum = {
  id: "id",
  title: "title",
  subtitle: "subtitle",
  badge: "badge",
  image: "image",
  order: "order",
  banner: "banner",
  isActive: "isActive",
  categoryId: "categoryId",
  buttonText: "buttonText",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
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
  cancelReason: "cancelReason",
  extrainfo: "extrainfo",
  discountAmount: "discountAmount",
  couponId: "couponId",
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
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  orderId: "orderId"
};
var CouponScalarFieldEnum = {
  id: "id",
  code: "code",
  discountType: "discountType",
  discountValue: "discountValue",
  minOrderAmount: "minOrderAmount",
  maxDiscountAmount: "maxDiscountAmount",
  expiryDate: "expiryDate",
  usageLimit: "usageLimit",
  usedCount: "usedCount",
  isActive: "isActive",
  description: "description",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
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
  mainImage: "mainImage",
  semiTitle: "semiTitle",
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
import { oAuthProxy } from "better-auth/plugins";
var auth = betterAuth({
  appName: "Urban Snacks",
  baseURL: env.PROD_APP_ORIGIN || env.APP_ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 3
      // 3 days
    }
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
  trustedOrigins: [
    env.APP_ORIGIN,
    env.PROD_APP_ORIGIN
  ].filter(Boolean),
  advanced: {
    disableCSRFCheck: true,
    cookiePrefix: "urban_snacks",
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax"
        }
      }
    }
  },
  plugins: [oAuthProxy()]
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
  }).search().filter().sort().paginate().include({ _count: true }).omit({ isDeleted: true, deletedAt: true }).where({ isDeleted: false });
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

// src/modules/coupon/coupon.constant.ts
var couponSearchableFields = ["code"];
var couponFilterableFields = ["isActive", "discountType"];

// src/modules/coupon/coupon.service.ts
var createCoupon = async (payload) => {
  const result = await prisma.coupon.create({
    data: payload
  });
  return result;
};
var getCoupons = async (queries) => {
  const queryBuilder = new QueryBuilder(prisma.coupon, queries, {
    searchableFields: couponSearchableFields,
    filterableFields: couponFilterableFields
  }).search().filter().sort().paginate().where({ isDeleted: false });
  const result = await queryBuilder.execute();
  return result;
};
var getCouponById = async (id) => {
  const result = await prisma.coupon.findUnique({
    where: { id, isDeleted: false }
  });
  if (!result) {
    throw new Error("Coupon not found!");
  }
  return result;
};
var updateCoupon = async (id, payload) => {
  await getCouponById(id);
  const result = await prisma.coupon.update({
    where: { id },
    data: payload
  });
  return result;
};
var deleteCoupon = async (id) => {
  await getCouponById(id);
  const result = await prisma.coupon.update({
    where: { id },
    data: { isDeleted: true, deletedAt: /* @__PURE__ */ new Date() }
  });
  return result;
};
var verifyCoupon = async (code, amount) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code, isDeleted: false, isActive: true }
  });
  if (!coupon) {
    throw new Error("Invalid or inactive coupon code!");
  }
  if (new Date(coupon.expiryDate) < /* @__PURE__ */ new Date()) {
    throw new Error("Coupon has expired!");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached!");
  }
  if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
    throw new Error(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
  }
  let discountAmount = 0;
  if (coupon.discountType === "FIXED") {
    discountAmount = coupon.discountValue;
  } else if (coupon.discountType === "PERCENTAGE") {
    discountAmount = amount * coupon.discountValue / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  }
  discountAmount = Math.min(discountAmount, amount);
  return {
    coupon,
    discountAmount
  };
};
var couponServices = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  verifyCoupon
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
            mainImage: true,
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
              mainImage: true,
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
            mainImage: true,
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
    paymentStatus,
    additionalInfo,
    extrainfo,
    couponCode,
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
    const subTotalAmount = items.reduce((sum, item) => sum + item.subTotal, 0);
    let finalTotalAmount = subTotalAmount;
    let appliedDiscountAmount = 0;
    let couponId = null;
    if (couponCode) {
      const couponResult = await couponServices.verifyCoupon(couponCode, subTotalAmount);
      appliedDiscountAmount = couponResult.discountAmount;
      finalTotalAmount = subTotalAmount - appliedDiscountAmount;
      couponId = couponResult.coupon.id;
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } }
      });
    }
    const newOrder = await tx.order.create({
      data: {
        userId,
        orderNumber,
        totalAmount: finalTotalAmount,
        discountAmount: appliedDiscountAmount,
        couponId,
        shippingName,
        shippingPhone,
        shippingEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        paymentMethod,
        paymentStatus: paymentStatus || "UNPAID",
        ...additionalInfo && { additionalInfo },
        ...extrainfo && { extrainfo }
      },
      select: { id: true }
    });
    await tx.orderItem.createMany({
      data: items.map((item) => ({ ...item, orderId: newOrder.id }))
    });
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: finalTotalAmount,
        status: paymentStatus || "UNPAID",
        ...paymentStatus === "PAID" && { transactionId: `MANUAL-${orderNumber}-${Date.now()}` }
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
var cancelOrder = async (userId, role, orderId, cancelReason) => {
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
    if (role !== UserRole.ADMIN && order.userId !== userId) {
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
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelReason: cancelReason ?? null }
    });
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
    await tx.payment.updateMany({
      where: { orderId, isDeleted: false },
      data: { isDeleted: true, deletedAt: /* @__PURE__ */ new Date() }
    });
    return { id: orderId, success: true };
  });
  return result;
};
var updatePaymentMethod = async (orderId, userId, paymentMethod) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId }
    });
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }
    if (order.userId !== userId) {
      throw new Error("You are not authorized to update this order!");
    }
    if (order.paymentStatus === "PAID") {
      throw new Error("Order is already paid and cannot be updated.");
    }
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { paymentMethod }
    });
    return updatedOrder;
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
  deleteOrder,
  updatePaymentMethod
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
  const { cancelReason } = req.body;
  const userId = req.user.id;
  const role = req.user.role;
  const result = await orderServices.cancelOrder(userId, role, orderId, cancelReason);
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
var updatePaymentMethod2 = async_handler_default(async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod } = req.body;
  const userId = req.user.id;
  const result = await orderServices.updatePaymentMethod(orderId, userId, paymentMethod);
  res.status(200).json({
    success: true,
    message: "Payment method updated successfully",
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
  deleteOrder: deleteOrder2,
  updatePaymentMethod: updatePaymentMethod2
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
router2.patch(
  "/update-payment-method/:orderId",
  auth_default(UserRole.USER, UserRole.ADMIN),
  orderControllers.updatePaymentMethod
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
var itemSearchableFields = ["name", "semiTitle", "description", "category.name"];
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
  }).omit({ isDeleted: true, deletedAt: true }).where({ isDeleted: false });
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
var reviewFilterableFields = ["customerId", "rating", "isActive", "itemId"];
var reviewIncludeConfig = {
  customer: true,
  order: true
};

// src/modules/review/review.service.ts
var getReviews = async (queries, isAdmin = false) => {
  const { itemId, ...remainingQueries } = queries;
  const queryBuilder = new QueryBuilder(prisma.review, remainingQueries, {
    searchableFields: reviewSearchableFields,
    filterableFields: reviewFilterableFields
  }).search().filter().sort().paginate().include({
    ...reviewIncludeConfig,
    order: {
      include: {
        orderItems: {
          include: {
            item: true
          }
        }
      }
    }
  }).where({
    isDeleted: false,
    ...itemId && {
      order: {
        orderItems: {
          some: {
            itemId
          }
        }
      }
    }
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

// src/constants/currency.constant.ts
var USD_TO_BDT_RATE = 120;

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
  const sessionConfig = {
    payment_method_types: ["card"],
    mode: "payment",
    line_items: order.orderItems.map((orderItem) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: orderItem.item.name,
          images: orderItem.item.image ? [orderItem.item.image] : []
        },
        unit_amount: Math.round(orderItem.unitPrice / USD_TO_BDT_RATE * 100)
      },
      quantity: orderItem.quantity
    })),
    success_url: `${env.APP_ORIGIN}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${env.APP_ORIGIN}/payment/cancel?order_id=${orderId}`,
    client_reference_id: orderId,
    customer_email: order.shippingEmail,
    metadata: {
      orderId: order.id
    }
  };
  if (order.discountAmount && order.discountAmount > 0) {
    const stripeCoupon = await stripe.coupons.create({
      amount_off: Math.round(order.discountAmount / USD_TO_BDT_RATE * 100),
      currency: "usd",
      duration: "once",
      name: "Order Discount"
    });
    sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
  }
  const session = await stripe.checkout.sessions.create(sessionConfig);
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

// src/modules/banner/banner.route.ts
import { Router } from "express";

// src/modules/banner/banner.constant.ts
var bannerSearchableFields = ["title", "subtitle", "badge"];
var bannerFilterableFields = ["isActive", "banner", "categoryId"];

// src/modules/banner/banner.service.ts
var createBanner = async (payload) => {
  const result = await prisma.banner.create({
    data: payload
  });
  return result;
};
var getBanners = async (queries) => {
  const queryBuilder = new QueryBuilder(prisma.banner, queries, {
    searchableFields: bannerSearchableFields,
    filterableFields: bannerFilterableFields
  }).search().filter().sort().paginate().where({ isDeleted: false });
  const result = await queryBuilder.execute();
  return result;
};
var getBannerById = async (id) => {
  const result = await prisma.banner.findUnique({
    where: { id, isDeleted: false }
  });
  if (!result) {
    throw new Error("Banner not found!");
  }
  return result;
};
var updateBanner = async (id, payload) => {
  await getBannerById(id);
  const result = await prisma.banner.update({
    where: { id },
    data: payload
  });
  return result;
};
var deleteBanner = async (id) => {
  await getBannerById(id);
  const result = await prisma.banner.update({
    where: { id },
    data: { isDeleted: true, deletedAt: /* @__PURE__ */ new Date() }
  });
  return result;
};
var bannerServices = {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner
};

// src/modules/banner/banner.controller.ts
var createBanner2 = async_handler_default(async (req, res) => {
  const result = await bannerServices.createBanner(req.body);
  res.status(201).json({
    success: true,
    message: "Banner created successfully",
    data: result
  });
});
var getBanners2 = async_handler_default(async (req, res) => {
  const result = await bannerServices.getBanners(req.query);
  res.status(200).json({
    success: true,
    message: "Banners retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});
var getBannerById2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await bannerServices.getBannerById(id);
  res.status(200).json({
    success: true,
    message: "Banner retrieved successfully",
    data: result
  });
});
var updateBanner2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await bannerServices.updateBanner(id, req.body);
  res.status(200).json({
    success: true,
    message: "Banner updated successfully",
    data: result
  });
});
var deleteBanner2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await bannerServices.deleteBanner(id);
  res.status(200).json({
    success: true,
    message: "Banner deleted successfully",
    data: result
  });
});
var bannerControllers = {
  createBanner: createBanner2,
  getBanners: getBanners2,
  getBannerById: getBannerById2,
  updateBanner: updateBanner2,
  deleteBanner: deleteBanner2
};

// src/modules/banner/banner.route.ts
var router8 = Router();
router8.get("/", bannerControllers.getBanners);
router8.post(
  "/",
  auth_default(UserRole.ADMIN),
  bannerControllers.createBanner
);
router8.get(
  "/:id",
  auth_default(UserRole.ADMIN),
  bannerControllers.getBannerById
);
router8.patch(
  "/:id",
  auth_default(UserRole.ADMIN),
  bannerControllers.updateBanner
);
router8.delete(
  "/:id",
  auth_default(UserRole.ADMIN),
  bannerControllers.deleteBanner
);
var bannerRouter = router8;

// src/modules/coupon/coupon.route.ts
import { Router as Router2 } from "express";

// src/modules/coupon/coupon.controller.ts
var createCoupon2 = async_handler_default(async (req, res) => {
  const result = await couponServices.createCoupon(req.body);
  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    data: result
  });
});
var getCoupons2 = async_handler_default(async (req, res) => {
  const result = await couponServices.getCoupons(req.query);
  res.status(200).json({
    success: true,
    message: "Coupons retrieved successfully",
    meta: result.meta,
    data: result.data
  });
});
var getCouponById2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await couponServices.getCouponById(id);
  res.status(200).json({
    success: true,
    message: "Coupon retrieved successfully",
    data: result
  });
});
var updateCoupon2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await couponServices.updateCoupon(id, req.body);
  res.status(200).json({
    success: true,
    message: "Coupon updated successfully",
    data: result
  });
});
var deleteCoupon2 = async_handler_default(async (req, res) => {
  const { id } = req.params;
  const result = await couponServices.deleteCoupon(id);
  res.status(200).json({
    success: true,
    message: "Coupon deleted successfully",
    data: result
  });
});
var verifyCoupon2 = async_handler_default(async (req, res) => {
  const { code } = req.params;
  const { amount } = req.query;
  if (!amount) {
    return res.status(400).json({
      success: false,
      message: "Order amount is required for verification!"
    });
  }
  const result = await couponServices.verifyCoupon(code, Number(amount));
  res.status(200).json({
    success: true,
    message: "Coupon is valid",
    data: result
  });
});
var couponControllers = {
  createCoupon: createCoupon2,
  getCoupons: getCoupons2,
  getCouponById: getCouponById2,
  updateCoupon: updateCoupon2,
  deleteCoupon: deleteCoupon2,
  verifyCoupon: verifyCoupon2
};

// src/modules/coupon/coupon.route.ts
var router9 = Router2();
router9.get(
  "/verify/:code",
  auth_default(UserRole.USER, UserRole.ADMIN),
  couponControllers.verifyCoupon
);
router9.post(
  "/",
  auth_default(UserRole.ADMIN),
  // validateRequest(couponValidations.createCouponSchema), // Uncomment if validateRequest middleware exists
  couponControllers.createCoupon
);
router9.get(
  "/",
  auth_default(UserRole.ADMIN),
  couponControllers.getCoupons
);
router9.get(
  "/:id",
  auth_default(UserRole.ADMIN),
  couponControllers.getCouponById
);
router9.patch(
  "/:id",
  auth_default(UserRole.ADMIN),
  // validateRequest(couponValidations.updateCouponSchema), // Uncomment if validateRequest middleware exists
  couponControllers.updateCoupon
);
router9.delete(
  "/:id",
  auth_default(UserRole.ADMIN),
  couponControllers.deleteCoupon
);
var couponRouter = router9;

// src/app.ts
import cookieParser from "cookie-parser";
var app = express8();
app.set("trust proxy", 1);
app.use(logger_default);
app.post(
  "/webhook",
  express8.raw({ type: "application/json" }),
  paymentControllers.webhook
);
app.use(
  cors({
    origin: [env.APP_ORIGIN, env.PROD_APP_ORIGIN].filter(Boolean),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
    credentials: true
  })
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express8.urlencoded({ extended: true }));
app.use(express8.json());
app.use(cookieParser());
app.use(express8.urlencoded({ extended: true }));
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/items", itemRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/banners", bannerRouter);
app.use("/api/v1/coupons", couponRouter);
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
//! Trust proxy for secure cookies on Vercel
