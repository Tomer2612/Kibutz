-- AlterTable
ALTER TABLE "public"."lessons" ADD COLUMN     "contentOrder" TEXT[] DEFAULT ARRAY['video', 'text', 'links', 'images']::TEXT[];
