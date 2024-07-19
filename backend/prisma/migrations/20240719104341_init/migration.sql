/*
  Warnings:

  - Added the required column `version` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "prevData" JSONB,
ADD COLUMN     "version" INTEGER NOT NULL;
