"use client";

import { useState, useCallback, useMemo } from "react";
import { useModal } from "@/src/shared/context/modal-context";
import { useCompanyScopeFilter } from "@/src/shared/hook/use-company-scope-filter";
import { DocumentFormModal } from "../_components/document-form";
import type { SavedDocument } from "../_components/document-list";
import { api } from "@/src/shared/context/trpc-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useDocumentsPage() {
  const { openModal } = useModal();
  const { scope, setScope, selectedCompany, companyIdForQuery } = useCompanyScopeFilter();
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const establishmentIdFilter = searchParams.get("establishmentId") || undefined;

  const { data: documentsData, isLoading, error, refetch } = api.document.list.useQuery({
    page: 1,
    pageSize: 100,
    ...(companyIdForQuery ? { companyId: companyIdForQuery } : {}),
    ...(establishmentIdFilter ? { establishmentId: establishmentIdFilter } : {}),
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
    groups: (doc.groups?.length
      ? doc.groups
      : doc.group
        ? [doc.group]
        : []
    ).map((group: { id: string; name: string }) => ({
      id: group.id,
      name: group.name,
    })),
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

  const clearEstablishmentFilter = useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  return {
    documents: filteredDocuments,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    handleOpenNewDocument,
    handleEditDocument,
    scope,
    setScope,
    selectedCompany,
    establishmentIdFilter,
    clearEstablishmentFilter,
  };
}

