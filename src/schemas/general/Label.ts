import { z } from 'zod';

const NAME_REQUIRED_ERROR = '{type} name is required';
const VALUE_REQUIRED_ERROR = '{type} value is required';

const MAX_LENGTH = 128;
const LABEL_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const labelSchema = z.object({
  name: z
    .string({
      required_error: NAME_REQUIRED_ERROR,
    })
    .min(1, { message: NAME_REQUIRED_ERROR })
    .max(MAX_LENGTH, { message: `{type} names must be ${MAX_LENGTH} characters or less` })
    .regex(LABEL_REGEX, { message: 'Invalid {type} name' }),
  value: z
    .string({
      required_error: VALUE_REQUIRED_ERROR,
    })
    .min(1, { message: VALUE_REQUIRED_ERROR })
    .max(MAX_LENGTH, { message: `{type} values must be ${MAX_LENGTH} characters or less` }),
});

export const labelsSchema = z.array(labelSchema).superRefine((labels, ctx) => {
  const labelNames = labels.map((label) => label.name);
  const uniqueNames = new Set(labelNames);

  if (labelNames.length !== uniqueNames.size) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '{type} names cannot be duplicated',
    });
  }
});
