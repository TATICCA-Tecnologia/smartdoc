-- AlterTable: add as nullable to preserve existing rows
ALTER TABLE "document_templates" ADD COLUMN "company_id" TEXT;

-- CreateIndex
CREATE INDEX "document_templates_company_id_idx" ON "document_templates"("company_id");

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
