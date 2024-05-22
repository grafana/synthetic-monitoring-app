import { z } from 'zod';

import { validateHostPort } from 'validation';

import { TargetSchema } from './Target';

export const HostPortTarget = TargetSchema.and(z.string().superRefine(validate));

function validate(target: string, ctx: z.RefinementCtx) {
  const message = validateHostPort(target);

  if (message) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}
