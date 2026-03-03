import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/shared/components/global/ui";
import { Skeleton } from "@/src/shared/components/global/ui/skeleton";
import { useSelectedCompany } from "@/src/shared/context/company-context";
import { api } from "@/src/shared/context/trpc-context";
import { Building2, ChevronRight, FileSpreadsheet, FileText } from "lucide-react";
import Link from "next/link";

export function DashboardLastFile() {
  const { selectedCompany } = useSelectedCompany();
  const { data: latestFiles, isLoading: filesLoading } = api.dashboard.getLatestDocuments.useQuery({ limit: 5, companyId: selectedCompany?.id ?? undefined });
  const { data: establishments, isLoading: establishmentsLoading } = api.dashboard.getEstablishmentsStats.useQuery({ companyId: selectedCompany?.id ?? undefined });

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Últimos Arquivos</CardTitle>
            <CardDescription>Arquivos mais recentes enviados para o sistema.</CardDescription>
          </div>
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="sm" className="gap-1 px-2 text-xs">
              Ver todos
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="mt-4 space-y-2 pb-4">
          {filesLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </div>
            ))}

          {!filesLoading && latestFiles?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum arquivo encontrado
            </p>
          )}

          {!filesLoading &&
            latestFiles?.map((file: any) => (
              <Link
                key={file.id}
                href={`/document/${file.id}`}
                target="_blank"
                className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/60 transition-colors"
                title="Abrir documento"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-700">
                    {file.id.slice(0, 2)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-tight">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {file.date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.type === "Excel" ? (
                    <FileSpreadsheet className="size-4 text-emerald-600" />
                  ) : (
                    <FileText className="size-4 text-amber-600" />
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    {file.type}
                  </Badge>
                </div>
              </Link>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-6 pb-0">
          <CardTitle className="text-base">Por Estabelecimento</CardTitle>
          <CardDescription>Distribuição de arquivos por unidade.</CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-2 pb-4">
          {establishmentsLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            ))}

          {!establishmentsLoading && establishments?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum estabelecimento encontrado
            </p>
          )}

          {!establishmentsLoading &&
            establishments?.map((establishment: any) => (
              <div
                key={establishment.id}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Building2 className="size-4" />
                  </div>
                  <span className="text-sm font-medium">
                    {establishment.name}
                  </span>
                </div>
                <Badge variant="secondary">
                  {establishment.count}
                </Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}