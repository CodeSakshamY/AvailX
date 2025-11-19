import { router, publicProcedure, protectedProcedure } from '../trpc';
import {
  signUpSchema,
  loginSchema,
  sendOTPSchema,
  verifyOTPSchema,
} from '@localpro/types';
import { TRPCError } from '@trpc/server';
import { signJWT } from '../utils/jwt';
import { generateOTP, sendOTPviaSMS, storeOTP, verifyOTP } from '../utils/otp';
import { hash, compare } from 'bcryptjs';

export const authRouter = router({
  sendOTP: publicProcedure
    .input(sendOTPSchema)
    .mutation(async ({ input, ctx }) => {
      const { phone, purpose } = input;

      if (purpose === 'SIGNUP') {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { phone },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Phone number already registered',
          });
        }
      } else if (purpose === 'LOGIN') {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { phone },
        });

        if (!existingUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Phone number not registered',
          });
        }
      }

      const otp = generateOTP();
      await storeOTP(phone, otp);
      await sendOTPviaSMS(phone, otp);

      return {
        success: true,
        message: 'OTP sent successfully',
        ...(process.env.NODE_ENV === 'development' && { otp }),
      };
    }),

  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input, ctx }) => {
      const { phone, name, email, role, password } = input;

      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            { phone },
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists with this phone or email',
        });
      }

      const passwordHash = password ? await hash(password, 10) : null;

      const user = await ctx.prisma.user.create({
        data: {
          phone,
          name,
          email,
          role,
          passwordHash,
          phoneVerified: false,
          emailVerified: false,
        },
      });

      if (role === 'CUSTOMER') {
        await ctx.prisma.customerProfile.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === 'PROVIDER') {
        await ctx.prisma.providerProfile.create({
          data: {
            userId: user.id,
            categoryId: 'temp',
          },
        });
      }

      const token = await signJWT({ userId: user.id, role: user.role });

      return {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      };
    }),

  verifyPhone: publicProcedure
    .input(verifyOTPSchema)
    .mutation(async ({ input, ctx }) => {
      const { phone, otp } = input;

      const isValid = await verifyOTP(phone, otp);

      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired OTP',
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { phone },
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

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });

      const token = await signJWT({ userId: user.id, role: user.role });

      return {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          phoneVerified: true,
          customerProfile: user.customerProfile,
          providerProfile: user.providerProfile,
        },
        token,
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const { phone, password, otp } = input;

      const user = await ctx.prisma.user.findUnique({
        where: { phone },
        include: {
          customerProfile: true,
          providerProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      if (otp) {
        const isValid = await verifyOTP(phone, otp);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired OTP',
          });
        }
      } else if (password && user.passwordHash) {
        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
        }
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either OTP or password is required',
        });
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const token = await signJWT({ userId: user.id, role: user.role });

      return {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          phoneVerified: user.phoneVerified,
          customerProfile: user.customerProfile,
          providerProfile: user.providerProfile,
        },
        token,
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.session.id,
      phone: ctx.session.phone,
      name: ctx.session.name,
      email: ctx.session.email,
      role: ctx.session.role,
      phoneVerified: ctx.session.phoneVerified,
      customerProfile: ctx.session.customerProfile,
      providerProfile: ctx.session.providerProfile,
    };
  }),

  logout: protectedProcedure.mutation(async () => {
    return { success: true };
  }),
});
