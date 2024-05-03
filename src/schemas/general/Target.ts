import { z } from 'zod';

const MAX_CHARACTERS = 2040;

export const TargetSchema = z
  .string()
  .max(MAX_CHARACTERS, { message: `Target must be ${MAX_CHARACTERS} characters or less` });
