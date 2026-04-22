-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "company_id" TEXT;

-- CreateIndex
CREATE INDEX "organizations_company_id_idx" ON "organizations"("company_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
