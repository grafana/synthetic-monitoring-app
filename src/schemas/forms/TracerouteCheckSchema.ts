import { HostNameTargetSchema } from 'schemas/general/HostNameTarget';
import { z, ZodType } from 'zod';

import { CheckFormValuesTraceroute, CheckType, TracerouteSettingsFormValues } from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';

const MAX_HOPS = 64;
const MAX_UNKNOWN_HOPS = 20;

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

const TracerouteSchemaValues = z.object({
  target: HostNameTargetSchema,
  checkType: z.literal(CheckType.Traceroute),
  settings: z.object({
    traceroute: TracerouteSettingsSchema,
  }),
});

export const TracerouteCheckSchema: ZodType<CheckFormValuesTraceroute> = BaseCheckSchema.and(TracerouteSchemaValues);
