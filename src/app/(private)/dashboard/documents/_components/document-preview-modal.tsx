"use client";

import { useMemo } from "react";
import { Button } from "@/src/shared/components/global/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/global/ui/dialog";
import { FileText, Calendar, Building2, User, Mail, Download } from "lucide-react";
import { type DocumentData } from "@/src/shared/utils/document-export-factory";
import { Badge } from "@/src/shared/components/global/ui/badge";

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  document: DocumentData;
  onExport?: (format: "pdf" | "excel") => void;
  attachments?: Array<{ name: string; filePath?: string }>;
}

export function DocumentPreviewModal({
  open,
  onClose,
  document,
  onExport,
  attachments = [],
}: DocumentPreviewModalProps) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    EXPIRED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: "Ativo",
    EXPIRED: "Expirado",
    PENDING: "Pendente",
    CANCELLED: "Cancelado",
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Não informada";
    try {
      return new Date(date).toLocaleDateString("pt-BR");
    } catch {
      return date;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visualização do Documento
          </DialogTitle>
          <DialogDescription>
            Visualize as informações do documento antes de exportar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cabeçalho */}
          <div className="border-b pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{document.templateName}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {document.organizationName}
                </p>
              </div>
              <Badge className={statusColors[document.status] || statusColors.ACTIVE}>
                {statusLabels[document.status] || document.status}
              </Badge>
            </div>
          </div>

          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Building2 className="h-3 w-3" />
                  Empresa
                </label>
                <p className="text-sm font-medium">{document.companyName}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Building2 className="h-3 w-3" />
                  Estabelecimento
                </label>
                <p className="text-sm font-medium">{document.establishmentName}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <User className="h-3 w-3" />
                  Responsável
                </label>
                <p className="text-sm font-medium">{document.responsibleName}</p>
              </div>

              {document.responsibleEmail && (
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="text-sm font-medium">{document.responsibleEmail}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3" />
                  Data de Expiração
                </label>
                <p className="text-sm font-medium">{formatDate(document.expirationDate)}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3" />
                  Data de Alerta
                </label>
                <p className="text-sm font-medium">{formatDate(document.alertDate)}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1">
                  Data de Criação
                </label>
                <p className="text-sm font-medium">
                  {formatDate(document.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Campos Customizados */}
          {document.customData && Object.keys(document.customData).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Campos Customizados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(document.customData).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground mb-1">{key}</label>
                    <p className="text-sm font-medium">{String(value || "-")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {document.observations && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Observações</h4>
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm whitespace-pre-wrap">{document.observations}</p>
              </div>
            </div>
          )}

          {/* Anexos */}
          {attachments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Anexos</h4>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.filePath ? `/api/document-attachments/download?path=${encodeURIComponent(att.filePath)}` : undefined}
                    download={att.name}
                    target={att.filePath ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{att.name}</span>
                    <Download className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            ID: {document.id}
          </div>
          <div className="flex gap-2">
            {onExport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onExport("pdf");
                    onClose();
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onExport("excel");
                    onClose();
                  }}
                >
                  Exportar Excel
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}














