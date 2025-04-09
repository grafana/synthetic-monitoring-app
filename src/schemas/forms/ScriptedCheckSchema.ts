import { z, ZodType } from 'zod';

import { CheckFormValuesScripted, CheckType, ScriptedSettings } from 'types';

import { maxSizeValidation, validateNonBrowserScript } from './script/validation';
import { baseCheckSchema } from './BaseCheckSchema';

export const scriptedSettingsSchema: ZodType<ScriptedSettings> = z.object({
  script: z.string().min(1, `Script is required.`).superRefine(maxSizeValidation).superRefine(validateNonBrowserScript),
});

const scriptedSchemaValues = z.object({
  target: z.string().min(3, `Instance must be at least 3 characters long.`),
  checkType: z.literal(CheckType.Scripted),
  settings: z.object({
    scripted: scriptedSettingsSchema,
  }),
});

export const scriptedCheckSchema: ZodType<CheckFormValuesScripted> = baseCheckSchema.and(scriptedSchemaValues);
