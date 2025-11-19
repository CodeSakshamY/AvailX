import { router, customerProcedure, providerProcedure, protectedProcedure } from '../trpc';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
} from '@localpro/types';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const bookingRouter = router({
  create: customerProcedure
    .input(createBookingSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        providerId,
        serviceType,
        serviceLocation,
        scheduledDate,
        scheduledTime,
        specialInstructions,
        quotedPrice,
      } = input;

      const provider = await ctx.prisma.providerProfile.findUnique({
        where: { id: providerId },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      if (!provider.isActive || provider.profileStatus !== 'APPROVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Provider is not available for bookings',
        });
      }

      const bookingCount = await ctx.prisma.booking.count();
      const bookingNumber = `BK-${new Date().getFullYear()}-${String(
        bookingCount + 1
      ).padStart(6, '0')}`;

      const booking = await ctx.prisma.booking.create({
        data: {
          bookingNumber,
          customerId: ctx.customerProfile!.id,
          providerId,
          serviceType,
          serviceLocation,
          scheduledDate: new Date(scheduledDate),
          scheduledTime,
          specialInstructions,
          quotedPrice,
          currency: 'INR',
          status: 'PENDING',
        },
        include: {
          provider: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profilePhoto: true,
                },
              },
            },
          },
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: provider.userId,
          type: 'NEW_BOOKING',
          title: 'New Booking Request',
          body: `You have a new booking request from ${ctx.session.name}`,
          data: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
          },
        },
      });

      return booking;
    }),

  myBookings: customerProcedure
    .input(
      z.object({
        status: z
          .enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
          .optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: any = {
        customerId: ctx.customerProfile!.id,
      };

      if (status) {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        ctx.prisma.booking.findMany({
          where,
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                    phone: true,
                    profilePhoto: true,
                  },
                },
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            payment: true,
            review: true,
          },
          orderBy: {
            scheduledDate: 'desc',
          },
          skip,
          take: limit,
        }),
        ctx.prisma.booking.count({ where }),
      ]);

      return {
        bookings,
        total,
        page,
        limit,
        hasMore: total > skip + limit,
      };
    }),

  providerBookings: providerProcedure
    .input(
      z.object({
        status: z
          .enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
          .optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: any = {
        providerId: ctx.providerProfile.id,
      };

      if (status) {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        ctx.prisma.booking.findMany({
          where,
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    name: true,
                    phone: true,
                    profilePhoto: true,
                  },
                },
              },
            },
            payment: true,
            review: true,
          },
          orderBy: {
            scheduledDate: 'desc',
          },
          skip,
          take: limit,
        }),
        ctx.prisma.booking.count({ where }),
      ]);

      return {
        bookings,
        total,
        page,
        limit,
        hasMore: total > skip + limit,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.id },
        include: {
          provider: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profilePhoto: true,
                },
              },
              category: true,
            },
          },
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  profilePhoto: true,
                },
              },
            },
          },
          payment: true,
          review: true,
          chatRoom: {
            include: {
              messages: {
                take: 10,
                orderBy: {
                  createdAt: 'desc',
                },
              },
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

      const isCustomer = ctx.session.role === 'CUSTOMER' &&
        ctx.session.customerProfile?.id === booking.customerId;
      const isProvider = ctx.session.role === 'PROVIDER' &&
        ctx.session.providerProfile?.id === booking.providerId;
      const isAdmin = ctx.session.role === 'ADMIN';

      if (!isCustomer && !isProvider && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this booking',
        });
      }

      return booking;
    }),

  accept: providerProcedure
    .input(z.object({ bookingId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          customer: {
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

      if (booking.providerId !== ctx.providerProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this booking',
        });
      }

      if (booking.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Booking is not in pending status',
        });
      }

      const updatedBooking = await ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
        include: {
          provider: {
            include: {
              user: true,
            },
          },
          customer: {
            include: {
              user: true,
            },
          },
        },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: booking.customer.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed',
          body: `Your booking ${booking.bookingNumber} has been confirmed by ${ctx.session.name}`,
          data: {
            bookingId: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
          },
        },
      });

      return updatedBooking;
    }),

  reject: providerProcedure
    .input(
      z.object({
        bookingId: z.string().cuid(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          customer: {
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

      if (booking.providerId !== ctx.providerProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this booking',
        });
      }

      if (booking.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Booking is not in pending status',
        });
      }

      const updatedBooking = await ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: {
          status: 'CANCELLED',
          cancelledBy: 'PROVIDER',
          cancellationReason: input.reason,
          cancelledAt: new Date(),
        },
      });

      await ctx.prisma.providerProfile.update({
        where: { id: ctx.providerProfile.id },
        data: {
          cancelledJobs: {
            increment: 1,
          },
        },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: booking.customer.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          body: `Your booking ${booking.bookingNumber} was cancelled by the provider. Reason: ${input.reason}`,
          data: {
            bookingId: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
          },
        },
      });

      return updatedBooking;
    }),

  start: providerProcedure
    .input(z.object({ bookingId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          customer: { include: { user: true } },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      if (booking.providerId !== ctx.providerProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this booking',
        });
      }

      if (booking.status !== 'CONFIRMED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Booking must be confirmed before starting',
        });
      }

      const updatedBooking = await ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: booking.customer.userId,
          type: 'BOOKING_STARTED',
          title: 'Service Started',
          body: `${ctx.session.name} has started working on your booking`,
          data: {
            bookingId: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
          },
        },
      });

      return updatedBooking;
    }),

  complete: providerProcedure
    .input(z.object({ bookingId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          customer: { include: { user: true } },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      if (booking.providerId !== ctx.providerProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this booking',
        });
      }

      if (booking.status !== 'IN_PROGRESS') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Booking must be in progress before completing',
        });
      }

      const updatedBooking = await ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await ctx.prisma.$transaction([
        ctx.prisma.providerProfile.update({
          where: { id: ctx.providerProfile.id },
          data: {
            completedJobs: {
              increment: 1,
            },
            totalJobs: {
              increment: 1,
            },
          },
        }),
        ctx.prisma.customerProfile.update({
          where: { id: booking.customerId },
          data: {
            completedBookings: {
              increment: 1,
            },
            totalBookings: {
              increment: 1,
            },
          },
        }),
      ]);

      await ctx.prisma.notification.create({
        data: {
          userId: booking.customer.userId,
          type: 'BOOKING_COMPLETED',
          title: 'Service Completed',
          body: `Your booking ${booking.bookingNumber} has been completed. Please leave a review!`,
          data: {
            bookingId: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
          },
        },
      });

      return updatedBooking;
    }),

  cancel: protectedProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ input, ctx }) => {
      const { bookingId, reason } = input;

      const booking = await ctx.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { include: { user: true } },
          provider: { include: { user: true } },
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      const isCustomer = ctx.session.role === 'CUSTOMER' &&
        ctx.session.customerProfile?.id === booking.customerId;
      const isProvider = ctx.session.role === 'PROVIDER' &&
        ctx.session.providerProfile?.id === booking.providerId;

      if (!isCustomer && !isProvider) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this booking',
        });
      }

      if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot cancel a completed or already cancelled booking',
        });
      }

      const updatedBooking = await ctx.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledBy: isCustomer ? 'CUSTOMER' : 'PROVIDER',
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      });

      const notifyUserId = isCustomer ? booking.provider.userId : booking.customer.userId;

      await ctx.prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          body: `Booking ${booking.bookingNumber} was cancelled. Reason: ${reason}`,
          data: {
            bookingId: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
          },
        },
      });

      return updatedBooking;
    }),
});
