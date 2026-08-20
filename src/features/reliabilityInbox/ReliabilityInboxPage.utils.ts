import { createAssistantContextItem } from '@grafana/assistant';

import { CheckType, CheckTypeGroup, HTTPCheck, HttpMethod } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { DEFAULT_CHECK_CONFIG_MAP } from 'components/Checkster/constants';

import { ReliabilityOpportunity } from './model';
import { ASSISTANT_ORIGIN } from './ReliabilityInboxPage.constants';

interface AssistantActionStateArgs {
  canWriteChecks: boolean;
  isAssistantLoading: boolean;
  isAssistantAvailable: boolean;
  hasOpenAssistant: boolean;
}

export function getAssistantActionState({
  canWriteChecks,
  isAssistantLoading,
  isAssistantAvailable,
  hasOpenAssistant,
}: AssistantActionStateArgs) {
  const disabled = !canWriteChecks || isAssistantLoading || !isAssistantAvailable || !hasOpenAssistant;
  const tooltip = !canWriteChecks
    ? 'You need permission to create checks'
    : !isAssistantLoading && (!isAssistantAvailable || !hasOpenAssistant)
      ? 'Grafana Assistant is unavailable'
      : undefined;

  return { disabled, tooltip };
}

export function getAssistantOpenPayload(opportunity: ReliabilityOpportunity) {
  const context = createAssistantContextItem('structured', {
    title: `Reliability Inbox setup: ${opportunity.subject}`,
    bypassLimits: true,
    data: {
      name: 'Reliability Inbox guided setup',
      suggestion: opportunity.suggestion,
      suggestedDraft: opportunity.proposedCheck,
    },
  });

  return {
    origin: ASSISTANT_ORIGIN,
    prompt: [
      opportunity.suggestion.prompt,
      'Review this suggestion with me and inspect available probes and existing checks where possible.',
      'Do not invent credentials, private-network details, DNS resolvers, probe assignments, or business semantics.',
      'Show the final configuration and do not create or save the check until I explicitly confirm it.',
    ].join(' '),
    context: [context],
    autoSend: true,
  };
}

export function getManualCreateLocation(opportunity: ReliabilityOpportunity) {
  const { proposedCheck } = opportunity;
  const defaultCheck = DEFAULT_CHECK_CONFIG_MAP[CheckType.Http] as HTTPCheck;

  return {
    pathname: `${generateRoutePath(AppRoutes.NewCheck)}/${CheckTypeGroup.ApiTest}`,
    search: `?checkType=${CheckType.Http}`,
    state: {
      prefilledCheck: {
        ...defaultCheck,
        job: proposedCheck.job,
        target: proposedCheck.target,
        frequency: proposedCheck.frequencyMs,
        timeout: proposedCheck.timeoutMs,
        labels: [...defaultCheck.labels],
        probes: [...proposedCheck.probeIds],
        settings: {
          http: {
            ...defaultCheck.settings.http,
            method: proposedCheck.method as HttpMethod,
            failIfNotSSL: proposedCheck.failIfNotSSL,
            validStatusCodes: [...proposedCheck.validStatusCodes],
          },
        },
      },
    },
  };
}

export function hasAggregateEvidence(opportunity: ReliabilityOpportunity) {
  return Boolean(opportunity.requestVolume || opportunity.requestRate || opportunity.errorRate || opportunity.p99);
}
