import { z, ZodObject, ZodType } from 'zod';

import { SecretWithValue } from './types';

const secretLabel = z.object({
  name: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
});

const createSecretSchema = z.object({
  description: z.string(),
  labels: secretLabel.array().max(10, 'You can add up to 10 labels'),
  name: z.string().min(1, 'Name is required'),
  plaintext: z.string().min(1, 'Value is required'),
});

const shape: ZodType<SecretWithValue> = createSecretSchema.shape;

export type CreateSecret = z.infer<typeof createSecretSchema>;

export const updateSecretSchema: ZodType<Omit<SecretWithValue, 'plaintext'> & { plaintext?: string }> =
  createSecretSchema.omit({ name: true, plaintext: true }).extend({
    plaintext: z.union([z.string().min(1, 'Value is required'), z.undefined()]),
  });
