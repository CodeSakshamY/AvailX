import { router, protectedProcedure, customerProcedure, providerProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import {
  createReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
  getReviewsForProviderSchema,
  getRatingsSummarySchema,
  respondToReviewSchema,
} from '@localpro/types';
import { TRPCError } from '@trpc/server';

/**
 * Reviews Router
 * Manages customer reviews and ratings for providers
 */
export const reviewsRouter = router({
  /**
   * Add a review (customer only)
   */
  addReview: customerProcedure
    .input(createReviewSchema)
    .mutation(async ({ input, ctx }) => {
      const { bookingId, ...reviewData } = input;

      // Verify booking exists and belongs to customer
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { review: true },
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      if (booking.customerId !== ctx.customerProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only review your own bookings',
        });
      }

      if (booking.status !== 'COMPLETED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only review completed bookings',
        });
      }

      if (booking.review) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Review already exists for this booking',
        });
      }

      // Create review
      const review = await ctx.prisma.review.create({
        data: {
          bookingId,
          customerId: ctx.customerProfile.id,
          providerId: booking.providerId,
          ...reviewData,
        },
      });

      // Update provider's average rating
      await updateProviderRating(ctx, booking.providerId);

      return review;
    }),

  /**
   * Edit a review
   */
  editReview: customerProcedure
    .input(updateReviewSchema)
    .mutation(async ({ input, ctx }) => {
      const { reviewId, ...updateData } = input;

      const review = await ctx.prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      if (review.customerId !== ctx.customerProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own reviews',
        });
      }

      const updatedReview = await ctx.prisma.review.update({
        where: { id: reviewId },
        data: updateData,
      });

      // Update provider's average rating
      await updateProviderRating(ctx, review.providerId);

      return updatedReview;
    }),

  /**
   * Delete a review
   */
  deleteReview: customerProcedure
    .input(deleteReviewSchema)
    .mutation(async ({ input, ctx }) => {
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      if (review.customerId !== ctx.customerProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own reviews',
        });
      }

      await ctx.prisma.review.delete({
        where: { id: input.reviewId },
      });

      // Update provider's average rating
      await updateProviderRating(ctx, review.providerId);

      return { success: true };
    }),

  /**
   * Get reviews for a provider
   */
  getReviewsForProvider: publicProcedure
    .input(getReviewsForProviderSchema)
    .query(async ({ input, ctx }) => {
      const { providerId, page, limit } = input;
      const offset = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        ctx.prisma.review.findMany({
          where: {
            providerId,
            isPublished: true,
          },
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    name: true,
                    profilePhoto: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        ctx.prisma.review.count({
          where: {
            providerId,
            isPublished: true,
          },
        }),
      ]);

      return {
        reviews,
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
   * Get ratings summary for a provider
   */
  getRatingsSummary: publicProcedure
    .input(getRatingsSummarySchema)
    .query(async ({ input, ctx }) => {
      const { providerId } = input;

      const [provider, reviews, ratingDistribution] = await Promise.all([
        ctx.prisma.providerProfile.findUnique({
          where: { id: providerId },
          select: {
            averageRating: true,
            _count: {
              select: {
                reviews: {
                  where: { isPublished: true },
                },
              },
            },
          },
        }),
        ctx.prisma.review.findMany({
          where: {
            providerId,
            isPublished: true,
          },
          select: {
            overallRating: true,
            qualityRating: true,
            punctualityRating: true,
            professionalismRating: true,
            valueRating: true,
          },
        }),
        ctx.prisma.review.groupBy({
          by: ['overallRating'],
          where: {
            providerId,
            isPublished: true,
          },
          _count: true,
        }),
      ]);

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      // Calculate average for each rating category
      const avgRatings = {
        quality: 0,
        punctuality: 0,
        professionalism: 0,
        value: 0,
      };

      if (reviews.length > 0) {
        let qualityCount = 0;
        let punctualityCount = 0;
        let professionalismCount = 0;
        let valueCount = 0;

        reviews.forEach((review) => {
          if (review.qualityRating) {
            avgRatings.quality += review.qualityRating;
            qualityCount++;
          }
          if (review.punctualityRating) {
            avgRatings.punctuality += review.punctualityRating;
            punctualityCount++;
          }
          if (review.professionalismRating) {
            avgRatings.professionalism += review.professionalismRating;
            professionalismCount++;
          }
          if (review.valueRating) {
            avgRatings.value += review.valueRating;
            valueCount++;
          }
        });

        if (qualityCount > 0) avgRatings.quality /= qualityCount;
        if (punctualityCount > 0) avgRatings.punctuality /= punctualityCount;
        if (professionalismCount > 0) avgRatings.professionalism /= professionalismCount;
        if (valueCount > 0) avgRatings.value /= valueCount;
      }

      // Create distribution map (1-5 stars)
      const distribution = [1, 2, 3, 4, 5].map((rating) => {
        const found = ratingDistribution.find((r) => r.overallRating === rating);
        return {
          rating,
          count: found?._count || 0,
        };
      });

      return {
        averageRating: Number(provider.averageRating),
        totalReviews: provider._count.reviews,
        categoryAverages: {
          quality: Math.round(avgRatings.quality * 10) / 10,
          punctuality: Math.round(avgRatings.punctuality * 10) / 10,
          professionalism: Math.round(avgRatings.professionalism * 10) / 10,
          value: Math.round(avgRatings.value * 10) / 10,
        },
        ratingDistribution: distribution,
      };
    }),

  /**
   * Provider responds to a review
   */
  respondToReview: providerProcedure
    .input(respondToReviewSchema)
    .mutation(async ({ input, ctx }) => {
      const { reviewId, response } = input;

      const review = await ctx.prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      if (review.providerId !== ctx.providerProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only respond to your own reviews',
        });
      }

      const updatedReview = await ctx.prisma.review.update({
        where: { id: reviewId },
        data: {
          providerResponse: response,
          respondedAt: new Date(),
        },
      });

      return updatedReview;
    }),
});

/**
 * Helper function to update provider's average rating
 */
async function updateProviderRating(ctx: any, providerId: string) {
  const reviews = await ctx.prisma.review.findMany({
    where: {
      providerId,
      isPublished: true,
    },
    select: {
      overallRating: true,
    },
  });

  if (reviews.length === 0) {
    await ctx.prisma.providerProfile.update({
      where: { id: providerId },
      data: { averageRating: 0 },
    });
    return;
  }

  const avgRating =
    reviews.reduce((sum, review) => sum + review.overallRating, 0) / reviews.length;

  await ctx.prisma.providerProfile.update({
    where: { id: providerId },
    data: { averageRating },
  });
}
