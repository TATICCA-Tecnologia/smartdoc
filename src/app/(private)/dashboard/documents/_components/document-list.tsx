"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/global/ui";
import { Input } from "@/src/shared/components/global/ui/input";
import { Label } from "@/src/shared/components/global/ui/label";
import { FileText, Download, Calendar, Building2, User, Mail, Loader2, Folder, Pencil, ExternalLink, Plus, Trash2 } from "lucide-react";
import { getExpirationStatus } from "@/src/shared/utils/document-expiration";
import { QRCodeViewer } from "@/src/shared/components/global/qr-code-viewer";
import { GroupQRCodeViewer } from "./group-qr-code-viewer";
import { DocumentPreviewModal } from "./document-preview-modal";
import { DocumentExportFactory, type DocumentData } from "@/src/shared/utils/document-export-factory";

export type SavedDocument = {
  id: string;
  name?: string;
  templateName?: string;
  documentTypeId: string;
  documentTypeName: string;
  orgaoId: string;
  orgaoName: string;
  expirationDate: string;
  alertDate: string;
  responsibleName: string;
  responsibleEmail?: string;
  companyName: string;
  establishmentName: string;
  observations?: string;
  customData?: Record<string, any>;
  status?: string;
  attachments: Array<{
    id?: string;
    name: string;
    size: number;
    type: string;
    filePath?: string;
  }>;
  groupId?: string;
  groupName?: string;
  createdAt: string;
};

function toDocumentData(doc: SavedDocument): DocumentData {
  return {
    id: doc.id,
    templateName: doc.documentTypeName,
    organizationName: doc.orgaoName,
    companyName: doc.companyName,
    establishmentName: doc.establishmentName,
    responsibleName: doc.responsibleName,
    responsibleEmail: doc.responsibleEmail,
    expirationDate: doc.expirationDate || null,
    alertDate: doc.alertDate || null,
    status: doc.status || "ACTIVE",
    observations: doc.observations ?? null,
    customData: doc.customData ?? null,
    createdAt: doc.createdAt,
  };
}

interface DocumentListProps {
  documents: SavedDocument[];
  groupBy?: "group" | "none";
  onEditDocument?: (doc: SavedDocument) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(s: string) {
  return s.trim().length > 0 && EMAIL_REGEX.test(s.trim());
}

export function DocumentList({ documents, groupBy = "none", onEditDocument }: DocumentListProps) {
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
  const [emailConfirmDoc, setEmailConfirmDoc] = useState<SavedDocument | null>(null);
  const [extraEmails, setExtraEmails] = useState<string[]>([""]);
  const [emailError, setEmailError] = useState<string | null>(null);

  const groupedDocuments = useMemo(() => {
    if (groupBy !== "group") {
      return { grouped: {}, ungrouped: documents };
    }

    const grouped: Record<string, SavedDocument[]> = {};
    const ungrouped: SavedDocument[] = [];

    documents.forEach((doc) => {
      if (doc.groupId && doc.groupName) {
        if (!grouped[doc.groupId]) {
          grouped[doc.groupId] = [];
        }
        grouped[doc.groupId].push(doc);
      } else {
        ungrouped.push(doc);
      }
    });

    return { grouped, ungrouped };
  }, [documents, groupBy]);

  const openEmailModal = (doc: SavedDocument) => {
    setEmailConfirmDoc(doc);
    setExtraEmails([""]);
    setEmailError(null);
  };

  const closeEmailModal = () => {
    setEmailConfirmDoc(null);
    setExtraEmails([""]);
    setEmailError(null);
  };

  const addExtraEmail = () => {
    setExtraEmails((prev) => [...prev, ""]);
  };

  const setExtraEmailAt = (index: number, value: string) => {
    setExtraEmails((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setEmailError(null);
  };

  const removeExtraEmailAt = (index: number) => {
    if (extraEmails.length <= 1) return;
    setExtraEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSendEmail = async () => {
    if (!emailConfirmDoc) return;
    const documentId = emailConfirmDoc.id;
    const recipients = [
      emailConfirmDoc.responsibleEmail?.trim(),
      ...extraEmails.map((e) => e.trim()).filter(Boolean),
    ].filter(Boolean) as string[];
    const invalid = recipients.filter((e) => !isValidEmail(e));
    if (invalid.length > 0) {
      setEmailError("Informe e-mails válidos.");
      return;
    }
    if (recipients.length === 0) {
      setEmailError("Adicione ao menos um destinatário ou informe o e-mail do responsável.");
      return;
    }

    setSendingEmails((prev) => ({ ...prev, [documentId]: true }));
    setEmailError(null);
    try {
      const response = await fetch("/api/email/send-expiration-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          recipientEmail: emailConfirmDoc.responsibleEmail || undefined,
          extraEmails: extraEmails.map((e) => e.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar email");
      }
      alert("E-mail de alerta enviado com sucesso!");
      closeEmailModal();
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      setEmailError(error instanceof Error ? error.message : "Erro ao enviar e-mail.");
    } finally {
      setSendingEmails((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const handleExportPreview = async (format: "pdf" | "excel") => {
    if (!previewDoc) return;
    await DocumentExportFactory.export(format, toDocumentData(previewDoc));
  };

  const renderDocumentCard = (doc: SavedDocument) => {
    const expirationStatus = getExpirationStatus(
      doc.expirationDate,
      doc.alertDate
    );

    return (
      <Card key={doc.id} className={`hover:shadow-md transition-shadow ${expirationStatus.borderColor} border-l-4`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="font-semibold text-lg text-left hover:text-primary hover:underline focus:outline-none focus:underline"
                  title="Abrir informações e anexos (exportar)"
                >
                  {doc.documentTypeName}
                </button>
                <p className="text-sm text-muted-foreground">{doc.orgaoName}</p>
              </div>
              {onEditDocument && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditDocument(doc);
                  }}
                  title="Editar documento"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expira em
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${expirationStatus.color}`}>
                  {new Date(doc.expirationDate).toLocaleDateString("pt-BR")}
                </span>
                <Badge
                  variant="outline"
                  className={`${expirationStatus.bgColor} ${expirationStatus.borderColor} ${expirationStatus.color} text-[10px] px-2 py-0.5`}
                >
                  {expirationStatus.text}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Aviso em
              </span>
              <span className="text-sm font-medium">
                {new Date(doc.alertDate).toLocaleDateString("pt-BR")}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Responsável / e-mail
              </span>
              <span className="text-sm font-medium truncate" title={doc.responsibleEmail || undefined}>
                {doc.responsibleEmail ? `${doc.responsibleName} / ${doc.responsibleEmail}` : doc.responsibleName}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Empresa
              </span>
              <span className="text-sm font-medium truncate" title={doc.establishmentName}>
                {doc.companyName}
              </span>
            </div>
          </div>

          {doc.observations && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Observações:</p>
              <p className="text-sm">{doc.observations}</p>
            </div>
          )}

          {doc.attachments && doc.attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Anexos:</p>
              <div className="flex flex-wrap gap-2">
                {doc.attachments.map((att, idx) => (
                  <a
                    key={att.id || idx}
                    href={att.filePath ? `/api/document-attachments/download?path=${encodeURIComponent(att.filePath)}` : undefined}
                    download={att.name}
                    target={att.filePath ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-sm transition-colors"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate max-w-[200px]">{att.name}</span>
                    <Download className="h-3 w-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEmailModal(doc)}
              disabled={sendingEmails[doc.id]}
              className="gap-2"
            >
              {sendingEmails[doc.id] ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Enviar Alerta por Email
                </>
              )}
            </Button>

            <QRCodeViewer
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/document/${doc.id}`}
              fileName={`${doc.documentTypeName} - ${doc.orgaoName}`}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {previewDoc && (
        <DocumentPreviewModal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={toDocumentData(previewDoc)}
          onExport={handleExportPreview}
          attachments={previewDoc.attachments?.map((a) => ({ name: a.name, filePath: a.filePath }))}
        />
      )}

      <Dialog open={!!emailConfirmDoc} onOpenChange={(open) => !open && closeEmailModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Confirmar envio de e-mail
            </DialogTitle>
            <DialogDescription>
              O alerta de vencimento será enviado para o responsável do documento
              {emailConfirmDoc?.responsibleEmail ? (
                <span className="font-medium text-foreground"> ({emailConfirmDoc.responsibleEmail})</span>
              ) : (
                " (nenhum e-mail cadastrado)"
              )}
              {" "}e para os e-mails adicionais que você informar abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm">E-mails adicionais (opcional)</Label>
            {extraEmails.map((value, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={value}
                  onChange={(e) => setExtraEmailAt(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExtraEmailAt(index)}
                  disabled={extraEmails.length <= 1}
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addExtraEmail} className="gap-2 w-full">
              <Plus className="h-4 w-4" />
              Adicionar outro e-mail
            </Button>
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEmailModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSendEmail}
              disabled={emailConfirmDoc ? sendingEmails[emailConfirmDoc.id] : false}
              className="gap-2"
            >
              {emailConfirmDoc && sendingEmails[emailConfirmDoc.id] ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Confirmar envio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {groupBy === "group" ? (
        <div className="grid gap-6">
          {Object.entries(groupedDocuments.grouped).map(([groupId, groupDocs]) => {
            const groupName = groupDocs[0]?.groupName || "Sem nome";
            return (
              <div key={groupId} className="space-y-4">
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                          <Folder className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">{groupName}</h2>
                          <p className="text-sm text-muted-foreground">
                            {groupDocs.length} documento{groupDocs.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <GroupQRCodeViewer groupId={groupId} groupName={groupName} />
                    </div>
                  </CardContent>
                </Card>
                <div className="grid gap-4 pl-4 border-l-2 border-purple-200">
                  {groupDocs.map((doc) => renderDocumentCard(doc))}
                </div>
              </div>
            );
          })}
          {groupedDocuments.ungrouped.length > 0 && (
            <div className="space-y-4">
              <Card className="border-2 border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Documentos sem grupo</h2>
                      <p className="text-sm text-muted-foreground">
                        {groupedDocuments.ungrouped.length} documento{groupedDocuments.ungrouped.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4 pl-4 border-l-2 border-gray-200">
                {groupedDocuments.ungrouped.map((doc) => renderDocumentCard(doc))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {documents?.map((doc) => renderDocumentCard(doc))}
        </div>
      )}
    </>
  );
}













