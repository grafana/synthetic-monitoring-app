import { z } from 'zod';

const NAME_REQUIRED_ERROR = '{type} name is required';
const VALUE_REQUIRED_ERROR = '{type} value is required';

const HeaderSchema = z.object({
  name: z
    .string({
      required_error: NAME_REQUIRED_ERROR,
    })
    .min(1, { message: NAME_REQUIRED_ERROR }),
  value: z
    .string({
      required_error: VALUE_REQUIRED_ERROR,
    })
    .min(1, { message: VALUE_REQUIRED_ERROR }),
});

export const HeadersSchema = z.array(HeaderSchema).superRefine((headers, ctx) => {
  const headerNames = headers.map((label) => label.name);
  const uniqueNames = new Set(headerNames);

  if (headerNames.length !== uniqueNames.size) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '{type} names cannot be duplicated',
    });
  }
});
