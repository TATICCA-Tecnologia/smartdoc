"use client";

import { useMemo, useCallback } from "react";
import { useDataTable } from "@/src/shared/hook/use-data-table";
import { getOrgaoColumns } from "../_components/columns";
import { useModal } from "@/src/shared/context/modal-context";
import { OrgaoModal } from "../_components/orgao-form";
import { api } from "@/src/shared/context/trpc-context";
import { useCompanyScopeFilter } from "@/src/shared/hook/use-company-scope-filter";

export function useOrgaoPage() {
  const { openModal } = useModal();
  const { scope, setScope, selectedCompany, companyIdForQuery } = useCompanyScopeFilter();
  const deleteMutation = api.organization.delete.useMutation();
  const { data, isLoading, error, refetch } = api.organization.list.useQuery({
    page: 1,
    pageSize: 50,
    ...(companyIdForQuery ? { companyId: companyIdForQuery } : {}),
  });

  const organizations = data?.organizations || [];

  // Mapear para formato da tabela
  const tableData = organizations.map((org: any) => ({
    id: org.id,
    name: org.name,
    shortName: org.shortName,
    type: org.type,
    city: org.city || "-",
    state: org.state || "-",
    status: org.status === "ACTIVE" ? "active" : "inactive",
    documentsCount: org._count?.documents || 0,
  }));

  const handleEditOrgao = useCallback(
    (orgao: (typeof tableData)[0]) => {
      const originalOrg = organizations.find((o: any) => o.id === orgao.id);
      if (!originalOrg) return;

      openModal(
        `edit-orgao-${orgao.id}`,
        OrgaoModal,
        {
          organization: {
            id: originalOrg.id,
            name: originalOrg.name,
            shortName: originalOrg.shortName,
            cnpj: originalOrg.cnpj || "",
            type: originalOrg.type,
            address: originalOrg.address || "",
            district: originalOrg.district || "",
            city: originalOrg.city || "",
            state: originalOrg.state || "",
            zipCode: originalOrg.zipCode || "",
            status: originalOrg.status,
          },
          onSuccess: () => {
            refetch();
          },
        },
        {
          size: "md",
        }
      );
    },
    [openModal, organizations, refetch]
  );

  const handleDeleteOrgao = useCallback(async (orgao: (typeof tableData)[0]) => {
    if (!confirm("Tem certeza que deseja excluir este órgão?")) return;

    try {
      await deleteMutation.mutateAsync({ id: orgao.id });
      refetch();
    } catch (error: any) {
      const message = error?.message || error?.data?.message || "Erro ao excluir órgão";
      alert(message);
    }
  }, [deleteMutation, refetch]);

  const columns = useMemo(() => getOrgaoColumns(handleEditOrgao, handleDeleteOrgao), [handleEditOrgao, handleDeleteOrgao]);

  const { table } = useDataTable({
    data: tableData,
    columns,
    pageCount: data?.pagination?.totalPages || 1,
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
  });

  const handleOpenNewOrgao = () => {
    openModal(
      "create-orgao",
      OrgaoModal,
      {
        companyId: companyIdForQuery ?? selectedCompany?.id,
        onSuccess: () => {
          refetch();
        },
      },
      {
        size: "md",
      }
    );
  };

  return {
    orgaos: tableData,
    table,
    isLoading,
    error,
    refetch,
    handleOpenNewOrgao,
    handleEditOrgao,
    handleDeleteOrgao,
    scope,
    setScope,
    selectedCompany,
  };
}











