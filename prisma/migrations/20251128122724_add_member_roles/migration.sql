-- CreateEnum
CREATE TYPE "public"."MemberRole" AS ENUM ('OWNER', 'MANAGER', 'USER');

-- AlterTable
ALTER TABLE "public"."community_members" ADD COLUMN     "role" "public"."MemberRole" NOT NULL DEFAULT 'USER';
