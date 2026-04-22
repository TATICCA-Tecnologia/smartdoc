"use client";

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
import { useEffect } from "react";

interface EstablishmentData {
  id: string;
  companyId: string;
  name: string;
  code: string;
  cnpj: string;
  stateRegistration: string;
  municipalRegistration: string;
  address: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  status: "ACTIVE" | "INACTIVE";
}

interface EstablishmentModalData {
  companyId?: string;
  establishment?: EstablishmentData;
  onSuccess: () => void;
}

const establishmentSchema = z.object({
  companyId: z.string().min(1, "Empresa é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório").max(120, "Máximo de 120 caracteres"),
  code: z.string().max(20, "Máximo de 20 caracteres").optional(),
  cnpj: z.string().optional(),
  address: z.string().max(180, "Máximo de 180 caracteres").optional(),
  district: z.string().max(100, "Máximo de 100 caracteres").optional(),
  city: z.string().max(100, "Máximo de 100 caracteres").optional(),
  state: z.string().max(2, "Use a sigla do estado (ex: SP)").optional(),
  zipCode: z.string().max(10, "Máximo de 10 caracteres").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type EstablishmentFormValues = z.infer<typeof establishmentSchema>;

export function EstablishmentModal({
  onClose,
  data,
}: ModalProps<EstablishmentModalData>) {
  // Buscar empresas para o select
  const { data: companiesData } = api.company.list.useQuery({
    page: 1,
    pageSize: 100,
  });

  const companies = companiesData?.companies || [];

  const form = useZodForm(establishmentSchema, {
    defaultValues: {
      companyId: data?.establishment?.companyId || data?.companyId || "",
      name: data?.establishment?.name || "",
      code: data?.establishment?.code || "",
      cnpj: data?.establishment?.cnpj || "",
      address: data?.establishment?.address || "",
      district: data?.establishment?.district || "",
      city: data?.establishment?.city || "",
      state: data?.establishment?.state || "",
      zipCode: data?.establishment?.zipCode || "",
      status: data?.establishment?.status || "ACTIVE",
    },
  });

  // Pré-seleciona: empresa do navbar > primeira da lista
  useEffect(() => {
    if (data?.establishment) return;
    const current = form.getValues("companyId");
    if (current) return;
    const fallback = companies[0]?.id;
    if (fallback) form.setValue("companyId", fallback);
  }, [companies]);

  if (!data) return null;

  const isEditing = !!data.establishment;

  const createMutation = api.establishment.create.useMutation({
    onSuccess: () => {
      data.onSuccess();
      onClose();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const updateMutation = api.establishment.update.useMutation({
    onSuccess: () => {
      data.onSuccess();
      onClose();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const deleteMutation = api.establishment.delete.useMutation({
    onSuccess: () => {
      data.onSuccess();
      onClose();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const handleSubmit = (values: EstablishmentFormValues) => {
    if (isEditing && data.establishment) {
      updateMutation.mutate({
        id: data.establishment.id,
        ...values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = () => {
    if (data.establishment && confirm("Tem certeza que deseja excluir este estabelecimento?")) {
      deleteMutation.mutate({ id: data.establishment.id });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="max-h-[90vh] overflow-y-auto p-6" id="form-estabelecimento">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">
          {isEditing ? "Editar Estabelecimento" : "Novo Estabelecimento"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditing
            ? "Edite os dados do estabelecimento."
            : "Preencha os dados do estabelecimento para adicioná-lo à lista."}
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
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl>
                  <Select value={field.value}  onValueChange={field.onChange}>
                    <SelectTrigger size="default" className="w-full">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Matriz São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: MTZ-SP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Endereço completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="SP" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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


