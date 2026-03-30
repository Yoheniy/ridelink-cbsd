/*
  Warnings:

  - You are about to drop the column `tripId` on the `trip` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "trip_tripId_key";

-- AlterTable
ALTER TABLE "trip" DROP COLUMN "tripId";
