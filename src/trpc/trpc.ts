// src/trpc/trpc.ts
import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure; // For now, treat same as public until Auth is added
