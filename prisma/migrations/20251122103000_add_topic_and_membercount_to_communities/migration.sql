-- Add topic and memberCount columns to communities
ALTER TABLE "communities"
ADD COLUMN "topic" TEXT,
ADD COLUMN "memberCount" INTEGER NOT NULL DEFAULT 0;
