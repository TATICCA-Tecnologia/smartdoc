"use client";
import { Suspense, useMemo, useState } from "react";
import {
  Plus,
  Loader2,
  LayoutGrid,
  List,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/src/shared/components/global/ui";
import { Input } from "@/src/shared/components/global/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/global/ui/select";
import { DocumentList } from "./_components/document-list";
import { DocumentExportButton } from "./_components/document-export-button";
import { useDocumentsPage } from "./hooks/documents.hook";
import { CompanyScopeToggle } from "@/src/shared/components/global/company-scope-toggle";

function DocumentsPageContent() {
  const {
    documents,
    handleOpenNewDocument,
    handleEditDocument,
    searchQuery,
    setSearchQuery,
    isLoading: documentsLoading,
    scope,
    setScope,
    selectedCompany,
    establishmentIdFilter,
    socialReasonIdFilter,
    socialReasonFilterName,
    clearFilter,
    page,
    setPage,
    totalPages,
    total,
  } = useDocumentsPage();
  const [viewMode, setViewMode] = useState<"none" | "group">("none");

  const exportDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];

    return documents.map((doc: any) => ({
      id: doc.id,
      templateName: doc.templateName || "Documento",
      organizationName: doc.orgaoName || "",
      companyName: doc.companyName || "",
      establishmentName: doc.establishmentName || "",
      responsibleName: doc.responsibleName || "",
      responsibleEmail: doc.responsibleEmail,
      expirationDate: new Date(doc.expirationDate!).toISOString(),
      alertDate: new Date(doc.alertDate!).toISOString(),
      status: doc.status,
      observations: doc.observations || undefined,
      customData: doc.customData as Record<string, any> | undefined,
      createdAt: new Date(doc.createdAt!).toISOString() as any,
    })) as any;
  }, [documents]);


  if (documentsLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Documentos</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold">Documentos</h1>
          <CompanyScopeToggle
            className="mt-2"
            value={scope}
            onChange={setScope}
            selectedCompanyName={selectedCompany?.name}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar documento"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as "none" | "group")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span>Lista</span>
                </div>
              </SelectItem>
              <SelectItem value="group">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span>Por Grupo</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <DocumentExportButton
            documents={exportDocuments}
            disabled={documents.length === 0}
          />
          <Button variant="default" size="sm" onClick={handleOpenNewDocument}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </Button>
        </div>
      </div>
      {socialReasonIdFilter && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-sm text-emerald-800">
            Exibindo documentos da razão social: <strong>{socialReasonFilterName || "selecionada"}</strong>
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            Limpar filtro
          </Button>
        </div>
      )}
      {establishmentIdFilter && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-sm text-emerald-800">
            Exibindo documentos filtrados por estabelecimento.
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            Limpar filtro
          </Button>
        </div>
      )}

      <DocumentList
        documents={documents as any}
        groupBy={viewMode === "group" ? "group" : "none"}
        onEditDocument={handleEditDocument}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} — {total} documento{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DocumentsPageContent />
    </Suspense>
  );
}