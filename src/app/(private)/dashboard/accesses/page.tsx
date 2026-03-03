"use client";

import { Suspense } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/src/shared/components/global/ui";
import { DataTable } from "@/src/shared/components/global/datatable/data-table";
import { Input } from "@/src/shared/components/global/ui/input";
import { Shield, Plus, Loader2, AlertCircle, Search } from "lucide-react";
import { useAccessesPage } from "./hooks/accesses.hook";

const TIPOS_ACESSO_DESCRICOES: { nome: string; descricao: string }[] = [
  { nome: "ADMINISTRADOR", descricao: "Acesso total ao sistema" },
  { nome: "EDITOR", descricao: "Pode criar e editar documentos" },
  { nome: "LEITOR", descricao: "Apenas visualização de documentos e Download" },
];

function AccessesPageContent() {
  
  const { 
    table, 
    isLoading, 
    error, 
    refetch, 
    searchQuery,
    setSearchQuery,
    handleOpenNewAccess, 
  } = useAccessesPage();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col flex-1">
            <h1 className="text-2xl font-semibold">Acessos</h1>
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
            <h1 className="text-2xl font-semibold">Acessos</h1>
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
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold">Acessos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários e seus tipos de acesso ao sistema.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleOpenNewAccess}
        >
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar usuário"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader className="px-6 pb-0">
          <CardTitle className="text-base">Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-4">
          <DataTable table={table} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-6 pb-0">
          <CardTitle className="text-base">Tipos de acesso</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-4 space-y-2 pb-4">
          {TIPOS_ACESSO_DESCRICOES.map((item) => (
            <div key={item.nome} className="flex items-start gap-2">
              <div className="w-32 text-sm font-medium shrink-0">{item.nome}:</div>
              <p className="text-sm text-muted-foreground">{item.descricao}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccessesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AccessesPageContent />
    </Suspense>
  );
}
