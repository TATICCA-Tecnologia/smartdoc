"use client";

import { useState, useEffect } from "react";
import { useZodForm } from "@/src/shared/hook/use-zod-form";
import { z } from "zod";
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
import { Button } from "@/src/shared/components/global/ui/button";
import { Checkbox } from "@/src/shared/components/global/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/global/ui/select";
import { api } from "@/src/shared/context/trpc-context";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ModalProps } from "@/src/shared/types/modal";

const fieldTypeOptions = [
  { value: "TEXT", label: "Texto" },
  { value: "NUMBER", label: "Número" },
  { value: "DATE", label: "Data" },
  { value: "EMAIL", label: "Email" },
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "PHONE", label: "Telefone" },
  { value: "TEXTAREA", label: "Área de Texto" },
  { value: "SELECT", label: "Seleção" },
  { value: "FILE", label: "Arquivo" },
];

type FieldType = "TEXT" | "NUMBER" | "DATE" | "EMAIL" | "CPF" | "CNPJ" | "PHONE" | "TEXTAREA" | "SELECT" | "FILE";
type ValidationRule = "NONE" | "CPF" | "CNPJ" | "EMAIL" | "NUMBER" | "PHONE";

const validationRuleOptions: Array<{ value: ValidationRule; label: string }> = [
  { value: "NONE", label: "Sem validação específica" },
  { value: "CPF", label: "Validar CPF" },
  { value: "CNPJ", label: "Validar CNPJ" },
  { value: "EMAIL", label: "Validar e-mail" },
  { value: "NUMBER", label: "Validar número" },
  { value: "PHONE", label: "Validar telefone" },
];

type Field = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  options?: string[];
  validationRule?: ValidationRule;
};

const FIELD_NAME_REGEX = /^[a-z][a-z0-9_]*$/;

function normalizeFieldName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function validateTemplateFields(fields: Field[]): string | null {
  const names = new Set<string>();

  for (const field of fields) {
    const normalizedName = normalizeFieldName(field.name);
    if (!normalizedName || !field.label.trim()) {
      return "Todos os campos devem ter nome e label";
    }

    if (!FIELD_NAME_REGEX.test(normalizedName)) {
      return "Nome do campo deve começar com letra e conter apenas letras minúsculas, números e underscore";
    }

    if (names.has(normalizedName)) {
      return `Nome de campo duplicado: ${normalizedName}`;
    }
    names.add(normalizedName);

    if (field.type === "SELECT") {
      const options = (field.options || [])
        .map((option) => option.trim())
        .filter(Boolean);

      if (options.length === 0) {
        return "Campos do tipo SELECT devem ter pelo menos uma opção";
      }

      const uniqueOptions = new Set(options.map((option) => option.toLowerCase()));
      if (uniqueOptions.size !== options.length) {
        return `O campo ${normalizedName} possui opções duplicadas`;
      }
    }
  }

  return null;
}

const templateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  companyId: z.string().min(1, "Selecione uma empresa"),
});

type TemplateFormModalData = {
  companyId?: string;
  template?: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    companyId?: string | null;
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      options: string[];
        validationRule?: ValidationRule | null;
    }>;
  };
  onSuccess?: () => void;
};

export function TemplateFormModal({
  onClose,
  data,
}: ModalProps<TemplateFormModalData>) {
  const [fields, setFields] = useState<Field[]>(
    data?.template?.fields.map((f, index) => ({
      id: f.id || `field-${index}`,
      name: f.name,
      label: f.label,
      type: f.type as FieldType,
      required: f.required,
      order: f.order,
      options: f.options || [],
      validationRule: f.validationRule || "NONE",
    })) || []
  );

  const { data: companiesData } = api.company.list.useQuery({
    page: 1,
    pageSize: 100,
  });
  const companies = companiesData?.companies ?? [];

  const form = useZodForm(templateSchema, {
    defaultValues: {
      name: data?.template?.name || "",
      description: data?.template?.description || "",
      isDefault: data?.template?.isDefault || false,
      companyId: data?.template?.companyId || data?.companyId || "",
    },
  });

  useEffect(() => {
    if (data?.template) return;
    const current = form.getValues("companyId");
    if (current) return;
    const fallback = companies[0]?.id;
    if (fallback) form.setValue("companyId", fallback);
  }, [companies]);

  const createMutation = api.documentTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
      data?.onSuccess?.();
      onClose();
    },
  });

  const updateMutation = api.documentTemplate.update.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado com sucesso!");
      data?.onSuccess?.();
      onClose();
    },
  });

  const addField = () => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      name: "",
      label: "",
      type: "TEXT",
      required: false,
      order: fields.length,
      validationRule: "NONE",
    };
    setFields([...fields, newField]);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const updateField = (fieldId: string, updates: Partial<Field>) => {
    setFields(
      fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  };

  const handleSubmit = async (values: z.infer<typeof templateSchema>) => {
    if (fields.length === 0) {
      form.setError("root", { message: "Adicione pelo menos um campo" });
      return;
    }

    const fieldsValidationError = validateTemplateFields(fields);
    if (fieldsValidationError) {
      form.setError("root", {
        message: fieldsValidationError,
      });
      return;
    }

    const fieldsData = fields.map((field, index) => ({
      name: normalizeFieldName(field.name),
      label: field.label.trim(),
      type: field.type as FieldType,
      required: field.required,
      validationRule: field.validationRule === "NONE" ? undefined : field.validationRule,
      order: index,
      options:
        field.type === "SELECT"
          ? (field.options || []).map((option) => option.trim()).filter(Boolean)
          : undefined,
    }));

    if (data?.template) {
      updateMutation.mutate({
        id: data.template.id,
        ...values,
        fields: fieldsData,
      });
    } else {
      createMutation.mutate({
        ...values,
        fields: fieldsData,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-h-[90vh] overflow-y-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">
          {data?.template ? "Editar Template" : "Novo Template"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.template
            ? "Edite as informações do template"
            : "Crie um novo template de documento"}
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Template</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Alvará de Funcionamento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!data?.template && (
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company: { id: string; name: string }) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o template..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Template Padrão</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Marque se este template deve ser usado como padrão
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-2 -mx-6 px-6 border-b">
              <div>
                <h3 className="text-lg font-semibold">Campos do Template</h3>
                <p className="text-sm text-muted-foreground">
                  Defina os campos que compõem este template
                </p>
              </div>
              <Button type="button" onClick={addField} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Campo
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Nenhum campo adicionado. Clique em &quot;Adicionar Campo&quot; para começar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Campo {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Label (exibição)
                        </label>
                        <Input
                          placeholder="Nome do Campo"
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, {
                              label: e.target.value,
                              name: normalizeFieldName(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block text-muted-foreground">
                          ID
                        </label>
                        <Input
                          value={normalizeFieldName(field.label)}
                          disabled
                          className="bg-muted text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Função de validação
                      </label>
                      <Select
                        value={field.validationRule || "NONE"}
                        onValueChange={(value) =>
                          updateField(field.id, { validationRule: value as ValidationRule })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {validationRuleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Tipo
                        </label>
                        <Select
                          value={field.type}
                          onValueChange={(value) =>
                            updateField(field.id, { type: value as FieldType })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateField(field.id, {
                                required: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <span className="text-sm font-medium">
                            Obrigatório
                          </span>
                        </label>
                      </div>
                    </div>

                    {field.type === "SELECT" && (
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Opções (uma por linha)
                        </label>
                        <Textarea
                          placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                          value={field.options?.join("\n") || ""}
                          onChange={(e) =>
                            updateField(field.id, {
                              options: e.target.value
                                .split("\n")
                                .filter((o) => o.trim()),
                            })
                          }
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Digite uma opção por linha
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : data?.template
                ? "Atualizar"
                : "Criar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

