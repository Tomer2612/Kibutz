-- AlterTable
ALTER TABLE "public"."lessons" ADD COLUMN     "files" JSONB[],
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "lessonType" TEXT NOT NULL DEFAULT 'content',
ADD COLUMN     "links" TEXT[];

-- CreateTable
CREATE TABLE "public"."lesson_quizzes" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "lesson_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lesson_quiz_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'radio',
    "order" INTEGER NOT NULL DEFAULT 0,
    "quizId" TEXT NOT NULL,

    CONSTRAINT "lesson_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lesson_quiz_options" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "lesson_quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_quizzes_lessonId_key" ON "public"."lesson_quizzes"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_quiz_questions_quizId_idx" ON "public"."lesson_quiz_questions"("quizId");

-- CreateIndex
CREATE INDEX "lesson_quiz_options_questionId_idx" ON "public"."lesson_quiz_options"("questionId");

-- AddForeignKey
ALTER TABLE "public"."lesson_quizzes" ADD CONSTRAINT "lesson_quizzes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_quiz_questions" ADD CONSTRAINT "lesson_quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."lesson_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_quiz_options" ADD CONSTRAINT "lesson_quiz_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."lesson_quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
