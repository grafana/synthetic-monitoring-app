import { z } from 'zod';

import { formatDuration } from 'utils';

const TEN_SECONDS = 10;
const ONE_HOUR = 60 * 60;
export const MAX_BASE_FREQUENCY = ONE_HOUR;
export const MIN_FREQUENCY = TEN_SECONDS;

export const FrequencySchema = z
  .number()
  .min(MIN_FREQUENCY, { message: `Frequency must be greater than ${formatDuration(MIN_FREQUENCY)}` })
  .max(MAX_BASE_FREQUENCY, { message: `Frequency cannot be greater than ${formatDuration(MAX_BASE_FREQUENCY)}` });
