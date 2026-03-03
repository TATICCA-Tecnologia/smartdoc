import { protectedProcedure, router } from "../trpc";
import { z } from "zod";

// Helper para verificar permissões
function hasPermission(userPermissions: string[], permission: string): boolean {
  return userPermissions.includes(permission) || userPermissions.includes("admin");
}

export const dashboardRouter = router({
  getStats: protectedProcedure.input(z.object({ companyId: z.string().optional() })).query(async ({ ctx, input }) => {
    const sessionUser = ctx.session?.user as any;
    const userId = sessionUser?.id;

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Extrair todas as permissões do usuário
    const allPermissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );

    const canReadDocuments = hasPermission(allPermissions, "documents:read");

    const stats = {
      totalDocuments: 0,
      totalTemplates: 0,
      totalEstablishments: 0,
      totalNotes: 0,
    };

    if (canReadDocuments) {
      const isAdmin = allPermissions.includes("admin") || user.userRoles.some((ur) => ur.role.name === "ADMINISTRADOR");

      const documentWhere = isAdmin
        ? {}
        : { responsibleId: userId, companyId: input.companyId };

      stats.totalDocuments = await ctx.prisma.document.count({
        where: documentWhere,
      });

      stats.totalTemplates = await ctx.prisma.documentTemplate.count({
        where: { isDefault: true },
      });

      stats.totalEstablishments = await ctx.prisma.establishment.count({
        where: { status: "ACTIVE" },
      });

      stats.totalNotes = await ctx.prisma.document.count({
        where: {
          ...documentWhere,
          observations: { not: null },
        },
      });
    }

    return stats;
  }),

  getLatestDocuments: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(5),
        companyId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessionUser = ctx.session?.user as any;
      const userId = sessionUser?.id;

      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      const allPermissions = user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.name)
      );

      const canReadDocuments = hasPermission(allPermissions, "documents:read");

      if (!canReadDocuments) {
        return [];
      }

      const isAdmin = allPermissions.includes("admin") || user.userRoles.some((ur) => ur.role.name === "ADMINISTRADOR");

      const documentWhere = isAdmin
        ? {}
        : { responsibleId: userId, companyId: input.companyId };

      const documents = await ctx.prisma.document.findMany({
        where: documentWhere,
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          template: {
            select: {
              name: true,
            },
          },
          organization: {
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
              code: true,
            },
          },
        },
      });

      return documents.map((doc) => ({
        id: doc.id,
        name: doc.template?.name || "Documento",
        date: doc.createdAt.toISOString().split("T")[0],
        type: "PDF",
        observations: doc.observations,
      }));
    }),

  getEstablishmentsStats: protectedProcedure.input(z.object({ companyId: z.string().optional() })).query(async ({ ctx, input }) => {
    const sessionUser = ctx.session?.user as any;
    const userId = sessionUser?.id;

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const allPermissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );

    const canReadDocuments = hasPermission(allPermissions, "documents:read");

    if (!canReadDocuments) {
      return [];
    }

    const isAdmin = allPermissions.includes("admin") || user.userRoles.some((ur) => ur.role.name === "ADMINISTRADOR");

    const documentWhere = isAdmin
      ? {}
      : { responsibleId: userId, companyId: input.companyId };

    // Buscar estabelecimentos com contagem de documentos
    const establishments = await ctx.prisma.establishment.findMany({
      where: { status: "ACTIVE" },
      include: {
        _count: {
          select: {
            documents: {
              where: documentWhere,
            },
          },
        },
      },
    });

    return establishments.map((est) => ({
      name: est.name,
      code: est.code || "",
      files: est._count.documents,
    }));
  }),
});

