import { HostPortTarget } from 'schemas/general/HostPortTarget';
import { TLSConfigSchema } from 'schemas/general/TLSConfig';
import { z, ZodType } from 'zod';

import { CheckFormValuesTcp, CheckType, IpVersion, TcpSettingsFormValues } from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';

const TCPSettingsSchema: ZodType<TcpSettingsFormValues> = z.object({
  ipVersion: z.nativeEnum(IpVersion),
  tls: z.boolean().optional(),
  tlsConfig: TLSConfigSchema,
  queryResponse: z.array(
    z.object({
      send: z.string(),
      expect: z.string(),
      startTLS: z.boolean(),
    })
  ),
});

const TCPSchemaValues = z.object({
  target: HostPortTarget,
  checkType: z.literal(CheckType.TCP),
  settings: z.object({
    tcp: TCPSettingsSchema,
  }),
});

export const TCPCheckSchema: ZodType<CheckFormValuesTcp> = BaseCheckSchema.and(TCPSchemaValues);
