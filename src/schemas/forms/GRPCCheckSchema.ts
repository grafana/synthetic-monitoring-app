import { hostPortTargetSchema } from 'schemas/general/HostPortTarget';
import { tlsConfigSchema } from 'schemas/general/TLSConfig';
import { z, ZodType } from 'zod';

import { CheckFormValuesGRPC, CheckType, GRPCSettingsFormValues, IpVersion } from 'types';

import { baseCheckSchema } from './BaseCheckSchema';

const grpcSettingsSchema: ZodType<GRPCSettingsFormValues> = z.object({
  ipVersion: z.nativeEnum(IpVersion),
  service: z.string().optional(),
  tls: z.boolean().optional(),
  tlsConfig: tlsConfigSchema,
});

export const grpcCheckSchema: ZodType<CheckFormValuesGRPC> = baseCheckSchema.and(
  z.object({
    target: hostPortTargetSchema,
    checkType: z.literal(CheckType.GRPC),
    settings: z.object({
      grpc: grpcSettingsSchema,
    }),
  })
);
