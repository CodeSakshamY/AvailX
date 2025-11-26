import { router, protectedProcedure, providerProcedure } from '../trpc';
import { z } from 'zod';
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
  refundPaymentSchema,
  getTransactionHistorySchema,
  recordPaymentSchema,
} from '@localpro/types';
import { TRPCError } from '@trpc/server';
import {
  calculatePlatformFee,
  createPaymentIntent as createPaymentIntentUtil,
  confirmPayment as confirmPaymentUtil,
  processRefund,
} from '../utils/payments';

/**
 * Payments Router
 * Manages payment processing, refunds, and transaction history
 * Integrates with Stripe/Razorpay (placeholders for now)
 */
export const paymentsRouter = router({
  /**
   * Create a payment intent for a booking
   */
  createPaymentIntent: protectedProcedure
    .input(createPaymentIntentSchema)
    .mutation(async ({ input, ctx }) => {
      const { bookingId, amount, currency } = input;

      // Verify booking exists
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true },
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      if (booking.payment) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Payment already exists for this booking',
        });
      }

      // Calculate platform fee
      const { platformFee, providerEarnings } = calculatePlatformFee(amount);

      // Create payment intent with gateway
      const paymentIntent = await createPaymentIntentUtil(amount, currency, {
        bookingId,
        customerId: booking.customerId,
        providerId: booking.providerId,
      });

      // Create payment record in database
      const payment = await ctx.prisma.payment.create({
        data: {
          bookingId,
          amount,
          currency,
          method: 'CARD', // Default, will be updated on confirmation
          status: 'PENDING',
          platformFee,
          providerEarnings,
          gatewayResponse: paymentIntent as any,
        },
      });

      return {
        paymentId: payment.id,
        clientSecret: paymentIntent.clientSecret,
        amount,
        currency,
      };
    }),

  /**
   * Confirm a payment
   */
  confirmPayment: protectedProcedure
    .input(confirmPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      const { paymentIntentId, paymentMethodId } = input;

      // Find payment by gateway response
      const payment = await ctx.prisma.payment.findFirst({
        where: {
          gatewayResponse: {
            path: ['id'],
            equals: paymentIntentId,
          },
        },
        include: {
          booking: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      // Confirm payment with gateway
      const result = await confirmPaymentUtil(paymentIntentId, paymentMethodId);

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment confirmation failed',
        });
      }

      // Update payment record
      const updatedPayment = await ctx.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: result.transactionId,
          paidAt: new Date(),
        },
      });

      // Update booking status
      await ctx.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });

      return {
        success: true,
        payment: updatedPayment,
        transactionId: result.transactionId,
      };
    }),

  /**
   * Record cash/UPI payment
   */
  recordPayment: protectedProcedure
    .input(recordPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      const { bookingId, amount, method, transactionId } = input;

      const booking = await ctx.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true },
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      if (booking.payment) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Payment already recorded',
        });
      }

      const { platformFee, providerEarnings } = calculatePlatformFee(amount);

      const payment = await ctx.prisma.payment.create({
        data: {
          bookingId,
          amount,
          method,
          status: 'COMPLETED',
          transactionId,
          platformFee,
          providerEarnings,
          paidAt: new Date(),
        },
      });

      // Update booking
      await ctx.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          finalPrice: amount,
        },
      });

      return { success: true, payment };
    }),

  /**
   * Refund a payment
   */
  refundPayment: protectedProcedure
    .input(refundPaymentSchema)
    .mutation(async ({ input, ctx }) => {
      const { paymentId, amount, reason } = input;

      const payment = await ctx.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      if (payment.status === 'REFUNDED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment already refunded',
        });
      }

      const refundAmount = amount || Number(payment.amount);

      // Process refund with gateway
      const result = await processRefund(
        payment.transactionId || payment.id,
        refundAmount,
        reason
      );

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Refund processing failed',
        });
      }

      // Update payment record
      await ctx.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });

      return {
        success: true,
        refundId: result.refundId,
        amount: refundAmount,
      };
    }),

  /**
   * Get transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(getTransactionHistorySchema.optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      // Determine user ID
      const userId = input?.userId || ctx.session.id;

      // Get provider or customer profile
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        include: {
          providerProfile: true,
          customerProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Build where clause based on role
      const whereClause: any = {};

      if (user.providerProfile) {
        whereClause.booking = {
          providerId: user.providerProfile.id,
        };
      } else if (user.customerProfile) {
        whereClause.booking = {
          customerId: user.customerProfile.id,
        };
      }

      const [payments, total] = await Promise.all([
        ctx.prisma.payment.findMany({
          where: whereClause,
          include: {
            booking: {
              include: {
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
                provider: {
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
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        ctx.prisma.payment.count({ where: whereClause }),
      ]);

      return {
        payments,
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
   * Calculate platform fee for an amount
   */
  calculatePlatformFee: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .query(async ({ input }) => {
      return calculatePlatformFee(input.amount);
    }),

  /**
   * Get earnings summary (for providers)
   */
  getEarningsSummary: providerProcedure.query(async ({ ctx }) => {
    const providerId = ctx.providerProfile.id;

    const payments = await ctx.prisma.payment.findMany({
      where: {
        booking: {
          providerId,
        },
        status: 'COMPLETED',
      },
      select: {
        amount: true,
        platformFee: true,
        providerEarnings: true,
        paidAt: true,
      },
    });

    const totalEarnings = payments.reduce(
      (sum, p) => sum + Number(p.providerEarnings || 0),
      0
    );
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPlatformFees = payments.reduce(
      (sum, p) => sum + Number(p.platformFee || 0),
      0
    );

    // Calculate earnings for current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPayments = payments.filter(
      (p) => p.paidAt && p.paidAt >= firstDayOfMonth
    );

    const monthlyEarnings = monthlyPayments.reduce(
      (sum, p) => sum + Number(p.providerEarnings || 0),
      0
    );

    return {
      totalEarnings,
      totalRevenue,
      totalPlatformFees,
      monthlyEarnings,
      transactionCount: payments.length,
      monthlyTransactionCount: monthlyPayments.length,
    };
  }),
});
