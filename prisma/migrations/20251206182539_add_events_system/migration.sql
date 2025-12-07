/*
  Warnings:

  - You are about to drop the `community_nav_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_nav_sections` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."RsvpStatus" AS ENUM ('GOING', 'MAYBE', 'NOT_GOING');

-- DropForeignKey
ALTER TABLE "public"."community_nav_links" DROP CONSTRAINT "community_nav_links_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."community_nav_sections" DROP CONSTRAINT "community_nav_sections_communityId_fkey";

-- DropTable
DROP TABLE "public"."community_nav_links";

-- DropTable
DROP TABLE "public"."community_nav_sections";

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "duration" INTEGER,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringType" TEXT,
    "locationType" TEXT NOT NULL DEFAULT 'online',
    "locationName" TEXT,
    "locationUrl" TEXT,
    "category" TEXT,
    "capacity" INTEGER,
    "sendReminders" BOOLEAN NOT NULL DEFAULT true,
    "reminderDays" INTEGER NOT NULL DEFAULT 1,
    "attendeeType" TEXT NOT NULL DEFAULT 'all',
    "communityId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_rsvps" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."RsvpStatus" NOT NULL DEFAULT 'GOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_rsvps_eventId_userId_key" ON "public"."event_rsvps"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_rsvps" ADD CONSTRAINT "event_rsvps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
