import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const createCompanySchema = z.object({
  name: z.string().min(1).max(120),
  cnpj: z.string().min(1),
  logoUrl: z.string().optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string(),
});

export const companyRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        companyId: z.string().optional(),
        search: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, status, companyId } = input;
      const skip = (page - 1) * pageSize;

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { cnpj: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && { status }),
        ...(companyId && { id: companyId }),
      };

      const [companies, total] = await Promise.all([
        ctx.prisma.company.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            establishments: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                documents: true,
              },
            },
          },
        }),
        ctx.prisma.company.count({ where }),
      ]);

      return {
        companies,
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
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.id },
        include: {
          establishments: true,
          documents: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!company) {
        throw new Error("Empresa não encontrada");
      }

      return company;
    }),

  create: protectedProcedure
    .input(createCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.create({
        data: input,
      });

      return company;
    }),

  update: protectedProcedure
    .input(updateCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const company = await ctx.prisma.company.update({
        where: { id },
        data,
      });

      return company;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.company.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

