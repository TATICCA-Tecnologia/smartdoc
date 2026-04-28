"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useZodForm } from "@/src/shared/hook/use-zod-form";
import { z } from "zod";
import { Button } from "@/src/shared/components/global/ui/button";
import { Input } from "@/src/shared/components/global/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/shared/components/global/ui/form";
import { Folder, Lock, Eye, EyeOff, Mail, User, Shield, Cloud, Users, CheckCircle2 } from "lucide-react";
import { api } from "@/src/shared/context/trpc-context";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm(registerSchema, {
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = api.user.register.useMutation({
    onSuccess: async () => {
      // Após registro bem-sucedido, fazer login automático
      const result = await signIn("credentials", {
        email: form.getValues("email"),
        password: form.getValues("password"),
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
      } else {
        router.push("/auth?registered=true");
      }
    },
    onError: (err) => {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    
    // Validar dados antes de enviar
    if (!data.name || !data.email || !data.password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    try {
      registerMutation.mutate({
        name: String(data.name).trim(),
        email: String(data.email).trim(),
        password: String(data.password),
      });
    } catch (err) {
      setError("Erro ao processar formulário. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <Folder className="w-9 h-9 text-primary" fill="currentColor" />
                <Lock className="w-4 h-4 absolute -bottom-1 -right-1 text-background bg-primary rounded-full p-0.5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-primary">Smartdoc - GERENCIAMENTO SEGURO DE ARQUIVOS</h2>
                <p className="text-xs text-muted-foreground">Gerenciamento seguro de arquivos</p>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-balance">
                Crie sua conta
              </h1>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Preencha seus dados para começar a gerenciar seus documentos com segurança
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Seu nome completo"
                            className="h-10 pl-10"
                            disabled={registerMutation.isPending}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="h-10 pl-10"
                            disabled={registerMutation.isPending}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            className="h-10 pl-10 pr-10"
                            disabled={registerMutation.isPending}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            disabled={registerMutation.isPending}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Digite a senha novamente"
                            className="h-10 pl-10 pr-10"
                            disabled={registerMutation.isPending}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            disabled={registerMutation.isPending}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Criando conta..." : "Criar conta no Smartdoc"}
              </Button>
            </form>
          </Form>

          <div className="pt-6 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Benefícios
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-xs text-center font-medium">Segurança total</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Cloud className="w-5 h-5 text-primary" />
                <span className="text-xs text-center font-medium">Backup automático</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-xs text-center font-medium">Trabalho em equipe</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                href="/auth"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Benefits Visual */}
      <div className="hidden lg:flex flex-1 bg-muted/30 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

        <div className="relative max-w-lg w-full space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Por que escolher o Smartdoc?</h3>
            <p className="text-muted-foreground">
              Gerencie seus documentos de forma inteligente e segura
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Shield,
                title: "Segurança de nível empresarial",
                description: "Seus dados protegidos com criptografia avançada",
              },
              {
                icon: Cloud,
                title: "Backup automático",
                description: "Nunca perca seus documentos importantes",
              },
              {
                icon: Users,
                title: "Colaboração em equipe",
                description: "Trabalhe junto com sua equipe em tempo real",
              },
              {
                icon: CheckCircle2,
                title: "Organização inteligente",
                description: "Encontre qualquer documento em segundos",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

