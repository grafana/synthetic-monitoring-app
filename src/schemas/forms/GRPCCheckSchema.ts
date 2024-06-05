import { HostPortTarget } from 'schemas/general/HostPortTarget';
import { TLSConfigSchema } from 'schemas/general/TLSConfig';
import { z, ZodType } from 'zod';

import { CheckFormValuesGRPC, CheckType, GRPCSettingsFormValues, IpVersion } from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';

const GRPCSettingsSchema: ZodType<GRPCSettingsFormValues> = z.object({
  ipVersion: z.nativeEnum(IpVersion),
  service: z.string().optional(),
  tls: z.boolean().optional(),
  tlsConfig: TLSConfigSchema,
});

const GRPCSchemaValues = z.object({
  target: HostPortTarget,
  checkType: z.literal(CheckType.GRPC),
  settings: z.object({
    grpc: GRPCSettingsSchema,
  }),
});

export const GRPCCheckSchema: ZodType<CheckFormValuesGRPC> = BaseCheckSchema.and(GRPCSchemaValues);
