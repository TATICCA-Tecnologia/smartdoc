import { z } from "zod";
import { Prisma } from "@prisma/client";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const createDocumentSchema = z.object({
  templateId: z.string(),
  organizationId: z.string(),
  companyId: z.string(),
  establishmentId: z.string(),
  responsibleId: z.string(),
  chiefId: z.string().optional(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
  alertDate: z.string().optional(),
  classification: z.string().optional(),
  groupId: z.string().optional(),
  customData: z.record(z.string(), z.any()).optional().nullable(),
  observations: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "EXPIRED", "PENDING", "CANCELLED"]).default("ACTIVE"),
});

const updateDocumentSchema = createDocumentSchema.partial().extend({
  id: z.string(),
});

export const documentRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        search: z.string().optional(),
        status: z.enum(["ACTIVE", "EXPIRED", "PENDING", "CANCELLED"]).optional(),
        templateId: z.string().optional(),
        companyId: z.string().optional(),
        establishmentId: z.string().optional(),
        organizationId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, status, templateId, companyId, establishmentId, organizationId } = input;
      const skip = (page - 1) * pageSize;

      const where = {
        ...(search && {
          observations: { contains: search, mode: "insensitive" as const },
        }),
        ...(status && { status }),
        ...(templateId && { templateId }),
        ...(companyId && { companyId }),
        ...(establishmentId && { establishmentId }),
        ...(organizationId && { organizationId }),
      };

      const [documents, total] = await Promise.all([
        ctx.prisma.document.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            template: {
              select: {
                id: true,
                name: true,
              },
            },
            organization: {
              select: {
                id: true,
                shortName: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            establishment: {
              select: {
                id: true,
                name: true,
              },
            },
            responsible: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            chief: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                filePath: true,
                fileType: true,
                fileSize: true,
              },
            },
          },
        }),
        ctx.prisma.document.count({ where }),
      ]);

      return {
        documents,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
        include: {
          template: {
            include: {
              fields: {
                orderBy: { order: "asc" },
              },
            },
          },
          organization: true,
          company: true,
          establishment: true,
          responsible: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
      });

      if (!document) {
        throw new Error("Documento não encontrado");
      }

      return document;
    }),

  getPublicById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
        include: {
          template: {
            include: {
              fields: {
                orderBy: { order: "asc" },
              },
            },
          },
          organization: true,
          company: true,
          establishment: true,
          responsible: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          chief: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
      });

      if (!document) {
        throw new Error("Documento não encontrado");
      }

      return document;
    }),

  create: protectedProcedure
    .input(createDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const { expirationDate, alertDate, issueDate, ...data } = input;

      const document = await ctx.prisma.document.create({
        data: {
          ...data,
          issueDate: issueDate ? new Date(issueDate) : null,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          alertDate: alertDate ? new Date(alertDate) : null,
          customData: data.customData === null ? Prisma.JsonNull : data.customData,
        },
        include: {
          template: true,
          organization: true,
          company: true,
          establishment: true,
          responsible: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          chief: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return document;
    }),

  update: protectedProcedure
    .input(updateDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, expirationDate, alertDate, issueDate, ...data } = input;

      const updateData: any = {};
      
      if (data.templateId !== undefined) updateData.templateId = data.templateId;
      if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
      if (data.companyId !== undefined) updateData.companyId = data.companyId;
      if (data.establishmentId !== undefined) updateData.establishmentId = data.establishmentId;
      if (data.responsibleId !== undefined) updateData.responsibleId = data.responsibleId;
      if (data.chiefId !== undefined) updateData.chiefId = data.chiefId;
      if (data.classification !== undefined) updateData.classification = data.classification;
      if (data.groupId !== undefined) updateData.groupId = data.groupId;
      if (data.observations !== undefined) updateData.observations = data.observations;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.customData !== undefined) {
        updateData.customData = data.customData === null ? Prisma.JsonNull : data.customData;
      }
      if (issueDate) updateData.issueDate = new Date(issueDate);
      if (expirationDate) updateData.expirationDate = new Date(expirationDate);
      if (alertDate) updateData.alertDate = new Date(alertDate);

      const document = await ctx.prisma.document.update({
        where: { id },
        data: updateData,
        include: {
          template: true,
          organization: true,
          company: true,
          establishment: true,
          responsible: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          chief: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return document;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.document.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  deleteAttachment: protectedProcedure
    .input(z.object({ attachmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.prisma.documentAttachment.findUnique({
        where: { id: input.attachmentId },
        select: { documentId: true },
      });
      if (!attachment) {
        throw new Error("Anexo não encontrado");
      }
      await ctx.prisma.documentAttachment.delete({
        where: { id: input.attachmentId },
      });
      return { success: true };
    }),

  getExpiring: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + input.days);

      const documents = await ctx.prisma.document.findMany({
        where: {
          status: "ACTIVE",
          ...(input.companyId && { companyId: input.companyId }),
          expirationDate: {
            gte: today,
            lte: futureDate,
          },
        },
        include: {
          template: {
            select: {
              name: true,
            },
          },
          company: {
            select: {
              name: true,
            },
          },
          establishment: {
            select: {
              name: true,
            },
          },
          responsible: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          expirationDate: "asc",
        },
      });

      return documents;
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus, expiringSoon] = await Promise.all([
      ctx.prisma.document.count(),
      ctx.prisma.document.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      ctx.prisma.document.count({
        where: {
          status: "ACTIVE",
          expirationDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      byStatus,
      expiringSoon,
    };
  }),
});






