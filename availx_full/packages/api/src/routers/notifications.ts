import { router, protectedProcedure, providerProcedure } from '../trpc';
import { z } from 'zod';
import {
  sendNotificationSchema,
  sendBookingConfirmationSchema,
  sendProviderAlertSchema,
  sendPaymentSuccessSchema,
  sendReviewReminderSchema,
  updateNotificationPreferencesSchema,
} from '@localpro/types';
import { TRPCError } from '@trpc/server';
import {
  sendPushNotification,
  sendBookingConfirmation,
  sendProviderAlert,
  sendPaymentSuccess,
  sendReviewReminder,
} from '../utils/notifications';

/**
 * Notifications Router
 * Manages push notifications, SMS, and email notifications
 */
export const notificationsRouter = router({
  /**
   * Send booking confirmation notification
   */
  sendBookingConfirmation: protectedProcedure
    .input(sendBookingConfirmationSchema)
    .mutation(async ({ input, ctx }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          customer: {
            include: {
              user: true,
            },
          },
          provider: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      await sendBookingConfirmation(
        booking.customer.userId,
        booking.customer.user.phone,
        booking.customer.user.email,
        {
          bookingNumber: booking.bookingNumber,
          providerName: booking.provider.user.name,
          serviceType: booking.serviceType,
          scheduledDate: booking.scheduledDate,
        }
      );

      return { success: true };
    }),

  /**
   * Send provider alert
   */
  sendProviderAlert: protectedProcedure
    .input(sendProviderAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const provider = await ctx.prisma.providerProfile.findUnique({
        where: { id: input.providerId },
        include: {
          user: true,
        },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      await sendProviderAlert(
        provider.userId,
        provider.user.phone,
        provider.user.email,
        input.type,
        input.data
      );

      return { success: true };
    }),

  /**
   * Send OTP notification
   */
  sendOTP: protectedProcedure
    .input(z.object({ phone: z.string(), otp: z.string() }))
    .mutation(async ({ input }) => {
      // This is typically called by the auth router
      return { success: true };
    }),

  /**
   * Send payment success notification
   */
  sendPaymentSuccess: protectedProcedure
    .input(sendPaymentSuccessSchema)
    .mutation(async ({ input, ctx }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.paymentId },
        include: {
          booking: {
            include: {
              customer: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      await sendPaymentSuccess(
        payment.booking.customer.userId,
        payment.booking.customer.user.phone,
        payment.booking.customer.user.email,
        {
          amount: Number(payment.amount),
          bookingNumber: payment.booking.bookingNumber,
          transactionId: payment.transactionId || payment.id,
        }
      );

      return { success: true };
    }),

  /**
   * Send review reminder
   */
  sendReviewReminder: protectedProcedure
    .input(sendReviewReminderSchema)
    .mutation(async ({ input, ctx }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          customer: {
            include: {
              user: true,
            },
          },
          provider: {
            include: {
              user: true,
            },
          },
          review: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      if (booking.review) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Review already exists',
        });
      }

      await sendReviewReminder(booking.customer.userId, booking.customer.user.phone, {
        bookingNumber: booking.bookingNumber,
        providerName: booking.provider.user.name,
        serviceType: booking.serviceType,
      });

      return { success: true };
    }),

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: protectedProcedure
    .input(updateNotificationPreferencesSchema)
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.id },
        include: {
          customerProfile: true,
          providerProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (user.customerProfile) {
        await ctx.prisma.customerProfile.update({
          where: { id: user.customerProfile.id },
          data: {
            notificationPreferences: input as any,
          },
        });
      }

      return { success: true, preferences: input };
    }),

  /**
   * Get user notifications
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, unreadOnly } = input;
      const offset = (page - 1) * limit;

      const whereClause: any = {
        userId: ctx.session.id,
      };

      if (unreadOnly) {
        whereClause.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        ctx.prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        ctx.prisma.notification.count({ where: whereClause }),
        ctx.prisma.notification.count({
          where: {
            userId: ctx.session.id,
            isRead: false,
          },
        }),
      ]);

      return {
        notifications,
        unreadCount,
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
   * Mark notifications as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string().cuid()).optional(),
        markAll: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.markAll) {
        await ctx.prisma.notification.updateMany({
          where: {
            userId: ctx.session.id,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      } else if (input.notificationIds) {
        await ctx.prisma.notification.updateMany({
          where: {
            id: { in: input.notificationIds },
            userId: ctx.session.id,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }

      return { success: true };
    }),
});
