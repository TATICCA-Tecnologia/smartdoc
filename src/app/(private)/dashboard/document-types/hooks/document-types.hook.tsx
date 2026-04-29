"use client";

import { useModal } from "@/src/shared/context/modal-context";
import { TemplateFormModal } from "../_components/template-form-modal";
import { api } from "@/src/shared/context/trpc-context";
import { useMemo, useCallback, useState } from "react";
import { useDataTable } from "@/src/shared/hook/use-data-table";
import { createColumns } from "../_components/columns";
import { ColumnDef } from "@tanstack/react-table";
import { useCompanyScopeFilter } from "@/src/shared/hook/use-company-scope-filter";

export function useDocumentTypesPage() {
  const { openModal } = useModal();
  const { scope, setScope, selectedCompany, companyIdForQuery } = useCompanyScopeFilter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templatesData, isLoading, refetch } = api.documentTemplate.list.useQuery({
    page: 1,
    pageSize: 100,
    ...(companyIdForQuery ? { companyId: companyIdForQuery } : {}),
  });

  const deleteMutation = api.documentTemplate.delete.useMutation();

  const templates = templatesData?.templates || [];

  // Filtrar por pesquisa (nome ou descrição)
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.trim().toLowerCase();
    return templates.filter(
      (t: { name?: string; description?: string | null | undefined }) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.description || null || "").toLowerCase().includes(q)
    ) as typeof templates;
  }, [templates, searchQuery]);

  // Mapear para formato da tabela
  const tableData = useMemo(() => {
    return templates.map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description || "-",
      fieldsCount: template.fields?.length || 0,
      isDefault: template.isDefault,
      documentsCount: template._count?.documents || 0,
      createdAt: template.createdAt,
    }));
  }, [templates]);

  const handleOpenNewTemplate = useCallback(() => {
    openModal(
      "create-template",
      TemplateFormModal,
      {
        companyId: companyIdForQuery ?? selectedCompany?.id,
        onSuccess: () => {
          refetch();
        },
      },
      {
        size: "lg",
      }
    );
  }, [openModal, refetch, companyIdForQuery, selectedCompany]);

  const handleEditTemplate = useCallback((templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (!template) return;

    openModal(
      `edit-template-${templateId}`,
      TemplateFormModal,
      {
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          isDefault: template.isDefault,
          fields: template.fields || [],
        },
        onSuccess: () => {
          refetch();
        },
      },
      {
        size: "lg",
      }
    );
  }, [openModal, templates, refetch]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      await deleteMutation.mutateAsync({ id: templateId });
      refetch();
    } catch (error: any) {
      const message = error?.message || error?.data?.message || "Erro ao excluir template";
      alert(message);
    }
  }, [deleteMutation, refetch]);

  const columns = useMemo(
    () => createColumns(handleEditTemplate, handleDeleteTemplate),
    [handleEditTemplate, handleDeleteTemplate]
  );

  const { table } = useDataTable({
    data: tableData,
    columns: columns as ColumnDef<{ id: any; name: any; description: any; fieldsCount: any; isDefault: any; documentsCount: any; createdAt: any; }, any>[],
    pageCount: Math.ceil(tableData.length / 10),
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
  });

  return {
    table,
    tableData,
    templates,
    filteredTemplates,
    searchQuery,
    setSearchQuery,
    isLoading,
    handleOpenNewTemplate,
    handleEditTemplate,
    handleDeleteTemplate,
    scope,
    setScope,
    selectedCompany,
  };
}

