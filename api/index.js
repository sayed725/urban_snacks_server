var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express7 from "express";

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
  STRIPE_WEBHOOK_SECRET: z.string()
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

// generated/prisma/enums.ts
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

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.6.0",
  "engineVersion": "75cbdc1eb7150937890ad5465d861175c6624711",
  "activeProvider": "postgresql",
  "inlineSchema": 'enum UserRole {\n  USER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  INACTIVE\n  BANNED\n}\n\nmodel User {\n  id            String     @id\n  name          String\n  email         String\n  emailVerified Boolean    @default(false)\n  phone         String?\n  image         String?\n  createdAt     DateTime   @default(now())\n  updatedAt     DateTime   @updatedAt\n  // additional fields\n  role          UserRole   @default(USER)\n  status        UserStatus @default(ACTIVE)\n  isDeleted     Boolean    @default(false)\n  // relations\n  sessions      Session[]\n  accounts      Account[]\n  orders        Order[]\n  reviews       Review[]\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nenum OrderStatus {\n  PLACED\n  CANCELLED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n}\n\nenum PaymentStatus {\n  PAID\n  UNPAID\n}\n\nmodel Order {\n  id                 String        @id @default(uuid())\n  orderNumber        String\n  status             OrderStatus   @default(PLACED)\n  totalAmount        Float\n  shippingName       String\n  shippingPhone      String\n  shippingEmail      String\n  shippingAddress    String\n  shippingCity       String\n  shippingPostalCode String\n  paymentStatus      PaymentStatus @default(UNPAID)\n  paymentMethod      String // e.g. "STRIPE" or "COD"\n  additionalInfo     String?\n  isDeleted          Boolean       @default(false)\n  deletedAt          DateTime?\n  createdAt          DateTime      @default(now())\n  updatedAt          DateTime      @updatedAt\n\n  // Relationships\n  userId     String\n  user       User        @relation(fields: [userId], references: [id])\n  orderItems OrderItem[]\n  payment    Payment?\n  reviews    Review[]\n\n  @@map("orders")\n}\n\nmodel OrderItem {\n  id        String @id @default(uuid())\n  quantity  Int\n  unitPrice Float\n  subTotal  Float\n\n  // Relationships\n  orderId String\n  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)\n  itemId  String\n  item    Item   @relation(fields: [itemId], references: [id])\n\n  @@map("order_items")\n}\n\nmodel Payment {\n  id                 String        @id @default(uuid())\n  amount             Float\n  transactionId      String        @unique\n  stripeEventId      String?       @unique\n  status             PaymentStatus @default(UNPAID)\n  invoiceUrl         String?\n  paymentGatewayData Json?\n  createdAt          DateTime      @default(now())\n  updatedAt          DateTime      @updatedAt\n\n  // Relationships\n  orderId String @unique\n  order   Order  @relation(fields: [orderId], references: [id])\n\n  @@map("payments")\n}\n\nmodel Coupon {\n  id             String   @id @default(uuid())\n  code           String   @unique\n  discountAmount Float\n  isActive       Boolean  @default(true)\n  expiryDate     DateTime\n  createdAt      DateTime @default(now())\n\n  @@map("coupons")\n}\n\nmodel Review {\n  id        String   @id @default(uuid())\n  rating    Float // e.g., 1 to 5\n  comment   String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  orderId String\n  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)\n\n  itemId String\n  item   Item   @relation(fields: [itemId], references: [id], onDelete: Cascade)\n\n  customerId String\n  customer   User   @relation(fields: [customerId], references: [id])\n\n  // Prevents a user from reviewing the same item multiple times for the same order\n  @@unique([orderId, itemId, customerId])\n  @@map("reviews")\n}\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Category {\n  id          String    @id @default(uuid())\n  name        String    @unique\n  subName     String?\n  image       String?\n  isFeatured  Boolean   @default(false)\n  description String?\n  isActive    Boolean   @default(true)\n  isDeleted   Boolean   @default(false)\n  deletedAt   DateTime?\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n\n  // Relationships\n  items Item[]\n\n  @@map("categories")\n}\n\nmodel Item {\n  id            String    @id @default(uuid())\n  name          String\n  isFeatured    Boolean   @default(false)\n  unit          String?\n  packSize      Int?\n  isSpicy       Boolean?\n  weight        String\n  price         Float\n  stockQuantity Int?\n  expiryDate    DateTime?\n  isActive      Boolean   @default(true)\n  isDeleted     Boolean   @default(false)\n  deletedAt     DateTime?\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n  image         String?\n  description   String?\n\n  // Relationships\n  categoryId String\n  category   Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)\n  orderItems OrderItem[]\n  reviews    Review[]\n\n  @@map("items")\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"phone","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderNumber","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"totalAmount","kind":"scalar","type":"Float"},{"name":"shippingName","kind":"scalar","type":"String"},{"name":"shippingPhone","kind":"scalar","type":"String"},{"name":"shippingEmail","kind":"scalar","type":"String"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"shippingCity","kind":"scalar","type":"String"},{"name":"shippingPostalCode","kind":"scalar","type":"String"},{"name":"paymentStatus","kind":"enum","type":"PaymentStatus"},{"name":"paymentMethod","kind":"scalar","type":"String"},{"name":"additionalInfo","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"payment","kind":"object","type":"Payment","relationName":"OrderToPayment"},{"name":"reviews","kind":"object","type":"Review","relationName":"OrderToReview"}],"dbName":"orders"},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Float"},{"name":"subTotal","kind":"scalar","type":"Float"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"itemId","kind":"scalar","type":"String"},{"name":"item","kind":"object","type":"Item","relationName":"ItemToOrderItem"}],"dbName":"order_items"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"stripeEventId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"invoiceUrl","kind":"scalar","type":"String"},{"name":"paymentGatewayData","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToPayment"}],"dbName":"payments"},"Coupon":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"code","kind":"scalar","type":"String"},{"name":"discountAmount","kind":"scalar","type":"Float"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"coupons"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Float"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReview"},{"name":"itemId","kind":"scalar","type":"String"},{"name":"item","kind":"object","type":"Item","relationName":"ItemToReview"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"ReviewToUser"}],"dbName":"reviews"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"subName","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"description","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"items","kind":"object","type":"Item","relationName":"CategoryToItem"}],"dbName":"categories"},"Item":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"unit","kind":"scalar","type":"String"},{"name":"packSize","kind":"scalar","type":"Int"},{"name":"isSpicy","kind":"scalar","type":"Boolean"},{"name":"weight","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"stockQuantity","kind":"scalar","type":"Int"},{"name":"expiryDate","kind":"scalar","type":"DateTime"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"image","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToItem"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"ItemToOrderItem"},{"name":"reviews","kind":"object","type":"Review","relationName":"ItemToReview"}],"dbName":"items"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","order","items","_count","category","orderItems","item","customer","reviews","payment","orders","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","_avg","_sum","Order.groupBy","Order.aggregate","OrderItem.findUnique","OrderItem.findUniqueOrThrow","OrderItem.findFirst","OrderItem.findFirstOrThrow","OrderItem.findMany","OrderItem.createOne","OrderItem.createMany","OrderItem.createManyAndReturn","OrderItem.updateOne","OrderItem.updateMany","OrderItem.updateManyAndReturn","OrderItem.upsertOne","OrderItem.deleteOne","OrderItem.deleteMany","OrderItem.groupBy","OrderItem.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","Coupon.findUnique","Coupon.findUniqueOrThrow","Coupon.findFirst","Coupon.findFirstOrThrow","Coupon.findMany","Coupon.createOne","Coupon.createMany","Coupon.createManyAndReturn","Coupon.updateOne","Coupon.updateMany","Coupon.updateManyAndReturn","Coupon.upsertOne","Coupon.deleteOne","Coupon.deleteMany","Coupon.groupBy","Coupon.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","Category.upsertOne","Category.deleteOne","Category.deleteMany","Category.groupBy","Category.aggregate","Item.findUnique","Item.findUniqueOrThrow","Item.findFirst","Item.findFirstOrThrow","Item.findMany","Item.createOne","Item.createMany","Item.createManyAndReturn","Item.updateOne","Item.updateMany","Item.updateManyAndReturn","Item.upsertOne","Item.deleteOne","Item.deleteMany","Item.groupBy","Item.aggregate","AND","OR","NOT","id","name","isFeatured","unit","packSize","isSpicy","weight","price","stockQuantity","expiryDate","isActive","isDeleted","deletedAt","createdAt","updatedAt","image","description","categoryId","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","subName","every","some","none","rating","comment","orderId","itemId","customerId","code","discountAmount","amount","transactionId","stripeEventId","PaymentStatus","status","invoiceUrl","paymentGatewayData","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","quantity","unitPrice","subTotal","orderNumber","OrderStatus","totalAmount","shippingName","shippingPhone","shippingEmail","shippingAddress","shippingCity","shippingPostalCode","paymentStatus","paymentMethod","additionalInfo","userId","identifier","value","expiresAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","email","emailVerified","phone","UserRole","role","UserStatus","orderId_itemId_customerId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "kQVpsAESBAAA7QIAIAUAAO4CACANAADwAgAgDwAA7wIAIMgBAADqAgAwyQEAACoAEMoBAADqAgAwywEBAAAAAcwBAQDEAgAh1gEgAMYCACHYAUAAyAIAIdkBQADIAgAh2gEBAMUCACH3AQAA7AKlAiKfAgEAAAABoAIgAMYCACGhAgEAxQIAIaMCAADrAqMCIgEAAAABACAMAwAA9AIAIMgBAACAAwAwyQEAAAMAEMoBAACAAwAwywEBAMQCACHYAUAAyAIAIdkBQADIAgAhjwIBAMQCACGSAkAAyAIAIZwCAQDEAgAhnQIBAMUCACGeAgEAxQIAIQMDAADTBAAgnQIAAIEDACCeAgAAgQMAIAwDAAD0AgAgyAEAAIADADDJAQAAAwAQygEAAIADADDLAQEAAAAB2AFAAMgCACHZAUAAyAIAIY8CAQDEAgAhkgJAAMgCACGcAgEAAAABnQIBAMUCACGeAgEAxQIAIQMAAAADACABAAAEADACAAAFACARAwAA9AIAIMgBAAD_AgAwyQEAAAcAEMoBAAD_AgAwywEBAMQCACHYAUAAyAIAIdkBQADIAgAhjwIBAMQCACGTAgEAxAIAIZQCAQDEAgAhlQIBAMUCACGWAgEAxQIAIZcCAQDFAgAhmAJAAMcCACGZAkAAxwIAIZoCAQDFAgAhmwIBAMUCACEIAwAA0wQAIJUCAACBAwAglgIAAIEDACCXAgAAgQMAIJgCAACBAwAgmQIAAIEDACCaAgAAgQMAIJsCAACBAwAgEQMAAPQCACDIAQAA_wIAMMkBAAAHABDKAQAA_wIAMMsBAQAAAAHYAUAAyAIAIdkBQADIAgAhjwIBAMQCACGTAgEAxAIAIZQCAQDEAgAhlQIBAMUCACGWAgEAxQIAIZcCAQDFAgAhmAJAAMcCACGZAkAAxwIAIZoCAQDFAgAhmwIBAMUCACEDAAAABwAgAQAACAAwAgAACQAgGQMAAPQCACAKAAD5AgAgDQAA8AIAIA4AAP4CACDIAQAA_AIAMMkBAAALABDKAQAA_AIAMMsBAQDEAgAh1gEgAMYCACHXAUAAxwIAIdgBQADIAgAh2QFAAMgCACH3AQAA_QKFAiKDAgEAxAIAIYUCCADNAgAhhgIBAMQCACGHAgEAxAIAIYgCAQDEAgAhiQIBAMQCACGKAgEAxAIAIYsCAQDEAgAhjAIAANUC9wEijQIBAMQCACGOAgEAxQIAIY8CAQDEAgAhBgMAANMEACAKAADVBAAgDQAA0QQAIA4AANYEACDXAQAAgQMAII4CAACBAwAgGQMAAPQCACAKAAD5AgAgDQAA8AIAIA4AAP4CACDIAQAA_AIAMMkBAAALABDKAQAA_AIAMMsBAQAAAAHWASAAxgIAIdcBQADHAgAh2AFAAMgCACHZAUAAyAIAIfcBAAD9AoUCIoMCAQDEAgAhhQIIAM0CACGGAgEAxAIAIYcCAQDEAgAhiAIBAMQCACGJAgEAxAIAIYoCAQDEAgAhiwIBAMQCACGMAgAA1QL3ASKNAgEAxAIAIY4CAQDFAgAhjwIBAMQCACEDAAAACwAgAQAADAAwAgAADQAgCwYAANcCACALAADzAgAgyAEAAPoCADDJAQAADwAQygEAAPoCADDLAQEAxAIAIe4BAQDEAgAh7wEBAMQCACGAAgIA-wIAIYECCADNAgAhggIIAM0CACECBgAA2gMAIAsAANIEACALBgAA1wIAIAsAAPMCACDIAQAA-gIAMMkBAAAPABDKAQAA-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_cBIo0CAQCHAwAhjgIBAIkDACGPAgEAhwMAIQIAAAALACAVAACRAQAgAgAAAAsAIBUAAJEBACADAAAADQAgHAAAigEAIB0AAI8BACABAAAADQAgAQAAAAsAIAcIAADiAwAgIgAA5QMAICMAAOQDACBkAADjAwAgZQAA5gMAINcBAACBAwAgjgIAAIEDACAVyAEAANsCADDJAQAAmAEAEMoBAADbAgAwywEBAKgCACHWASAAqQIAIdcBQACuAgAh2AFAAK8CACHZAUAArwIAIfcBAADcAoUCIoMCAQCoAgAhhQIIAK0CACGGAgEAqAIAIYcCAQCoAgAhiAIBAKgCACGJAgEAqAIAIYoCAQCoAgAhiwIBAKgCACGMAgAAzwL3ASKNAgEAqAIAIY4CAQCqAgAhjwIBAKgCACEDAAAACwAgAQAAlwEAMCEAAJgBACADAAAACwAgAQAADAAwAgAADQAgAQAAABEAIAEAAAARACADAAAADwAgAQAAEAAwAgAAEQAgAwAAAA8AIAEAABAAMAIAABEAIAMAAAAPACABAAAQADACAAARACAIBgAAsAMAIAsAAOEDACDLAQEAAAAB7gEBAAAAAe8BAQAAAAGAAgIAAAABgQIIAAAAAYICCAAAAAEBFQAAoAEAIAbLAQEAAAAB7gEBAAAAAe8BAQAAAAGAAgIAAAABgQIIAAAAAYICCAAAAAEBFQAAogEAMAEVAACiAQAwCAYAAK4DACALAADgAwAgywEBAIcDACHuAQEAhwMAIe8BAQCHAwAhgAICAKwDACGBAggAjAMAIYICCACMAwAhAgAAABEAIBUAAKUBACAGywEBAIcDACHuAQEAhwMAIe8BAQCHAwAhgAICAKwDACGBAggAjAMAIYICCACMAwAhAgAAAA8AIBUAAKcBACACAAAADwAgFQAApwEAIAMAAAARACAcAACgAQAgHQAApQEAIAEAAAARACABAAAADwAgBQgAANsDACAiAADeAwAgIwAA3QMAIGQAANwDACBlAADfAwAgCcgBAADYAgAwyQEAAK4BABDKAQAA2AIAMMsBAQCoAgAh7gEBAKgCACHvAQEAqAIAIYACAgDZAgAhgQIIAK0CACGCAggArQIAIQMAAAAPACABAACtAQAwIQAArgEAIAMAAAAPACABAAAQADACAAARACAOBgAA1wIAIMgBAADUAgAwyQEAAB8AEMoBAADUAgAwywEBAAAAAdgBQADIAgAh2QFAAMgCACHuAQEAAAAB8wEIAM0CACH0AQEAAAAB9QEBAAAAAfcBAADVAvcBIvgBAQDFAgAh-QEAANYCACABAAAAsQEAIAEAAACxAQAgBAYAANoDACD1AQAAgQMAIPgBAACBAwAg-QEAAIEDACADAAAAHwAgAQAAtAEAMAIAALEBACADAAAAHwAgAQAAtAEAMAIAALEBACADAAAAHwAgAQAAtAEAMAIAALEBACALBgAA2QMAIMsBAQAAAAHYAUAAAAAB2QFAAAAAAe4BAQAAAAHzAQgAAAAB9AEBAAAAAfUBAQAAAAH3AQAAAPcBAvgBAQAAAAH5AYAAAAABARUAALgBACAKywEBAAAAAdgBQAAAAAHZAUAAAAAB7gEBAAAAAfMBCAAAAAH0AQEAAAAB9QEBAAAAAfcBAAAA9wEC-AEBAAAAAfkBgAAAAAEBFQAAugEAMAEVAAC6AQAwCwYAANgDACDLAQEAhwMAIdgBQACOAwAh2QFAAI4DACHuAQEAhwMAIfMBCACMAwAh9AEBAIcDACH1AQEAiQMAIfcBAADXA_cBIvgBAQCJAwAh-QGAAAAAAQIAAACxAQAgFQAAvQEAIArLAQEAhwMAIdgBQACOAwAh2QFAAI4DACHuAQEAhwMAIfMBCACMAwAh9AEBAIcDACH1AQEAiQMAIfcBAADXA_cBIvgBAQCJAwAh-QGAAAAAAQIAAAAfACAVAAC_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-AEAIA8HAADJAgAgyAEAAMMCADDJAQAA-wEAEMoBAADDAgAwywEBAMQCACHMAQEAxAIAIc0BIADGAgAh1QEgAMYCACHWASAAxgIAIdcBQADHAgAh2AFAAMgCACHZAUAAyAIAIdoBAQDFAgAh2wEBAMUCACHoAQEAxQIAIQUHAADFAwAg1wEAAIEDACDaAQAAgQMAINsBAACBAwAg6AEAAIEDACADAAAA-wEAIAEAAPwBADACAAD4AQAgAwAAAPsBACABAAD8AQAwAgAA-AEAIAMAAAD7AQAgAQAA_AEAMAIAAPgBACAMBwAAxAMAIMsBAQAAAAHMAQEAAAABzQEgAAAAAdUBIAAAAAHWASAAAAAB1wFAAAAAAdgBQAAAAAHZAUAAAAAB2gEBAAAAAdsBAQAAAAHoAQEAAAABARUAAIACACALywEBAAAAAcwBAQAAAAHNASAAAAAB1QEgAAAAAdYBIAAAAAHXAUAAAAAB2AFAAAAAAdkBQAAAAAHaAQEAAAAB2wEBAAAAAegBAQAAAAEBFQAAggIAMAEVAACCAgAwDAcAALcDACDLAQEAhwMAIcwBAQCHAwAhzQEgAIgDACHVASAAiAMAIdYBIACIAwAh1wFAAI0DACHYAUAAjgMAIdkBQACOAwAh2gEBAIkDACHbAQEAiQMAIegBAQCJAwAhAgAAAPgBACAVAACFAgAgC8sBAQCHAwAhzAEBAIcDACHNASAAiAMAIdUBIACIAwAh1gEgAIgDACHXAUAAjQMAIdgBQACOAwAh2QFAAI4DACHaAQEAiQMAIdsBAQCJAwAh6AEBAIkDACECAAAA-wEAIBUAAIcCACACAAAA-wEAIBUAAIcCACADAAAA-AEAIBwAAIACACAdAACFAgAgAQAAAPgBACABAAAA-wEAIAcIAAC0AwAgIgAAtgMAICMAALUDACDXAQAAgQMAINoBAACBAwAg2wEAAIEDACDoAQAAgQMAIA7IAQAAwgIAMMkBAACOAgAQygEAAMICADDLAQEAqAIAIcwBAQCoAgAhzQEgAKkCACHVASAAqQIAIdYBIACpAgAh1wFAAK4CACHYAUAArwIAIdkBQACvAgAh2gEBAKoCACHbAQEAqgIAIegBAQCqAgAhAwAAAPsBACABAACNAgAwIQAAjgIAIAMAAAD7AQAgAQAA_AEAMAIAAPgBACABAAAAFQAgAQAAABUAIAMAAAATACABAAAUADACAAAVACADAAAAEwAgAQAAFAAwAgAAFQAgAwAAABMAIAEAABQAMAIAABUAIBUJAACxAwAgCgAAsgMAIA0AALMDACDLAQEAAAABzAEBAAAAAc0BIAAAAAHOAQEAAAABzwECAAAAAdABIAAAAAHRAQEAAAAB0gEIAAAAAdMBAgAAAAHUAUAAAAAB1QEgAAAAAdYBIAAAAAHXAUAAAAAB2AFAAAAAAdkBQAAAAAHaAQEAAAAB2wEBAAAAAdwBAQAAAAEBFQAAlgIAIBLLAQEAAAABzAEBAAAAAc0BIAAAAAHOAQEAAAABzwECAAAAAdABIAAAAAHRAQEAAAAB0gEIAAAAAdMBAgAAAAHUAUAAAAAB1QEgAAAAAdYBIAAAAAHXAUAAAAAB2AFAAAAAAdkBQAAAAAHaAQEAAAAB2wEBAAAAAdwBAQAAAAEBFQAAmAIAMAEVAACYAgAwFQkAAI8DACAKAACQAwAgDQAAkQMAIMsBAQCHAwAhzAEBAIcDACHNASAAiAMAIc4BAQCJAwAhzwECAIoDACHQASAAiwMAIdEBAQCHAwAh0gEIAIwDACHTAQIAigMAIdQBQACNAwAh1QEgAIgDACHWASAAiAMAIdcBQACNAwAh2AFAAI4DACHZAUAAjgMAIdoBAQCJAwAh2wEBAIkDACHcAQEAhwMAIQIAAAAVACAVAACbAgAgEssBAQCHAwAhzAEBAIcDACHNASAAiAMAIc4BAQCJAwAhzwECAIoDACHQASAAiwMAIdEBAQCHAwAh0gEIAIwDACHTAQIAigMAIdQBQACNAwAh1QEgAIgDACHWASAAiAMAIdcBQACNAwAh2AFAAI4DACHZAUAAjgMAIdoBAQCJAwAh2wEBAIkDACHcAQEAhwMAIQIAAAATACAVAACdAgAgAgAAABMAIBUAAJ0CACADAAAAFQAgHAAAlgIAIB0AAJsCACABAAAAFQAgAQAAABMAIA0IAACCAwAgIgAAhQMAICMAAIQDACBkAACDAwAgZQAAhgMAIM4BAACBAwAgzwEAAIEDACDQAQAAgQMAINMBAACBAwAg1AEAAIEDACDXAQAAgQMAINoBAACBAwAg2wEAAIEDACAVyAEAAKcCADDJAQAApAIAEMoBAACnAgAwywEBAKgCACHMAQEAqAIAIc0BIACpAgAhzgEBAKoCACHPAQIAqwIAIdABIACsAgAh0QEBAKgCACHSAQgArQIAIdMBAgCrAgAh1AFAAK4CACHVASAAqQIAIdYBIACpAgAh1wFAAK4CACHYAUAArwIAIdkBQACvAgAh2gEBAKoCACHbAQEAqgIAIdwBAQCoAgAhAwAAABMAIAEAAKMCADAhAACkAgAgAwAAABMAIAEAABQAMAIAABUAIBXIAQAApwIAMMkBAACkAgAQygEAAKcCADDLAQEAqAIAIcwBAQCoAgAhzQEgAKkCACHOAQEAqgIAIc8BAgCrAgAh0AEgAKwCACHRAQEAqAIAIdIBCACtAgAh0wECAKsCACHUAUAArgIAIdUBIACpAgAh1gEgAKkCACHXAUAArgIAIdgBQACvAgAh2QFAAK8CACHaAQEAqgIAIdsBAQCqAgAh3AEBAKgCACEOCAAAsQIAICIAAMECACAjAADBAgAg3QEBAAAAAd4BAQAAAATfAQEAAAAE4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wEBAAAAAeQBAQDAAgAh5QEBAAAAAeYBAQAAAAHnAQEAAAABBQgAALECACAiAAC_AgAgIwAAvwIAIN0BIAAAAAHkASAAvgIAIQ4IAAC0AgAgIgAAvQIAICMAAL0CACDdAQEAAAAB3gEBAAAABd8BAQAAAAXgAQEAAAAB4QEBAAAAAeIBAQAAAAHjAQEAAAAB5AEBALwCACHlAQEAAAAB5gEBAAAAAecBAQAAAAENCAAAtAIAICIAALQCACAjAAC0AgAgZAAAuwIAIGUAALQCACDdAQIAAAAB3gECAAAABd8BAgAAAAXgAQIAAAAB4QECAAAAAeIBAgAAAAHjAQIAAAAB5AECALoCACEFCAAAtAIAICIAALkCACAjAAC5AgAg3QEgAAAAAeQBIAC4AgAhDQgAALECACAiAAC3AgAgIwAAtwIAIGQAALcCACBlAAC3AgAg3QEIAAAAAd4BCAAAAATfAQgAAAAE4AEIAAAAAeEBCAAAAAHiAQgAAAAB4wEIAAAAAeQBCAC2AgAhCwgAALQCACAiAAC1AgAgIwAAtQIAIN0BQAAAAAHeAUAAAAAF3wFAAAAABeABQAAAAAHhAUAAAAAB4gFAAAAAAeMBQAAAAAHkAUAAswIAIQsIAACxAgAgIgAAsgIAICMAALICACDdAUAAAAAB3gFAAAAABN8BQAAAAATgAUAAAAAB4QFAAAAAAeIBQAAAAAHjAUAAAAAB5AFAALACACELCAAAsQIAICIAALICACAjAACyAgAg3QFAAAAAAd4BQAAAAATfAUAAAAAE4AFAAAAAAeEBQAAAAAHiAUAAAAAB4wFAAAAAAeQBQACwAgAhCN0BAgAAAAHeAQIAAAAE3wECAAAABOABAgAAAAHhAQIAAAAB4gECAAAAAeMBAgAAAAHkAQIAsQIAIQjdAUAAAAAB3gFAAAAABN8BQAAAAATgAUAAAAAB4QFAAAAAAeIBQAAAAAHjAUAAAAAB5AFAALICACELCAAAtAIAICIAALUCACAjAAC1AgAg3QFAAAAAAd4BQAAAAAXfAUAAAAAF4AFAAAAAAeEBQAAAAAHiAUAAAAAB4wFAAAAAAeQBQACzAgAhCN0BAgAAAAHeAQIAAAAF3wECAAAABeABAgAAAAHhAQIAAAAB4gECAAAAAeMBAgAAAAHkAQIAtAIAIQjdAUAAAAAB3gFAAAAABd8BQAAAAAXgAUAAAAAB4QFAAAAAAeIBQAAAAAHjAUAAAAAB5AFAALUCACENCAAAsQIAICIAALcCACAjAAC3AgAgZAAAtwIAIGUAALcCACDdAQgAAAAB3gEIAAAABN8BCAAAAATgAQgAAAAB4QEIAAAAAeIBCAAAAAHjAQgAAAAB5AEIALYCACEI3QEIAAAAAd4BCAAAAATfAQgAAAAE4AEIAAAAAeEBCAAAAAHiAQgAAAAB4wEIAAAAAeQBCAC3AgAhBQgAALQCACAiAAC5AgAgIwAAuQIAIN0BIAAAAAHkASAAuAIAIQLdASAAAAAB5AEgALkCACENCAAAtAIAICIAALQCACAjAAC0AgAgZAAAuwIAIGUAALQCACDdAQIAAAAB3gECAAAABd8BAgAAAAXgAQIAAAAB4QECAAAAAeIBAgAAAAHjAQIAAAAB5AECALoCACEI3QEIAAAAAd4BCAAAAAXfAQgAAAAF4AEIAAAAAeEBCAAAAAHiAQgAAAAB4wEIAAAAAeQBCAC7AgAhDggAALQCACAiAAC9AgAgIwAAvQIAIN0BAQAAAAHeAQEAAAAF3wEBAAAABeABAQAAAAHhAQEAAAAB4gEBAAAAAeMBAQAAAAHkAQEAvAIAIeUBAQAAAAHmAQEAAAAB5wEBAAAAAQvdAQEAAAAB3gEBAAAABd8BAQAAAAXgAQEAAAAB4QEBAAAAAeIBAQAAAAHjAQEAAAAB5AEBAL0CACHlAQEAAAAB5gEBAAAAAecBAQAAAAEFCAAAsQIAICIAAL8CACAjAAC_AgAg3QEgAAAAAeQBIAC-AgAhAt0BIAAAAAHkASAAvwIAIQ4IAACxAgAgIgAAwQIAICMAAMECACDdAQEAAAAB3gEBAAAABN8BAQAAAATgAQEAAAAB4QEBAAAAAeIBAQAAAAHjAQEAAAAB5AEBAMACACHlAQEAAAAB5gEBAAAAAecBAQAAAAEL3QEBAAAAAd4BAQAAAATfAQEAAAAE4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wEBAAAAAeQBAQDBAgAh5QEBAAAAAeYBAQAAAAHnAQEAAAABDsgBAADCAgAwyQEAAI4CABDKAQAAwgIAMMsBAQCoAgAhzAEBAKgCACHNASAAqQIAIdUBIACpAgAh1gEgAKkCACHXAUAArgIAIdgBQACvAgAh2QFAAK8CACHaAQEAqgIAIdsBAQCqAgAh6AEBAKoCACEPBwAAyQIAIMgBAADDAgAwyQEAAPsBABDKAQAAwwIAMMsBAQDEAgAhzAEBAMQCACHNASAAxgIAIdUBIADGAgAh1gEgAMYCACHXAUAAxwIAIdgBQADIAgAh2QFAAMgCACHaAQEAxQIAIdsBAQDFAgAh6AEBAMUCACEL3QEBAAAAAd4BAQAAAATfAQEAAAAE4AEBAAAAAeEBAQAAAAHiAQEAAAAB4wEBAAAAAeQBAQDBAgAh5QEBAAAAAeYBAQAAAAHnAQEAAAABC90BAQAAAAHeAQEAAAAF3wEBAAAABeABAQAAAAHhAQEAAAAB4gEBAAAAAeMBAQAAAAHkAQEAvQIAIeUBAQAAAAHmAQEAAAAB5wEBAAAAAQLdASAAAAAB5AEgAL8CACEI3QFAAAAAAd4BQAAAAAXfAUAAAAAF4AFAAAAAAeEBQAAAAAHiAUAAAAAB4wFAAAAAAeQBQAC1AgAhCN0BQAAAAAHeAUAAAAAE3wFAAAAABOABQAAAAAHhAUAAAAAB4gFAAAAAAeMBQAAAAAHkAUAAsgIAIQPpAQAAEwAg6gEAABMAIOsBAAATACALyAEAAMoCADDJAQAA9QEAEMoBAADKAgAwywEBAKgCACHYAUAArwIAIdkBQACvAgAh7AEIAK0CACHtAQEAqAIAIe4BAQCoAgAh7wEBAKgCACHwAQEAqAIAIQnIAQAAywIAMMkBAADfAQAQygEAAMsCADDLAQEAqAIAIdQBQACvAgAh1QEgAKkCACHYAUAArwIAIfEBAQCoAgAh8gEIAK0CACEJyAEAAMwCADDJAQAAzAEAEMoBAADMAgAwywEBAMQCACHUAUAAyAIAIdUBIADGAgAh2AFAAMgCACHxAQEAxAIAIfIBCADNAgAhCN0BCAAAAAHeAQgAAAAE3wEIAAAABOABCAAAAAHhAQgAAAAB4gEIAAAAAeMBCAAAAAHkAQgAtwIAIQ3IAQAAzgIAMMkBAADGAQAQygEAAM4CADDLAQEAqAIAIdgBQACvAgAh2QFAAK8CACHuAQEAqAIAIfMBCACtAgAh9AEBAKgCACH1AQEAqgIAIfcBAADPAvcBIvgBAQCqAgAh-QEAANACACAHCAAAsQIAICIAANMCACAjAADTAgAg3QEAAAD3AQLeAQAAAPcBCN8BAAAA9wEI5AEAANIC9wEiDwgAALQCACAiAADRAgAgIwAA0QIAIN0BgAAAAAHgAYAAAAAB4QGAAAAAAeIBgAAAAAHjAYAAAAAB5AGAAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BgAAAAAH-AYAAAAAB_wGAAAAAAQzdAYAAAAAB4AGAAAAAAeEBgAAAAAHiAYAAAAAB4wGAAAAAAeQBgAAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AYAAAAAB_gGAAAAAAf8BgAAAAAEHCAAAsQIAICIAANMCACAjAADTAgAg3QEAAAD3AQLeAQAAAPcBCN8BAAAA9wEI5AEAANIC9wEiBN0BAAAA9wEC3gEAAAD3AQjfAQAAAPcBCOQBAADTAvcBIg4GAADXAgAgyAEAANQCADDJAQAAHwAQygEAANQCADDLAQEAxAIAIdgBQADIAgAh2QFAAMgCACHuAQEAxAIAIfMBCADNAgAh9AEBAMQCACH1AQEAxQIAIfcBAADVAvcBIvgBAQDFAgAh-QEAANYCACAE3QEAAAD3AQLeAQAAAPcBCN8BAAAA9wEI5AEAANMC9wEiDN0BgAAAAAHgAYAAAAAB4QGAAAAAAeIBgAAAAAHjAYAAAAAB5AGAAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BgAAAAAH-AYAAAAAB_wGAAAAAARsDAAD0AgAgCgAA-QIAIA0AAPACACAOAAD-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-gIAMMkBAAAPABDKAQAA-gIAMMsBAQDEAgAh7gEBAMQCACHvAQEAxAIAIYACAgD7AgAhgQIIAM0CACGCAggAzQIAIQjdAQIAAAAB3gECAAAABN8BAgAAAATgAQIAAAAB4QECAAAAAeIBAgAAAAHjAQIAAAAB5AECALECACEZAwAA9AIAIAoAAPkCACANAADwAgAgDgAA_gIAIMgBAAD8AgAwyQEAAAsAEMoBAAD8AgAwywEBAMQCACHWASAAxgIAIdcBQADHAgAh2AFAAMgCACHZAUAAyAIAIfcBAAD9AoUCIoMCAQDEAgAhhQIIAM0CACGGAgEAxAIAIYcCAQDEAgAhiAIBAMQCACGJAgEAxAIAIYoCAQDEAgAhiwIBAMQCACGMAgAA1QL3ASKNAgEAxAIAIY4CAQDFAgAhjwIBAMQCACEE3QEAAACFAgLeAQAAAIUCCN8BAAAAhQII5AEAAN4ChQIiEAYAANcCACDIAQAA1AIAMMkBAAAfABDKAQAA1AIAMMsBAQDEAgAh2AFAAMgCACHZAUAAyAIAIe4BAQDEAgAh8wEIAM0CACH0AQEAxAIAIfUBAQDFAgAh9wEAANUC9wEi-AEBAMUCACH5AQAA1gIAIKYCAAAfACCnAgAAHwAgEQMAAPQCACDIAQAA_wIAMMkBAAAHABDKAQAA_wIAMMsBAQDEAgAh2AFAAMgCACHZAUAAyAIAIY8CAQDEAgAhkwIBAMQCACGUAgEAxAIAIZUCAQDFAgAhlgIBAMUCACGXAgEAxQIAIZgCQADHAgAhmQJAAMcCACGaAgEAxQIAIZsCAQDFAgAhDAMAAPQCACDIAQAAgAMAMMkBAAADABDKAQAAgAMAMMsBAQDEAgAh2AFAAMgCACHZAUAAyAIAIY8CAQDEAgAhkgJAAMgCACGcAgEAxAIAIZ0CAQDFAgAhngIBAMUCACEAAAAAAAABqwIBAAAAAQGrAiAAAAABAasCAQAAAAEFqwICAAAAAbECAgAAAAGyAgIAAAABswICAAAAAbQCAgAAAAEBqwIgAAAAAQWrAggAAAABsQIIAAAAAbICCAAAAAGzAggAAAABtAIIAAAAAQGrAkAAAAABAasCQAAAAAEFHAAA_AQAIB0AAJAFACCoAgAA_QQAIKkCAACPBQAgrgIAAPgBACALHAAAogMAMB0AAKcDADCoAgAAowMAMKkCAACkAwAwqgIAAKUDACCrAgAApgMAMKwCAACmAwAwrQIAAKYDADCuAgAApgMAMK8CAACoAwAwsAIAAKkDADALHAAAkgMAMB0AAJcDADCoAgAAkwMAMKkCAACUAwAwqgIAAJUDACCrAgAAlgMAMKwCAACWAwAwrQIAAJYDADCuAgAAlgMAMK8CAACYAwAwsAIAAJkDADAJBgAAoAMAIAwAAKEDACDLAQEAAAAB2AFAAAAAAdkBQAAAAAHsAQgAAAAB7QEBAAAAAe4BAQAAAAHwAQEAAAABAgAAABsAIBwAAJ8DACADAAAAGwAgHAAAnwMAIB0AAJwDACABFQAAjgUAMA8GAADXAgAgCwAA8wIAIAwAAPQCACDIAQAA8gIAMMkBAAAZABDKAQAA8gIAMMsBAQAAAAHYAUAAyAIAIdkBQADIAgAh7AEIAM0CACHtAQEAxAIAIe4BAQDEAgAh7wEBAMQCACHwAQEAxAIAIaUCAADxAgAgAgAAABsAIBUAAJwDACACAAAAmgMAIBUAAJsDACALyAEAAJkDADDJAQAAmgMAEMoBAACZAwAwywEBAMQCACHYAUAAyAIAIdkBQADIAgAh7AEIAM0CACHtAQEAxAIAIe4BAQDEAgAh7wEBAMQCACHwAQEAxAIAIQvIAQAAmQMAMMkBAACaAwAQygEAAJkDADDLAQEAxAIAIdgBQADIAgAh2QFAAMgCACHsAQgAzQIAIe0BAQDEAgAh7gEBAMQCACHvAQEAxAIAIfABAQDEAgAhB8sBAQCHAwAh2AFAAI4DACHZAUAAjgMAIewBCACMAwAh7QEBAIcDACHuAQEAhwMAIfABAQCHAwAhCQYAAJ0DACAMAACeAwAgywEBAIcDACHYAUAAjgMAIdkBQACOAwAh7AEIAIwDACHtAQEAhwMAIe4BAQCHAwAh8AEBAIcDACEFHAAAhgUAIB0AAIwFACCoAgAAhwUAIKkCAACLBQAgrgIAAA0AIAUcAACEBQAgHQAAiQUAIKgCAACFBQAgqQIAAIgFACCuAgAAAQAgCQYAAKADACAMAAChAwAgywEBAAAAAdgBQAAAAAHZAUAAAAAB7AEIAAAAAe0BAQAAAAHuAQEAAAAB8AEBAAAAAQMcAACGBQAgqAIAAIcFACCuAgAADQAgAxwAAIQFACCoAgAAhQUAIK4CAAABACAGBgAAsAMAIMsBAQAAAAHuAQEAAAABgAICAAAAAYECCAAAAAGCAggAAAABAgAAABEAIBwAAK8DACADAAAAEQAgHAAArwMAIB0AAK0DACABFQAAgwUAMAsGAADXAgAgCwAA8wIAIMgBAAD6AgAwyQEAAA8AEMoBAAD6AgAwywEBAAAAAe4BAQDEAgAh7wEBAMQCACGAAgIA-wIAIYECCADNAgAhggIIAM0CACECAAAAEQAgFQAArQMAIAIAAACqAwAgFQAAqwMAIAnIAQAAqQMAMMkBAACqAwAQygEAAKkDADDLAQEAxAIAIe4BAQDEAgAh7wEBAMQCACGAAgIA-wIAIYECCADNAgAhggIIAM0CACEJyAEAAKkDADDJAQAAqgMAEMoBAACpAwAwywEBAMQCACHuAQEAxAIAIe8BAQDEAgAhgAICAPsCACGBAggAzQIAIYICCADNAgAhBcsBAQCHAwAh7gEBAIcDACGAAgIArAMAIYECCACMAwAhggIIAIwDACEFqwICAAAAAbECAgAAAAGyAgIAAAABswICAAAAAbQCAgAAAAEGBgAArgMAIMsBAQCHAwAh7gEBAIcDACGAAgIArAMAIYECCACMAwAhggIIAIwDACEFHAAA_gQAIB0AAIEFACCoAgAA_wQAIKkCAACABQAgrgIAAA0AIAYGAACwAwAgywEBAAAAAe4BAQAAAAGAAgIAAAABgQIIAAAAAYICCAAAAAEDHAAA_gQAIKgCAAD_BAAgrgIAAA0AIAMcAAD8BAAgqAIAAP0EACCuAgAA-AEAIAQcAACiAwAwqAIAAKMDADCqAgAApQMAIK4CAACmAwAwBBwAAJIDADCoAgAAkwMAMKoCAACVAwAgrgIAAJYDADAAAAALHAAAuAMAMB0AAL0DADCoAgAAuQMAMKkCAAC6AwAwqgIAALsDACCrAgAAvAMAMKwCAAC8AwAwrQIAALwDADCuAgAAvAMAMK8CAAC-AwAwsAIAAL8DADATCgAAsgMAIA0AALMDACDLAQEAAAABzAEBAAAAAc0BIAAAAAHOAQEAAAABzwECAAAAAdABIAAAAAHRAQEAAAAB0gEIAAAAAdMBAgAAAAHUAUAAAAAB1QEgAAAAAdYBIAAAAAHXAUAAAAAB2AFAAAAAAdkBQAAAAAHaAQEAAAAB2wEBAAAAAQIAAAAVACAcAADDAwAgAwAAABUAIBwAAMMDACAdAADCAwAgARUAAPsEADAYCQAA-AIAIAoAAPkCACANAADwAgAgyAEAAPUCADDJAQAAEwAQygEAAPUCADDLAQEAAAABzAEBAMQCACHNASAAxgIAIc4BAQDFAgAhzwECAPYCACHQASAA9wIAIdEBAQDEAgAh0gEIAM0CACHTAQIA9gIAIdQBQADHAgAh1QEgAMYCACHWASAAxgIAIdcBQADHAgAh2AFAAMgCACHZAUAAyAIAIdoBAQDFAgAh2wEBAMUCACHcAQEAxAIAIQIAAAAVACAVAADCAwAgAgAAAMADACAVAADBAwAgFcgBAAC_AwAwyQEAAMADABDKAQAAvwMAMMsBAQDEAgAhzAEBAMQCACHNASAAxgIAIc4BAQDFAgAhzwECAPYCACHQASAA9wIAIdEBAQDEAgAh0gEIAM0CACHTAQIA9gIAIdQBQADHAgAh1QEgAMYCACHWASAAxgIAIdcBQADHAgAh2AFAAMgCACHZAUAAyAIAIdoBAQDFAgAh2wEBAMUCACHcAQEAxAIAIRXIAQAAvwMAMMkBAADAAwAQygEAAL8DADDLAQEAxAIAIcwBAQDEAgAhzQEgAMYCACHOAQEAxQIAIc8BAgD2AgAh0AEgAPcCACHRAQEAxAIAIdIBCADNAgAh0wECAPYCACHUAUAAxwIAIdUBIADGAgAh1gEgAMYCACHXAUAAxwIAIdgBQADIAgAh2QFAAMgCACHaAQEAxQIAIdsBAQDFAgAh3AEBAMQCACERywEBAIcDACHMAQEAhwMAIc0BIACIAwAhzgEBAIkDACHPAQIAigMAIdABIACLAwAh0QEBAIcDACHSAQgAjAMAIdMBAgCKAwAh1AFAAI0DACHVASAAiAMAIdYBIACIAwAh1wFAAI0DACHYAUAAjgMAIdkBQACOAwAh2gEBAIkDACHbAQEAiQMAIRMKAACQAwAgDQAAkQMAIMsBAQCHAwAhzAEBAIcDACHNASAAiAMAIc4BAQCJAwAhzwECAIoDACHQASAAiwMAIdEBAQCHAwAh0gEIAIwDACHTAQIAigMAIdQBQACNAwAh1QEgAIgDACHWASAAiAMAIdcBQACNAwAh2AFAAI4DACHZAUAAjgMAIdoBAQCJAwAh2wEBAIkDACETCgAAsgMAIA0AALMDACDLAQEAAAABzAEBAAAAAc0BIAAAAAHOAQEAAAABzwECAAAAAdABIAAAAAHRAQEAAAAB0gEIAAAAAdMBAgAAAAHUAUAAAAAB1QEgAAAAAdYBIAAAAAHXAUAAAAAB2AFAAAAAAdkBQAAAAAHaAQEAAAAB2wEBAAAAAQQcAAC4AwAwqAIAALkDADCqAgAAuwMAIK4CAAC8AwAwAAAAAAAABRwAAPYEACAdAAD5BAAgqAIAAPcEACCpAgAA-AQAIK4CAAAVACADHAAA9gQAIKgCAAD3BAAgrgIAABUAIAAAAAAAAAAAAAABqwIAAAD3AQIFHAAA8QQAIB0AAPQEACCoAgAA8gQAIKkCAADzBAAgrgIAAA0AIAMcAADxBAAgqAIAAPIEACCuAgAADQAgBgMAANMEACAKAADVBAAgDQAA0QQAIA4AANYEACDXAQAAgQMAII4CAACBAwAgAAAAAAAFHAAA7AQAIB0AAO8EACCoAgAA7QQAIKkCAADuBAAgrgIAABUAIAMcAADsBAAgqAIAAO0EACCuAgAAFQAgAAAAAAABqwIAAACFAgIFHAAA5QQAIB0AAOoEACCoAgAA5gQAIKkCAADpBAAgrgIAAAEAIAscAAD6AwAwHQAA_gMAMKgCAAD7AwAwqQIAAPwDADCqAgAA_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-QIAIA0AAPACACAOAAD-AgAgyAEAAPwCADDJAQAACwAQygEAAPwCADDLAQEAAAAB1gEgAMYCACHXAUAAxwIAIdgBQADIAgAh2QFAAMgCACH3AQAA_QKFAiKDAgEAxAIAIYUCCADNAgAhhgIBAMQCACGHAgEAxAIAIYgCAQDEAgAhiQIBAMQCACGKAgEAxAIAIYsCAQDEAgAhjAIAANUC9wEijQIBAMQCACGOAgEAxQIAIY8CAQDEAgAhAgAAAA0AIBUAALAEACACAAAArgQAIBUAAK8EACAVyAEAAK0EADDJAQAArgQAEMoBAACtBAAwywEBAMQCACHWASAAxgIAIdcBQADHAgAh2AFAAMgCACHZAUAAyAIAIfcBAAD9AoUCIoMCAQDEAgAhhQIIAM0CACGGAgEAxAIAIYcCAQDEAgAhiAIBAMQCACGJAgEAxAIAIYoCAQDEAgAhiwIBAMQCACGMAgAA1QL3ASKNAgEAxAIAIY4CAQDFAgAhjwIBAMQCACEVyAEAAK0EADDJAQAArgQAEMoBAACtBAAwywEBAMQCACHWASAAxgIAIdcBQADHAgAh2AFAAMgCACHZAUAAyAIAIfcBAAD9AoUCIoMCAQDEAgAhhQIIAM0CACGGAgEAxAIAIYcCAQDEAgAhiAIBAMQCACGJAgEAxAIAIYoCAQDEAgAhiwIBAMQCACGMAgAA1QL3ASKNAgEAxAIAIY4CAQDFAgAhjwIBAMQCACERywEBAIcDACHWASAAiAMAIdcBQACNAwAh2AFAAI4DACHZAUAAjgMAIfcBAADnA4UCIoMCAQCHAwAhhQIIAIwDACGGAgEAhwMAIYcCAQCHAwAhiAIBAIcDACGJAgEAhwMAIYoCAQCHAwAhiwIBAIcDACGMAgAA1wP3ASKNAgEAhwMAIY4CAQCJAwAhFAoAAOkDACANAADrAwAgDgAA6gMAIMsBAQCHAwAh1gEgAIgDACHXAUAAjQMAIdgBQACOAwAh2QFAAI4DACH3AQAA5wOFAiKDAgEAhwMAIYUCCACMAwAhhgIBAIcDACGHAgEAhwMAIYgCAQCHAwAhiQIBAIcDACGKAgEAhwMAIYsCAQCHAwAhjAIAANcD9wEijQIBAIcDACGOAgEAiQMAIRQKAACEBAAgDQAAhgQAIA4AAIUEACDLAQEAAAAB1gEgAAAAAdcBQAAAAAHYAUAAAAAB2QFAAAAAAfcBAAAAhQICgwIBAAAAAYUCCAAAAAGGAgEAAAABhwIBAAAAAYgCAQAAAAGJAgEAAAABigIBAAAAAYsCAQAAAAGMAgAAAPcBAo0CAQAAAAGOAgEAAAABDMsBAQAAAAHYAUAAAAAB2QFAAAAAAZMCAQAAAAGUAgEAAAABlQIBAAAAAZYCAQAAAAGXAgEAAAABmAJAAAAAAZkCQAAAAAGaAgEAAAABmwIBAAAAAQIAAAAJACAcAAC9BAAgAwAAAAkAIBwAAL0EACAdAAC8BAAgARUAANgEADARAwAA9AIAIMgBAAD_AgAwyQEAAAcAEMoBAAD_AgAwywEBAAAAAdgBQADIAgAh2QFAAMgCACGPAgEAxAIAIZMCAQDEAgAhlAIBAMQCACGVAgEAxQIAIZYCAQDFAgAhlwIBAMUCACGYAkAAxwIAIZkCQADHAgAhmgIBAMUCACGbAgEAxQIAIQIAAAAJACAVAAC8BAAgAgAAALoEACAVAAC7BAAgEMgBAAC5BAAwyQEAALoEABDKAQAAuQQAMMsBAQDEAgAh2AFAAMgCACHZAUAAyAIAIY8CAQDEAgAhkwIBAMQCACGUAgEAxAIAIZUCAQDFAgAhlgIBAMUCACGXAgEAxQIAIZgCQADHAgAhmQJAAMcCACGaAgEAxQIAIZsCAQDFAgAhEMgBAAC5BAAwyQEAALoEABDKAQAAuQQAMMsBAQDEAgAh2AFAAMgCACHZAUAAyAIAIY8CAQDEAgAhkwIBAMQCACGUAgEAxAIAIZUCAQDFAgAhlgIBAMUCACGXAgEAxQIAIZgCQADHAgAhmQJAAMcCACGaAgEAxQIAIZsCAQDFAgAhDMsBAQCHAwAh2AFAAI4DACHZAUAAjgMAIZMCAQCHAwAhlAIBAIcDACGVAgEAiQMAIZYCAQCJAwAhlwIBAIkDACGYAkAAjQMAIZkCQACNAwAhmgIBAIkDACGbAgEAiQMAIQzLAQEAhwMAIdgBQACOAwAh2QFAAI4DACGTAgEAhwMAIZQCAQCHAwAhlQIBAIkDACGWAgEAiQMAIZcCAQCJAwAhmAJAAI0DACGZAkAAjQMAIZoCAQCJAwAhmwIBAIkDACEMywEBAAAAAdgBQAAAAAHZAUAAAAABkwIBAAAAAZQCAQAAAAGVAgEAAAABlgIBAAAAAZcCAQAAAAGYAkAAAAABmQJAAAAAAZoCAQAAAAGbAgEAAAABB8sBAQAAAAHYAUAAAAAB2QFAAAAAAZICQAAAAAGcAgEAAAABnQIBAAAAAZ4CAQAAAAECAAAABQAgHAAAyQQAIAMAAAAFACAcAADJBAAgHQAAyAQAIAEVAADXBAAwDAMAAPQCACDIAQAAgAMAMMkBAAADABDKAQAAgAMAMMsBAQAAAAHYAUAAyAIAIdkBQADIAgAhjwIBAMQCACGSAkAAyAIAIZwCAQAAAAGdAgEAxQIAIZ4CAQDFAgAhAgAAAAUAIBUAAMgEACACAAAAxgQAIBUAAMcEACALyAEAAMUEADDJAQAAxgQAEMoBAADFBAAwywEBAMQCACHYAUAAyAIAIdkBQADIAgAhjwIBAMQCACGSAkAAyAIAIZwCAQDEAgAhnQIBAMUCACGeAgEAxQIAIQvIAQAAxQQAMMkBAADGBAAQygEAAMUEADDLAQEAxAIAIdgBQADIAgAh2QFAAMgCACGPAgEAxAIAIZICQADIAgAhnAIBAMQCACGdAgEAxQIAIZ4CAQDFAgAhB8sBAQCHAwAh2AFAAI4DACHZAUAAjgMAIZICQACOAwAhnAIBAIcDACGdAgEAiQMAIZ4CAQCJAwAhB8sBAQCHAwAh2AFAAI4DACHZAUAAjgMAIZICQACOAwAhnAIBAIcDACGdAgEAiQMAIZ4CAQCJAwAhB8sBAQAAAAHYAUAAAAAB2QFAAAAAAZICQAAAAAGcAgEAAAABnQIBAAAAAZ4CAQAAAAEEHAAAvgQAMKgCAAC_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_gQAIAMAAAALACAcAAD-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_QEHqwH-AQesAf8BB60BgQIHrgGDAg6vAYQCWrABhgIHsQGIAg6yAYkCW7MBigIHtAGLAge1AYwCDrYBjwJctwGQAmC4AZECBrkBkgIGugGTAga7AZQCBrwBlQIGvQGXAga-AZkCDr8BmgJhwAGcAgbBAZ4CDsIBnwJiwwGgAgbEAaECBsUBogIOxgGlAmPHAaYCaQ"
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

// generated/prisma/internal/prismaNamespace.ts
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
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  orderId: "orderId",
  itemId: "itemId",
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
  unit: "unit",
  packSize: "packSize",
  isSpicy: "isSpicy",
  weight: "weight",
  price: "price",
  stockQuantity: "stockQuantity",
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

// generated/prisma/client.ts
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

// src/utils/pagination-sort.ts
var DEFAULT_PAGE = 1;
var DEFAULT_LIMIT = 20;
var buildPaginationAndSort = (options) => {
  const page = Math.max(1, Number(options.page) || DEFAULT_PAGE);
  const limit = Math.max(1, Number(options.limit) || DEFAULT_LIMIT);
  const skip = (page - 1) * limit;
  const orderBy = options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : void 0;
  return {
    skip,
    take: limit,
    orderBy
  };
};

// src/modules/category/category.service.ts
var getCategories = async (queries) => {
  const { skip, take, orderBy, search, isFeatured } = queries;
  const whereFilters = {
    isDeleted: false,
    isActive: true,
    AND: [
      // search filters
      {
        ...search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { subName: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        }
      },
      // attribute filters
      {
        ...isFeatured !== void 0 && { isFeatured }
      }
    ]
  };
  const result = await prisma.category.findMany({
    // filters
    where: whereFilters,
    // pagination
    skip,
    take,
    // sorting
    ...orderBy && { orderBy },
    // includes & omissions
    include: { _count: true },
    omit: { isDeleted: true, deletedAt: true }
  });
  const total = await prisma.category.count({
    where: whereFilters
  });
  return { data: result, total };
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
  const { search, isFeatured } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);
  const result = await categoryServices.getCategories({
    skip,
    take,
    orderBy,
    search,
    isFeatured: isFeatured !== void 0 ? isFeatured === "true" : void 0
  });
  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip
    },
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

// src/modules/item/item.service.ts
var getItems = async (queries) => {
  const { skip, take, orderBy, search, categoryId, isFeatured, isSpicy } = queries;
  const whereFilters = {
    isDeleted: false,
    isActive: true,
    AND: [
      {
        ...search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        }
      },
      {
        ...categoryId && { categoryId }
      },
      {
        ...isFeatured !== void 0 && { isFeatured }
      },
      {
        ...isSpicy !== void 0 && { isSpicy }
      }
    ]
  };
  const result = await prisma.item.findMany({
    where: whereFilters,
    skip,
    take,
    ...orderBy && { orderBy },
    include: {
      category: {
        select: { id: true, name: true, subName: true }
      }
    },
    omit: { isDeleted: true, deletedAt: true }
  });
  const total = await prisma.item.count({ where: whereFilters });
  return { data: result, total };
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
var updateItemStock = async (id, operation, quantity, tx) => {
  const client = tx ?? prisma;
  const item = await client.item.findUnique({
    where: { id },
    select: { id: true, stockQuantity: true }
  });
  if (!item) {
    throw new Error(`Item with ID ${id} not found!`);
  }
  if (item.stockQuantity === null) return;
  const newStock = operation === "INC" ? item.stockQuantity + quantity : item.stockQuantity - quantity;
  if (newStock < 0) {
    throw new Error(`Insufficient stock for item ID ${id}!`);
  }
  await client.item.update({
    where: { id },
    data: { stockQuantity: newStock }
  });
};
var itemServices = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateItemStock
};

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
var getOrders = async (payload) => {
  const { skip, take, orderBy, status } = payload;
  const whereFilters = {
    isDeleted: false,
    ...status && {
      OR: [{ status: { in: status } }]
    }
  };
  const result = await prisma.order.findMany({
    where: whereFilters,
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
              image: true
            }
          }
        }
      },
      user: {
        select: { id: true, name: true, email: true, image: true }
      }
    },
    omit: {
      userId: true
    },
    skip,
    take,
    ...orderBy && { orderBy }
  });
  const total = await prisma.order.count({ where: whereFilters });
  return { data: result, total };
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
  const { skip, take, orderBy } = queries;
  const result = await prisma.order.findMany({
    where: { userId, isDeleted: false },
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
              image: true
            }
          }
        }
      }
    },
    omit: {
      userId: true
    },
    skip,
    take,
    ...orderBy && { orderBy }
  });
  const total = await prisma.order.count({ where: { userId, isDeleted: false } });
  return { data: result, total };
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
            stockQuantity: true,
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
        if (result2.stockQuantity !== null && orderItem.quantity > result2.stockQuantity) {
          throw new Error(`Insufficient stock for item ID ${orderItem.itemId}`);
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
    await Promise.all(
      items.map(
        (item) => itemServices.updateItemStock(item.itemId, "DEC", item.quantity, tx)
      )
    );
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
      select: { id: true, status: true }
    });
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found!`);
    }
    if (order.status === updatedStatus) {
      throw new Error(`Order status is already ${updatedStatus}!`);
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
    await Promise.all(
      order.orderItems.map(
        (item) => itemServices.updateItemStock(item.itemId, "INC", item.quantity, tx)
      )
    );
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
    if (order.status !== OrderStatus.CANCELLED) {
      await Promise.all(
        order.orderItems.map(
          (item) => itemServices.updateItemStock(item.itemId, "INC", item.quantity, tx)
        )
      );
    }
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
  const { status } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);
  const result = await orderServices.getOrders({
    skip,
    take,
    orderBy,
    status: status ? status.split(",").map((s) => s) : void 0
  });
  res.status(200).json({
    success: true,
    message: "Orders retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip
    },
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
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);
  const result = await orderServices.getUserOrders(userId, {
    skip,
    take,
    orderBy
  });
  res.status(200).json({
    success: true,
    message: "Your orders retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip
    },
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

// src/modules/user/user.service.ts
var getAllUsers = async (queries) => {
  const { skip, take, orderBy, search, status, role } = queries;
  const whereFilters = {
    AND: [
      // search filters
      {
        ...search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }
      },
      // attribute filters
      {
        ...status && { status }
      },
      {
        ...role && { role }
      }
    ]
  };
  const result = await prisma.user.findMany({
    // filters
    where: whereFilters,
    // pagination
    skip,
    take,
    // sorting
    ...orderBy && { orderBy }
  });
  const total = await prisma.user.count({
    where: whereFilters
  });
  return { data: result, total };
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
  const { search, role, status } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);
  const result = await userServices.getAllUsers({
    skip,
    take,
    orderBy,
    search,
    role,
    status
  });
  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip
    },
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

// src/modules/item/item.controller.ts
var getItems2 = async_handler_default(async (req, res) => {
  const { search, categoryId, isFeatured, isSpicy } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);
  const result = await itemServices.getItems({
    skip,
    take,
    orderBy,
    search,
    categoryId,
    isFeatured: isFeatured !== void 0 ? isFeatured === "true" : void 0,
    isSpicy: isSpicy !== void 0 ? isSpicy === "true" : void 0
  });
  res.status(200).json({
    success: true,
    message: "Items retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip
    },
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

// src/modules/review/review.service.ts
var getReviews = async (queries) => {
  const { skip, take, orderBy, itemId, customerId, rating } = queries;
  const whereFilters = {
    ...itemId && { itemId },
    ...customerId && { customerId },
    ...rating && { rating }
  };
  const result = await prisma.review.findMany({
    where: whereFilters,
    skip,
    take,
    ...orderBy && { orderBy },
    include: {
      customer: {
        select: { id: true, name: true, image: true }
      },
      item: {
        select: { id: true, name: true, image: true }
      }
    }
  });
  const total = await prisma.review.count({ where: whereFilters });
  return { data: result, total };
};
var getReviewById = async (id) => {
  const result = await prisma.review.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, image: true }
      },
      item: {
        select: { id: true, name: true, image: true }
      }
    }
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
  const orderItem = await prisma.orderItem.findFirst({
    where: { orderId: payload.orderId, itemId: payload.itemId }
  });
  if (!orderItem) {
    throw new Error("Item was not part of this order!");
  }
  const existingReview = await prisma.review.findUnique({
    where: {
      orderId_itemId_customerId: {
        orderId: payload.orderId,
        itemId: payload.itemId,
        customerId: payload.customerId
      }
    }
  });
  if (existingReview) {
    throw new Error("You have already reviewed this item for this order!");
  }
  const result = await prisma.review.create({
    data: payload,
    include: {
      customer: { select: { id: true, name: true, image: true } },
      item: { select: { id: true, name: true, image: true } }
    }
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
    include: {
      customer: { select: { id: true, name: true, image: true } },
      item: { select: { id: true, name: true, image: true } }
    }
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
var reviewServices = {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
};

// src/modules/review/review.controller.ts
var getReviews2 = async_handler_default(async (req, res) => {
  const { itemId, customerId, rating } = req.query;
  const { skip, take, orderBy } = buildPaginationAndSort(req.query);
  const result = await reviewServices.getReviews({
    skip,
    take,
    orderBy,
    itemId,
    customerId,
    rating: rating ? Number(rating) : void 0
  });
  res.status(200).json({
    success: true,
    message: "Reviews retrieved successfully",
    meta: {
      total: result.total,
      page: Math.ceil(skip / take) + 1,
      totalPages: Math.ceil(result.total / take),
      limit: take,
      skip
    },
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
var reviewControllers = {
  getReviews: getReviews2,
  getReviewById: getReviewById2,
  createReview: createReview2,
  updateReview: updateReview2,
  deleteReview: deleteReview2
};

// src/modules/review/review.route.ts
var router5 = express5.Router();
router5.get("/", reviewControllers.getReviews);
router5.get("/:id", reviewControllers.getReviewById);
router5.post("/", auth_default(), reviewControllers.createReview);
router5.patch("/:id", auth_default(), reviewControllers.updateReview);
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
        await tx.payment.create({
          data: {
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
          data: { paymentStatus: "PAID" }
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
    const payment = await tx.payment.create({
      data: {
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
      data: { paymentStatus: "PAID" }
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

// src/app.ts
var app = express7();
app.use(express7.json());
app.use(logger_default);
var allowed_origins = [
  env.APP_ORIGIN,
  env.PROD_APP_ORIGIN
  // Production frontend URL
].filter(Boolean);
app.post(
  "/webhook",
  express7.raw({ type: "application/json" }),
  paymentControllers.webhook
);
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
