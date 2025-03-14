import { HostNameTargetSchema } from 'schemas/general/HostNameTarget';
import { z, ZodType } from 'zod';

import { CheckFormValuesPing, CheckType, IpVersion, PingSettingsFormValues } from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';

const PingSettingsSchema: ZodType<PingSettingsFormValues> = z.object({
  ipVersion: z.nativeEnum(IpVersion),
  dontFragment: z.boolean(),
});

export const PingCheckSchema: ZodType<CheckFormValuesPing> = BaseCheckSchema.and(
  z.object({
    target: HostNameTargetSchema,
    checkType: z.literal(CheckType.PING),
    settings: z.object({
      ping: PingSettingsSchema,
    }),
  })
);
