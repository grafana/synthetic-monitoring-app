import { z } from 'zod';

const NAME_REQUIRED_ERROR = '{type} name is required';

const queryParamSchema = z.object({
  name: z
    .string({
      error: NAME_REQUIRED_ERROR,
    })
    .min(1, { message: NAME_REQUIRED_ERROR }),
  value: z.string(),
});

export const queryParamsSchema = z.array(queryParamSchema).superRefine((queryParams, ctx) => {
  const queryParamNames = queryParams.map((query) => query.name);
  const uniqueNames = new Set(queryParamNames);

  if (queryParamNames.length !== uniqueNames.size) {
    return ctx.addIssue({
      code: `custom`,
      message: '{type} names cannot be duplicated',
    });
  }
});
