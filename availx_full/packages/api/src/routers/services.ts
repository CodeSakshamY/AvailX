import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Services Router
 * Manages categories, subcategories, and service listings
 */
export const servicesRouter = router({
  /**
   * List all active categories
   */
  listCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            providers: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    return categories;
  }),

  /**
   * Get category by ID or slug
   */
  getCategory: publicProcedure
    .input(
      z.object({
        categoryId: z.string().cuid().optional(),
        slug: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!input.categoryId && !input.slug) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either categoryId or slug is required',
        });
      }

      const category = await ctx.prisma.category.findFirst({
        where: {
          OR: [
            { id: input.categoryId },
            { slug: input.slug },
          ],
          isActive: true,
        },
        include: {
          subCategories: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              providers: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      return category;
    }),

  /**
   * List subcategories for a category
   */
  listSubcategories: publicProcedure
    .input(z.object({ categoryId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const subcategories = await ctx.prisma.subCategory.findMany({
        where: {
          categoryId: input.categoryId,
          isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
      });

      return subcategories;
    }),

  /**
   * Search services/categories
   */
  searchServices: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().int().positive().max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { query, limit } = input;

      // Search in categories
      const categories = await ctx.prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: Math.floor(limit / 2),
      });

      // Search in subcategories
      const subcategories = await ctx.prisma.subCategory.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        include: {
          category: true,
        },
        take: Math.floor(limit / 2),
      });

      return {
        categories,
        subcategories,
      };
    }),

  /**
   * Get services offered by a provider
   */
  getServicesByProvider: publicProcedure
    .input(z.object({ providerId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const provider = await ctx.prisma.providerProfile.findUnique({
        where: { id: input.providerId },
        include: {
          category: true,
        },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        });
      }

      // Get subcategories the provider offers
      const subcategories = await ctx.prisma.subCategory.findMany({
        where: {
          id: { in: provider.subCategoryIds },
        },
        include: {
          category: true,
        },
      });

      return {
        mainCategory: provider.category,
        subcategories,
        pricing: provider.pricing,
        workingHours: provider.workingHours,
      };
    }),
});
