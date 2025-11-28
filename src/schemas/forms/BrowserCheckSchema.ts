import { createFrequencySchema } from 'schemas/general/Frequency';
import { createTimeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import { BrowserSettings, CheckFormValuesBrowser, CheckType, ProbeWithMetadata } from 'types';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

import { maxSizeValidation, validateBrowserScript } from './script/validation';
import { createProbeCompatibilityRefinement } from './utils/probeCompatibilityRefinement';
import { baseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_BROWSER = ONE_MINUTE_IN_MS;
export const MIN_TIMEOUT_BROWSER = ONE_SECOND_IN_MS * 5;
export const MAX_TIMEOUT_BROWSER = ONE_MINUTE_IN_MS * 3;

function createBrowserSettingsSchema(): ZodType<BrowserSettings> {
  return z.object({
    script: z.string().min(1, `Script is required.`).superRefine(maxSizeValidation).superRefine(validateBrowserScript),
    channel: z.string().nullable().optional(),
  });
}


export function createBrowserCheckSchema(availableProbes?: ProbeWithMetadata[]): ZodType<CheckFormValuesBrowser> {
  const schema = baseCheckSchema
    .omit({
      timeout: true,
      frequency: true,
      target: true,
    })
    .and(
      z.object({
        target: z.string().min(3, `Instance must be at least 3 characters long.`),
        checkType: z.literal(CheckType.Browser),
        settings: z.object({
          browser: createBrowserSettingsSchema(),
        }),
        frequency: createFrequencySchema(MIN_FREQUENCY_BROWSER),
        timeout: createTimeoutSchema(MIN_TIMEOUT_BROWSER, MAX_TIMEOUT_BROWSER),
      })
    );

  // Add probe compatibility refinement if probes are provided
  if (availableProbes && availableProbes.length > 0) {
    const getChannel = (data: CheckFormValuesBrowser) => data.settings.browser?.channel;
    return schema.superRefine(createProbeCompatibilityRefinement<CheckFormValuesBrowser>(availableProbes, getChannel));
  }

  return schema;
}

export const browserCheckSchema: ZodType<CheckFormValuesBrowser> = createBrowserCheckSchema();
