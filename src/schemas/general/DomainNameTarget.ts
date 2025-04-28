import { z } from 'zod';

import { validateDomain } from 'validation';

import { targetSchema } from './Target';

export const domainNameTargetSchema = targetSchema.and(z.string().superRefine(validate));

function validate(target: string, ctx: z.RefinementCtx) {
  const message = validateDomain(target);

  if (message) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}
