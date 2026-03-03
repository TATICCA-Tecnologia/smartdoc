"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/src/shared/components/global/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/shared/components/global/ui/form";
import { Input } from "@/src/shared/components/global/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/global/ui/select";
import { useZodForm } from "@/src/shared/hook/use-zod-form";
import { ModalProps } from "@/src/shared/types/modal";
import { api } from "@/src/shared/context/trpc-context";
import { ImagePlus, X } from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  cnpj: string;
  logoUrl?: string | null;
  stateRegistration: string;
  municipalRegistration: string;
  status: "ACTIVE" | "INACTIVE";
}

interface CompanyModalData {
  company?: CompanyData;
  onSuccess: () => void;
}

const companySchema = z.object({
  name: z
    .string()
    .min(1, "Nome da empresa é obrigatório")
    .max(120, "Máximo de 120 caracteres"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  logoUrl: z.string().optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export function CompanyModal({ onClose, data }: ModalProps<CompanyModalData>) {
  const form = useZodForm(companySchema, {
    defaultValues: {
      name: data?.company?.name || "",
      status: data?.company?.status || "ACTIVE",
      cnpj: data?.company?.cnpj || "",
      logoUrl: data?.company?.logoUrl || "",
      stateRegistration: data?.company?.stateRegistration || "",
      municipalRegistration: data?.company?.municipalRegistration || "",
    },
  });

  if (!data) return null;

  const isEditing = !!data.company;

  const createMutation = api.company.create.useMutation({
    onSuccess: () => {
      data.onSuccess();
      onClose();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const updateMutation = api.company.update.useMutation({
    onSuccess: () => {
      data.onSuccess();
      onClose();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const deleteMutation = api.company.delete.useMutation({
    onSuccess: () => {
      data.onSuccess();
      onClose();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const handleSubmit = (values: CompanyFormValues) => {
    if (isEditing && data.company) {
      updateMutation.mutate({
        id: data.company.id,
        ...values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/company-logo/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro no upload");
      form.setValue("logoUrl", json.logoUrl);
    } catch (err) {
      form.setError("logoUrl", { message: err instanceof Error ? err.message : "Erro ao enviar logo" });
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  const logoUrl = form.watch("logoUrl");
  const logoPreviewUrl = logoUrl ? `/api/company-logo/${logoUrl}` : null;

  const handleDelete = () => {
    if (data.company && confirm("Tem certeza que deseja excluir esta empresa?")) {
      deleteMutation.mutate({ id: data.company.id });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="max-h-[90vh] overflow-y-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">
          {isEditing ? "Editar Empresa" : "Nova Empresa"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditing
            ? "Edite os dados da empresa."
            : "Preencha os dados da empresa para adicioná-la à lista."}
        </p>
      </div>

      {form.formState.errors.root && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Empresa XPTO S.A." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger size="default" className="w-full">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="INACTIVE">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo (opcional)</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-2 w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden w-full"
                      onChange={handleLogoChange}
                      disabled={logoUploading}
                    />
                    {logoPreviewUrl ? (
                      <div className="flex items-center gap-3 w-full">
                        <div className="relative size-20 rounded-lg border bg-muted overflow-hidden shrink-0">
                          <img
                            src={logoPreviewUrl}
                            alt="Logo"
                            className="size-full object-contain"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={logoUploading}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Trocar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={logoUploading}
                            onClick={() => form.setValue("logoUrl", "")}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={logoUploading}
                        className="w-full"
                      >
                        <ImagePlus className="size-4 mr-2" />
                        {logoUploading ? "Enviando..." : "Enviar logo"}
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000/0000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stateRegistration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inscrição Estadual</FormLabel>
                <FormControl>
                  <Input placeholder="Inscrição estadual (opcional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="municipalRegistration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inscrição Municipal</FormLabel>
                <FormControl>
                  <Input placeholder="Inscrição municipal (opcional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between gap-3 pt-4 border-t">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}











