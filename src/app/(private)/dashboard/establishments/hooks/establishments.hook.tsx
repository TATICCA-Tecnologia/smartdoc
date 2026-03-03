"use client";

import { useMemo, useCallback, useState } from "react";
import { useDataTable } from "@/src/shared/hook/use-data-table";
import { useModal } from "@/src/shared/context/modal-context";
import { useSelectedCompany } from "@/src/shared/context/company-context";
import { EstablishmentModal } from "../_components/establishment-form";
import { getEstablishmentColumns } from "../_components/columns";
import { api } from "@/src/shared/context/trpc-context";

export function useEstablishmentsPage() {
  const { openModal } = useModal();
  const { selectedCompanyId } = useSelectedCompany();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error, refetch } = api.establishment.list.useQuery({
    page: 1,
    pageSize: 50,
    companyId: selectedCompanyId || undefined,
  });

  const establishments = data?.establishments || [];

  const tableData = useMemo(() => establishments.map((est: any) => ({
    id: est.id,
    name: est.name,
    code: est.code || "",
    address: `${est.city || ""}, ${est.state || ""}`.trim().replace(/^,\s*|,\s*$/g, "") || "-",
    status: est.status === "ACTIVE" ? "active" : "inactive",
    filesCount: est._count?.documents || 0,
    company: est.company?.name || "-",
  })), [establishments]);

  // Filtrar por pesquisa (nome, código ou empresa)
  const filteredTableData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    const q = searchQuery.trim().toLowerCase();
    return tableData.filter(
      (row: { name: string; code: string; company: string }) =>
        (row.name || "").toLowerCase().includes(q) ||
        (row.code || "").toLowerCase().includes(q) ||
        (row.company || "").toLowerCase().includes(q)
    );
  }, [tableData, searchQuery]);

  const handleEditEstablishment = useCallback((establishment: (typeof tableData)[0]) => {
    const originalEst = establishments.find((e: any) => e.id === establishment.id);
    if (!originalEst) return;

    openModal(
      `edit-establishment-${establishment.id}`,
      EstablishmentModal,
      {
        establishment: {
          id: originalEst.id,
          companyId: originalEst.company?.id || "",
          name: originalEst.name,
          code: originalEst.code || "",
          cnpj: originalEst.cnpj || "",
          stateRegistration: originalEst.stateRegistration || "",
          municipalRegistration: originalEst.municipalRegistration || "",
          address: originalEst.address || "",
          district: originalEst.district || "",
          city: originalEst.city || "",
          state: originalEst.state || "",
          zipCode: originalEst.zipCode || "",
          status: originalEst.status,
        },
        onSuccess: () => {
          refetch();
        },
      },
      {
        size: "md",
      }
    );
  }, [openModal, establishments, refetch]);

  const columns = useMemo(() => getEstablishmentColumns(handleEditEstablishment), [handleEditEstablishment]);

  const { table } = useDataTable({
    data: filteredTableData,
    columns,
    pageCount: data?.pagination?.totalPages || 1,
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
  });

  const handleOpenNewEstablishment = () => {
    openModal(
      "create-establishment",
      EstablishmentModal,
      {
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
    establishments: filteredTableData,
    searchQuery,
    setSearchQuery,
    table,
    isLoading,
    error,
    refetch,
    handleOpenNewEstablishment,
    handleEditEstablishment,
  };
}


