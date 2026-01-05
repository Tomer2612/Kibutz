-- AlterTable
ALTER TABLE "communities" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "communities_slug_key" ON "communities"("slug");
