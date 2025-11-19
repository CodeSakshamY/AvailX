import { router, publicProcedure } from '../trpc';
import { searchProvidersSchema } from '@localpro/types';
import { getBoundingBox, calculateDistance } from '../utils/geo';
import { z } from 'zod';

export const searchRouter = router({
  providers: publicProcedure
    .input(searchProvidersSchema)
    .query(async ({ input, ctx }) => {
      const {
        query,
        categoryId,
        subCategoryIds,
        location,
        filters,
        sort,
        page,
        limit,
      } = input;

      const skip = (page - 1) * limit;

      const whereClause: any = {
        isActive: true,
        profileStatus: 'APPROVED',
      };

      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      if (subCategoryIds && subCategoryIds.length > 0) {
        whereClause.subCategoryIds = {
          hasSome: subCategoryIds,
        };
      }

      if (filters?.minRating) {
        whereClause.averageRating = {
          gte: filters.minRating,
        };
      }

      if (filters?.isAadhaarVerified) {
        whereClause.aadhaarVerified = true;
      }

      if (filters?.isBackgroundVerified) {
        whereClause.backgroundVerified = true;
      }

      let providers = await ctx.prisma.providerProfile.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
              phone: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          reviews: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              overallRating: true,
              comment: true,
              createdAt: true,
              customer: {
                select: {
                  user: {
                    select: {
                      name: true,
                      profilePhoto: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
        take: limit * 3,
      });

      const bbox = getBoundingBox(location, location.radiusKm);

      providers = providers.filter((provider) => {
        if (!provider.baseLocation) return false;

        const baseLocation = provider.baseLocation as any;
        if (!baseLocation.lat || !baseLocation.lng) return false;

        const distance = calculateDistance(
          location.lat,
          location.lng,
          baseLocation.lat,
          baseLocation.lng
        );

        return distance <= location.radiusKm;
      });

      const providersWithDistance = providers.map((provider) => {
        const baseLocation = provider.baseLocation as any;
        const distance = calculateDistance(
          location.lat,
          location.lng,
          baseLocation.lat,
          baseLocation.lng
        );

        const reputationScore = calculateReputationScore(provider);

        return {
          ...provider,
          distance,
          reputationScore,
        };
      });

      let sortedProviders = [...providersWithDistance];

      switch (sort) {
        case 'rating':
          sortedProviders.sort((a, b) => Number(b.averageRating) - Number(a.averageRating));
          break;
        case 'distance':
          sortedProviders.sort((a, b) => a.distance - b.distance);
          break;
        case 'price_low':
          sortedProviders.sort((a, b) => {
            const priceA = getPriceValue(a.pricing);
            const priceB = getPriceValue(b.pricing);
            return priceA - priceB;
          });
          break;
        case 'price_high':
          sortedProviders.sort((a, b) => {
            const priceA = getPriceValue(a.pricing);
            const priceB = getPriceValue(b.pricing);
            return priceB - priceA;
          });
          break;
        case 'response_time':
          sortedProviders.sort((a, b) => a.responseTimeSeconds - b.responseTimeSeconds);
          break;
        case 'relevance':
        default:
          sortedProviders.sort((a, b) => b.reputationScore - a.reputationScore);
          break;
      }

      if (filters?.maxPrice) {
        sortedProviders = sortedProviders.filter(
          (p) => getPriceValue(p.pricing) <= filters.maxPrice!
        );
      }

      const paginatedProviders = sortedProviders.slice(skip, skip + limit);

      return {
        providers: paginatedProviders.map((p) => ({
          id: p.id,
          userId: p.userId,
          user: p.user,
          businessName: p.businessName,
          description: p.description,
          category: p.category,
          baseLocation: p.baseLocation,
          pricing: p.pricing,
          averageRating: Number(p.averageRating),
          reputationScore: p.reputationScore,
          completedJobs: p.completedJobs,
          aadhaarVerified: p.aadhaarVerified,
          backgroundVerified: p.backgroundVerified,
          responseTimeSeconds: p.responseTimeSeconds,
          distance: p.distance,
          reviews: p.reviews,
          reviewCount: p._count.reviews,
          bookingCount: p._count.bookings,
        })),
        total: sortedProviders.length,
        page,
        limit,
        hasMore: sortedProviders.length > skip + limit,
      };
    }),

  categories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            providers: {
              where: {
                isActive: true,
                profileStatus: 'APPROVED',
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories;
  }),

  provider: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const provider = await ctx.prisma.providerProfile.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
              phone: true,
              createdAt: true,
            },
          },
          category: true,
          portfolioPhotos: {
            orderBy: { sortOrder: 'asc' },
          },
          certifications: {
            where: { verified: true },
            orderBy: { issueDate: 'desc' },
          },
          reviews: {
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' },
            include: {
              customer: {
                select: {
                  user: {
                    select: {
                      name: true,
                      profilePhoto: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
            },
          },
        },
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      return {
        ...provider,
        averageRating: Number(provider.averageRating),
        reputationScore: Number(provider.reputationScore),
        reviewCount: provider._count.reviews,
        bookingCount: provider._count.bookings,
      };
    }),
});

function calculateReputationScore(provider: any): number {
  const weights = {
    rating: 0.4,
    completedJobs: 0.2,
    responseTime: 0.15,
    verification: 0.15,
    distance: 0.1,
  };

  const ratingScore = (Number(provider.averageRating) / 5) * 100;

  const jobsScore = Math.min(provider.completedJobs / 50, 1) * 100;

  const avgResponseTime = provider.responseTimeSeconds || 3600;
  const responseScore = Math.max(0, 100 - (avgResponseTime / 600) * 100);

  let verificationScore = 0;
  if (provider.aadhaarVerified) verificationScore += 50;
  if (provider.backgroundVerified) verificationScore += 50;

  const distanceScore = provider.distance
    ? Math.max(0, 100 - (provider.distance / 10) * 100)
    : 50;

  const totalScore =
    ratingScore * weights.rating +
    jobsScore * weights.completedJobs +
    responseScore * weights.responseTime +
    verificationScore * weights.verification +
    distanceScore * weights.distance;

  return Math.round(totalScore);
}

function getPriceValue(pricing: any): number {
  if (!pricing) return 0;

  if (typeof pricing === 'object') {
    return pricing.hourlyRate || pricing.fixedPrice || 0;
  }

  return 0;
}
