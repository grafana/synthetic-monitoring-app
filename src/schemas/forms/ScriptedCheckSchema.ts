import { FrequencySchema } from 'schemas/general/Frequency';
import { TimeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import { CheckFormValuesScripted, CheckType, ScriptedSettings } from 'types';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

import { maxSizeValidation, validateNonBrowserScript } from './script/validation';
import { BaseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_SCRIPTED = ONE_MINUTE_IN_MS;
export const MIN_TIMEOUT_SCRIPTED = ONE_SECOND_IN_MS * 5;
export const MAX_TIMEOUT_SCRIPTED = ONE_MINUTE_IN_MS * 3;

export const ScriptedSettingsSchema: ZodType<ScriptedSettings> = z.object({
  script: z.string().min(1, `Script is required.`).superRefine(maxSizeValidation).superRefine(validateNonBrowserScript),
});

export const ScriptedCheckSchema: ZodType<CheckFormValuesScripted> = BaseCheckSchema.omit({
  frequency: true,
  timeout: true,
  target: true,
}).and(
  z.object({
    target: z.string().min(3, `Instance must be at least 3 characters long.`),
    checkType: z.literal(CheckType.Scripted),
    settings: z.object({
      scripted: ScriptedSettingsSchema,
    }),
    frequency: FrequencySchema(MIN_FREQUENCY_SCRIPTED),
    timeout: TimeoutSchema(MIN_TIMEOUT_SCRIPTED, MAX_TIMEOUT_SCRIPTED),
  })
);
