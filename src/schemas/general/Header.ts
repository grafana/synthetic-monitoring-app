import { z } from 'zod';

const NAME_REQUIRED_ERROR = '{type} name is required';
const VALUE_REQUIRED_ERROR = '{type} value is required';

const headerSchema = z.object({
  name: z
    .string({
      error: NAME_REQUIRED_ERROR,
    })
    .min(1, { message: NAME_REQUIRED_ERROR }),
  value: z
    .string({
      error: VALUE_REQUIRED_ERROR,
    })
    .min(1, { message: VALUE_REQUIRED_ERROR }),
});

export const headersSchema = z
  .array(headerSchema)
  .superRefine((headers, ctx) => {
    const headerNames = headers.map((header) => header.name);
    const uniqueNames = new Set(headerNames);

    if (headerNames.length !== uniqueNames.size) {
      return ctx.addIssue({
        code: `custom`,
        message: '{type} names cannot be duplicated',
      });
    }
  })
  .optional();
