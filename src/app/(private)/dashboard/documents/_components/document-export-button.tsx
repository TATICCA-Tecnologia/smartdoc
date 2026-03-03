"use client";

import { useState } from "react";
import { Button } from "@/src/shared/components/global/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/src/shared/components/global/ui/dropdown-menu";
import { FileText, FileSpreadsheet, File, Download, Loader2, Eye } from "lucide-react";
import { DocumentExportFactory, type DocumentData, type ExportFormat } from "@/src/shared/utils/document-export-factory";
import { DocumentPreviewModal } from "./document-preview-modal";

interface DocumentExportButtonProps {
  documents: DocumentData | DocumentData[];
  disabled?: boolean;
}

export function DocumentExportButton({ documents, disabled }: DocumentExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentData | null>(null);

  // Garantir que documents seja sempre um array
  const documentsArray = Array.isArray(documents) ? documents : [documents];

  const handleExport = async (format: ExportFormat) => {
    if (documentsArray.length === 0) {
      alert("Nenhum documento para exportar");
      return;
    }

    setIsExporting(true);
    setExportingFormat(format);

    try {
      await DocumentExportFactory.export(format, documentsArray.length === 1 ? documentsArray[0] : documentsArray);
    } catch (error) {
      console.error("Erro ao exportar documento:", error);
      alert("Erro ao exportar documento. Por favor, tente novamente.");
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const getIcon = (format: ExportFormat) => {
    switch (format) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  const getLabel = (format: ExportFormat) => {
    switch (format) {
      case "pdf":
        return "Exportar como PDF";
      case "excel":
        return "Exportar como Excel";
    }
  };

  const handlePreview = () => {
    if (documentsArray.length === 0) return;
    // Se houver apenas um documento, mostra preview dele
    // Se houver múltiplos, mostra o primeiro
    setPreviewDocument(documentsArray[0]);
    setPreviewOpen(true);
  };

  const handlePreviewExport = async (format: ExportFormat) => {
    if (!previewDocument) return;
    await handleExport(format);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled || isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {documentsArray.length === 1 && (
            <DropdownMenuItem onClick={handlePreview} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </DropdownMenuItem>
          )}
          {(["pdf", "excel"] as ExportFormat[]).map((format) => (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
              className="gap-2"
            >
              {exportingFormat === format ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                getIcon(format)
              )}
              {getLabel(format)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {previewDocument && (
        <DocumentPreviewModal
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewDocument(null);
          }}
          document={previewDocument}
          onExport={handlePreviewExport}
        />
      )}
    </>
  );
}

