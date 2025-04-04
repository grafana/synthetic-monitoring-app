import { z } from 'zod';

import { validateHttpTarget } from 'validation';

import { targetSchema } from './Target';

export const httpTargetSchema = targetSchema.and(z.string().superRefine(validate));

function validate(target: string, ctx: z.RefinementCtx) {
  const message = validateHttpTarget(target);

  if (message) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}
