import { router, adminProcedure } from '../trpc';
import {
  getAllUsersSchema,
  getAllProvidersSchema,
  verifyProviderDocumentsSchema,
  blockUserSchema,
  blockProviderSchema,
  listReportsSchema,
  resolveReportSchema,
  approveProviderSchema,
} from '@localpro/types';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

/**
 * Admin Router
 * Manages admin operations like user management, provider verification, and reports
 */
export const adminRouter = router({
  /**
   * Get all users with filtering
   */
  getAllUsers: adminProcedure
    .input(getAllUsersSchema.optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page || 1;
      const limit = input?.limit || 50;
      const offset = (page - 1) * limit;

      const whereClause: any = {};

      if (input?.role) {
        whereClause.role = input.role;
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where: whereClause,
          include: {
            customerProfile: true,
            providerProfile: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        ctx.prisma.user.count({ where: whereClause }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
      };
    }),

  /**
   * Get all providers with filtering
   */
  getAllProviders: adminProcedure
    .input(getAllProvidersSchema.optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page || 1;
      const limit = input?.limit || 50;
      const offset = (page - 1) * limit;

      const whereClause: any = {};

      if (input?.status) {
        whereClause.profileStatus = input.status;
      }

      if (input?.categoryId) {
        whereClause.categoryId = input.categoryId;
      }

      const [providers, total] = await Promise.all([
        ctx.prisma.providerProfile.findMany({
          where: whereClause,
          include: {
            user: true,
            category: true,
            certifications: true,
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        ctx.prisma.providerProfile.count({ where: whereClause }),
      ]);

      return {
        providers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
      };
    }),

  /**
   * Verify/Approve provider
   */
  approveProvider: adminProcedure
    .input(approveProviderSchema)
    .mutation(async ({ input, ctx }) => {
      const { providerId, approved, rejectionReason } = input;

      const provider = await ctx.prisma.providerProfile.findUnique({
        where: { id: providerId },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      const updateData: any = {
        profileStatus: approved ? 'APPROVED' : 'REJECTED',
        isActive: approved,
      };

      if (!approved && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      const updatedProvider = await ctx.prisma.providerProfile.update({
        where: { id: providerId },
        data: updateData,
      });

      // Log admin action
      await ctx.prisma.adminLog.create({
        data: {
          userId: ctx.session.id,
          action: approved ? 'APPROVE_PROVIDER' : 'REJECT_PROVIDER',
          entityType: 'PROVIDER',
          entityId: providerId,
          details: {
            approved,
            rejectionReason,
          } as any,
        },
      });

      return { success: true, provider: updatedProvider };
    }),

  /**
   * Verify provider documents
   */
  verifyProviderDocuments: adminProcedure
    .input(verifyProviderDocumentsSchema)
    .mutation(async ({ input, ctx }) => {
      const { providerId, documentType, verified, notes } = input;

      const provider = await ctx.prisma.providerProfile.findUnique({
        where: { id: providerId },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      const updateData: any = {};

      if (documentType === 'AADHAAR') {
        updateData.aadhaarVerified = verified;
        if (verified) {
          updateData.aadhaarVerifiedAt = new Date();
        }
      } else if (documentType === 'BACKGROUND_CHECK') {
        updateData.backgroundVerified = verified;
        if (verified) {
          updateData.backgroundVerifiedAt = new Date();
        }
      } else if (documentType === 'CERTIFICATION') {
        // Update specific certifications
        // This would require additional logic to identify which certification
      }

      await ctx.prisma.providerProfile.update({
        where: { id: providerId },
        data: updateData,
      });

      // Log admin action
      await ctx.prisma.adminLog.create({
        data: {
          userId: ctx.session.id,
          action: `VERIFY_${documentType}`,
          entityType: 'PROVIDER',
          entityId: providerId,
          details: {
            verified,
            notes,
          } as any,
        },
      });

      return { success: true };
    }),

  /**
   * Block/suspend a user
   */
  blockUser: adminProcedure
    .input(blockUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, reason, permanent } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // In production, you'd add a 'blocked' or 'suspended' field to the User model
      // For now, we'll log the action

      await ctx.prisma.adminLog.create({
        data: {
          userId: ctx.session.id,
          action: 'BLOCK_USER',
          entityType: 'USER',
          entityId: userId,
          details: {
            reason,
            permanent,
          } as any,
        },
      });

      return { success: true };
    }),

  /**
   * Block a provider
   */
  blockProvider: adminProcedure
    .input(blockProviderSchema)
    .mutation(async ({ input, ctx }) => {
      const { providerId, reason, permanent } = input;

      const provider = await ctx.prisma.providerProfile.findUnique({
        where: { id: providerId },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      await ctx.prisma.providerProfile.update({
        where: { id: providerId },
        data: {
          isActive: false,
          profileStatus: 'REJECTED',
          rejectionReason: reason,
        },
      });

      await ctx.prisma.adminLog.create({
        data: {
          userId: ctx.session.id,
          action: 'BLOCK_PROVIDER',
          entityType: 'PROVIDER',
          entityId: providerId,
          details: {
            reason,
            permanent,
          } as any,
        },
      });

      return { success: true };
    }),

  /**
   * List reports (placeholder - requires Report model in schema)
   */
  listReports: adminProcedure
    .input(listReportsSchema.optional())
    .query(async ({ input, ctx }) => {
      // This is a placeholder implementation
      // In production, you'd have a Report model in your schema

      return {
        reports: [],
        pagination: {
          page: input?.page || 1,
          limit: input?.limit || 50,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }),

  /**
   * Resolve a report
   */
  resolveReport: adminProcedure
    .input(resolveReportSchema)
    .mutation(async ({ input, ctx }) => {
      const { reportId, resolution, notes, actionTaken } = input;

      // Placeholder implementation
      // In production, you'd update the Report model

      await ctx.prisma.adminLog.create({
        data: {
          userId: ctx.session.id,
          action: 'RESOLVE_REPORT',
          entityType: 'REPORT',
          entityId: reportId,
          details: {
            resolution,
            notes,
            actionTaken,
          } as any,
        },
      });

      return { success: true };
    }),

  /**
   * Get admin dashboard statistics
   */
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalProviders,
      totalBookings,
      pendingProviders,
      recentUsers,
      recentProviders,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.providerProfile.count(),
      ctx.prisma.booking.count(),
      ctx.prisma.providerProfile.count({
        where: { profileStatus: 'PENDING' },
      }),
      ctx.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customerProfile: true,
          providerProfile: true,
        },
      }),
      ctx.prisma.providerProfile.findMany({
        where: { profileStatus: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: true,
          category: true,
        },
      }),
    ]);

    // Get bookings by status
    const bookingsByStatus = await ctx.prisma.booking.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get users by role
    const usersByRole = await ctx.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return {
      stats: {
        totalUsers,
        totalProviders,
        totalBookings,
        pendingProviders,
        bookingsByStatus: bookingsByStatus.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {} as Record<string, number>),
        usersByRole: usersByRole.reduce((acc, stat) => {
          acc[stat.role] = stat._count;
          return acc;
        }, {} as Record<string, number>),
      },
      recentUsers,
      recentProviders,
    };
  }),

  /**
   * Get admin logs
   */
  getAdminLogs: adminProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
        action: z.string().optional(),
        entityType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, action, entityType } = input;
      const offset = (page - 1) * limit;

      const whereClause: any = {};

      if (action) {
        whereClause.action = action;
      }

      if (entityType) {
        whereClause.entityType = entityType;
      }

      const [logs, total] = await Promise.all([
        ctx.prisma.adminLog.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        ctx.prisma.adminLog.count({ where: whereClause }),
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
      };
    }),
});
