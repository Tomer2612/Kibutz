-- CreateTable
CREATE TABLE "public"."community_nav_sections" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "community_nav_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."community_nav_links" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "community_nav_links_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."community_nav_sections" ADD CONSTRAINT "community_nav_sections_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_nav_links" ADD CONSTRAINT "community_nav_links_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."community_nav_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
