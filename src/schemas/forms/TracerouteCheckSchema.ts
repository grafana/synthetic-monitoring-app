import { createFrequencySchema } from 'schemas/general/Frequency';
import { hostNameTargetSchema } from 'schemas/general/HostNameTarget';
import { createTimeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import { CheckFormValuesTraceroute, CheckType, TracerouteSettingsFormValues } from 'types';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

import { baseCheckSchema } from './BaseCheckSchema';

const MAX_HOPS = 64;
const MAX_UNKNOWN_HOPS = 20;

const THIRTY_SECONDS = ONE_SECOND_IN_MS * 30;

export const MIN_FREQUENCY_TRACEROUTE = ONE_MINUTE_IN_MS * 2;
export const MIN_TIMEOUT_TRACEROUTE = THIRTY_SECONDS;
export const MAX_TIMEOUT_TRACEROUTE = THIRTY_SECONDS;

const TracerouteSettingsSchema: ZodType<TracerouteSettingsFormValues> = z.object({
  maxHops: z
    .number({
      required_error: `Must be a number (0-${MAX_HOPS})`,
      invalid_type_error: `Must be a number (0-${MAX_HOPS})`,
    })
    .min(0, `Must be greater than 0`)
    .max(MAX_HOPS, `Can be no more than ${MAX_HOPS} hops`),
  maxUnknownHops: z
    .number({
      required_error: `Must be a number (0-${MAX_UNKNOWN_HOPS})`,
      invalid_type_error: `Must be a number (0-${MAX_UNKNOWN_HOPS})`,
    })
    .min(0, `Must be greater than 0`)
    .max(MAX_UNKNOWN_HOPS, `Can be no more than ${MAX_UNKNOWN_HOPS} hops`),
  ptrLookup: z.boolean(),
  hopTimeout: z.number(),
});

export const tracerouteCheckSchema: ZodType<CheckFormValuesTraceroute> = baseCheckSchema
  .omit({
    frequency: true,
    timeout: true,
    target: true,
  })
  .and(
    z.object({
      target: hostNameTargetSchema,
      checkType: z.literal(CheckType.Traceroute),
      settings: z.object({
        traceroute: TracerouteSettingsSchema,
      }),
      frequency: createFrequencySchema(MIN_FREQUENCY_TRACEROUTE),
      timeout: createTimeoutSchema(MIN_TIMEOUT_TRACEROUTE, MAX_TIMEOUT_TRACEROUTE),
    })
  );
