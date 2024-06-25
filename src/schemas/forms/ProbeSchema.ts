import { LabelsSchema } from 'schemas/general/Label';
import { z, ZodType } from 'zod';

import { Probe } from 'types';

const MAX_NAME_LENGTH = 32;

const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;

const LONGITUDE_MIN = -180;
const LONGITUDE_MAX = 180;

export const ProbeSchema: ZodType<Probe> = z.object({
  created: z.number().optional(),
  id: z.number().optional(),
  modified: z.number().optional(),
  tenantId: z.number().optional(),
  updated: z.number().optional(),
  name: z
    .string({
      required_error: `Name is required`,
      invalid_type_error: `Latitude must be a number`,
    })
    .min(1, `Name is required`)
    .max(MAX_NAME_LENGTH, `Name must be less than ${MAX_NAME_LENGTH} characters`),
  public: z.boolean(),
  latitude: z
    .number({
      required_error: `Latitude is required`,
      invalid_type_error: `Latitude must be a number`,
    })
    .min(LATITUDE_MIN, `Latitude must be greater than ${LATITUDE_MIN}`)
    .max(LATITUDE_MAX, `Latitude must be less than ${LATITUDE_MAX}`),
  longitude: z
    .number({
      required_error: `Longitude is required`,
      invalid_type_error: `Latitude must be a number`,
    })
    .min(LONGITUDE_MIN, `Longitude must be greater than ${LONGITUDE_MIN}`)
    .max(LONGITUDE_MAX, `Longitude must be less than ${LONGITUDE_MAX}`),
  region: z.string({
    required_error: `Region is required`,
    invalid_type_error: `Region is required`,
  }),
  online: z.boolean(),
  onlineChange: z.number(),
  labels: LabelsSchema,
  version: z.string(),
  deprecated: z.boolean(),
  capabilities: z.object({
    disableScriptedChecks: z.boolean(),
  }),
});
