import { hostPortTargetSchema } from 'schemas/general/HostPortTarget';
import { tlsConfigSchema } from 'schemas/general/TLSConfig';
import { z, ZodType } from 'zod';

import { CheckFormValuesTcp, CheckType, IpVersion, TcpSettingsFormValues } from 'types';

import { baseCheckSchema } from './BaseCheckSchema';

const tcpSettingsSchema: ZodType<TcpSettingsFormValues> = z.object({
  ipVersion: z.nativeEnum(IpVersion),
  tls: z.boolean().optional(),
  tlsConfig: tlsConfigSchema,
  queryResponse: z.array(
    z.object({
      send: z.string(),
      expect: z.string(),
      startTLS: z.boolean(),
    })
  ),
});

const tcpSchemaValues = z.object({
  target: hostPortTargetSchema,
  checkType: z.literal(CheckType.TCP),
  settings: z.object({
    tcp: tcpSettingsSchema,
  }),
});

export const tcpCheckSchema: ZodType<CheckFormValuesTcp> = baseCheckSchema.and(tcpSchemaValues);
