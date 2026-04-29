from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parent
REPORT_PATH = ROOT / "AUDITORIA.md"

TEXT_EXTENSIONS = {
    ".css",
    ".env",
    ".example",
    ".gitignore",
    ".dockerignore",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".prisma",
    ".sql",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}

IGNORED_DIRS = {
    ".git",
    ".next",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".turbo",
}

SECRET_PATTERNS = [
    re.compile(r"(?i)\b(api[_-]?key|secret|token|password|passwd|private[_-]?key)\b\s*[:=]\s*['\"][^'\"\n]{12,}['\"]"),
    re.compile(r"(?i)\b(DATABASE_URL|NEXTAUTH_SECRET|GMAIL_APP_PASS|MINIO_SECRET_KEY)\b\s*=\s*[^$\s][^\n]+"),
]

RISK_PATTERNS = {
    "Build ignora erro de TypeScript": re.compile(r"ignoreBuildErrors\s*:\s*true"),
    "Build ignora erro de ESLint": re.compile(r"ignoreDuringBuilds\s*:\s*true"),
    "Uso de any": re.compile(r"\bas\s+any\b|:\s*any\b"),
    "Console em codigo": re.compile(r"\bconsole\.(log|error|warn)\s*\("),
    "Rota/procedure publica": re.compile(r"\bpublicProcedure\b|getPublicById"),
    "Leitura de arquivo local": re.compile(r"\breadFile\b"),
    "Escrita de arquivo local": re.compile(r"\bwriteFile\b"),
    "Redirect baseado em dado": re.compile(r"\bNextResponse\.redirect\b"),
    "Upload/FormData": re.compile(r"\bformData\(|upload", re.IGNORECASE),
}


@dataclass
class Finding:
    severity: str
    title: str
    detail: str
    file: str | None = None
    line: int | None = None

    def location(self) -> str:
        if not self.file:
            return ""
        if self.line:
            return f"`{self.file}:{self.line}`"
        return f"`{self.file}`"


def iter_files() -> Iterable[Path]:
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORED_DIRS for part in path.relative_to(ROOT).parts):
            continue
        if path.name == REPORT_PATH.name:
            continue
        yield path


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="latin-1", errors="replace")


def read_lines(path: Path) -> list[str]:
    return read_text(path).splitlines()


def load_package_json() -> dict:
    package_path = ROOT / "package.json"
    if not package_path.exists():
        return {}
    try:
        return json.loads(read_text(package_path))
    except json.JSONDecodeError:
        return {}


def detect_stack(package: dict, files: list[Path]) -> list[str]:
    deps = {
        **package.get("dependencies", {}),
        **package.get("devDependencies", {}),
    }
    stack = []

    checks = [
        ("Next.js", "next"),
        ("React", "react"),
        ("TypeScript", "typescript"),
        ("Prisma ORM", "prisma"),
        ("PostgreSQL", None),
        ("tRPC", "@trpc/server"),
        ("NextAuth", "next-auth"),
        ("Tailwind CSS", "tailwindcss"),
        ("Radix UI", "@radix-ui/react-dialog"),
        ("shadcn/ui", None),
        ("MinIO/S3", "minio"),
        ("Nodemailer/Gmail", "nodemailer"),
        ("Docker", None),
        ("GitHub Actions", None),
        ("pnpm", None),
    ]

    for label, dep in checks:
        if dep and dep in deps:
            stack.append(label)

    if (ROOT / "prisma" / "schema.prisma").exists():
        schema = read_text(ROOT / "prisma" / "schema.prisma")
        if 'provider = "postgresql"' in schema:
            if "PostgreSQL" not in stack:
                stack.append("PostgreSQL")

    if (ROOT / "components.json").exists() and "shadcn/ui" not in stack:
        stack.append("shadcn/ui")
    if (ROOT / "Dockerfile").exists() and "Docker" not in stack:
        stack.append("Docker")
    if (ROOT / ".github" / "workflows").exists() and "GitHub Actions" not in stack:
        stack.append("GitHub Actions")
    if (ROOT / "pnpm-lock.yaml").exists() or "pnpm" in package.get("packageManager", ""):
        if "pnpm" not in stack:
            stack.append("pnpm")

    return stack


def count_extensions(files: list[Path]) -> Counter:
    counter: Counter[str] = Counter()
    for path in files:
        ext = path.suffix or "(sem extensao)"
        counter[ext] += 1
    return counter


def find_tests(files: list[Path]) -> list[str]:
    test_markers = re.compile(r"(\.test\.|\.spec\.|__tests__)", re.IGNORECASE)
    return [relative(path) for path in files if test_markers.search(relative(path))]


def find_routes(files: list[Path]) -> tuple[list[str], list[str]]:
    api_routes = []
    public_pages = []
    for path in files:
        rel = relative(path)
        if rel.startswith("src/app/api/") and path.name in {"route.ts", "route.tsx", "route.js"}:
            api_routes.append(rel)
        if rel.startswith("src/app/(public)/") and path.name in {"page.tsx", "page.ts", "page.jsx"}:
            public_pages.append(rel)
    return sorted(api_routes), sorted(public_pages)


def scan_risks(files: list[Path]) -> list[Finding]:
    findings: list[Finding] = []

    for path in files:
        if path.suffix not in TEXT_EXTENSIONS and path.name not in {"Dockerfile", "package.json"}:
            continue
        rel = relative(path)
        if path.stat().st_size > 800_000:
            continue

        for line_no, line in enumerate(read_lines(path), start=1):
            for title, pattern in RISK_PATTERNS.items():
                if pattern.search(line):
                    severity = "Media"
                    if "ignora erro" in title:
                        severity = "Alta"
                    if "publica" in title or "arquivo local" in title or "Redirect" in title:
                        severity = "Revisar"
                    if title == "Console em codigo" and (
                        rel.startswith("prisma/seed.") or rel.endswith("/seed.ts")
                    ):
                        severity = "Info"
                    findings.append(
                        Finding(
                            severity=severity,
                            title=title,
                            detail=line.strip()[:180],
                            file=rel,
                            line=line_no,
                        )
                    )

    return findings


def scan_secrets(files: list[Path]) -> list[Finding]:
    findings: list[Finding] = []

    for path in files:
        rel = relative(path)
        if path.suffix not in TEXT_EXTENSIONS and path.name not in {"Dockerfile"}:
            continue
        if path.name in {"pnpm-lock.yaml", "package-lock.json", "yarn.lock"}:
            continue
        if path.stat().st_size > 800_000:
            continue

        for line_no, line in enumerate(read_lines(path), start=1):
            stripped = line.strip()
            if not stripped or stripped.startswith("//") or stripped.startswith("#"):
                continue
            if "${{" in stripped or "${" in stripped or "process.env." in stripped or "env(" in stripped:
                continue
            for pattern in SECRET_PATTERNS:
                if pattern.search(stripped):
                    findings.append(
                        Finding(
                            severity="Alta",
                            title="Possivel segredo hardcoded",
                            detail=mask_sensitive(stripped),
                            file=rel,
                            line=line_no,
                        )
                    )

    return findings


def mask_sensitive(value: str) -> str:
    if len(value) <= 24:
        return "[mascarado]"
    return value[:12] + "...[mascarado]..." + value[-6:]


def analyze_dependencies(package: dict) -> list[Finding]:
    findings = []
    deps = package.get("dependencies", {})
    dev_deps = package.get("devDependencies", {})
    scripts = package.get("scripts", {})

    required_scripts = {
        "build": "Script de build",
        "lint": "Script de lint",
    }
    for script, title in required_scripts.items():
        if script not in scripts:
            findings.append(Finding("Média", f"{title} ausente", f"package.json nao possui script `{script}`.", "package.json"))

    test_deps = {"jest", "vitest", "playwright", "@playwright/test", "cypress"}
    if not test_deps.intersection(deps).intersection(dev_deps) and not test_deps.intersection({**deps, **dev_deps}):
        findings.append(
            Finding(
                "Alta",
                "Framework de testes nao detectado",
                "Nao encontrei Jest, Vitest, Playwright ou Cypress nas dependencias.",
                "package.json",
            )
        )

    if "next-auth" in deps and "bcryptjs" in deps:
        findings.append(
            Finding(
                "Info",
                "Autenticacao por credenciais detectada",
                "NextAuth e bcryptjs aparecem nas dependencias. Revisar politica de senha, sessao e reset.",
                "package.json",
            )
        )

    return findings


def analyze_prisma() -> tuple[list[str], list[Finding]]:
    schema_path = ROOT / "prisma" / "schema.prisma"
    if not schema_path.exists():
        return [], [Finding("Alta", "Prisma schema ausente", "Nao encontrei prisma/schema.prisma.")]

    schema = read_text(schema_path)
    models = re.findall(r"^model\s+(\w+)\s+\{", schema, re.MULTILINE)
    findings = []

    if "UserCompany" in models and "Company" in models:
        findings.append(
            Finding(
                "Revisar",
                "Sistema multiempresa detectado",
                "Validar automaticamente que usuarios nao acessam dados de outras empresas.",
                "prisma/schema.prisma",
            )
        )

    if "Document" in models and "DocumentAttachment" in models:
        findings.append(
            Finding(
                "Revisar",
                "Documentos e anexos detectados",
                "Criar testes para download, link publico, senha de acesso e permissao.",
                "prisma/schema.prisma",
            )
        )

    return models, findings


def summarize_by_title(findings: list[Finding], limit: int = 8) -> list[tuple[str, int]]:
    counts = Counter(f.title for f in findings)
    return counts.most_common(limit)


def group_findings(findings: list[Finding]) -> dict[str, list[Finding]]:
    grouped: dict[str, list[Finding]] = defaultdict(list)
    order = {"Alta": 0, "Media": 1, "Revisar": 2, "Info": 3}
    for finding in sorted(findings, key=lambda item: (order.get(item.severity, 9), item.title, item.file or "", item.line or 0)):
        grouped[finding.severity].append(finding)
    return grouped


def render_list(items: Iterable[str]) -> str:
    values = list(items)
    if not values:
        return "- Nenhum item encontrado.\n"
    return "".join(f"- `{item}`\n" for item in values)


def render_findings(findings: list[Finding], max_items: int = 80) -> str:
    if not findings:
        return "- Nenhum achado nesta categoria.\n"

    lines = []
    for finding in findings[:max_items]:
        loc = f" - {finding.location()}" if finding.location() else ""
        detail = f" `{finding.detail}`" if finding.detail else ""
        lines.append(f"- **{finding.title}**{loc}: {finding.severity}.{detail}\n")
    if len(findings) > max_items:
        lines.append(f"- ...mais {len(findings) - max_items} achados omitidos nesta secao.\n")
    return "".join(lines)


def build_report() -> str:
    files = list(iter_files())
    package = load_package_json()
    stack = detect_stack(package, files)
    extensions = count_extensions(files)
    tests = find_tests(files)
    api_routes, public_pages = find_routes(files)
    prisma_models, prisma_findings = analyze_prisma()

    findings: list[Finding] = []
    findings.extend(analyze_dependencies(package))
    findings.extend(prisma_findings)
    findings.extend(scan_secrets(files))
    risk_findings = scan_risks(files)
    findings.extend(risk_findings)

    grouped = group_findings(findings)
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    dependency_count = len(package.get("dependencies", {}))
    dev_dependency_count = len(package.get("devDependencies", {}))
    scripts = package.get("scripts", {})

    top_extensions = "\n".join(
        f"- `{ext}`: {count}" for ext, count in extensions.most_common(12)
    )
    top_risks = "\n".join(
        f"- {title}: {count}" for title, count in summarize_by_title(risk_findings, 10)
    ) or "- Nenhum padrao de risco detectado."

    lines = [
        "# Auditoria tecnica automatica\n",
        "\n",
        f"Gerado em: `{generated_at}`\n",
        f"Repositorio: `{ROOT}`\n",
        "\n",
        "## Resumo executivo\n",
        "\n",
        f"- Arquivos analisados: **{len(files)}**\n",
        f"- Dependencias de runtime: **{dependency_count}**\n",
        f"- Dependencias de desenvolvimento: **{dev_dependency_count}**\n",
        f"- Testes encontrados: **{len(tests)}**\n",
        f"- Rotas API detectadas: **{len(api_routes)}**\n",
        f"- Paginas publicas detectadas: **{len(public_pages)}**\n",
        f"- Modelos Prisma detectados: **{len(prisma_models)}**\n",
        "\n",
        "## Stack detectada\n",
        "\n",
        render_list(stack),
        "\n",
        "## Linguagens e tipos de arquivo\n",
        "\n",
        top_extensions + "\n",
        "\n",
        "## Scripts do package.json\n",
        "\n",
        render_list(f'{name}: {command}' for name, command in scripts.items()),
        "\n",
        "## Banco de dados / Prisma\n",
        "\n",
        render_list(prisma_models),
        "\n",
        "## Rotas API\n",
        "\n",
        render_list(api_routes),
        "\n",
        "## Paginas publicas\n",
        "\n",
        render_list(public_pages),
        "\n",
        "## Testes encontrados\n",
        "\n",
        render_list(tests),
        "\n",
        "## Padroes de risco mais frequentes\n",
        "\n",
        top_risks + "\n",
        "\n",
        "## Como interpretar os achados\n",
        "\n",
        "- **Console em codigo**: nao significa bug automaticamente. Em scripts como `prisma/seed.ts`, `console.log` costuma ser normal para mostrar progresso. Vira ponto de atencao quando aparece em codigo de producao, APIs ou autenticacao, porque pode vazar dados sensiveis em logs ou poluir monitoramento.\n",
        "- **Uso de any**: indica perda de seguranca do TypeScript. Nem sempre quebra o sistema, mas reduz a capacidade do compilador de encontrar erros.\n",
        "- **Rota/procedure publica**: pode ser correta, como login ou documento publico. Precisa revisar se ela realmente deveria estar aberta.\n",
        "- **Leitura/escrita de arquivo local**: precisa validar permissao, caminho do arquivo e risco de expor arquivos indevidos.\n",
        "- **Build ignora erro**: e um achado mais forte, porque permite publicar mesmo com erro de TypeScript ou ESLint.\n",
        "\n",
        "## Achados por severidade\n",
        "\n",
    ]

    for severity in ["Alta", "Media", "Revisar", "Info"]:
        lines.extend([f"### {severity}\n", "\n", render_findings(grouped.get(severity, [])), "\n"])

    lines.extend(
        [
            "## Comandos recomendados para proxima etapa\n",
            "\n",
            "Quando Node/pnpm estiverem instalados no ambiente, rode:\n",
            "\n",
            "```bash\n",
            "pnpm install --frozen-lockfile\n",
            "pnpm lint\n",
            "npx tsc --noEmit\n",
            "pnpm build\n",
            "pnpm audit\n",
            "```\n",
            "\n",
            "Ferramentas externas uteis para complementar:\n",
            "\n",
            "```bash\n",
            "gitleaks detect\n",
            "trivy fs .\n",
            "semgrep scan\n",
            "```\n",
            "\n",
            "## Prioridades sugeridas\n",
            "\n",
            "1. Remover a configuracao que ignora erros de TypeScript e ESLint no build, ou justificar formalmente por que ela existe.\n",
            "2. Criar testes para permissao multiempresa, links publicos de documentos, uploads e downloads.\n",
            "3. Rodar auditoria de dependencias com `pnpm audit`/Trivy assim que o ambiente Node estiver pronto.\n",
            "4. Validar manualmente os achados marcados como `Revisar`, especialmente rotas publicas e acesso a arquivos.\n",
            "\n",
            "## Observacao\n",
            "\n",
            "Este relatorio e uma auditoria estatica inicial. Ele aponta sinais e prioridades, mas nao substitui testes executando a aplicacao nem revisao humana de regras de negocio.\n",
        ]
    )

    return "".join(lines)


def main() -> None:
    report = build_report()
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"Relatorio gerado: {REPORT_PATH}")


if __name__ == "__main__":
    main()
