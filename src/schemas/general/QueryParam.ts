import { z } from 'zod';

const NAME_REQUIRED_ERROR = '{type} name is required';

const QueryParam = z.object({
  name: z
    .string({
      required_error: NAME_REQUIRED_ERROR,
    })
    .min(1, { message: NAME_REQUIRED_ERROR }),
  value: z.string(),
});

export const QueryParamsSchema = z.array(QueryParam).superRefine((queryParams, ctx) => {
  const queryParamNames = queryParams.map((query) => query.name);
  const uniqueNames = new Set(queryParamNames);

  if (queryParamNames.length !== uniqueNames.size) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '{type} names cannot be duplicated',
    });
  }
});
