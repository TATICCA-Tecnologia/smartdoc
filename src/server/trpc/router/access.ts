import { z } from "zod";
import { router, protectedProcedure, createPermissionMiddleware } from "../trpc";
import {
  assignRoleInput,
  createRoleInput,
  updateRoleInput,
  createPermissionInput,
  assignPermissionToRoleInput,
  removePermissionFromRoleInput,
  assignCompanyInput,
  removeCompanyInput,
} from "./input/access";

const requireAccessManagement = createPermissionMiddleware("accesses:manage");

export const accessRouter = router({
  listUsers: protectedProcedure.input(z.object({
    companyId: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const { companyId } = input;
    const users = await ctx.prisma.user.findMany({
      where: {
        ...(companyId && { userCompanies: { some: { companyId } } }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
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
        userCompanies: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                cnpj: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return users.map((user) => ({
      ...user,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })),
      companies: user.userCompanies.map((uc) => ({
        id: uc.company.id,
        name: uc.company.name,
        cnpj: uc.company.cnpj,
        code: uc.code,
      })),
    }));
  }),

  listRoles: protectedProcedure.query(async ({ ctx }) => {
    const roles = await ctx.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return roles.map((role) => ({
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    }));
  }),

  listPermissions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.permission.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),

  createRole: protectedProcedure
    .use(requireAccessManagement)
    .input(createRoleInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.role.create({
        data: {
          name: input.name,
          description: input.description,
        },
      });
    }),

  updateRole: protectedProcedure
    .use(requireAccessManagement)
    .input(updateRoleInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.role.update({
        where: { id },
        data,
      });
    }),

  deleteRole: protectedProcedure
    .use(requireAccessManagement)
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.role.delete({
        where: { id: input },
      });
    }),

  assignRole: protectedProcedure
    .use(requireAccessManagement)
    .input(assignRoleInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userRole.create({
        data: {
          userId: input.userId,
          roleId: input.roleId,
        },
        include: {
          role: true,
        },
      });
    }),

  removeRole: protectedProcedure
    .use(requireAccessManagement)
    .input(assignRoleInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userRole.deleteMany({
        where: {
          userId: input.userId,
          roleId: input.roleId,
        },
      });
    }),

  createPermission: protectedProcedure
    .use(requireAccessManagement)
    .input(createPermissionInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.permission.create({
        data: input,
      });
    }),

  assignPermissionToRole: protectedProcedure
    .use(requireAccessManagement)
    .input(assignPermissionToRoleInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.rolePermission.create({
        data: {
          roleId: input.roleId,
          permissionId: input.permissionId,
        },
        include: {
          permission: true,
        },
      });
    }),

  removePermissionFromRole: protectedProcedure
    .use(requireAccessManagement)
    .input(removePermissionFromRoleInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.rolePermission.deleteMany({
        where: {
          roleId: input.roleId,
          permissionId: input.permissionId,
        },
      });
    }),

  assignCompany: protectedProcedure
    .use(requireAccessManagement)
    .input(assignCompanyInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userCompany.upsert({
        where: {
          userId_companyId: {
            userId: input.userId,
            companyId: input.companyId,
          },
        },
        update: {
          code: input.code,
        },
        create: {
          userId: input.userId,
          companyId: input.companyId,
          code: input.code,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              cnpj: true,
            },
          },
        },
      });
    }),

  removeCompany: protectedProcedure
    .use(requireAccessManagement)
    .input(removeCompanyInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userCompany.deleteMany({
        where: {
          userId: input.userId,
          companyId: input.companyId,
        },
      });
    }),
});

