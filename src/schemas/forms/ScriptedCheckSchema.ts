import { createFrequencySchema } from 'schemas/general/Frequency';
import { createTimeoutSchema } from 'schemas/general/Timeout';
import { z, ZodIssueCode, ZodType } from 'zod';

import { CheckFormValuesScripted, CheckType, K6Channel, ScriptedSettings } from 'types';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

import { maxSizeValidation, validateNonBrowserScript } from './script/validation';
import { baseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_SCRIPTED = ONE_MINUTE_IN_MS;
export const MIN_TIMEOUT_SCRIPTED = ONE_SECOND_IN_MS * 5;
export const MAX_TIMEOUT_SCRIPTED = ONE_MINUTE_IN_MS * 3;

function createScriptedSettingsSchema(k6Channels: K6Channel[] = []): ZodType<ScriptedSettings> {
  return z.object({
    script: z.string().min(1, `Script is required.`).superRefine(maxSizeValidation).superRefine(validateNonBrowserScript),
    channel: z.string().nullable().optional().superRefine((channelId, ctx) => {
      if (!channelId) {
        return;
      }

      const selectedChannel = k6Channels.find((channel) => channel.id === channelId);
      if (selectedChannel) {
        const isDisabled = new Date(selectedChannel.disabledAfter) < new Date();
        if (isDisabled) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: 'The selected k6 channel is disabled. Please select a different one.',
          });
        }
      }
    }),
  });
}


export function createScriptedCheckSchema(k6Channels: K6Channel[] = []): ZodType<CheckFormValuesScripted> {
  return baseCheckSchema
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
          scripted: createScriptedSettingsSchema(k6Channels),
        }),
        frequency: createFrequencySchema(MIN_FREQUENCY_SCRIPTED),
        timeout: createTimeoutSchema(MIN_TIMEOUT_SCRIPTED, MAX_TIMEOUT_SCRIPTED),
      })
    );
}

export const scriptedCheckSchema: ZodType<CheckFormValuesScripted> = createScriptedCheckSchema();
