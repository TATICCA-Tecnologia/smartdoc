import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { getUserCompanyIds } from "../utils/user-company-scope";

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  shortName: z.string().min(1).max(60),
  cnpj: z.string().optional(),
  type: z.enum(["FEDERAL", "ESTADUAL", "MUNICIPAL", "OUTROS"]),
  companyId: z.string().optional(),
  address: z.string().max(180).optional(),
  complement: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.preprocess((v) => (v === "" ? undefined : v), z.string().length(2, "UF deve ter 2 caracteres").optional()),
  zipCode: z.string().max(10).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const updateOrganizationSchema = createOrganizationSchema.partial().extend({
  id: z.string(),
});

export const organizationRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        search: z.string().optional(),
        type: z.enum(["FEDERAL", "ESTADUAL", "MUNICIPAL", "OUTROS"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, type, status, companyId } = input;
      const skip = (page - 1) * pageSize;

      let companyFilter: Record<string, unknown> = {};
      if (companyId) {
        companyFilter = { companyId };
      } else {
        const ids = await getUserCompanyIds(ctx);
        if (ids.length === 0) {
          return {
            organizations: [],
            pagination: { page, pageSize, total: 0, totalPages: 0 },
          };
        }
        companyFilter = { companyId: { in: ids } };
      }

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { shortName: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(type && { type }),
        ...(status && { status }),
        ...companyFilter,
      };

      const [organizations, total] = await Promise.all([
        ctx.prisma.organization.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: {
                documents: true,
              },
            },
          },
        }),
        ctx.prisma.organization.count({ where }),
      ]);

      return {
        organizations,
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
      const organization = await ctx.prisma.organization.findUnique({
        where: { id: input.id },
        include: {
          documents: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!organization) {
        throw new Error("Órgão não encontrado");
      }

      return organization;
    }),

  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organization.create({
        data: input,
      });

      return organization;
    }),

  update: protectedProcedure
    .input(updateOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const organization = await ctx.prisma.organization.update({
        where: { id },
        data,
      });

      return organization;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.organization.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});






