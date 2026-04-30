-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "social_reason_id" TEXT;

-- CreateIndex
CREATE INDEX "documents_social_reason_id_idx" ON "documents"("social_reason_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_social_reason_id_fkey" FOREIGN KEY ("social_reason_id") REFERENCES "social_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
