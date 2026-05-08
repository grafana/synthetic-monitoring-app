import { createFrequencySchema } from 'schemas/general/Frequency';
import { createTimeoutSchema } from 'schemas/general/Timeout';
import { z, ZodType } from 'zod';

import { CheckFormValuesLLMEvaluator, CheckType, LLMEvaluatorSettings } from 'types';
import { ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';

import { baseCheckSchema } from './BaseCheckSchema';

export const MIN_FREQUENCY_LLM_EVALUATOR = ONE_MINUTE_IN_MS * 5;
export const MIN_TIMEOUT_LLM_EVALUATOR = ONE_SECOND_IN_MS * 5;
export const MAX_TIMEOUT_LLM_EVALUATOR = ONE_MINUTE_IN_MS * 3;

export const MAX_PROMPT_LENGTH = 2000;
export const MAX_SYSTEM_PROMPT_LENGTH = 500;
export const MAX_CRITERION_LENGTH = 200;
export const MAX_CRITERIA_COUNT = 10;

function createLLMEvaluatorSettingsSchema(): ZodType<LLMEvaluatorSettings> {
  return z.object({
    endpoint: z.url(`Endpoint must be a valid URL.`),
    model: z.string().min(1, `Model is required.`),
    apiKeyRef: z.string().min(1, `API key secret is required.`),
    systemPrompt: z
      .string()
      .max(MAX_SYSTEM_PROMPT_LENGTH, `System prompt must be at most ${MAX_SYSTEM_PROMPT_LENGTH} characters.`)
      .optional(),
    prompt: z
      .string()
      .min(1, `Prompt is required.`)
      .max(MAX_PROMPT_LENGTH, `Prompt must be at most ${MAX_PROMPT_LENGTH} characters.`),
    criteria: z
      .array(
        z
          .string()
          .min(1, `Criterion cannot be empty.`)
          .max(MAX_CRITERION_LENGTH, `Criterion must be at most ${MAX_CRITERION_LENGTH} characters.`)
      )
      .min(1, `At least one criterion is required.`)
      .max(MAX_CRITERIA_COUNT, `At most ${MAX_CRITERIA_COUNT} criteria are allowed.`),
  });
}

export function createLLMEvaluatorCheckSchema(): ZodType<CheckFormValuesLLMEvaluator> {
  return baseCheckSchema
    .omit({
      frequency: true,
      timeout: true,
    })
    .and(
      z.object({
        checkType: z.literal(CheckType.LlmEvaluator),
        settings: z.object({
          llmEvaluator: createLLMEvaluatorSettingsSchema(),
        }),
        frequency: createFrequencySchema(MIN_FREQUENCY_LLM_EVALUATOR),
        timeout: createTimeoutSchema(MIN_TIMEOUT_LLM_EVALUATOR, MAX_TIMEOUT_LLM_EVALUATOR),
      })
    );
}

export const llmEvaluatorCheckSchema: ZodType<CheckFormValuesLLMEvaluator> = createLLMEvaluatorCheckSchema();
