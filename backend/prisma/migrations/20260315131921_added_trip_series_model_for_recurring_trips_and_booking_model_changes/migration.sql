/*
  Warnings:

  - The `status` column on the `booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isSubscribable` on the `trip` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionOptions` on the `trip` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionPricing` on the `trip` table. All the data in the column will be lost.
  - You are about to drop the column `tripId` on the `trip_subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tripId,passengerId]` on the table `booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[seriesId,passengerId]` on the table `trip_subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seriesId` to the `trip_subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'canceled', 'completed');

-- DropForeignKey
ALTER TABLE "trip_subscription" DROP CONSTRAINT "trip_subscription_tripId_fkey";

-- DropIndex
DROP INDEX "booking_tripId_passengerId_idx";

-- DropIndex
DROP INDEX "trip_subscription_tripId_idx";

-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "dropOffPoint" TEXT,
ADD COLUMN     "isSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickUpPoint" TEXT,
ADD COLUMN     "subscriptionId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "trip" DROP COLUMN "isSubscribable",
DROP COLUMN "subscriptionOptions",
DROP COLUMN "subscriptionPricing",
ADD COLUMN     "seriesId" TEXT;

-- AlterTable
ALTER TABLE "trip_subscription" DROP COLUMN "tripId",
ADD COLUMN     "seriesId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "trip_series" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "routeCoordinates" JSONB NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "pricePerSeat" DOUBLE PRECISION NOT NULL,
    "daysOfWeek" INTEGER[],
    "departureTimeOfDay" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "exceptions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionOptions" "SubscriptionType"[],
    "subscriptionPricing" JSONB,
    "generatedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_series_driverId_idx" ON "trip_series"("driverId");

-- CreateIndex
CREATE INDEX "trip_series_isActive_idx" ON "trip_series"("isActive");

-- CreateIndex
CREATE INDEX "trip_series_origin_destination_idx" ON "trip_series"("origin", "destination");

-- CreateIndex
CREATE INDEX "booking_subscriptionId_idx" ON "booking"("subscriptionId");

-- CreateIndex
CREATE INDEX "booking_status_idx" ON "booking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_tripId_passengerId_key" ON "booking"("tripId", "passengerId");

-- CreateIndex
CREATE INDEX "trip_seriesId_idx" ON "trip"("seriesId");

-- CreateIndex
CREATE INDEX "trip_subscription_seriesId_idx" ON "trip_subscription"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "trip_subscription_seriesId_passengerId_key" ON "trip_subscription"("seriesId", "passengerId");

-- AddForeignKey
ALTER TABLE "trip_series" ADD CONSTRAINT "trip_series_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "trip_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "trip_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_subscription" ADD CONSTRAINT "trip_subscription_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "trip_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
