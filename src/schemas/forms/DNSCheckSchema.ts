import { domainNameTargetSchema } from 'schemas/general/DomainNameTarget';
import { z, ZodType } from 'zod';

import {
  CheckFormValuesDns,
  CheckType,
  DnsProtocol,
  DnsRecordType,
  DnsResponseCodes,
  DnsSettingsFormValues,
  IpVersion,
  ResponseMatchType,
} from 'types';

import { baseCheckSchema } from './BaseCheckSchema';

const dnsSettingsSchema: ZodType<DnsSettingsFormValues> = z.object({
  recordType: z.nativeEnum(DnsRecordType),
  server: z
    .string({
      // todo: make the server type stronger?
      required_error: 'DNS server is required',
    })
    .min(1, { message: 'DNS server is required' }),
  ipVersion: z.nativeEnum(IpVersion),
  protocol: z.nativeEnum(DnsProtocol),
  port: z
    .number({
      required_error: 'Port is required',
      invalid_type_error: 'Port must be a number',
    })
    .min(1, { message: 'Port is required' }),
  validRCodes: z.array(z.nativeEnum(DnsResponseCodes)).optional(),
  validations: z.array(
    z.object({
      expression: z.string(),
      inverted: z.boolean(),
      responseMatch: z.nativeEnum(ResponseMatchType),
    })
  ),
});

const dnsSchemaValues = z.object({
  target: domainNameTargetSchema,
  checkType: z.literal(CheckType.DNS),
  settings: z.object({
    dns: dnsSettingsSchema,
  }),
});

export const dnsCheckSchema: ZodType<CheckFormValuesDns> = baseCheckSchema.and(dnsSchemaValues);
