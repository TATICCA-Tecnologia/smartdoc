"use client";

import { useState, useCallback, useMemo } from "react";
import { useModal } from "@/src/shared/context/modal-context";
import { useSelectedCompany } from "@/src/shared/context/company-context";
import { DocumentFormModal } from "../_components/document-form";
import type { SavedDocument } from "../_components/document-list";
import { api } from "@/src/shared/context/trpc-context";

export function useDocumentsPage() {
  const { openModal } = useModal();
  const { selectedCompanyId } = useSelectedCompany();
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar documentos do banco (filtrado pela empresa selecionada)
  const { data: documentsData, isLoading, error, refetch } = api.document.list.useQuery({
    page: 1,
    pageSize: 100,
    ...(selectedCompanyId ? { companyId: selectedCompanyId } : {}),
  });

  const documents = documentsData?.documents || [];

  const mappedDocuments = useMemo(() => documents.map((doc: any) => ({
    id: doc.id,
    name: doc.template?.name || "Documento",
    templateName: doc.template?.name || "",
    documentTypeId: doc.template?.id || "",
    documentTypeName: doc.template?.name || "",
    orgaoId: doc.organization?.id || "",
    orgaoName: doc.organization?.shortName || "",
    companyName: doc.company?.name || "",
    establishmentName: doc.establishment?.name || "",
    responsibleName: doc.responsible?.name || "",
    responsibleEmail: doc.responsible?.email || undefined,
    status: doc.status,
    expirationDate: doc.expirationDate?.toISOString() || "",
    alertDate: doc.alertDate?.toISOString() || "",
    observations: doc.observations || undefined,
    customData: doc.customData,
    groupId: doc.group?.id || undefined,
    groupName: doc.group?.name || undefined,
    attachments: (doc.attachments || []).map((a: any) => ({
      name: a.fileName,
      size: a.fileSize || 0,
      type: a.fileType || "",
      id: a.id,
      filePath: a.filePath,
    })),
    createdAt: doc.createdAt.toISOString(),
  })), [documents]);

  const filteredDocuments = useMemo((): SavedDocument[] => {
    if (!searchQuery.trim()) return mappedDocuments;
    const q = searchQuery.trim().toLowerCase();
    return mappedDocuments.filter(
      (d: SavedDocument) =>
        (d.documentTypeName || "").toLowerCase().includes(q) ||
        (d.orgaoName || "").toLowerCase().includes(q) ||
        (d.companyName || "").toLowerCase().includes(q) ||
        (d.establishmentName || "").toLowerCase().includes(q) ||
        (d.responsibleName || "").toLowerCase().includes(q) ||
        (d.observations || "").toLowerCase().includes(q)
    );
  }, [mappedDocuments, searchQuery]);

  const handleOpenNewDocument = useCallback(() => {
    openModal(
      "create-document",
      DocumentFormModal,
      {
        onSuccess: () => {
          refetch();
        },
      },
      {
        className: "max-w-full lg:max-w-5xl",
      }
    );
  }, [openModal, refetch]);

  const handleEditDocument = useCallback((doc: SavedDocument) => {
    openModal(
      "edit-document-" + doc.id,
      DocumentFormModal,
      {
        documentId: doc.id,
        onSuccess: () => {
          refetch();
        },
      },
      {
        className: "max-w-full lg:max-w-5xl",
      }
    );
  }, [openModal, refetch]);

  return {
    documents: filteredDocuments,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    handleOpenNewDocument,
    handleEditDocument,
  };
}

