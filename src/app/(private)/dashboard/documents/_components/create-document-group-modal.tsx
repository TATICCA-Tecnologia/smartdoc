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
import { Textarea } from "@/src/shared/components/global/ui/textarea";
import { useZodForm } from "@/src/shared/hook/use-zod-form";
import { ModalProps } from "@/src/shared/types/modal";
import { Loader2 } from "lucide-react";
import { api } from "@/src/shared/context/trpc-context";

interface CreateDocumentGroupModalData {
  companyId?: string;
  onSuccess: (groupId: string) => void;
}

const createDocumentGroupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

type CreateDocumentGroupFormValues = z.infer<typeof createDocumentGroupSchema>;

export function CreateDocumentGroupModal({
  onClose,
  data,
}: ModalProps<CreateDocumentGroupModalData>) {
  const form = useZodForm(createDocumentGroupSchema, {
    defaultValues: {
      name: "",
      description: "",
    },
  });

  if (!data) return null;

  const createGroupMutation = api.documentGroup.create.useMutation({
    onSuccess: (group) => {
      data.onSuccess(group.id);
      onClose();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const handleSubmit = async (values: CreateDocumentGroupFormValues) => {
    createGroupMutation.mutate({
      name: values.name,
      description: values.description || undefined,
      companyId: data?.companyId,
    });
  };

  const isSubmitting = createGroupMutation.isPending;

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Criar Grupo de Documentos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crie um novo grupo para organizar seus documentos.
        </p>
      </div>

      {form.formState.errors.root && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Grupo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Licenças Ambientais"
                    {...field}
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o propósito deste grupo..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Grupo"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}







