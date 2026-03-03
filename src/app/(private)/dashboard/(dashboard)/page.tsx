"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/shared/components/global/ui"
import { useSelectedCompany } from "@/src/shared/context/company-context"
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardLastFile } from "./_components/dashboard-last-file";

export default function DashboardPage() {
  const { selectedCompany } = useSelectedCompany();

  const companyName = selectedCompany?.name ?? "Empresa";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-card px-4 py-3">
        <p className="text-sm font-medium text-muted-foreground">Nome da empresa</p>
        <p className="text-lg font-semibold">{companyName}</p>
        <p className="text-sm font-semibold text-emerald-600 mt-1">Controle de Documentos</p>
      </div>

      <DashboardHeader />

      <DashboardLastFile />

      <Card>
        <CardHeader className="px-6 pb-0">
          <CardTitle className="text-base">Notas Abaixo</CardTitle>
        </CardHeader>
        <CardContent className="mt-4 space-y-1 pb-4">
          <p className="text-xs text-muted-foreground">
            Clique em um estabelecimento para ver seus arquivos.
          </p>
          <p className="text-xs text-muted-foreground">
            Use o Menu Smartdoc (Lateral) para navegar por categoria de arquivo.
          </p>
          <p className="text-xs text-muted-foreground">
            Cada categoria e arquivo pode receber observações.
          </p>
        </CardContent>
      </Card>
    </div >
  )
}