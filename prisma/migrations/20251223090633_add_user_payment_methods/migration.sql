-- CreateTable
CREATE TABLE "public"."user_payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardLastFour" TEXT NOT NULL,
    "cardBrand" TEXT NOT NULL DEFAULT 'Visa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_payment_methods_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."user_payment_methods" ADD CONSTRAINT "user_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
