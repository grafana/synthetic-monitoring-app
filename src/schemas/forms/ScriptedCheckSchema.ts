import { createFrequencySchema } from 'schemas/general/Frequency';
import { createTimeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import { CheckFormValuesScripted, CheckType, ScriptedSettings } from 'types';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

import { maxSizeValidation, validateNonBrowserScript } from './script/validation';
import { baseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_SCRIPTED = ONE_MINUTE_IN_MS;
export const MIN_TIMEOUT_SCRIPTED = ONE_SECOND_IN_MS * 5;
export const MAX_TIMEOUT_SCRIPTED = ONE_MINUTE_IN_MS * 3;

export const ScriptedSettingsSchema: ZodType<ScriptedSettings> = z.object({
  script: z.string().min(1, `Script is required.`).superRefine(maxSizeValidation).superRefine(validateNonBrowserScript),
});

export const scriptedCheckSchema: ZodType<CheckFormValuesScripted> = baseCheckSchema
  .omit({
    frequency: true,
    timeout: true,
    target: true,
  })
  .and(
    z.object({
      target: z.string().min(3, `Instance must be at least 3 characters long.`),
      checkType: z.literal(CheckType.Scripted),
      settings: z.object({
        scripted: ScriptedSettingsSchema,
      }),
      frequency: createFrequencySchema(MIN_FREQUENCY_SCRIPTED),
      timeout: createTimeoutSchema(MIN_TIMEOUT_SCRIPTED, MAX_TIMEOUT_SCRIPTED),
    })
  );
