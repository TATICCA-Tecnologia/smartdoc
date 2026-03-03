"use client";
import { useMemo, useState } from "react";
import {
  Plus,
  Loader2,
  LayoutGrid,
  List,
  Search,
  FileText,
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

export default function DocumentsPage() {
  const {
    documents,
    handleOpenNewDocument,
    handleEditDocument,
    searchQuery,
    setSearchQuery,
    isLoading: documentsLoading,
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

      <DocumentList
        documents={documents as any}
        groupBy={viewMode === "group" ? "group" : "none"}
        onEditDocument={handleEditDocument}
      />
    </div>
  );
}