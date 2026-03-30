-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('scheduled', 'inProgress', 'completed', 'canceled');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('weekly', 'monthly');

-- CreateTable
CREATE TABLE "trip" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "routeCoordinates" JSONB NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "pricePerSeat" DOUBLE PRECISION NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'scheduled',
    "isSubscribable" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionOptions" "SubscriptionType"[],
    "subscriptionPricing" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "seatsBooked" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_subscription" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "subscriptionType" "SubscriptionType" NOT NULL,
    "seatsSubscribed" INTEGER NOT NULL DEFAULT 1,
    "pricePerPeriod" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_tripId_key" ON "trip"("tripId");

-- CreateIndex
CREATE INDEX "trip_driverId_idx" ON "trip"("driverId");

-- CreateIndex
CREATE INDEX "trip_departureTime_idx" ON "trip"("departureTime");

-- CreateIndex
CREATE INDEX "trip_status_idx" ON "trip"("status");

-- CreateIndex
CREATE INDEX "trip_origin_idx" ON "trip"("origin");

-- CreateIndex
CREATE INDEX "trip_destination_idx" ON "trip"("destination");

-- CreateIndex
CREATE INDEX "trip_origin_destination_idx" ON "trip"("origin", "destination");

-- CreateIndex
CREATE INDEX "trip_departureTime_status_idx" ON "trip"("departureTime", "status");

-- CreateIndex
CREATE INDEX "booking_tripId_idx" ON "booking"("tripId");

-- CreateIndex
CREATE INDEX "booking_passengerId_idx" ON "booking"("passengerId");

-- CreateIndex
CREATE INDEX "booking_tripId_passengerId_idx" ON "booking"("tripId", "passengerId");

-- CreateIndex
CREATE INDEX "trip_subscription_tripId_idx" ON "trip_subscription"("tripId");

-- CreateIndex
CREATE INDEX "trip_subscription_passengerId_idx" ON "trip_subscription"("passengerId");

-- CreateIndex
CREATE INDEX "trip_subscription_isActive_idx" ON "trip_subscription"("isActive");

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_subscription" ADD CONSTRAINT "trip_subscription_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_subscription" ADD CONSTRAINT "trip_subscription_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE CASCADE ON UPDATE CASCADE;
