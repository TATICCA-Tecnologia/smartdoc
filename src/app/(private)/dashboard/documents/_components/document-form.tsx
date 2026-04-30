"use client";

import { z } from "zod";
import { useState, useRef, useEffect } from "react";
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
import { Textarea } from "@/src/shared/components/global/ui/textarea";
import { useZodForm } from "@/src/shared/hook/use-zod-form";
import { ModalProps } from "@/src/shared/types/modal";
import { FileText, Upload, X, Loader2, Plus, Pencil, Lock } from "lucide-react";
import { api } from "@/src/shared/context/trpc-context";
import { DateRangePicker } from "@/src/shared/components/global/date-picker";
import { useModal } from "@/src/shared/context/modal-context";
import { CreateDocumentGroupModal } from "./create-document-group-modal";
import { EditDocumentGroupModal } from "./edit-document-group-modal";
import { useSelectedCompany } from "@/src/shared/context/company-context";
import { toast } from "sonner";
import { Document } from "@/src/shared/utils/document";

interface DocumentModalData {
  onSuccess: () => void;
  documentId?: string;
}

const documentSchema = z
  .object({
    templateId: z.string().min(1, "Tipo de documento é obrigatório"),
    organizationId: z.string().min(1, "Órgão é obrigatório"),
    issueDate: z.string().optional(),
    expirationDate: z.string().optional(),
    alertDate: z.string().optional(),
    responsibleId: z.string().min(1, "Responsável é obrigatório"),
    chiefId: z.string().optional(),
    companyId: z.string().min(1, "Empresa é obrigatória"),
    establishmentId: z.string().min(1, "Estabelecimento é obrigatório"),
    socialReasonId: z.string().optional(),
    classification: z.string().optional(),
    groupIds: z.array(z.string()).default([]),
    observations: z.string().optional(),
    accessPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      const issue = data.issueDate ? new Date(data.issueDate).getTime() : null;
      const alert = data.alertDate ? new Date(data.alertDate).getTime() : null;
      const exp = data.expirationDate ? new Date(data.expirationDate).getTime() : null;
      if (alert == null) return true;
      if (issue != null && alert < issue) return false;
      if (exp != null && alert > exp) return false;
      return true;
    },
    {
      message:
        "Data de aviso deve ser maior ou igual à data de expedição e menor ou igual à data de expiração.",
      path: ["alertDate"],
    }
  );

type DocumentFormValues = z.infer<typeof documentSchema>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateDynamicFieldValue(field: any, rawValue: string): string | null {
  const value = String(rawValue ?? "").trim();
  if (!value) return field.required ? `${field.label} é obrigatório` : null;

  const effectiveValidation = field.validationRule && field.validationRule !== "NONE"
    ? field.validationRule
    : field.type;

  if (effectiveValidation === "CPF" && !Document.validateCPF(value)) {
    return `${field.label} inválido`;
  }

  if (effectiveValidation === "CNPJ" && !Document.validateCNPJ(value) && !Document.validateCNPJAlphanumeric(value)) {
    return `${field.label} inválido`;
  }

  if (effectiveValidation === "EMAIL" && !EMAIL_REGEX.test(value)) {
    return `${field.label} inválido`;
  }

  if (effectiveValidation === "NUMBER" && Number.isNaN(Number(value))) {
    return `${field.label} deve ser numérico`;
  }

  if (effectiveValidation === "PHONE" && value.replace(/\D/g, "").length < 10) {
    return `${field.label} inválido`;
  }

  if (field.type === "SELECT" && field.options?.length && !field.options.includes(value)) {
    return `${field.label} possui valor inválido`;
  }

  return null;
}

export function DocumentFormModal({
  onClose,
  data,
}: ModalProps<DocumentModalData>) {
  const { selectedCompanyId } = useSelectedCompany();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: templatesData, isLoading: templatesLoading } = api.documentTemplate.list.useQuery({
    page: 1,
    pageSize: 100,
    companyId: selectedCompanyId || undefined,
  });
  const { data: orgaosData, isLoading: orgaosLoading } = api.organization.list.useQuery({
    page: 1,
    pageSize: 100,
    companyId: selectedCompanyId || undefined,
  });
  const { data: companiesData, isLoading: companiesLoading } = api.company.list.useQuery({
    page: 1,
    pageSize: 100,
    companyId: selectedCompanyId || undefined,
  });
  const { data: establishmentsData, isLoading: establishmentsLoading } = api.establishment.list.useQuery({
    page: 1,
    pageSize: 100,
    companyId: selectedCompanyId || undefined,
  });

  const { data: usersData, isLoading: usersLoading } = api.access.listUsers.useQuery({
    companyId: selectedCompanyId || undefined,
  });

  const { data: groupsData, isLoading: groupsLoading, refetch: refetchGroups } = api.documentGroup.list.useQuery({
    page: 1,
    pageSize: 100,
    companyId: selectedCompanyId || undefined,
  });

  const { data: socialReasonsData } = api.socialReason.list.useQuery({
    page: 1,
    pageSize: 100,
  });

  const templates = templatesData?.templates || [];
  const organizations = orgaosData?.organizations || [];
  const companies = companiesData?.companies || [];
  const establishments = establishmentsData?.establishments || [];
  const users = usersData || [];
  const groups = groupsData?.groups || [];
  const socialReasons = socialReasonsData?.socialReasons || [];

  const { openModal } = useModal();
  const utils = api.useUtils();

  const { data: existingDocument, isLoading: documentLoading } = api.document.getById.useQuery(
    { id: data?.documentId! },
    { enabled: !!data?.documentId }
  );

  // Buscar template selecionado com seus campos
  const selectedTemplate = templates.find((t: any) => t.id === selectedTemplateId);
  const templateFields = selectedTemplate?.fields || [];

  const form = useZodForm(documentSchema, {
    defaultValues: {
      templateId: "",
      organizationId: "",
      issueDate: "",
      expirationDate: "",
      alertDate: "",
      responsibleId: "",
      chiefId: "",
      companyId: selectedCompanyId ?? "",
      establishmentId: "",
      classification: "",
      groupIds: [],
      observations: "",
      accessPassword: "",
      socialReasonId: "",
    },
  });

  if (!data) return null;

  const isEditing = !!data.documentId && !!existingDocument;

  useEffect(() => {
    if (!existingDocument) return;
    const d = existingDocument as any;

    form.reset({
      templateId: d.templateId ?? "",
      organizationId: d.organizationId ?? "",
      issueDate: d.issueDate ? new Date(d.issueDate).toISOString().slice(0, 10) : "",
      expirationDate: d.expirationDate ? new Date(d.expirationDate).toISOString().slice(0, 10) : "",
      alertDate: d.alertDate ? new Date(d.alertDate).toISOString().slice(0, 10) : "",
      responsibleId: d.responsibleId ?? "",
      chiefId: d.chiefId ?? "",
      companyId: d.companyId ?? "",
      establishmentId: d.establishmentId ?? "",
      classification: d.classification ?? "",
      groupIds: d.groups?.map((g: { id: string }) => g.id) ?? (d.groupId ? [d.groupId] : []),
      observations: d.observations ?? "",
      accessPassword: "",
      socialReasonId: d.socialReasonId ?? "",
    });

    setSelectedTemplateId(d.templateId ?? "");
    setCustomFieldsData((d.customData as Record<string, string>) ?? {});
  }, [existingDocument]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mutation para criar documento
  const createDocumentMutation = api.document.create.useMutation({
    onSuccess: async (document) => {
      if (attachments.length > 0 && document?.id) {
        try {
          const formData = new FormData();
          attachments.forEach((file) => {
            formData.append("files", file);
          });
          formData.append("documentId", document.id);

          const uploadResponse = await fetch("/api/document-attachments/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "Erro ao fazer upload dos anexos");
          }
        } catch (error) {
          console.error("Erro ao fazer upload dos anexos:", error);
          form.setError("root", {
            message: error instanceof Error ? error.message : "Erro ao fazer upload dos anexos",
          });
          setIsUploading(false);
          return;
        }
      }
      setIsUploading(false);
      toast.success("Documento criado com sucesso!");
      data.onSuccess();
      onClose();
    },
    onError: (error) => {
      setIsUploading(false);
      form.setError("root", { message: error.message });
    },
  });

  const updateDocumentMutation = api.document.update.useMutation({
    onSuccess: async (_, variables) => {
      const documentId = variables.id;
      if (attachments.length > 0 && documentId) {
        try {
          setIsUploading(true);
          const formData = new FormData();
          attachments.forEach((file) => {
            formData.append("files", file);
          });
          formData.append("documentId", documentId);
          const uploadResponse = await fetch("/api/document-attachments/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "Erro ao fazer upload dos anexos");
          }
        } catch (error) {
          console.error("Erro ao fazer upload dos anexos:", error);
          form.setError("root", {
            message: error instanceof Error ? error.message : "Erro ao fazer upload dos anexos",
          });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
      data.onSuccess();
      onClose();
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const deleteAttachmentMutation = api.document.deleteAttachment.useMutation({
    onSuccess: () => {
      if (data?.documentId) {
        utils.document.getById.invalidate({ id: data.documentId });
      }
    },
    onError: (error) => {
      form.setError("root", { message: error.message });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: DocumentFormValues) => {
    for (const field of templateFields) {
      const fieldValue = customFieldsData[field.name];
      const validationError = validateDynamicFieldValue(field, fieldValue);
      if (validationError) {
        form.setError("root", { message: validationError });
        toast.error(validationError);
        return;
      }
    }

    if (isEditing && data.documentId) {
      updateDocumentMutation.mutate({
        id: data.documentId,
        templateId: values.templateId,
        organizationId: values.organizationId,
        companyId: values.companyId,
        establishmentId: values.establishmentId,
        responsibleId: values.responsibleId,
        chiefId: values.chiefId || undefined,
        socialReasonId: values.socialReasonId || null,
        issueDate: values.issueDate || undefined,
        expirationDate: values.expirationDate || undefined,
        alertDate: values.alertDate || undefined,
        classification: values.classification || undefined,
        groupIds: values.groupIds.length ? values.groupIds : undefined,
        observations: values.observations || undefined,
        customData: Object.keys(customFieldsData).length > 0 ? customFieldsData : undefined,
        accessPassword: values.accessPassword || undefined,
      });
      return;
    }

    setIsUploading(true);
    try {
      createDocumentMutation.mutate({
        templateId: values.templateId,
        organizationId: values.organizationId,
        companyId: values.companyId,
        establishmentId: values.establishmentId,
        responsibleId: values.responsibleId,
        chiefId: values.chiefId || undefined,
        socialReasonId: values.socialReasonId || undefined,
        issueDate: values.issueDate || undefined,
        expirationDate: values.expirationDate || undefined,
        alertDate: values.alertDate || undefined,
        classification: values.classification || undefined,
        groupIds: values.groupIds.length ? values.groupIds : undefined,
        observations: values.observations || undefined,
        customData: Object.keys(customFieldsData).length > 0 ? customFieldsData : undefined,
        accessPassword: values.accessPassword || undefined,
        status: "ACTIVE",
      });
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      form.setError("root", {
        message: error instanceof Error ? error.message : "Erro ao criar documento",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const isDataLoading = templatesLoading || orgaosLoading || companiesLoading || establishmentsLoading || usersLoading || groupsLoading || (!!data.documentId && documentLoading);
  const isSubmitting = createDocumentMutation.isPending || updateDocumentMutation.isPending || isUploading;

  return (
    <div className="max-h-[90vh] overflow-y-auto p-6" id="form-document">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">{isEditing ? "Editar documento" : "Novo documento"}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditing ? "Altere as informações do documento." : "Cadastre um novo documento com todas as informações necessárias."}
        </p>
      </div>

      {form.formState.errors.root && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        </div>
      )}

      {isDataLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando dados...</span>
        </div>
      ) : (
        <Form {...form}>
          <form
            key={existingDocument?.id ?? "new"}
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              const first = Object.values(errors).find((e) => e?.message);
              toast.error((first as any)?.message ?? "Verifique os campos obrigatórios.");
            })}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Tipo de documento</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedTemplateId(value);
                        setCustomFieldsData({});
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhum template cadastrado
                          </div>
                        ) : (
                          templates.map((type: any) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Órgão</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o órgão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhum órgão cadastrado
                          </div>
                        ) : (
                          organizations.map((orgao: any) => (
                            <SelectItem key={orgao.id} value={orgao.id}>
                              {orgao.shortName} - {orgao.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Data de expedição</FormLabel>
                    <FormControl>
                      <DateRangePicker
                        value={field.value ? new Date(field.value) : undefined}
                        mode="single"
                        onDateChange={(date) => field.onChange(date ? new Date(date as Date).toISOString() : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertDate"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Data de aviso</FormLabel>
                    <FormControl>
                      <DateRangePicker
                        value={field.value ? new Date(field.value) : undefined}
                        mode="single"
                        onDateChange={(date) => field.onChange(date ? new Date(date as Date).toISOString() : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Data de expiração</FormLabel>
                    <FormControl>
                      <DateRangePicker
                        value={field.value ? new Date(field.value) : undefined}
                        mode="single"
                        onDateChange={(date) => field.onChange(date ? new Date(date as Date).toISOString() : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsibleId"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhum usuário cadastrado
                          </div>
                        ) : (
                          users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || "Sem nome"} ({user.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chiefId"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Supervisor</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value || undefined)}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleciono o supervisor (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || "Sem nome"} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Empresa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhuma empresa cadastrada
                          </div>
                        ) : (
                          companies.map((company: any) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="establishmentId"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Estabelecimento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o estabelecimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {establishments.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Nenhum estabelecimento cadastrado
                          </div>
                        ) : (
                          establishments.map((est: any) => (
                            <SelectItem key={est.id} value={est.id}>
                              {est.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="socialReasonId"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Razão Social <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a razão social" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {socialReasons.map((sr: any) => (
                          <SelectItem key={sr.id} value={sr.id}>
                            {sr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classification"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>Classificação</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Segurança, Ambiental, Fiscal..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="groupIds"
                render={({ field }) => {
                  const selectedGroups = groups.filter((group: { id: string }) =>
                    field.value?.includes(group.id)
                  );
                  return (
                    <FormItem className="flex-1 w-full">
                      <FormLabel>Grupo de Documentos</FormLabel>
                      <FormControl>
                        <div className="space-y-2 rounded-md border p-3">
                          <Select
                            onValueChange={(value) => {
                              if (value === "__create_new__") {
                                openModal(
                                  "create-document-group",
                                  CreateDocumentGroupModal,
                                  {
                                    companyId: selectedCompanyId || undefined,
                                    onSuccess: async (groupId) => {
                                      await refetchGroups();
                                      const current = field.value ?? [];
                                      if (!current.includes(groupId)) {
                                        field.onChange([...current, groupId]);
                                      }
                                    },
                                  }
                                );
                                return;
                              }
                              const current = field.value ?? [];
                              if (!current.includes(value)) {
                                field.onChange([...current, value]);
                              }
                            }}
                            value={undefined}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione um grupo para adicionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.map((group: any) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="__create_new__">
                                <div className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Criar novo grupo
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex flex-wrap gap-2">
                            {selectedGroups.map((group: any) => (
                              <div key={group.id} className="flex items-center gap-1 rounded-md border px-2 py-1">
                                <span className="text-sm">{group.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  title="Editar grupo"
                                  onClick={() => {
                                    openModal(
                                      "edit-document-group-" + group.id,
                                      EditDocumentGroupModal,
                                      {
                                        groupId: group.id,
                                        initialName: group.name,
                                        initialDescription: group.description ?? undefined,
                                        onSuccess: () => refetchGroups(),
                                      }
                                    );
                                  }}
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  title="Remover grupo"
                                  onClick={() =>
                                    field.onChange((field.value ?? []).filter((id: string) => id !== group.id))
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openModal(
                                "create-document-group",
                                CreateDocumentGroupModal,
                                {
                                  onSuccess: async (groupId) => {
                                    await refetchGroups();
                                    const current = field.value ?? [];
                                    if (!current.includes(groupId)) {
                                      field.onChange([...current, groupId]);
                                    }
                                  },
                                }
                              )
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Criar novo grupo
                          </Button>
                          {groups.length === 0 && (
                            <p className="text-sm text-muted-foreground">Nenhum grupo disponível</p>
                          )}
                          {selectedGroups.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {selectedGroups.length} grupo{selectedGroups.length > 1 ? "s" : ""} selecionado
                              {selectedGroups.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem className="flex-1 w-full">
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Procedimento de renovação..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessPassword"
              render={({ field }) => (
                <FormItem className="flex-1 w-full">
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Senha de acesso ao link público
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder={
                        isEditing
                          ? "Deixe vazio para manter a senha atual"
                          : "Opcional — protege o link público com senha"
                      }
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {isEditing
                      ? "Preencha apenas se quiser alterar ou remover a senha atual. Para remover, envie um espaço."
                      : "Quem acessar o link público precisará informar esta senha para visualizar o documento."}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {templateFields.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Campos do Template: {selectedTemplate?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Preencha os campos específicos deste template
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templateFields.map((field: any) => {
                    const fieldValue = customFieldsData[field.name] || "";

                    const handleChange = (value: string) => {
                      setCustomFieldsData((prev) => ({
                        ...prev,
                        [field.name]: value,
                      }));
                    };

                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm font-medium">
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </label>
                        {field.type === "TEXTAREA" ? (
                          <Textarea
                            placeholder={`Digite ${field.label.toLowerCase()}...`}
                            rows={3}
                            value={fieldValue}
                            onChange={(e) => handleChange(e.target.value)}
                          />
                        ) : field.type === "SELECT" ? (
                          <Select
                            onValueChange={handleChange}
                            value={fieldValue}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option: any) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === "DATE" ? (
                          <Input
                            type="date"
                            value={fieldValue}
                            onChange={(e) => handleChange(e.target.value)}
                          />
                        ) : field.type === "NUMBER" ? (
                          <Input
                            type="number"
                            placeholder={`Digite ${field.label.toLowerCase()}...`}
                            value={fieldValue}
                            onChange={(e) => handleChange(e.target.value)}
                          />
                        ) : (
                          <Input
                            type="text"
                            placeholder={`Digite ${field.label.toLowerCase()}...`}
                            value={fieldValue}
                            onChange={(e) => handleChange(e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <FormLabel>Anexos</FormLabel>
              <div className="mt-2 space-y-3">
                {isEditing && existingDocument?.attachments?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Anexos atuais</p>
                    <div className="border rounded-md p-2 space-y-2">
                      {(existingDocument as any).attachments.map((att: { id: string; fileName: string; fileSize: number }) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="text-sm truncate">{att.fileName}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              ({(att.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAttachmentMutation.mutate({ attachmentId: att.id })}
                            disabled={deleteAttachmentMutation.isPending}
                            className="h-6 w-6 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Remover anexo"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {isEditing ? "Adicionar novos arquivos" : "Arquivos do documento"}
                  </p>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar arquivo
                  </Button>

                  {attachments.length > 0 && (
                    <div className="border rounded-md p-2 space-y-2">
                      {attachments.map((file: File, index: number) => (
                        <div
                          key={`new-${index}`}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="h-6 w-6 p-0 shrink-0"
                            title="Remover da lista"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
