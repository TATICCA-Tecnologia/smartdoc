import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const createDocumentGroupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

const updateDocumentGroupSchema = createDocumentGroupSchema.partial().extend({
  id: z.string(),
});

export const documentGroupRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(100),
        search: z.string().optional(),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, companyId } = input;
      const skip = (page - 1) * pageSize;

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [groups, total] = await Promise.all([
        ctx.prisma.documentGroup.findMany({
          where: {
            ...where,
            documents: {
              every: {
                companyId: companyId,
              }
            }
          },
          skip,
          take: pageSize,
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: {
                documents: true,
              },
            },
          },
        }),
        ctx.prisma.documentGroup.count({ where }),
      ]);

      return {
        groups,
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
      const group = await ctx.prisma.documentGroup.findUnique({
        where: { id: input.id },
        include: {
          documents: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!group) {
        throw new Error("Grupo não encontrado");
      }

      return group;
    }),

  create: protectedProcedure
    .input(createDocumentGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.documentGroup.create({
        data: input,
      });

      return group;
    }),

  update: protectedProcedure
    .input(updateDocumentGroupSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const group = await ctx.prisma.documentGroup.update({
        where: { id },
        data,
      });

      return group;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.documentGroup.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  getPublicById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const group = await ctx.prisma.documentGroup.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          description: true,
          documents: {
            where: {
              status: "ACTIVE",
            },
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
            },
          },
        },
      });

      if (!group) {
        throw new Error("Grupo não encontrado");
      }

      return group;
    }),
});



