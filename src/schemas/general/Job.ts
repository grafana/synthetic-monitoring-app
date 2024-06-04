import { z } from 'zod';

export const JobSchema = z
  .string({
    required_error: 'Job name is required',
  })
  .min(1, { message: 'Job name is required' })
  .max(128, { message: 'Job name must be 128 characters or less' });
