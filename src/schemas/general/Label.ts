import { z } from 'zod';

const NAME_REQUIRED_ERROR = 'Label name is required';
const VALUE_REQUIRED_ERROR = 'Label value is required';

const MAX_LENGTH = 128;
const LABEL_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const LabelSchema = z.object({
  name: z
    .string({
      required_error: NAME_REQUIRED_ERROR,
    })
    .min(1, { message: NAME_REQUIRED_ERROR })
    .max(MAX_LENGTH, { message: `Label names must be ${MAX_LENGTH} characters or less` })
    .regex(LABEL_REGEX, { message: 'Invalid label name' }),
  value: z
    .string({
      required_error: VALUE_REQUIRED_ERROR,
    })
    .min(1, { message: VALUE_REQUIRED_ERROR })
    .max(MAX_LENGTH, { message: `Label values must be ${MAX_LENGTH} characters or less` })
    .regex(LABEL_REGEX, { message: 'Invalid label name' }),
});

export const LabelsSchema = z.array(LabelSchema).superRefine((labels, ctx) => {
  const labelNames = labels.map((label) => label.name);
  const uniqueNames = new Set(labelNames);

  if (labelNames.length !== uniqueNames.size) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Label names cannot be duplicated',
    });
  }
});
