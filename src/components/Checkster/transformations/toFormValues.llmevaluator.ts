import { CheckFormValuesLLMEvaluator, CheckType, LLMEvaluatorCheck } from 'types';

import { getBaseFormValuesFromCheck } from './toFormValues.utils';

export function getLLMEvaluatorCheckFormValues(check: LLMEvaluatorCheck): CheckFormValuesLLMEvaluator {
  const base = getBaseFormValuesFromCheck(check);
  const settings = check.settings.llmEvaluator;

  return {
    ...base,
    checkType: CheckType.LlmEvaluator,
    settings: {
      llmEvaluator: {
        endpoint: settings.endpoint ?? '',
        model: settings.model ?? '',
        apiKeyRef: settings.apiKeyRef ?? '',
        systemPrompt: settings.systemPrompt ?? '',
        prompt: settings.prompt ?? '',
        criteria: settings.criteria ?? [],
      },
    },
  };
}
