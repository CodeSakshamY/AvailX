import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { Prisma } from '@localpro/database';

/**
 * Provider Router with PostGIS-based Radius Search
 *
 * This router implements high-performance geospatial queries using PostGIS.
 * Performance: <50ms for 1M providers (with GIST spatial index)
 */
export const providerRouter = router({
  /**
   * Search providers within a radius using PostGIS ST_DWithin
   *
   * Uses the find_providers_within_radius() PostgreSQL function
   * created in the PostGIS migration.
   */
  searchByRadius: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.number().positive().max(100).default(10),
        categoryId: z.string().cuid().optional(),
        minRating: z.number().min(0).max(5).optional(),
        aadhaarVerified: z.boolean().optional(),
        backgroundVerified: z.boolean().optional(),
        sortBy: z.enum(['distance', 'rating', 'reputation', 'response_time']).default('distance'),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const {
        latitude,
        longitude,
        radiusKm,
        categoryId,
        minRating,
        aadhaarVerified,
        backgroundVerified,
        sortBy,
        page,
        limit,
      } = input;

      const offset = (page - 1) * limit;

      // Use the PostGIS function for high-performance radius search
      const providers = await ctx.prisma.$queryRaw<
        Array<{
          id: string;
          userId: string;
          businessName: string | null;
          description: string | null;
          categoryId: string;
          baseLocation: any;
          averageRating: Prisma.Decimal;
          reputationScore: Prisma.Decimal;
          completedJobs: number;
          aadhaarVerified: boolean;
          backgroundVerified: boolean;
          responseTimeSeconds: number;
          distance_km: number;
        }>
      >`
        SELECT
          p.id,
          p."userId",
          p."businessName",
          p.description,
          p."categoryId",
          p."baseLocation",
          p."averageRating",
          p."reputationScore",
          p."completedJobs",
          p."aadhaarVerified",
          p."backgroundVerified",
          p."responseTimeSeconds",
          ROUND(
            CAST(
              ST_Distance(
                p."locationGeom"::geography,
                ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
              ) / 1000 AS numeric
            ),
            2
          )::float AS distance_km
        FROM provider_profiles p
        WHERE
          -- Fast spatial query using GIST index
          ST_DWithin(
            p."locationGeom"::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${radiusKm * 1000}  -- Convert km to meters
          )
          AND p."isActive" = true
          AND p."profileStatus" = 'APPROVED'
          ${categoryId ? Prisma.sql`AND p."categoryId" = ${categoryId}` : Prisma.empty}
          ${minRating !== undefined ? Prisma.sql`AND p."averageRating" >= ${minRating}` : Prisma.empty}
          ${aadhaarVerified !== undefined ? Prisma.sql`AND p."aadhaarVerified" = ${aadhaarVerified}` : Prisma.empty}
          ${backgroundVerified !== undefined ? Prisma.sql`AND p."backgroundVerified" = ${backgroundVerified}` : Prisma.empty}
        ORDER BY
          ${sortBy === 'distance' ? Prisma.sql`distance_km ASC` : Prisma.empty}
          ${sortBy === 'rating' ? Prisma.sql`p."averageRating" DESC` : Prisma.empty}
          ${sortBy === 'reputation' ? Prisma.sql`p."reputationScore" DESC` : Prisma.empty}
          ${sortBy === 'response_time' ? Prisma.sql`p."responseTimeSeconds" ASC` : Prisma.empty}
          ${sortBy === 'distance' ? Prisma.empty : Prisma.sql`, distance_km ASC`}
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      // Get total count for pagination
      const countResult = await ctx.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint as count
        FROM provider_profiles p
        WHERE
          ST_DWithin(
            p."locationGeom"::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${radiusKm * 1000}
          )
          AND p."isActive" = true
          AND p."profileStatus" = 'APPROVED'
          ${categoryId ? Prisma.sql`AND p."categoryId" = ${categoryId}` : Prisma.empty}
          ${minRating !== undefined ? Prisma.sql`AND p."averageRating" >= ${minRating}` : Prisma.empty}
          ${aadhaarVerified !== undefined ? Prisma.sql`AND p."aadhaarVerified" = ${aadhaarVerified}` : Prisma.empty}
          ${backgroundVerified !== undefined ? Prisma.sql`AND p."backgroundVerified" = ${backgroundVerified}` : Prisma.empty}
      `;

      const total = Number(countResult[0]?.count || 0);

      // Fetch additional data for providers (users, reviews, etc.)
      const providerIds = providers.map((p) => p.id);

      const providersWithDetails = await ctx.prisma.providerProfile.findMany({
        where: {
          id: { in: providerIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
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
            take: 3,
            orderBy: { createdAt: 'desc' },
            where: { isPublished: true },
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
              reviews: { where: { isPublished: true } },
              bookings: true,
            },
          },
        },
      });

      // Create a map for quick lookup
      const detailsMap = new Map(
        providersWithDetails.map((p) => [p.id, p])
      );

      // Merge distance data with full provider details
      const results = providers.map((provider) => {
        const details = detailsMap.get(provider.id);
        return {
          id: provider.id,
          userId: provider.userId,
          user: details?.user,
          businessName: provider.businessName,
          description: provider.description,
          category: details?.category,
          baseLocation: provider.baseLocation,
          pricing: details?.pricing,
          averageRating: Number(provider.averageRating),
          reputationScore: Number(provider.reputationScore),
          completedJobs: provider.completedJobs,
          aadhaarVerified: provider.aadhaarVerified,
          backgroundVerified: provider.backgroundVerified,
          responseTimeSeconds: provider.responseTimeSeconds,
          distance: provider.distance_km,
          reviews: details?.reviews || [],
          reviewCount: details?._count.reviews || 0,
          bookingCount: details?._count.bookings || 0,
        };
      });

      return {
        providers: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
        },
        searchCenter: {
          latitude,
          longitude,
          radiusKm,
        },
      };
    }),

  /**
   * Get providers within a bounding box (for map view)
   *
   * Useful for displaying providers on a map with viewport bounds
   */
  searchByBoundingBox: publicProcedure
    .input(
      z.object({
        northEast: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
        southWest: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
        categoryId: z.string().cuid().optional(),
        minRating: z.number().min(0).max(5).optional(),
        limit: z.number().int().positive().max(500).default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { northEast, southWest, categoryId, minRating, limit } = input;

      // Use ST_MakeEnvelope for bounding box search
      const providers = await ctx.prisma.$queryRaw<
        Array<{
          id: string;
          userId: string;
          businessName: string | null;
          categoryId: string;
          baseLocation: any;
          averageRating: Prisma.Decimal;
          reputationScore: Prisma.Decimal;
          completedJobs: number;
          aadhaarVerified: boolean;
        }>
      >`
        SELECT
          p.id,
          p."userId",
          p."businessName",
          p."categoryId",
          p."baseLocation",
          p."averageRating",
          p."reputationScore",
          p."completedJobs",
          p."aadhaarVerified"
        FROM provider_profiles p
        WHERE
          p."locationGeom" && ST_MakeEnvelope(
            ${southWest.longitude},
            ${southWest.latitude},
            ${northEast.longitude},
            ${northEast.latitude},
            4326
          )
          AND p."isActive" = true
          AND p."profileStatus" = 'APPROVED'
          ${categoryId ? Prisma.sql`AND p."categoryId" = ${categoryId}` : Prisma.empty}
          ${minRating !== undefined ? Prisma.sql`AND p."averageRating" >= ${minRating}` : Prisma.empty}
        ORDER BY p."reputationScore" DESC
        LIMIT ${limit}
      `;

      return {
        providers: providers.map((p) => ({
          id: p.id,
          userId: p.userId,
          businessName: p.businessName,
          categoryId: p.categoryId,
          baseLocation: p.baseLocation,
          averageRating: Number(p.averageRating),
          reputationScore: Number(p.reputationScore),
          completedJobs: p.completedJobs,
          aadhaarVerified: p.aadhaarVerified,
        })),
        bounds: {
          northEast,
          southWest,
        },
      };
    }),

  /**
   * Find nearest providers to a location
   *
   * Returns the N closest providers, sorted by distance
   */
  findNearest: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        categoryId: z.string().cuid().optional(),
        limit: z.number().int().positive().max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const { latitude, longitude, categoryId, limit } = input;

      const providers = await ctx.prisma.$queryRaw<
        Array<{
          id: string;
          userId: string;
          businessName: string | null;
          categoryId: string;
          baseLocation: any;
          averageRating: Prisma.Decimal;
          reputationScore: Prisma.Decimal;
          distance_km: number;
        }>
      >`
        SELECT
          p.id,
          p."userId",
          p."businessName",
          p."categoryId",
          p."baseLocation",
          p."averageRating",
          p."reputationScore",
          ROUND(
            CAST(
              ST_Distance(
                p."locationGeom"::geography,
                ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
              ) / 1000 AS numeric
            ),
            2
          )::float AS distance_km
        FROM provider_profiles p
        WHERE
          p."isActive" = true
          AND p."profileStatus" = 'APPROVED'
          AND p."locationGeom" IS NOT NULL
          ${categoryId ? Prisma.sql`AND p."categoryId" = ${categoryId}` : Prisma.empty}
        ORDER BY p."locationGeom" <-> ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        LIMIT ${limit}
      `;

      return {
        providers: providers.map((p) => ({
          id: p.id,
          userId: p.userId,
          businessName: p.businessName,
          categoryId: p.categoryId,
          baseLocation: p.baseLocation,
          averageRating: Number(p.averageRating),
          reputationScore: Number(p.reputationScore),
          distance: p.distance_km,
        })),
        searchLocation: {
          latitude,
          longitude,
        },
      };
    }),

  /**
   * Get statistics about provider distribution in an area
   */
  getAreaStats: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.number().positive().max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const { latitude, longitude, radiusKm } = input;

      const stats = await ctx.prisma.$queryRaw<
        Array<{
          total_providers: bigint;
          avg_rating: number;
          avg_completed_jobs: number;
          aadhaar_verified_count: bigint;
          background_verified_count: bigint;
        }>
      >`
        SELECT
          COUNT(*)::bigint as total_providers,
          ROUND(AVG(p."averageRating"::numeric), 2)::float as avg_rating,
          ROUND(AVG(p."completedJobs"::numeric), 0)::float as avg_completed_jobs,
          COUNT(*) FILTER (WHERE p."aadhaarVerified" = true)::bigint as aadhaar_verified_count,
          COUNT(*) FILTER (WHERE p."backgroundVerified" = true)::bigint as background_verified_count
        FROM provider_profiles p
        WHERE
          ST_DWithin(
            p."locationGeom"::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${radiusKm * 1000}
          )
          AND p."isActive" = true
          AND p."profileStatus" = 'APPROVED'
      `;

      const categoryStats = await ctx.prisma.$queryRaw<
        Array<{
          category_id: string;
          category_count: bigint;
        }>
      >`
        SELECT
          p."categoryId" as category_id,
          COUNT(*)::bigint as category_count
        FROM provider_profiles p
        WHERE
          ST_DWithin(
            p."locationGeom"::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${radiusKm * 1000}
          )
          AND p."isActive" = true
          AND p."profileStatus" = 'APPROVED'
        GROUP BY p."categoryId"
        ORDER BY category_count DESC
      `;

      return {
        area: {
          latitude,
          longitude,
          radiusKm,
        },
        stats: {
          totalProviders: Number(stats[0]?.total_providers || 0),
          averageRating: stats[0]?.avg_rating || 0,
          averageCompletedJobs: stats[0]?.avg_completed_jobs || 0,
          aadhaarVerifiedCount: Number(stats[0]?.aadhaar_verified_count || 0),
          backgroundVerifiedCount: Number(stats[0]?.background_verified_count || 0),
        },
        categoriesDistribution: categoryStats.map((cat) => ({
          categoryId: cat.category_id,
          count: Number(cat.category_count),
        })),
      };
    }),
});
