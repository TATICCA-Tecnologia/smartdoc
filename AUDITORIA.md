# Auditoria tecnica automatica

Gerado em: `2026-04-29 11:22:37`
Repositorio: `C:\Users\danie\smartdoc-main`

## Resumo executivo

- Arquivos analisados: **218**
- Dependencias de runtime: **47**
- Dependencias de desenvolvimento: **12**
- Testes encontrados: **0**
- Rotas API detectadas: **9**
- Paginas publicas detectadas: **4**
- Modelos Prisma detectados: **20**

## Stack detectada

- `Next.js`
- `React`
- `TypeScript`
- `Prisma ORM`
- `tRPC`
- `NextAuth`
- `Tailwind CSS`
- `Radix UI`
- `MinIO/S3`
- `Nodemailer/Gmail`
- `PostgreSQL`
- `shadcn/ui`
- `Docker`
- `GitHub Actions`
- `pnpm`

## Linguagens e tipos de arquivo

- `.tsx`: 100
- `.ts`: 75
- `.sql`: 11
- `.png`: 6
- `.json`: 5
- `(sem extensao)`: 3
- `.svg`: 3
- `.yml`: 2
- `.jpg`: 2
- `.py`: 1
- `.js`: 1
- `.yaml`: 1

## Scripts do package.json

- `dev: next dev`
- `build: next build`
- `start: next start`
- `lint: next lint`
- `db:generate: prisma generate`
- `db:push: prisma db push`
- `db:migrate: prisma migrate dev`
- `db:studio: prisma studio`
- `db:seed: tsx prisma/seed.ts`

## Banco de dados / Prisma

- `Account`
- `Session`
- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `UserCompany`
- `VerificationToken`
- `Company`
- `DocumentGroup`
- `Establishment`
- `SocialReason`
- `Organization`
- `DocumentTemplate`
- `DocumentTemplateField`
- `Document`
- `DocumentAttachment`
- `Folder`
- `File`

## Rotas API

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/company-logo/[filename]/route.ts`
- `src/app/api/company-logo/upload/route.ts`
- `src/app/api/document-attachments/[id]/route.ts`
- `src/app/api/document-attachments/upload/route.ts`
- `src/app/api/email/send-expiration-alert/route.ts`
- `src/app/api/files/[id]/route.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/upload/route.ts`

## Paginas publicas

- `src/app/(public)/auth/page.tsx`
- `src/app/(public)/auth/register/page.tsx`
- `src/app/(public)/document/[id]/page.tsx`
- `src/app/(public)/document/group/[id]/page.tsx`

## Testes encontrados

- Nenhum item encontrado.

## Padroes de risco mais frequentes

- Upload/FormData: 96
- Uso de any: 87
- Console em codigo: 53
- Rota/procedure publica: 9
- Leitura de arquivo local: 6
- Escrita de arquivo local: 5
- Redirect baseado em dado: 3
- Build ignora erro de TypeScript: 1
- Build ignora erro de ESLint: 1

## Como interpretar os achados

- **Console em codigo**: nao significa bug automaticamente. Em scripts como `prisma/seed.ts`, `console.log` costuma ser normal para mostrar progresso. Vira ponto de atencao quando aparece em codigo de producao, APIs ou autenticacao, porque pode vazar dados sensiveis em logs ou poluir monitoramento.
- **Uso de any**: indica perda de seguranca do TypeScript. Nem sempre quebra o sistema, mas reduz a capacidade do compilador de encontrar erros.
- **Rota/procedure publica**: pode ser correta, como login ou documento publico. Precisa revisar se ela realmente deveria estar aberta.
- **Leitura/escrita de arquivo local**: precisa validar permissao, caminho do arquivo e risco de expor arquivos indevidos.
- **Build ignora erro**: e um achado mais forte, porque permite publicar mesmo com erro de TypeScript ou ESLint.

## Achados por severidade

### Alta

- **Build ignora erro de ESLint** - `next.config.js:8`: Alta. `ignoreDuringBuilds: true,`
- **Build ignora erro de TypeScript** - `next.config.js:5`: Alta. `ignoreBuildErrors: true,`
- **Framework de testes nao detectado** - `package.json`: Alta. `Nao encontrei Jest, Vitest, Playwright ou Cypress nas dependencias.`

### Media

- **Console em codigo** - `src/app/(private)/dashboard/accesses/_components/access-form.tsx:97`: Media. `console.error("Erro ao criar usuário:", error);`
- **Console em codigo** - `src/app/(private)/dashboard/accesses/_components/access-modal.tsx:161`: Media. `console.error("Erro ao atualizar acessos:", error);`
- **Console em codigo** - `src/app/(private)/dashboard/document-types/hooks/document-types.hook.tsx:99`: Media. `console.error("Erro ao excluir template:", error);`
- **Console em codigo** - `src/app/(private)/dashboard/documents/_components/document-export-button.tsx:41`: Media. `console.error("Erro ao exportar documento:", error);`
- **Console em codigo** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:237`: Media. `console.error("Erro ao fazer upload dos anexos:", error);`
- **Console em codigo** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:275`: Media. `console.error("Erro ao fazer upload dos anexos:", error);`
- **Console em codigo** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:365`: Media. `console.error("Erro ao criar documento:", error);`
- **Console em codigo** - `src/app/(private)/dashboard/documents/_components/document-list.tsx:185`: Media. `console.error("Erro ao enviar email:", error);`
- **Console em codigo** - `src/app/api/company-logo/[filename]/route.ts:45`: Media. `console.error("Erro ao servir logo:", error);`
- **Console em codigo** - `src/app/api/company-logo/upload/route.ts:64`: Media. `console.error("Erro no upload da logo:", error);`
- **Console em codigo** - `src/app/api/document-attachments/[id]/route.ts:47`: Media. `console.error("Erro ao buscar anexo no MinIO:", error);`
- **Console em codigo** - `src/app/api/document-attachments/[id]/route.ts:61`: Media. `console.error("Erro ao ler anexo:", error);`
- **Console em codigo** - `src/app/api/document-attachments/[id]/route.ts:74`: Media. `console.error("Error fetching attachment:", error);`
- **Console em codigo** - `src/app/api/document-attachments/upload/route.ts:70`: Media. `console.error("Erro no upload de anexos:", error);`
- **Console em codigo** - `src/app/api/email/send-expiration-alert/route.ts:112`: Media. `console.error("Erro ao enviar email de alerta:", error);`
- **Console em codigo** - `src/app/api/files/[id]/route.ts:61`: Media. `console.error("Erro ao ler arquivo:", error);`
- **Console em codigo** - `src/app/api/files/[id]/route.ts:74`: Media. `console.error("Error fetching file:", error);`
- **Console em codigo** - `src/app/api/trpc/[trpc]/route.ts:14`: Media. `console.error(`
- **Console em codigo** - `src/app/api/upload/route.ts:78`: Media. `console.error("Erro no upload:", error);`
- **Console em codigo** - `src/shared/components/global/csv-upload.tsx:71`: Media. `console.error("Erro ao fazer upload:", error);`
- **Console em codigo** - `src/shared/components/modals/nested-modal.tsx:28`: Media. `onOpen: () => console.log(`Modal nível ${data.level + 1} aberto!`),`
- **Console em codigo** - `src/shared/components/modals/nested-modal.tsx:29`: Media. `onClose: () => console.log(`Modal nível ${data.level + 1} fechado!`),`
- **Console em codigo** - `src/shared/config/auth.ts:82`: Media. `console.error("Auth error:", error);`
- **Console em codigo** - `src/shared/hook/use-local-store.ts:11`: Media. `console.warn(`Erro ao ler a key "${key}" do localStorage:`, error);`
- **Console em codigo** - `src/shared/hook/use-local-store.ts:36`: Media. `console.warn(`Erro ao salvar a key "${key}" no localStorage:`, error);`
- **Console em codigo** - `src/shared/jobs/document-expiration-job.ts:12`: Media. `console.log("[Document Expiration Job] Iniciando verificação de documentos vencendo hoje...");`
- **Console em codigo** - `src/shared/jobs/document-expiration-job.ts:60`: Media. `console.log(`
- **Console em codigo** - `src/shared/jobs/document-expiration-job.ts:87`: Media. `console.log(`
- **Console em codigo** - `src/shared/jobs/document-expiration-job.ts:92`: Media. `console.error(`
- **Console em codigo** - `src/shared/jobs/document-expiration-job.ts:99`: Media. `console.log(`
- **Console em codigo** - `src/shared/jobs/document-expiration-job.ts:103`: Media. `console.error("[Document Expiration Job] Erro ao processar job:", error);`
- **Console em codigo** - `src/shared/jobs/document-expiration-job.ts:107`: Media. `console.log("[Document Expiration Job] Job agendado para rodar diariamente às 08:00");`
- **Console em codigo** - `src/shared/lib/email.ts:8`: Media. `console.warn("Variáveis de ambiente de email não configuradas");`
- **Console em codigo** - `src/shared/lib/email.ts:42`: Media. `console.error("Erro ao enviar email:", error);`
- **Console em codigo** - `src/shared/utils/fetch.ts:57`: Media. `console.warn("Could not get server session:", error);`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:103`: Media. `const [logoUploading, setLogoUploading] = useState(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:119`: Media. `setLogoUploading(true);`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:121`: Media. `const formData = new FormData();`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:123`: Media. `const res = await fetch("/api/company-logo/upload", {`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:128`: Media. `if (!res.ok) throw new Error(json.error || "Erro no upload");`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:133`: Media. `setLogoUploading(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:221`: Media. `disabled={logoUploading}`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:237`: Media. `disabled={logoUploading}`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:246`: Media. `disabled={logoUploading}`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:258`: Media. `disabled={logoUploading}`
- **Upload/FormData** - `src/app/(private)/dashboard/companies/_components/company-form.tsx:262`: Media. `{logoUploading ? "Enviando..." : "Enviar logo"}`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:25`: Media. `import { FileText, Upload, X, Loader2, Plus, Pencil, Lock } from "lucide-react";`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:118`: Media. `const [isUploading, setIsUploading] = useState(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:221`: Media. `const formData = new FormData();`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:227`: Media. `const uploadResponse = await fetch("/api/document-attachments/upload", {`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:232`: Media. `if (!uploadResponse.ok) {`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:233`: Media. `const errorData = await uploadResponse.json();`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:234`: Media. `throw new Error(errorData.error || "Erro ao fazer upload dos anexos");`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:237`: Media. `console.error("Erro ao fazer upload dos anexos:", error);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:239`: Media. `message: error instanceof Error ? error.message : "Erro ao fazer upload dos anexos",`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:241`: Media. `setIsUploading(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:245`: Media. `setIsUploading(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:250`: Media. `setIsUploading(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:260`: Media. `setIsUploading(true);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:261`: Media. `const formData = new FormData();`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:266`: Media. `const uploadResponse = await fetch("/api/document-attachments/upload", {`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:270`: Media. `if (!uploadResponse.ok) {`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:271`: Media. `const errorData = await uploadResponse.json();`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:272`: Media. `throw new Error(errorData.error || "Erro ao fazer upload dos anexos");`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:275`: Media. `console.error("Erro ao fazer upload dos anexos:", error);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:277`: Media. `message: error instanceof Error ? error.message : "Erro ao fazer upload dos anexos",`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:279`: Media. `setIsUploading(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:282`: Media. `setIsUploading(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:345`: Media. `setIsUploading(true);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:370`: Media. `setIsUploading(false);`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:375`: Media. `const isSubmitting = createDocumentMutation.isPending || updateDocumentMutation.isPending || isUploading;`
- **Upload/FormData** - `src/app/(private)/dashboard/documents/_components/document-form.tsx:995`: Media. `<Upload className="h-4 w-4 mr-2" />`
- **Upload/FormData** - `src/app/api/company-logo/[filename]/route.ts:6`: Media. `const UPLOAD_DIR = join(process.cwd(), "uploads", "companies");`
- **Upload/FormData** - `src/app/api/company-logo/[filename]/route.ts:29`: Media. `const filePath = join(UPLOAD_DIR, filename);`
- **Upload/FormData** - `src/app/api/company-logo/upload/route.ts:8`: Media. `const UPLOAD_DIR = join(process.cwd(), "uploads", "companies");`
- **Upload/FormData** - `src/app/api/company-logo/upload/route.ts:13`: Media. `async function ensureUploadDir() {`
- **Upload/FormData** - `src/app/api/company-logo/upload/route.ts:14`: Media. `if (!existsSync(UPLOAD_DIR)) {`
- **Upload/FormData** - `src/app/api/company-logo/upload/route.ts:15`: Media. `await mkdir(UPLOAD_DIR, { recursive: true });`
- **Upload/FormData** - `src/app/api/company-logo/upload/route.ts:27`: Media. `await ensureUploadDir();`
- **Upload/FormData** - `src/app/api/company-logo/upload/route.ts:29`: Media. `const formData = await request.formData();`
- ...mais 138 achados omitidos nesta secao.

### Revisar

- **Documentos e anexos detectados** - `prisma/schema.prisma`: Revisar. `Criar testes para download, link publico, senha de acesso e permissao.`
- **Escrita de arquivo local** - `src/app/api/company-logo/upload/route.ts:4`: Revisar. `import { writeFile, mkdir } from "fs/promises";`
- **Escrita de arquivo local** - `src/app/api/company-logo/upload/route.ts:56`: Revisar. `await writeFile(filePath, buffer);`
- **Escrita de arquivo local** - `src/app/api/upload/route.ts:5`: Revisar. `import { writeFile, mkdir } from "fs/promises";`
- **Escrita de arquivo local** - `src/app/api/upload/route.ts:50`: Revisar. `await writeFile(filePath, buffer);`
- **Escrita de arquivo local** - `src/shared/utils/document-export-factory.ts:225`: Revisar. `XLSX.writeFile(workbook, fileName);`
- **Leitura de arquivo local** - `src/app/api/company-logo/[filename]/route.ts:2`: Revisar. `import { readFile } from "fs/promises";`
- **Leitura de arquivo local** - `src/app/api/company-logo/[filename]/route.ts:34`: Revisar. `const fileBuffer = await readFile(filePath);`
- **Leitura de arquivo local** - `src/app/api/document-attachments/[id]/route.ts:3`: Revisar. `import { readFile } from "fs/promises";`
- **Leitura de arquivo local** - `src/app/api/document-attachments/[id]/route.ts:58`: Revisar. `const fileBuffer = await readFile(filePath);`
- **Leitura de arquivo local** - `src/app/api/files/[id]/route.ts:5`: Revisar. `import { readFile } from "fs/promises";`
- **Leitura de arquivo local** - `src/app/api/files/[id]/route.ts:52`: Revisar. `const fileBuffer = await readFile(file.path);`
- **Redirect baseado em dado** - `src/app/api/files/[id]/route.ts:38`: Revisar. `return NextResponse.redirect(file.url);`
- **Redirect baseado em dado** - `src/middleware.ts:43`: Revisar. `return NextResponse.redirect(url);`
- **Redirect baseado em dado** - `src/middleware.ts:80`: Revisar. `return NextResponse.redirect(url);`
- **Rota/procedure publica** - `src/app/(public)/document/[id]/page.tsx:229`: Revisar. `const { data: queryResult, isLoading, error } = api.document.getPublicById.useQuery(`
- **Rota/procedure publica** - `src/app/(public)/document/group/[id]/page.tsx:13`: Revisar. `const { data: group, isLoading, error } = api.documentGroup.getPublicById.useQuery({ id });`
- **Rota/procedure publica** - `src/server/trpc/router/document-group.ts:2`: Revisar. `import { protectedProcedure, publicProcedure, router } from "../trpc";`
- **Rota/procedure publica** - `src/server/trpc/router/document-group.ts:134`: Revisar. `getPublicById: publicProcedure`
- **Rota/procedure publica** - `src/server/trpc/router/document.ts:5`: Revisar. `import { protectedProcedure, publicProcedure, router } from "../trpc";`
- **Rota/procedure publica** - `src/server/trpc/router/document.ts:199`: Revisar. `getPublicById: publicProcedure`
- **Rota/procedure publica** - `src/server/trpc/router/user.ts:3`: Revisar. `import { publicProcedure, router } from "../trpc";`
- **Rota/procedure publica** - `src/server/trpc/router/user.ts:7`: Revisar. `register: publicProcedure.input(userRegisterInput).mutation(async ({ ctx, input }) => {`
- **Rota/procedure publica** - `src/server/trpc/trpc.ts:17`: Revisar. `export const publicProcedure = t.procedure.use(({ next, ctx }) => {`
- **Sistema multiempresa detectado** - `prisma/schema.prisma`: Revisar. `Validar automaticamente que usuarios nao acessam dados de outras empresas.`

### Info

- **Autenticacao por credenciais detectada** - `package.json`: Info. `NextAuth e bcryptjs aparecem nas dependencias. Revisar politica de senha, sessao e reset.`
- **Console em codigo** - `prisma/seed.ts:14`: Info. `console.log('🌱 Iniciando seed do banco de dados...');`
- **Console em codigo** - `prisma/seed.ts:17`: Info. `console.log('📝 Criando permissões...');`
- **Console em codigo** - `prisma/seed.ts:83`: Info. `console.log('👥 Criando roles...');`
- **Console em codigo** - `prisma/seed.ts:112`: Info. `console.log('🔐 Associando permissões às roles...');`
- **Console em codigo** - `prisma/seed.ts:167`: Info. `console.log('👑 Criando role SUPERADMIN...');`
- **Console em codigo** - `prisma/seed.ts:195`: Info. `console.log('👤 Criando usuário admin...');`
- **Console em codigo** - `prisma/seed.ts:247`: Info. `console.log(`✅ Usuário admin criado: ${adminUser.email} com roles ADMINISTRADOR e SUPERADMIN`);`
- **Console em codigo** - `prisma/seed.ts:250`: Info. `console.log('🏢 Criando empresa para o admin...');`
- **Console em codigo** - `prisma/seed.ts:295`: Info. `console.log('✅ Seed concluído com sucesso!');`
- **Console em codigo** - `prisma/seed.ts:296`: Info. `console.log('\n📊 Resumo:');`
- **Console em codigo** - `prisma/seed.ts:297`: Info. `console.log(`  - ${permissions.length} permissões criadas`);`
- **Console em codigo** - `prisma/seed.ts:298`: Info. `console.log(`  - 3 roles criadas (ADMINISTRADOR, EDITOR, LEITOR)`);`
- **Console em codigo** - `prisma/seed.ts:299`: Info. `console.log(`  - 1 usuário: admin@sim.com com role ADMINISTRADOR`);`
- **Console em codigo** - `prisma/seed.ts:300`: Info. `console.log(`  - 1 empresa (${company1.name}) com 1 estabelecimento, admin associado (ADM001)`);`
- **Console em codigo** - `prisma/seed.ts:301`: Info. `console.log('\n🔑 Credenciais do Admin:');`
- **Console em codigo** - `prisma/seed.ts:302`: Info. `console.log(`  Email: admin@sim.com`);`
- **Console em codigo** - `prisma/seed.ts:303`: Info. `console.log(`  Senha: admin123`);`
- **Console em codigo** - `prisma/seed.ts:308`: Info. `console.error('❌ Erro ao executar seed:', e);`

## Comandos recomendados para proxima etapa

Quando Node/pnpm estiverem instalados no ambiente, rode:

```bash
pnpm install --frozen-lockfile
pnpm lint
npx tsc --noEmit
pnpm build
pnpm audit
```

Ferramentas externas uteis para complementar:

```bash
gitleaks detect
trivy fs .
semgrep scan
```

## Prioridades sugeridas

1. Remover a configuracao que ignora erros de TypeScript e ESLint no build, ou justificar formalmente por que ela existe.
2. Criar testes para permissao multiempresa, links publicos de documentos, uploads e downloads.
3. Rodar auditoria de dependencias com `pnpm audit`/Trivy assim que o ambiente Node estiver pronto.
4. Validar manualmente os achados marcados como `Revisar`, especialmente rotas publicas e acesso a arquivos.

## Observacao

Este relatorio e uma auditoria estatica inicial. Ele aponta sinais e prioridades, mas nao substitui testes executando a aplicacao nem revisao humana de regras de negocio.
