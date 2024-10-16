import { z } from 'zod';

import { validateHostAddress } from 'validation';

import { TargetSchema } from './Target';

export const HostNameTargetSchema = TargetSchema.and(z.string().superRefine(validate));

function validate(target: string, ctx: z.RefinementCtx) {
  const message = validateHostAddress(target);

  if (message) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
    });
  }
}
