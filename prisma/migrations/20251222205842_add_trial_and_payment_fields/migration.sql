-- AlterTable
ALTER TABLE "public"."communities" ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "cardLastFour" TEXT,
ADD COLUMN     "trialCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialStartDate" TIMESTAMP(3);
