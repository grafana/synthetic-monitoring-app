import { createFrequencySchema } from 'schemas/general/Frequency';
import { createTimeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import { AiAgentSettings, CheckFormValuesAiAgent, CheckType } from 'types';
import { ONE_MINUTE_IN_MS } from 'utils.constants';

import { baseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_AIAGENT = ONE_MINUTE_IN_MS * 5;
export const MIN_TIMEOUT_AIAGENT = ONE_MINUTE_IN_MS * 1;
export const MAX_TIMEOUT_AIAGENT = ONE_MINUTE_IN_MS * 60;

const aiagentSettingsSchema: ZodType<AiAgentSettings> = z.object({
  url: z.string().min(1, `URL is required.`),
  depth: z
    .number({
      required_error: 'Depth is required',
      invalid_type_error: 'Depth must be a number',
    })
    .min(1, { message: 'Depth is required' }),
  durationInMinutes: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .min(1, { message: 'Duration is required' }),
  aggressiveness: z
    .number({
      required_error: 'Aggressiveness is required',
      invalid_type_error: 'Aggressiveness must be a number',
    })
    .min(1, { message: 'Aggressiveness is required' }),
  features: z.object({
    insightsAccessibility: z.boolean(),
    insightsTechnicalIssues: z.boolean(),
    insightsContentQuality: z.boolean(),
    userJourneys: z.boolean(),
  }),
  userJourneys: z.object({
    enabled: z.boolean(),
    maxUserJourneys: z.number().min(1),
    maxStepsPerJourney: z.number().min(1),
  }),
});

export const aiAgentCheckSchema: ZodType<CheckFormValuesAiAgent> = baseCheckSchema
  .omit({
    timeout: true,
    frequency: true,
  })
  .and(
    z.object({
      checkType: z.literal(CheckType.AiAgent),
      settings: z.object({
        aiagent: aiagentSettingsSchema,
      }),
      frequency: createFrequencySchema(MIN_FREQUENCY_AIAGENT),
      timeout: createTimeoutSchema(MIN_TIMEOUT_AIAGENT, MAX_TIMEOUT_AIAGENT),
    })
  );
