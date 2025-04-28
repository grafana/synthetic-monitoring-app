import { z } from 'zod';

import { validateHostAddress } from 'validation';

import { targetSchema } from './Target';

export const hostNameTargetSchema = targetSchema.and(z.string().superRefine(validate));

function validate(target: string, ctx: z.RefinementCtx) {
  const message = validateHostAddress(target);

  if (message) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}
