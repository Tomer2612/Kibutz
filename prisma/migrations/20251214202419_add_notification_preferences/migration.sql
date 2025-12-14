-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "notifyComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyCommunityJoins" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyFollows" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyLikes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyMentions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyNewPosts" BOOLEAN NOT NULL DEFAULT true;
