import { FrequencySchema } from 'schemas/general/Frequency';
import { TimeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import { BrowserSettings, CheckFormValuesBrowser, CheckType } from 'types';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

import { maxSizeValidation, validateBrowserScript } from './script/validation';
import { BaseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_BROWSER = ONE_MINUTE_IN_MS;
export const MIN_TIMEOUT_BROWSER = ONE_SECOND_IN_MS * 5;
export const MAX_TIMEOUT_BROWSER = ONE_MINUTE_IN_MS * 3;

const BrowserSettingsSchema: ZodType<BrowserSettings> = z.object({
  script: z.string().min(1, `Script is required.`).superRefine(maxSizeValidation),
});

export const BrowserCheckSchema: ZodType<CheckFormValuesBrowser> = BaseCheckSchema.omit({
  timeout: true,
  frequency: true,
  target: true,
}).and(
  z.object({
    target: z.string().min(3, `Instance must be at least 3 characters long.`),
    checkType: z.literal(CheckType.Browser),
    settings: z.object({
      browser: BrowserSettingsSchema,
    }),
    frequency: FrequencySchema(MIN_FREQUENCY_BROWSER),
    timeout: TimeoutSchema(MIN_TIMEOUT_BROWSER, MAX_TIMEOUT_BROWSER),
  })
);
