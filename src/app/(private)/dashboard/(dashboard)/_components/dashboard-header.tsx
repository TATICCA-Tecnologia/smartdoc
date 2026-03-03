import { Card } from "@/src/shared/components/global/ui/card";
import { useSelectedCompany } from "@/src/shared/context/company-context";
import { api } from "@/src/shared/context/trpc-context";
import { FileText, Folder, Building2, StickyNote } from "lucide-react";

export function DashboardHeader() {
  const { selectedCompany } = useSelectedCompany();

  const { data: stats, isLoading: statsLoading } = api.dashboard.getStats.useQuery({ companyId: selectedCompany?.id ?? undefined });

  const summaryCards = [
    {
      title: "Total de Arquivos",
      value: stats?.totalDocuments?.toString() || "0",
      icon: FileText,
    },
    {
      title: "Categorias Ativas",
      value: stats?.totalTemplates?.toString() || "0",
      icon: Folder,
    },
    {
      title: "Estabelecimentos",
      value: stats?.totalEstablishments?.toString() || "0",
      icon: Building2,
    },
    {
      title: "Obs.",
      value: stats?.totalNotes?.toString() || "0",
      icon: StickyNote,
    },
  ] as const

  const isLoading = statsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="flex-row items-center gap-4 px-6 py-4 animate-pulse">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted" />
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <Card key={card.title} className="flex-row items-center gap-4 px-6 py-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <card.icon className="size-6" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
            <span className="text-2xl font-semibold leading-none tracking-tight">{card.value}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}