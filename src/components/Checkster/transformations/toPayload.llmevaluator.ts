import { CheckFormValuesLLMEvaluator, LLMEvaluatorCheck } from 'types';

import { getBasePayloadValuesFromForm } from './toPayload.utils';

export function getLLMEvaluatorPayload(formValues: CheckFormValuesLLMEvaluator): LLMEvaluatorCheck {
  const base = getBasePayloadValuesFromForm(formValues);
  const { systemPrompt, ...rest } = formValues.settings.llmEvaluator;

  return {
    ...base,
    settings: {
      llmEvaluator: {
        ...rest,
        ...(systemPrompt ? { systemPrompt } : {}),
      },
    },
  };
}
