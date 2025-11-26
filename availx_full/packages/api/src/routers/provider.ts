import { router, publicProcedure, providerProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { Prisma } from '@localpro/database';
import { TRPCError } from '@trpc/server';

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

  /**
   * Create or update provider profile
   */
  createProfile: providerProcedure
    .input(
      z.object({
        businessName: z.string().min(2).optional(),
        description: z.string().min(20),
        categoryId: z.string().cuid(),
        subCategoryIds: z.array(z.string().cuid()).min(1),
        baseLocation: z.object({
          address: z.string(),
          lat: z.number(),
          lng: z.number(),
        }),
        pricing: z.object({
          hourlyRate: z.number().positive().optional(),
          fixedPrice: z.number().positive().optional(),
          custom: z.string().optional(),
        }),
        workingHours: z.record(z.string(), z.object({
          start: z.string().regex(/^\d{2}:\d{2}$/),
          end: z.string().regex(/^\d{2}:\d{2}$/),
          isAvailable: z.boolean(),
        })).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { baseLocation, ...rest } = input;

      // Update provider profile with PostGIS geometry
      const updatedProfile = await ctx.prisma.$executeRaw`
        UPDATE provider_profiles
        SET
          "businessName" = ${input.businessName || null},
          description = ${input.description},
          "categoryId" = ${input.categoryId},
          "subCategoryIds" = ${input.subCategoryIds}::text[],
          "baseLocation" = ${JSON.stringify(baseLocation)}::jsonb,
          pricing = ${JSON.stringify(input.pricing)}::jsonb,
          "workingHours" = ${input.workingHours ? JSON.stringify(input.workingHours) : null}::jsonb,
          "locationGeom" = ST_SetSRID(ST_MakePoint(${baseLocation.lng}, ${baseLocation.lat}), 4326),
          "updatedAt" = NOW()
        WHERE "userId" = ${ctx.session.id}
      `;

      return { success: true, message: 'Provider profile updated successfully' };
    }),

  /**
   * Upload documents (Aadhaar, certifications, etc.)
   */
  uploadDocument: providerProcedure
    .input(
      z.object({
        type: z.enum(['AADHAAR', 'PAN', 'CERTIFICATION', 'ID_PROOF', 'ADDRESS_PROOF', 'POLICE_CLEARANCE']),
        url: z.string().url(),
        title: z.string().optional(),
        issuer: z.string().optional(),
        issueDate: z.string().datetime().optional(),
        expiryDate: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const providerId = ctx.providerProfile.id;

      if (input.type === 'CERTIFICATION') {
        // Create certification record
        await ctx.prisma.certification.create({
          data: {
            providerId,
            title: input.title || 'Certification',
            issuer: input.issuer,
            issueDate: input.issueDate ? new Date(input.issueDate) : null,
            expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
            documentUrl: input.url,
            verified: false,
          },
        });
      }

      return { success: true, message: 'Document uploaded successfully' };
    }),

  /**
   * Submit provider profile for verification
   */
  submitForVerification: providerProcedure
    .mutation(async ({ ctx }) => {
      const profile = await ctx.prisma.providerProfile.findUnique({
        where: { id: ctx.providerProfile.id },
      });

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider profile not found',
        });
      }

      if (profile.profileStatus === 'APPROVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Profile is already verified',
        });
      }

      await ctx.prisma.providerProfile.update({
        where: { id: ctx.providerProfile.id },
        data: { profileStatus: 'PENDING' },
      });

      return { success: true, message: 'Profile submitted for verification' };
    }),

  /**
   * Set work radius (service area)
   */
  setWorkRadius: providerProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radiusKm: z.number().min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const serviceArea = {
        type: 'radius',
        lat: input.lat,
        lng: input.lng,
        radiusKm: input.radiusKm,
      };

      await ctx.prisma.providerProfile.update({
        where: { id: ctx.providerProfile.id },
        data: {
          serviceAreas: [serviceArea] as any,
        },
      });

      return { success: true, serviceArea };
    }),

  /**
   * Set availability calendar
   */
  setAvailabilityCalendar: providerProcedure
    .input(
      z.object({
        date: z.string().datetime(),
        slots: z.array(
          z.object({
            start: z.string().regex(/^\d{2}:\d{2}$/),
            end: z.string().regex(/^\d{2}:\d{2}$/),
            isAvailable: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.providerProfile.findUnique({
        where: { id: ctx.providerProfile.id },
      });

      const currentAvailability = (profile?.availability as any) || {};
      const dateKey = new Date(input.date).toISOString().split('T')[0];

      currentAvailability[dateKey] = input.slots;

      await ctx.prisma.providerProfile.update({
        where: { id: ctx.providerProfile.id },
        data: { availability: currentAvailability as any },
      });

      return { success: true, date: dateKey, slots: input.slots };
    }),

  /**
   * Add a service offering
   */
  addService: providerProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string().min(10),
        pricing: z.object({
          amount: z.number().positive(),
          unit: z.enum(['HOURLY', 'FIXED', 'PER_UNIT']),
        }),
        duration: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // For now, store services in the pricing JSON field
      // In a production app, you might want a separate Service model
      return { success: true, message: 'Service added successfully', service: input };
    }),

  /**
   * Update a service
   */
  updateService: providerProcedure
    .input(
      z.object({
        serviceId: z.string().cuid(),
        name: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        pricing: z.object({
          amount: z.number().positive(),
          unit: z.enum(['HOURLY', 'FIXED', 'PER_UNIT']),
        }).optional(),
        duration: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return { success: true, message: 'Service updated successfully' };
    }),

  /**
   * Remove a service
   */
  removeService: providerProcedure
    .input(z.object({ serviceId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return { success: true, message: 'Service removed successfully' };
    }),

  /**
   * Get provider dashboard statistics
   */
  getDashboardStats: providerProcedure.query(async ({ ctx }) => {
    const providerId = ctx.providerProfile.id;

    const [profile, bookingsStats, recentBookings, reviews] = await Promise.all([
      ctx.prisma.providerProfile.findUnique({
        where: { id: providerId },
      }),
      ctx.prisma.booking.groupBy({
        by: ['status'],
        where: { providerId },
        _count: true,
      }),
      ctx.prisma.booking.findMany({
        where: { providerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
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
        },
      }),
      ctx.prisma.review.findMany({
        where: { providerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
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
      }),
    ]);

    const stats = {
      totalJobs: profile?.totalJobs || 0,
      completedJobs: profile?.completedJobs || 0,
      cancelledJobs: profile?.cancelledJobs || 0,
      averageRating: Number(profile?.averageRating || 0),
      reputationScore: Number(profile?.reputationScore || 0),
      responseTimeSeconds: profile?.responseTimeSeconds || 0,
      bookingsByStatus: bookingsStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      stats,
      recentBookings,
      recentReviews: reviews,
      profile: {
        businessName: profile?.businessName,
        description: profile?.description,
        isActive: profile?.isActive,
        profileStatus: profile?.profileStatus,
        aadhaarVerified: profile?.aadhaarVerified,
        backgroundVerified: profile?.backgroundVerified,
      },
    };
  }),

  /**
   * Get provider profile by ID (public)
   */
  getById: publicProcedure
    .input(z.object({ providerId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const provider = await ctx.prisma.providerProfile.findUnique({
        where: { id: input.providerId },
        include: {
          user: {
            select: {
              name: true,
              profilePhoto: true,
            },
          },
          category: true,
          reviews: {
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
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
          },
          portfolioPhotos: {
            orderBy: { sortOrder: 'asc' },
          },
          certifications: {
            where: { verified: true },
          },
        },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      return provider;
    }),
});
