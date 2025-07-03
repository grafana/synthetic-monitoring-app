import { AiAgentCheck, CheckFormValuesAiAgent } from 'types';
import { getBasePayloadValuesFromForm } from 'components/CheckEditor/transformations/toPayload.utils';

export function getAiAgentPayload(formValues: CheckFormValuesAiAgent): AiAgentCheck {
  const base = getBasePayloadValuesFromForm(formValues);

  return {
    ...base,
    settings: {
      aiagent: {
        url: formValues.settings.aiagent.url,
        depth: formValues.settings.aiagent.depth,
        size: formValues.settings.aiagent.size,
        concurrency: formValues.settings.aiagent.concurrency,
        durationInMinutes: formValues.settings.aiagent.durationInMinutes,
        aggressiveness: formValues.settings.aiagent.aggressiveness,
        features: formValues.settings.aiagent.features,
        userJourneys: formValues.settings.aiagent.userJourneys,
      },
    },
  };
}
