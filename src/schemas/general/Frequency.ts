import { z } from 'zod';

import { formatDuration } from 'utils';
import { ONE_HOUR_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

export const MIN_BASE_FREQUENCY = ONE_SECOND_IN_MS * 10;
export const MAX_BASE_FREQUENCY = ONE_HOUR_IN_MS;

export const MIN_FREQUENCY_ERROR_MESSAGE_START = `Frequency must be at least `;
export const MAX_FREQUENCY_ERROR_MESSAGE_START = `Frequency cannot be greater than `;

export const FrequencySchema = (minFrequency = MIN_BASE_FREQUENCY) =>
  z
    .number()
    .min(minFrequency, { message: `${MIN_FREQUENCY_ERROR_MESSAGE_START}${formatDuration(minFrequency)}` })
    .max(MAX_BASE_FREQUENCY, { message: `${MAX_FREQUENCY_ERROR_MESSAGE_START}${formatDuration(MAX_BASE_FREQUENCY)}` });
