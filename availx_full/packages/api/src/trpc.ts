import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && 'issues' in error.cause
            ? error.cause.issues
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsProvider = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (ctx.session.role !== 'PROVIDER') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Provider access required' });
  }
  if (!ctx.session.providerProfile) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Provider profile not set up' });
  }
  return next({
    ctx: {
      session: ctx.session,
      providerProfile: ctx.session.providerProfile,
    },
  });
});

export const providerProcedure = t.procedure.use(enforceUserIsProvider);

const enforceUserIsCustomer = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (ctx.session.role !== 'CUSTOMER') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
  }
  return next({
    ctx: {
      session: ctx.session,
      customerProfile: ctx.session.customerProfile,
    },
  });
});

export const customerProcedure = t.procedure.use(enforceUserIsCustomer);

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (ctx.session.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
