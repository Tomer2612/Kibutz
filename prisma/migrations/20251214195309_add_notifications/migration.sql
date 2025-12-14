-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('LIKE', 'COMMENT', 'FOLLOW', 'NEW_POST', 'MENTION', 'COMMUNITY_JOIN');

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "postId" TEXT,
    "communityId" TEXT,
    "commentId" TEXT,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipientId_isRead_idx" ON "public"."notifications"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_recipientId_createdAt_idx" ON "public"."notifications"("recipientId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
