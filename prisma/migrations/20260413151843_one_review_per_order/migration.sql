/*
  Warnings:

  - A unique constraint covering the columns `[orderId,customerId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "reviews_orderId_itemId_customerId_key";

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderId_customerId_key" ON "reviews"("orderId", "customerId");
