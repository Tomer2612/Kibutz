-- CreateTable
CREATE TABLE "public"."polls" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."poll_options" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."poll_votes" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "oderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "polls_postId_key" ON "public"."polls"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_optionId_oderId_key" ON "public"."poll_votes"("optionId", "oderId");

-- AddForeignKey
ALTER TABLE "public"."polls" ADD CONSTRAINT "polls_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."poll_votes" ADD CONSTRAINT "poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
