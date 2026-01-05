/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `communities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `communities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add slug column as nullable first
ALTER TABLE "public"."communities" ADD COLUMN "slug" TEXT;

-- Generate slugs for existing communities using id as fallback for uniqueness
UPDATE "public"."communities" 
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^\w\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING(id, 1, 8);

-- Make slug NOT NULL after populating
ALTER TABLE "public"."communities" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "public"."communities"("slug");
