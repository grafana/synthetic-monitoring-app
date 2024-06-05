import { z } from 'zod';

const ONE_HOUR = 60 * 60;
export const MAX_BASE_FREQUENCY = ONE_HOUR;

export const FrequencySchema = z
  .number()
  .max(MAX_BASE_FREQUENCY, { message: `Frequency cannot be greater than ${MAX_BASE_FREQUENCY} seconds` });
