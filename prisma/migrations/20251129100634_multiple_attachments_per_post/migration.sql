/*
  Warnings:

  - You are about to drop the column `fileName` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `linkUrl` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "fileName",
DROP COLUMN "fileUrl",
DROP COLUMN "image",
DROP COLUMN "linkUrl",
ADD COLUMN     "files" JSONB[],
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "links" TEXT[];
