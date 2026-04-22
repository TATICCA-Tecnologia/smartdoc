-- AlterTable
ALTER TABLE "document_groups" ADD COLUMN     "company_id" TEXT;

-- CreateIndex
CREATE INDEX "document_groups_company_id_idx" ON "document_groups"("company_id");

-- AddForeignKey
ALTER TABLE "document_groups" ADD CONSTRAINT "document_groups_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
