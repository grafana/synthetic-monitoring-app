import { z } from 'zod';

import { formatDuration } from 'utils';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

export const MIN_BASE_TIMEOUT = ONE_SECOND_IN_MS;
export const MAX_BASE_TIMEOUT = ONE_MINUTE_IN_MS;

export const timeoutSchema = (minTimeout = MIN_BASE_TIMEOUT, maxTimeout = MAX_BASE_TIMEOUT) => {
  return z
    .number()
    .min(minTimeout, { message: `Timeout must be at least ${formatDuration(minTimeout)}` })
    .max(maxTimeout, { message: `Timeout cannot be greater than ${formatDuration(maxTimeout)}` });
};
