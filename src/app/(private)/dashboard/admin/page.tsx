"use client";

import { Suspense, useState } from "react";
import {
  Button,
  Card,
  CardContent,
} from "@/src/shared/components/global/ui";
import { Input } from "@/src/shared/components/global/ui/input";
import { Badge } from "@/src/shared/components/global/ui/badge";
import {
  ShieldCheck,
  Plus,
  Search,
  Building2,
  Users,
  RefreshCw,
} from "lucide-react";
import { api } from "@/src/shared/context/trpc-context";
import { useModal } from "@/src/shared/context/modal-context";
import { CreateUserModal } from "./_components/create-user-modal";
import { CreateCompanyModal } from "./_components/create-company-modal";
import { Pagination } from "./_components/pagination";

type Tab = "users" | "companies";

const PAGE_SIZE = 10;

function UserSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start justify-between py-3.5 gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-28 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompanySkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start justify-between py-3.5 gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-36 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyUsers() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Nenhum usuário encontrado</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tente ajustar a pesquisa ou crie um novo usuário.
        </p>
      </div>
    </div>
  );
}

function EmptyCompanies() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Nenhuma empresa encontrada</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tente ajustar a pesquisa ou cadastre uma nova empresa.
        </p>
      </div>
    </div>
  );
}

function AdminPageContent() {
  const [tab, setTab] = useState<Tab>("users");
  const [userSearch, setUserSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [companyPage, setCompanyPage] = useState(1);
  const { openModal } = useModal();
  const utils = api.useUtils();

  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } =
    api.admin.listAllUsers.useQuery({
      page: userPage,
      pageSize: PAGE_SIZE,
      search: userSearch || undefined,
    });

  const { data: companiesData, isLoading: loadingCompanies, refetch: refetchCompanies } =
    api.admin.listAllCompanies.useQuery({
      page: companyPage,
      pageSize: PAGE_SIZE,
      search: companySearch || undefined,
    });

  const { data: rolesData } = api.admin.listRoles.useQuery();

  const handleUserSearch = (value: string) => {
    setUserSearch(value);
    setUserPage(1);
  };

  const handleCompanySearch = (value: string) => {
    setCompanySearch(value);
    setCompanyPage(1);
  };

  const handleCreateUser = () => {
    openModal(
      "admin-create-user",
      CreateUserModal,
      {
        roles: rolesData ?? [],
        companies: companiesData?.companies.map((c) => ({ id: c.id, name: c.name })) ?? [],
        onSuccess: () => utils.admin.listAllUsers.invalidate(),
      },
      { size: "md" }
    );
  };

  const handleCreateCompany = () => {
    openModal(
      "admin-create-company",
      CreateCompanyModal,
      {
        onSuccess: () => utils.admin.listAllCompanies.invalidate(),
      },
      { size: "md" }
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Painel SuperAdmin</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as empresas e usuários do sistema.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            tab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Usuários
          {usersData && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {usersData.pagination.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("companies")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${
            tab === "companies"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Empresas
          {companiesData && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {companiesData.pagination.total}
            </span>
          )}
        </button>
      </div>

      {/* Users Tab */}
      <div
        key={tab}
        className="flex flex-col gap-4 transition-opacity duration-200 animate-in fade-in"
      >
        {tab === "users" && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar usuário..."
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleCreateUser}>
                <Plus className="h-4 w-4" />
                Novo usuário
              </Button>
            </div>

            <Card>
              <CardContent className="px-6 pt-4 pb-4">
                {loadingUsers ? (
                  <UserSkeleton />
                ) : (
                  <>
                    <div className="divide-y">
                      {usersData?.users.map((user) => (
                        <div key={user.id} className="flex items-start justify-between py-3.5 gap-4">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{user.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex flex-wrap gap-1 justify-end">
                              {user.roles.map((r) => (
                                <Badge key={r.id} variant="secondary" className="text-xs">
                                  {r.name}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {user.companies.map((c) => (
                                <span
                                  key={c.id}
                                  className="text-[11px] text-muted-foreground border rounded px-1.5 py-0.5"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      {usersData?.users.length === 0 && <EmptyUsers />}
                    </div>
                    {usersData && usersData.pagination.totalPages > 1 && (
                      <Pagination
                        page={userPage}
                        totalPages={usersData.pagination.totalPages}
                        total={usersData.pagination.total}
                        pageSize={PAGE_SIZE}
                        onPageChange={setUserPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Companies Tab */}
        {tab === "companies" && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar empresa..."
                  value={companySearch}
                  onChange={(e) => handleCompanySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchCompanies()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleCreateCompany}>
                <Plus className="h-4 w-4" />
                Nova empresa
              </Button>
            </div>

            <Card>
              <CardContent className="px-6 pt-4 pb-4">
                {loadingCompanies ? (
                  <CompanySkeleton />
                ) : (
                  <>
                    <div className="divide-y">
                      {companiesData?.companies.map((company) => (
                        <div key={company.id} className="flex items-start justify-between py-3.5 gap-4">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{company.name}</span>
                            <span className="text-xs text-muted-foreground">{company.cnpj}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                company.status === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                              }`}
                            >
                              {company.status === "ACTIVE" ? "Ativa" : "Inativa"}
                            </span>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {company._count.userCompanies} usuário{company._count.userCompanies !== 1 ? "s" : ""}
                              {" · "}
                              {company._count.documents} doc{company._count.documents !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                      {companiesData?.companies.length === 0 && <EmptyCompanies />}
                    </div>
                    {companiesData && companiesData.pagination.totalPages > 1 && (
                      <Pagination
                        page={companyPage}
                        totalPages={companiesData.pagination.totalPages}
                        total={companiesData.pagination.total}
                        pageSize={PAGE_SIZE}
                        onPageChange={setCompanyPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-muted animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-3.5 w-64 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-px w-full bg-border" />
        <UserSkeleton />
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
