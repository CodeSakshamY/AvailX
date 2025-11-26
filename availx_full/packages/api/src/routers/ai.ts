import { router, protectedProcedure, providerProcedure } from '../trpc';
import {
  askAssistantSchema,
  getProviderInsightsSchema,
  getAutoReplySuggestionsSchema,
  getSmartMatchingSchema,
} from '@localpro/types';
import { TRPCError } from '@trpc/server';
import {
  askAssistant,
  generateProviderInsights,
  generateAutoReplySuggestions,
  smartMatchProviders,
} from '../utils/ai';

/**
 * AI Router
 * Provides AI-powered features like assistant, insights, auto-reply, and smart matching
 */
export const aiRouter = router({
  /**
   * Ask the AI assistant
   */
  askAssistant: protectedProcedure
    .input(askAssistantSchema)
    .mutation(async ({ input, ctx }) => {
      const { query, context, conversationId } = input;

      // You can fetch conversation history if conversationId is provided
      let conversationHistory = [];
      if (conversationId) {
        // Fetch from database or cache
      }

      const response = await askAssistant(query, context, conversationHistory);

      return response;
    }),

  /**
   * Get AI-powered provider insights
   */
  providerInsights: providerProcedure
    .input(getProviderInsightsSchema.optional())
    .query(async ({ input, ctx }) => {
      const period = input?.period || 'MONTH';
      const providerId = ctx.providerProfile.id;

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'WEEK':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'MONTH':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'QUARTER':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'YEAR':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Fetch metrics from database
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          providerId,
          createdAt: {
            gte: startDate,
          },
        },
      });

      const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
      const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;

      const payments = await ctx.prisma.payment.findMany({
        where: {
          booking: {
            providerId,
          },
          paidAt: {
            gte: startDate,
          },
        },
      });

      const revenue = payments.reduce((sum, p) => sum + Number(p.providerEarnings || 0), 0);

      const profile = await ctx.prisma.providerProfile.findUnique({
        where: { id: providerId },
      });

      const avgRating = Number(profile?.averageRating || 0);

      // Generate AI insights
      const insights = await generateProviderInsights(
        providerId,
        {
          bookings: bookings.length,
          completed,
          cancelled,
          avgRating,
          revenue,
        },
        period
      );

      return insights;
    }),

  /**
   * Get auto-reply suggestions for chat messages
   */
  autoReplySuggestions: protectedProcedure
    .input(getAutoReplySuggestionsSchema)
    .mutation(async ({ input, ctx }) => {
      const { messageContent, chatRoomId } = input;

      // Fetch chat context
      const chatRoom = await ctx.prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!chatRoom) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat room not found',
        });
      }

      const suggestions = await generateAutoReplySuggestions(messageContent, {
        chatRoomId,
        recentMessages: chatRoom.messages,
      });

      return { suggestions };
    }),

  /**
   * Get AI-powered smart matching for service requests
   */
  smartMatching: protectedProcedure
    .input(getSmartMatchingSchema)
    .mutation(async ({ input, ctx }) => {
      const { serviceType, location, requirements, budget } = input;

      // Find providers within 50km radius
      const providers = await ctx.prisma.$queryRaw<
        Array<{
          id: string;
          distance: number;
          averageRating: number;
          completedJobs: number;
          responseTimeSeconds: number;
          pricing: any;
        }>
      >`
        SELECT
          p.id,
          ROUND(
            CAST(
              ST_Distance(
                p."locationGeom"::geography,
                ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography
              ) / 1000 AS numeric
            ),
            2
          )::float AS distance,
          p."averageRating"::float,
          p."completedJobs",
          p."responseTimeSeconds",
          p.pricing
        FROM provider_profiles p
        WHERE
          ST_DWithin(
            p."locationGeom"::geography,
            ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography,
            50000
          )
          AND p."isActive" = true
          AND p."profileStatus" = 'APPROVED'
        LIMIT 20
      `;

      // Extract pricing from provider data
      const providersWithPricing = providers.map((p) => {
        const pricing = p.pricing as any;
        const priceValue =
          pricing?.hourlyRate || pricing?.fixedPrice || budget || 500;

        return {
          id: p.id,
          distance: p.distance,
          rating: p.averageRating,
          completedJobs: p.completedJobs,
          responseTime: p.responseTimeSeconds,
          pricing: priceValue,
        };
      });

      // Run AI matching algorithm
      const matchResults = await smartMatchProviders(providersWithPricing, {
        serviceType,
        budget,
        urgency: 'medium',
      });

      // Fetch full provider details for top matches
      const topMatchIds = matchResults.slice(0, 10).map((m) => m.providerId);

      const providerDetails = await ctx.prisma.providerProfile.findMany({
        where: {
          id: { in: topMatchIds },
        },
        include: {
          user: {
            select: {
              name: true,
              profilePhoto: true,
            },
          },
          category: true,
        },
      });

      // Combine match scores with provider details
      const results = matchResults.slice(0, 10).map((match) => {
        const details = providerDetails.find((p) => p.id === match.providerId);
        return {
          ...match,
          provider: details,
        };
      });

      return {
        matches: results,
        totalFound: providers.length,
      };
    }),
});
