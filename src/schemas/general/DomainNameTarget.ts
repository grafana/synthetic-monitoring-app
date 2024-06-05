import { z } from 'zod';

import { validateDomain } from 'validation';

import { TargetSchema } from './Target';

export const DomainNameTarget = TargetSchema.and(z.string().superRefine(validate));

function validate(target: string, ctx: z.RefinementCtx) {
  const message = validateDomain(target);

  if (message) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}
