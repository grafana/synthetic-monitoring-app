import { z } from 'zod';

import { validateHostPort } from 'validation';

import { targetSchema } from './Target';

export const hostPortTargetSchema = targetSchema.and(z.string().superRefine(validate));

function validate(target: string, ctx: z.RefinementCtx) {
  const message = validateHostPort(target);

  if (message) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}
