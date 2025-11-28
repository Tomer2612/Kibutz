-- AlterTable
ALTER TABLE "public"."communities" ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "galleryImages" TEXT[],
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "whatsappUrl" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;
