import { z, ZodType } from 'zod';

import { Secret, SecretWithValue } from './types';

const keyValueRegex = /^(?=.{1,63}$)[a-zA-Z\d][a-zA-Z\d._-]*$/;
const keyValueRegexErrorMessage =
  'Must start with a letter or number and can only contain letters, numbers, dashes, underscores, and periods';
const keyValue = z
  .string()
  .min(1, 'Required')
  .max(63, 'Cannot be more than 63 characters')
  .regex(keyValueRegex, keyValueRegexErrorMessage);

const description = z.string().min(1, 'Required').max(253, 'Cannot be more than 253 characters');

const labels: ZodType<Secret['labels']> = z
  .array(
    z.object({
      name: keyValue,
      value: keyValue,
    })
  )
  .superRefine((labels, ctx) => {
    const [, hasError] = labels.reduce<[string[], boolean]>(
      ([labelNames, error], label, currentIndex) => {
        if (labelNames.some((subject) => subject === label.name)) {
          error = true;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Label name must be unique',
            path: [currentIndex, 'name'],
            fatal: true,
          });
        }
        labelNames.push(label.name);

        return [labelNames, error];
      },
      [[], false]
    );

    if (hasError) {
      return z.NEVER;
    }
  })
  .superRefine((labels, ctx) => {
    if (labels.length > 10) {
      // Add issues for each label beyond the 10th
      // Ideally, this will never happen since the UI should prevent it
      labels.slice(10).forEach((label, index) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'You can add up to 10 labels',
          path: [index + 10, 'name'],
          fatal: true,
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index + 10, 'value'],
          message: '',
          fatal: true,
        });
      });
      return z.NEVER;
    }
  });

const createSecretSchema: ZodType<SecretWithValue> = z.object({
  labels,
  description,
  name: z
    .string()
    .toLowerCase()
    .transform((value) => value.replaceAll(' ', '-'))
    .pipe(
      z
        .string()
        .min(1, 'Required')
        .max(253, 'Cannot be more than 253 characters')
        .regex(
          /^(?=.{1,253}$)[a-z\d][a-z\d.-]*$/,
          'Must start with a letter or number and can only contain letters, numbers, dashes, and periods'
        )
    ),
  plaintext: z.string().min(1, 'Required'),
});

export const updateSecretSchema: ZodType<Omit<SecretWithValue, 'name'> | Omit<SecretWithValue, 'name' | 'plaintext'>> =
  z.object({
    uuid: z.string().min(1, 'Required'),
    labels,
    description,
    plaintext: z.string().min(1, 'Required').optional(),
  });

export function secretSchemaFactory(isNew = true) {
  return isNew ? createSecretSchema : updateSecretSchema;
}
