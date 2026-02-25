import { z } from 'zod';

import { LabelType } from 'types';

const NAME_REQUIRED_ERROR = '{type} name is required';
const VALUE_REQUIRED_ERROR = '{type} value is required';

const MAX_LENGTH = 128;
const LABEL_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const LABEL_TYPES: [LabelType, ...LabelType[]] = ['custom', 'cost-attribution'];

const labelSchema = z
  .object({
    name: z.string({ error: NAME_REQUIRED_ERROR }),
    value: z.string({ error: VALUE_REQUIRED_ERROR }),
    type: z.enum(LABEL_TYPES).optional(),
  })
  .superRefine((label, ctx) => {
    if (label.type === 'cost-attribution') {
      return;
    }

    if (!label.name || label.name.length === 0) {
      ctx.addIssue({ code: 'custom', message: NAME_REQUIRED_ERROR, path: ['name'] });
    } else if (label.name.length > MAX_LENGTH) {
      ctx.addIssue({
        code: 'custom',
        message: `{type} names must be ${MAX_LENGTH} characters or less`,
        path: ['name'],
      });
    } else if (!LABEL_REGEX.test(label.name)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid {type} name', path: ['name'] });
    }

    if (!label.value || label.value.length === 0) {
      ctx.addIssue({ code: 'custom', message: VALUE_REQUIRED_ERROR, path: ['value'] });
    } else if (label.value.length > MAX_LENGTH) {
      ctx.addIssue({
        code: 'custom',
        message: `{type} values must be ${MAX_LENGTH} characters or less`,
        path: ['value'],
      });
    }
  });

export const labelsSchema = z.array(labelSchema).superRefine((labels, ctx) => {
  const customLabels = labels.filter((label) => label.type !== 'cost-attribution');
  const labelNames = customLabels.map((label) => label.name);
  const uniqueNames = new Set(labelNames);

  if (labelNames.length !== uniqueNames.size) {
    return ctx.addIssue({
      code: 'custom',
      message: '{type} names cannot be duplicated',
    });
  }
});
