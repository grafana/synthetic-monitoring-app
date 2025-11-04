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
  recordType: z.enum(DnsRecordType),
  server: z
    .string({
      // todo: make the server type stronger?
      error: 'DNS server is required',
    })
    .min(1, { message: 'DNS server is required' }),
  ipVersion: z.enum(IpVersion),
  protocol: z.enum(DnsProtocol),
  port: z
    .number({
      error: (issue) => (!!issue.input ? 'Port is required' : 'Port must be a number'),
    })
    .min(1, { message: 'Port is required' }),
  validRCodes: z.array(z.enum(DnsResponseCodes)).optional(),
  validations: z.array(
    z.object({
      expression: z.string(),
      inverted: z.boolean(),
      responseMatch: z.enum(ResponseMatchType),
    })
  ),
});

export const dnsCheckSchema: ZodType<CheckFormValuesDns> = baseCheckSchema.and(
  z.object({
    target: domainNameTargetSchema,
    checkType: z.literal(CheckType.DNS),
    settings: z.object({
      dns: dnsSettingsSchema,
    }),
  })
);
