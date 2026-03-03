export type ExportFormat = "pdf" | "excel";

export interface DocumentData {
  id: string;
  templateName: string;
  organizationName: string;
  companyName: string;
  establishmentName: string;
  responsibleName: string;
  responsibleEmail?: string;
  expirationDate: string | null;
  alertDate: string | null;
  status: string;
  observations?: string | null;
  customData?: Record<string, any> | null;
  createdAt: string;
}

export interface DocumentExportFactory {
  export(data: DocumentData | DocumentData[], filename?: string): Promise<void>;
}

class PDFExporter implements DocumentExportFactory {
  async export(data: DocumentData | DocumentData[], filename?: string): Promise<void> {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const documents = Array.isArray(data) ? data : [data];
    const fileName = filename || `documentos_${new Date().toISOString().split("T")[0]}.pdf`;

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    documents.forEach((docData, index) => {
      if (index > 0 && yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Título
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(docData.templateName, margin, yPosition);
      yPosition += lineHeight * 2;

      // Informações principais
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const fields = [
        { label: "Órgão", value: docData.organizationName },
        { label: "Empresa", value: docData.companyName },
        { label: "Estabelecimento", value: docData.establishmentName },
        { label: "Responsável", value: docData.responsibleName },
        ...(docData.responsibleEmail
          ? [{ label: "Email", value: docData.responsibleEmail }]
          : []),
        {
          label: "Data de Expiração",
          value: docData.expirationDate
            ? new Date(docData.expirationDate).toLocaleDateString("pt-BR")
            : "Não informada",
        },
        {
          label: "Data de Alerta",
          value: docData.alertDate
            ? new Date(docData.alertDate).toLocaleDateString("pt-BR")
            : "Não informada",
        },
        { label: "Status", value: this.translateStatus(docData.status) },
        {
          label: "Data de Criação",
          value: new Date(docData.createdAt).toLocaleDateString("pt-BR"),
        },
      ];

      fields.forEach((field) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.text(`${field.label}:`, margin, yPosition);
        doc.setFont("helvetica", "normal");
        const textWidth = doc.getTextWidth(field.value);
        const maxWidth = doc.internal.pageSize.width - margin * 2 - 60;
        if (textWidth > maxWidth) {
          const lines = doc.splitTextToSize(field.value, maxWidth);
          doc.text(lines, margin + 60, yPosition);
          yPosition += lineHeight * (lines.length - 1);
        } else {
          doc.text(field.value, margin + 60, yPosition);
        }
        yPosition += lineHeight;
      });

      // Campos customizados
      if (docData.customData && Object.keys(docData.customData).length > 0) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        yPosition += lineHeight;
        doc.setFont("helvetica", "bold");
        doc.text("Campos Customizados:", margin, yPosition);
        yPosition += lineHeight;

        doc.setFont("helvetica", "normal");
        Object.entries(docData.customData).forEach(([key, value]) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          const label = String(key);
          const val = String(value || "");
          doc.setFont("helvetica", "bold");
          doc.text(`${label}:`, margin, yPosition);
          doc.setFont("helvetica", "normal");
          const textWidth = doc.getTextWidth(val);
          const maxWidth = doc.internal.pageSize.width - margin * 2 - 60;
          if (textWidth > maxWidth) {
            const lines = doc.splitTextToSize(val, maxWidth);
            doc.text(lines, margin + 60, yPosition);
            yPosition += lineHeight * (lines.length - 1);
          } else {
            doc.text(val, margin + 60, yPosition);
          }
          yPosition += lineHeight;
        });
      }

      // Observações
      if (docData.observations) {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        yPosition += lineHeight;
        doc.setFont("helvetica", "bold");
        doc.text("Observações:", margin, yPosition);
        yPosition += lineHeight;

        doc.setFont("helvetica", "normal");
        const maxWidth = doc.internal.pageSize.width - margin * 2;
        const lines = doc.splitTextToSize(docData.observations, maxWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lineHeight * lines.length;
      }

      // Separador entre documentos
      if (index < documents.length - 1) {
        yPosition += lineHeight;
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, doc.internal.pageSize.width - margin, yPosition);
        yPosition += lineHeight * 2;
      }
    });

    doc.save(fileName);
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      ACTIVE: "Ativo",
      EXPIRED: "Expirado",
      PENDING: "Pendente",
      CANCELLED: "Cancelado",
    };
    return statusMap[status] || status;
  }
}

class ExcelExporter implements DocumentExportFactory {
  async export(data: DocumentData | DocumentData[], filename?: string): Promise<void> {
    const XLSX = await import("xlsx");
    const documents = Array.isArray(data) ? data : [data];

    // Preparar dados para Excel
    const rows = documents.map((doc) => {
      const row: Record<string, any> = {
        "Tipo de Documento": doc.templateName,
        "Órgão": doc.organizationName,
        "Empresa": doc.companyName,
        "Estabelecimento": doc.establishmentName,
        "Responsável": doc.responsibleName,
        "Email": doc.responsibleEmail || "",
        "Data de Expiração": doc.expirationDate
          ? new Date(doc.expirationDate).toLocaleDateString("pt-BR")
          : "",
        "Data de Alerta": doc.alertDate
          ? new Date(doc.alertDate).toLocaleDateString("pt-BR")
          : "",
        "Status": this.translateStatus(doc.status),
        "Data de Criação": new Date(doc.createdAt).toLocaleDateString("pt-BR"),
        "Observações": doc.observations || "",
      };

      // Adicionar campos customizados
      if (doc.customData) {
        Object.entries(doc.customData).forEach(([key, value]) => {
          row[key] = String(value || "");
        });
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documentos");

    // Ajustar largura das colunas
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    worksheet["!cols"] = colWidths;

    const fileName = filename || `documentos_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      ACTIVE: "Ativo",
      EXPIRED: "Expirado",
      PENDING: "Pendente",
      CANCELLED: "Cancelado",
    };
    return statusMap[status] || status;
  }
}

export class DocumentExportFactory {
  static create(format: ExportFormat): DocumentExportFactory {
    switch (format) {
      case "pdf":
        return new PDFExporter();
      case "excel":
        return new ExcelExporter();
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }
  }

  static async export(
    format: ExportFormat,
    data: DocumentData | DocumentData[],
    filename?: string
  ): Promise<void> {
    const exporter = this.create(format);
    await exporter.export(data, filename);
  }
}














