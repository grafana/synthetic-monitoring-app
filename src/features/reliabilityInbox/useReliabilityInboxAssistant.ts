import { useCallback } from 'react';
import { createAssistantContextItem, useAssistant } from '@grafana/assistant';
import { trackSetupWithAssistant } from 'features/tracking/reliabilityInboxEvents';

import { ReliabilityOpportunity } from './types';
import { getUserPermissions } from 'data/permissions';

const ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/reliability-inbox';

export function useReliabilityInboxAssistant() {
  const { canWriteChecks } = getUserPermissions();
  const { isAvailable, isLoading, openAssistant } = useAssistant();
  const disabled = !canWriteChecks || isLoading || !isAvailable || !openAssistant;
  const disabledReason = !canWriteChecks
    ? 'You need permission to create checks'
    : !isLoading && (!isAvailable || !openAssistant)
      ? 'Grafana Assistant is unavailable'
      : undefined;

  const startReview = useCallback(
    (opportunity: ReliabilityOpportunity) => {
      if (!openAssistant) {
        return;
      }

      trackSetupWithAssistant({
        opportunityId: opportunity.id,
        checkType: opportunity.proposedCheck.checkType,
      });

      const suggestedDraft = opportunity.proposedCheck;
      const { reqPerS, p99Ms, statusDistribution } = opportunity.suggestion.evidence;
      const evidence = {
        target: opportunity.suggestion.target,
        recommendationRationale: opportunity.importanceSummary,
        confidence: opportunity.confidence,
        ...(opportunity.suggestion.confidenceBreakdown && {
          confidenceBreakdown: opportunity.suggestion.confidenceBreakdown,
        }),
        ...(reqPerS !== undefined && {
          requestsPerSecond: reqPerS,
          estimatedRequestsInWindow: opportunity.requestVolume,
        }),
        ...(p99Ms !== undefined && { p99Milliseconds: p99Ms }),
        ...(opportunity.errorRate !== undefined && { httpErrorRate: opportunity.errorRate }),
        ...(statusDistribution !== undefined && { statusDistribution }),
        measurementWindow: 'last hour',
        telemetryFamilies: opportunity.suggestion.evidence.families,
        reachability: {
          classification: opportunity.suggestion.reachability,
          source: opportunity.suggestion.reachabilitySource,
        },
        coverageMatch: {
          conclusion: 'No exact matching check was found among the configuration the experiment could analyze.',
          compared: ['observed target', 'URL path', 'HTTP check type'],
          limitations: [
            'Aliases, redirects, upstream checks, inaccessible configuration, or a different path may cover the service.',
            'Hostname-only similarity is not treated as certainty.',
          ],
        },
      };
      const context = createAssistantContextItem('structured', {
        title: `Reliability Inbox setup: ${opportunity.subject}`,
        bypassLimits: true,
        data: {
          name: 'Reliability Inbox guided setup',
          task: 'guide-suggested-http-check-setup',
          evidence,
          suggestedDraft,
          setupContract: {
            beginFromSuggestedDraft: true,
            inspectWhereToolsPermit: ['real available probes', 'existing Synthetic Monitoring checks'],
            askOnlyWhenMateriallyChanging: [
              'cadence',
              'timeout',
              'regions or probes',
              'response assertion',
              'alerting intent',
            ],
            neverInvent: [
              'credentials',
              'private-network details',
              'DNS resolvers',
              'probe assignments',
              'business semantics',
            ],
            finalReview: 'Show every proposed change in one compact final configuration.',
            creationPolicy:
              'Do not create or save the check until the user explicitly confirms the final configuration.',
          },
          assistantGuidance:
            'Act as a bounded Synthetic Monitoring setup guide. Start from the suggested draft, validate what tools can validate, ask only questions that materially change configuration, present a compact final configuration, and wait for explicit confirmation before creating or saving anything.',
        },
      });

      openAssistant({
        origin: ASSISTANT_ORIGIN,
        prompt: [
          `Guide me through setting up the suggested HTTP Synthetic Monitoring check for ${suggestedDraft.target}.`,
          'Begin from the attached suggested draft and evidence.',
          'Where your tools permit, inspect the real available probes and existing checks before recommending changes.',
          'Ask only for inputs that materially change cadence, timeout, regions or probes, response assertions, or alerting intent.',
          'Do not invent credentials, private-network details, DNS resolvers, probe assignments, or business semantics.',
          'Before taking action, show all changes in one compact final configuration.',
          'Do not create or save the check until I explicitly confirm that final configuration.',
        ].join(' '),
        context: [context],
        autoSend: true,
      });
    },
    [openAssistant]
  );

  return {
    startReview,
    disabled,
    disabledReason,
  };
}
