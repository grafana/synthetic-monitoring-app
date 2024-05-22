import { HostNameTargetSchema } from 'schemas/general/HostnameTarget';
import { z, ZodType } from 'zod';

import { CheckFormValuesPing, CheckType, IpVersion, PingSettingsFormValues } from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';

const PingSettingsSchema: ZodType<PingSettingsFormValues> = z.object({
  ipVersion: z.nativeEnum(IpVersion),
  dontFragment: z.boolean(),
});

const PingSchemaValues = z.object({
  target: HostNameTargetSchema,
  checkType: z.literal(CheckType.PING),
  settings: z.object({
    ping: PingSettingsSchema,
  }),
});

export const PingCheckSchema: ZodType<CheckFormValuesPing> = BaseCheckSchema.and(PingSchemaValues);
