import { AiAgentCheck, CheckFormValuesAiAgent, CheckType } from 'types';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/toFormValues.utils';

export function getAiAgentCheckFormValues(check: AiAgentCheck): CheckFormValuesAiAgent {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.AiAgent,
    settings: {
      aiagent: {
        url: check.settings?.aiagent?.url,
        depth: check.settings?.aiagent?.depth,
        durationInMinutes: check.settings?.aiagent?.durationInMinutes,
        aggressiveness: check.settings?.aiagent?.aggressiveness,
        features: check.settings?.aiagent?.features,
      },
    },
  };
}
