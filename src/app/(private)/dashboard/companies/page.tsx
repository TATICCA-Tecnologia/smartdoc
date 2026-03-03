"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/global/ui";
import { Input } from "@/src/shared/components/global/ui/input";
import { Building2, Plus, Loader2, AlertCircle, Search } from "lucide-react";
import { useModal } from "@/src/shared/context/modal-context";
import { CompanyModal } from "./_components/company-form";
import { api } from "@/src/shared/context/trpc-context";
import { useSelectedCompany } from "@/src/shared/context/company-context";

export default function CompaniesPage() {
  const { selectedCompany } = useSelectedCompany();
  const [search, setSearch] = useState("");
  const { openModal } = useModal();

  const { data, isLoading, error, refetch } = api.company.list.useQuery({
    page: 1,
    pageSize: 10,
    search: search || undefined,
    companyId: selectedCompany?.id || undefined,
  });

  const companies = data?.companies || [];

  const handleCreateCompany = () => {
    openModal(
      "create-company",
      CompanyModal,
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

  const handleEditCompany = (company: any) => {
    openModal(
      `edit-company-${company.id}`,
      CompanyModal,
      {
        company: {
          id: company.id,
          name: company.name,
          cnpj: company.cnpj,
          logoUrl: company.logoUrl ?? undefined,
          stateRegistration: company.stateRegistration || "",
          municipalRegistration: company.municipalRegistration || "",
          status: company.status,
        },
        onSuccess: () => {
          refetch();
        },
      },
      {
        size: "md",
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col flex-1">
            <h1 className="text-2xl font-semibold">Empresas</h1>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col flex-1">
            <h1 className="text-2xl font-semibold">Empresas</h1>
            <p className="text-sm text-red-600">Erro ao carregar dados</p>
          </div>
        </div>
        <Card className="p-6">
          <p className="text-muted-foreground">{error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Empresa, estabelecimento, status e inscrições cadastrais.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleCreateCompany}
        >
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar empresa"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {companies.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground text-center">
            {search.trim()
              ? "Nenhuma empresa encontrada para essa pesquisa."
              : "Nenhuma empresa cadastrada"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company: any) => (
            <Card
              key={company.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEditCompany(company)}
            >
              <CardHeader className="px-6 pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {company.logoUrl ? (
                      <div className="size-12 shrink-0 rounded-lg border bg-muted overflow-hidden">
                        <img
                          src={`/api/company-logo/${company.logoUrl}`}
                          alt=""
                          className="size-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="size-12 shrink-0 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Building2 className="size-6" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs text-muted-foreground">Empresa</span>
                      <CardTitle className="text-base">
                        {company.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {company.establishments.length} estabelecimento(s)
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={company.status === "ACTIVE" ? "default" : "secondary"}
                    className={
                      company.status === "ACTIVE"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }
                  >
                    {company.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-6 pt-0 pb-4 grid gap-4 md:grid-cols-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">CNPJ</span>
                  <span className="font-mono">{company.cnpj}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Insc. estadual
                  </span>
                  <span>{company.stateRegistration || "-"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Insc. municipal
                  </span>
                  <span>{company.municipalRegistration || "-"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
