"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Printer,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@/src/shared/components/global/ui";
import { api } from "@/src/shared/context/trpc-context";
import { getExpirationStatus } from "@/src/shared/utils/document-expiration";
import Link from "next/link";
import { CalendarCellStatus, getMonthMetadata, getStatusClasses, STATUS_PRIORITY } from "./utils/calender.utils";
import { useSelectedCompany } from "@/src/shared/context/company-context";

export default function DocumentsCalendarPage() {
  const { selectedCompanyId } = useSelectedCompany();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const { data: documents, isLoading } = api.document.getExpiring.useQuery({
    days: 365,
    companyId: selectedCompanyId ?? undefined,
  }, {
    enabled: !!selectedCompanyId,
  });

  const documentsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};

    (documents || []).forEach((doc: any) => {
      if (!doc.expirationDate) return;
      const d = new Date(doc.expirationDate as string | Date);
      const key = d.toISOString().slice(0, 10); // yyyy-mm-dd
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(doc);
    });

    return map;
  }, [documents]);

  const calendarWeeks = useMemo(() => {
    const { year, month, daysInMonth, firstWeekday } =
      getMonthMetadata(currentMonth);

    const weeks: {
      date: Date;
      inCurrentMonth: boolean;
      key: string;
      docs: any[];
      status: CalendarCellStatus | null;
      label: string;
    }[][] = [];

    const totalCells = 42;
    for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
      const weekIndex = Math.floor(cellIndex / 7);
      if (!weeks[weekIndex]) {
        weeks[weekIndex] = [];
      }

      const dayNumber = cellIndex - firstWeekday + 1;
      const cellDate = new Date(year, month, dayNumber);
      const inCurrentMonth = cellDate.getMonth() === month;

      const key = cellDate.toISOString().slice(0, 10);
      const docs = inCurrentMonth ? documentsByDate[key] || [] : [];

      let status: CalendarCellStatus | null = null;
      if (docs.length > 0) {
        docs.forEach((doc: any) => {
          const expStatus = getExpirationStatus(
            doc.expirationDate as Date | string | null,
            doc.alertDate as Date | string | null
          );

          const current =
            (expStatus.status as CalendarCellStatus) ?? ("safe" as const);

          if (
            status === null ||
            STATUS_PRIORITY[current] > STATUS_PRIORITY[status]
          ) {
            status = current;
          }
        });
      }

      weeks[weekIndex].push({
        date: cellDate,
        inCurrentMonth,
        key,
        docs,
        status,
        label: inCurrentMonth ? String(cellDate.getDate()) : "",
      });
    }

    return weeks;
  }, [currentMonth, documentsByDate]);

  const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const selectedDocs =
    selectedDateKey && documentsByDate[selectedDateKey]
      ? documentsByDate[selectedDateKey]
      : [];

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
    setSelectedDateKey(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
    setSelectedDateKey(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            Calendário de Vencimentos
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" id="calendar-print-area">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-600" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold">Calendário de Vencimentos</h1>
            <p className="text-sm text-muted-foreground">
              Visualize os documentos por data de vencimento, com cores por
              criticidade.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 print:hidden"
            onClick={() => window.print()}
            title="Imprimir calendário"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {monthFormatter.format(currentMonth)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Calendário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground">
              <span className="text-center">Seg</span>
              <span className="text-center">Ter</span>
              <span className="text-center">Qua</span>
              <span className="text-center">Qui</span>
              <span className="text-center">Sex</span>
              <span className="text-center">Sáb</span>
              <span className="text-center">Dom</span>
            </div>

            <div className="grid grid-rows-6 gap-1">
              {calendarWeeks.map((week, wIndex) => (
                <div key={wIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day: any) => {
                    const isSelected = selectedDateKey === day.key;
                    const hasDocs = day.docs.length > 0;
                    const statusClasses = getStatusClasses(day.status);

                    return (
                      <button
                        key={day.key}
                        type="button"
                        disabled={!day.inCurrentMonth}
                        onClick={() =>
                          hasDocs
                            ? setSelectedDateKey(
                              selectedDateKey === day.key ? null : day.key
                            )
                            : undefined
                        }
                        className={[
                          "min-h-[52px] rounded-md border text-xs flex flex-col items-center justify-center px-1 py-1 transition-colors",
                          day.inCurrentMonth
                            ? "bg-background"
                            : "bg-muted/40 text-muted-foreground cursor-default",
                          hasDocs && day.inCurrentMonth ? statusClasses : "",
                          hasDocs && "cursor-pointer",
                          isSelected && "ring-2 ring-emerald-500 ring-offset-2",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className="font-medium">{day.label}</span>
                        {hasDocs && (
                          <span className="mt-1 text-[10px]">
                            {day.docs.length} doc
                            {day.docs.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-dashed border-border/60 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>Verde / Válido</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-3 w-3 rounded bg-yellow-100 border border-yellow-300" />
                <span>Amarelo / Em Andamento</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-3 w-3 rounded bg-red-100 border border-red-300" />
                <span>Vermelho / Expirado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedDateKey
                ? `Documentos em ${new Date(
                  selectedDateKey
                ).toLocaleDateString("pt-BR")}`
                : "Selecione um dia com documentos"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDateKey && (
              <p className="text-sm text-muted-foreground">
                Clique em um dia do calendário que tenha documentos para ver os
                detalhes aqui.
              </p>
            )}

            {selectedDateKey && selectedDocs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum documento vencendo nesta data.
              </p>
            )}

            {selectedDocs.length > 0 && (
              <div className="space-y-2">
                {selectedDocs.map((doc: any) => {
                  const status = getExpirationStatus(
                    doc.expirationDate as Date | string | null,
                    doc.alertDate as Date | string | null
                  );

                  return (
                    <div
                      key={doc.id}
                      className={`rounded-lg border p-3 text-xs flex flex-col gap-2 shadow-sm transition hover:shadow-md ${status.bgColor} ${status.borderColor}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm leading-tight">
                            {doc.template?.name || "Documento"}
                          </span>

                          <Badge
                            variant="outline"
                            className="mt-1 w-fit text-[10px]"
                          >
                            {status.text}
                          </Badge>
                        </div>

                        <Link
                          href={`/document/${doc.id}`}
                          target="_blank"
                          className="h-7 w-7 shrink-0 cursor-pointer"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>

                      {/* Content */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        {doc.company?.name && (
                          <span>
                            <strong className="font-medium text-foreground">Empresa:</strong>{" "}
                            {doc.company.name}
                          </span>
                        )}

                        {doc.establishment?.name && (
                          <span>
                            <strong className="font-medium text-foreground">Estabelecimento:</strong>{" "}
                            {doc.establishment.name}
                          </span>
                        )}

                        {doc.responsible?.name && (
                          <span>
                            <strong className="font-medium text-foreground">Responsável:</strong>{" "}
                            {doc.responsible.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


