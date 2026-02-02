import { z } from 'zod';

const MAX_CHARACTERS = 2040;

export const targetSchema = z
  .string()
  .max(MAX_CHARACTERS, { message: `Target must be ${MAX_CHARACTERS} characters or less` })
  .superRefine((value, ctx) => {
    if (value !== value.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: `Target cannot have leading or trailing whitespace`,
      });
    }
  });
