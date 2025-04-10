import { hostNameTargetSchema } from 'schemas/general/HostNameTarget';
import { z, ZodType } from 'zod';

import { CheckFormValuesPing, CheckType, IpVersion, PingSettingsFormValues } from 'types';

import { baseCheckSchema } from './BaseCheckSchema';

const pingSettingsSchema: ZodType<PingSettingsFormValues> = z.object({
  ipVersion: z.nativeEnum(IpVersion),
  dontFragment: z.boolean(),
});

const pingSchemaValues = z.object({
  target: hostNameTargetSchema,
  checkType: z.literal(CheckType.PING),
  settings: z.object({
    ping: pingSettingsSchema,
  }),
});

export const pingCheckSchema: ZodType<CheckFormValuesPing> = baseCheckSchema.and(pingSchemaValues);
