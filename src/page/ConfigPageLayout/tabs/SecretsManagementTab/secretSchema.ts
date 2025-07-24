import { z, ZodType } from 'zod';

import { Secret, SecretWithValue } from './types';

const keyValueRegex = /^(?=.{1,63}$)[a-zA-Z\d][a-zA-Z\d._-]*$/;
const keyValueRegexErrorMessage =
  'must start with a letter or number and can only contain letters, numbers, dashes, underscores, and periods';

function keyValueFactory(fieldName: 'Name' | 'Value') {
  return z
    .string()
    .min(1, `Label ${fieldName} is required`)
    .max(63, `Label ${fieldName} cannot be more than 63 characters`)
    .regex(keyValueRegex, `Label ${fieldName} ${keyValueRegexErrorMessage}`);
}

const labelName = keyValueFactory('Name');
const labelValue = keyValueFactory('Value');

const description = z
  .string()
  .min(1, 'Description is required')
  .max(253, 'Description cannot be more than 253 characters');

const labels: ZodType<Secret['labels']> = z
  .array(
    z.object({
      name: labelName,
      value: labelValue,
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
      labels.slice(10).forEach((_label, index) => {
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

function createCreateSecretSchema(existingNames: string[] = []) {
  return z.object({
    labels,
    description,
    name: z
      .string()
      .toLowerCase()
      .transform((value) => value.replaceAll(' ', '-'))
      .pipe(
        z
          .string()
          .min(1, 'Name is required')
          .max(253, 'Name cannot be more than 253 characters')
          .regex(
            /^(?=.{1,253}$)[a-z\d][a-z\d.-]*$/,
            'Name must start with a letter or number and can only contain letters, numbers, dashes, and periods'
          )
      )
      .superRefine((name, ctx) => {
        if (existingNames.includes(name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'A secret with this name already exists',
            fatal: true,
          });
          return z.NEVER;
        }
      }),
    plaintext: z.string().min(1, 'Value is required'),
  }) as ZodType<SecretWithValue>;
}

export const updateSecretSchema: ZodType<Omit<SecretWithValue, 'plaintext'> | SecretWithValue> =
  z.object({
    uuid: z.string().min(1, 'UUID is required'),
    name: z.string().min(1, 'Name is required'), // Include name for API URL construction
    labels,
    description,
    plaintext: z.string().min(1, 'Value is required').optional(),
  });

/**
 * Creates a schema for creating or updating a secret.
 *
 * @param isNew - If true, creates a schema for creating a new secret. If false, create a schema for updating an existing secret.
 * @param existingNames - An array of existing secret names to check for uniqueness.
 * @returns A Zod schema for the secret.
 */
export function secretSchemaFactory(isNew = true, existingNames: string[] = []) {
  return isNew ? createCreateSecretSchema(existingNames) : updateSecretSchema;
}
