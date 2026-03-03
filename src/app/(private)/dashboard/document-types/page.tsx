"use client";

import { Suspense } from "react";
import { useDocumentTypesPage } from "./hooks/document-types.hook";
import { Button } from "@/src/shared/components/global/ui/button";
import { Input } from "@/src/shared/components/global/ui/input";
import { Plus, Loader2, Search } from "lucide-react";
import { TemplateCard } from "./_components/template-card";

function DocumentTypesPageContent() {
  const {
    filteredTemplates,
    searchQuery,
    setSearchQuery,
    isLoading,
    handleOpenNewTemplate,
    handleEditTemplate,
    handleDeleteTemplate,
  } = useDocumentTypesPage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Documentos</h1>
          <p className="text-muted-foreground">
            Gerencie os modelos de documentos do sistema
          </p>
        </div>
        <Button onClick={handleOpenNewTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar modelo"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-64 rounded-xl border border-border/60 bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/60">
          <p className="text-sm text-muted-foreground">
            {searchQuery.trim()
              ? "Nenhum modelo encontrado para essa pesquisa."
              : "Nenhum modelo cadastrado. Clique em \"Novo Modelo\" para criar o primeiro."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template: any) => (
            <TemplateCard
              key={template.id}
              template={template as any}
              onEdit={() => handleEditTemplate(template.id)}
              onDelete={() => handleDeleteTemplate(template.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentTypesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <DocumentTypesPageContent />
    </Suspense>
  );
}

