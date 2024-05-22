import { z, ZodType } from 'zod';

import { CheckFormValuesScripted, CheckType, ScriptedSettings } from 'types';

import { BaseCheckSchema } from './BaseCheckSchema';

const ScriptedSettingsSchema: ZodType<ScriptedSettings> = z.object({
  script: z.string().min(1, `Script is required.`),
});

const ScriptedSchemaValues = z.object({
  target: z.string().min(3, `Instance must be at lesat 3 characters long.`),
  checkType: z.literal(CheckType.Scripted),
  settings: z.object({
    scripted: ScriptedSettingsSchema,
  }),
});

export const ScriptedCheckSchema: ZodType<CheckFormValuesScripted> = BaseCheckSchema.and(ScriptedSchemaValues);
