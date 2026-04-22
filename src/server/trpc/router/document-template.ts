import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { getUserCompanyIds } from "../utils/user-company-scope";

const fieldTypeEnum = z.enum([
  "TEXT",
  "NUMBER",
  "DATE",
  "EMAIL",
  "CPF",
  "CNPJ",
  "PHONE",
  "TEXTAREA",
  "SELECT",
  "FILE",
]);

const fieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: fieldTypeEnum,
  required: z.boolean(),
  validationRule: z.enum(["NONE", "CPF", "CNPJ", "EMAIL", "NUMBER", "PHONE"]).optional(),
  order: z.number(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  width: z.number().optional(),
  options: z.array(z.string()).optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  companyId: z.string(),
  fields: z.array(fieldSchema),
});

const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.string(),
});

export const documentTemplateRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        search: z.string().optional(),
        isDefault: z.boolean().optional(),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, isDefault, companyId } = input;
      const skip = (page - 1) * pageSize;

      let companyFilter: Record<string, unknown> = {};
      if (companyId) {
        companyFilter = { companyId };
      } else {
        const ids = await getUserCompanyIds(ctx);
        if (ids.length === 0) {
          return {
            templates: [],
            pagination: { page, pageSize, total: 0, totalPages: 0 },
          };
        }
        companyFilter = { companyId: { in: ids } };
      }

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(isDefault !== undefined && { isDefault }),
        ...companyFilter,
      };

      const [templates, total] = await Promise.all([
        ctx.prisma.documentTemplate.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            fields: {
              orderBy: { order: "asc" },
            },
            _count: {
              select: {
                documents: true,
              },
            },
          },
        }),
        ctx.prisma.documentTemplate.count({ where }),
      ]);

      return {
        templates,
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
      const template = await ctx.prisma.documentTemplate.findUnique({
        where: { id: input.id },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!template) {
        throw new Error("Template não encontrado");
      }

      return template;
    }),

  create: protectedProcedure
    .input(createTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { fields, companyId, ...templateData } = input;

      const template = await ctx.prisma.documentTemplate.create({
        data: {
          ...templateData,
          companyId,
          fields: {
            create: fields,
          },
        },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      });

      return template;
    }),

  update: protectedProcedure
    .input(updateTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, fields, ...templateData } = input;

      // Delete existing fields and create new ones
      await ctx.prisma.documentTemplateField.deleteMany({
        where: { templateId: id },
      });

      const template = await ctx.prisma.documentTemplate.update({
        where: { id },
        data: {
          ...templateData,
          ...(fields && {
            fields: {
              create: fields,
            },
          }),
        },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      });

      return template;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.documentTemplate.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.prisma.documentTemplate.findUnique({
        where: { id: input.id },
        include: {
          fields: true,
        },
      });

      if (!original) {
        throw new Error("Template não encontrado");
      }

      const duplicate = await ctx.prisma.documentTemplate.create({
        data: {
          name: `${original.name} (Cópia)`,
          description: original.description,
          isDefault: false,
          fields: {
            create: original.fields.map(({ id, templateId, createdAt, updatedAt, ...field }) => field),
          },
        },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      });

      return duplicate;
    }),
});






