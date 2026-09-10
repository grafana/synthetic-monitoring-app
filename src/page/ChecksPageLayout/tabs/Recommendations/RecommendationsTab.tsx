import React, { useEffect, useMemo, useRef } from 'react';
import { t, Trans } from '@grafana/i18n';
import { EmptyState, LinkButton, Stack, Text } from '@grafana/ui';
import {
  trackRecommendationActioned,
  trackRecommendationShown,
  trackRecommendationsTabViewed,
} from 'features/tracking/recommendationEvents';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { Recommendation, RecommendationId, RecommendationSeverity } from './Recommendations.types';
import { Check, FeatureName } from 'types';
import { useSuspenseChecks } from 'data/useChecks';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { Feedback } from 'components/Feedback';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { CheckRow, GroupRow, PaginatedRows, RecommendationSection } from './Recommendations.components';
import {
  getChecksByTargetUrl,
  getChecksMissingCostLabelsUrl,
  getChecksWithoutAlertsUrl,
  getPausedChecksUrl,
} from './Recommendations.links';
import { computeRecommendations } from './Recommendations.utils';

export function RecommendationsTab() {
  return (
    <QueryErrorBoundary>
      <RecommendationsTabContent />
    </QueryErrorBoundary>
  );
}

function RecommendationsTabContent() {
  const { data: checks } = useSuspenseChecks();
  const { isEnabled: isCALsEnabled } = useFeatureFlag(FeatureName.CALs);
  const { data: calData } = useTenantCostAttributionLabels();
  const calNames = useMemo(() => (isCALsEnabled ? (calData?.names ?? []) : []), [isCALsEnabled, calData?.names]);

  const recommendations = useMemo(() => computeRecommendations({ checks, calNames }), [checks, calNames]);

  useRecommendationImpressions(recommendations, checks.length);

  if (checks.length === 0) {
    return <ChecksEmptyState />;
  }

  return (
    <Stack direction="column" gap={3}>
      {/* Feedback sits outside the empty state as well as the findings: hearing that we
          found nothing worth showing is as useful a signal as hearing that a finding was wrong. */}
      <Stack direction="row" gap={2} alignItems="center" justifyContent="space-between">
        <Text color="secondary">
          <Trans i18nKey="recommendations.intro">
            Findings derived from how your checks are configured. Each one opens the checks it refers to.
          </Trans>
        </Text>
        <Feedback feature="recommendations" about={{ text: `New feature!` }} />
      </Stack>
      {recommendations.length === 0 ? (
        <EmptyState
          variant="completed"
          message={t('recommendations.emptyState.message', 'Nothing needs your attention')}
          data-testid={RECOMMENDATIONS_TEST_ID.emptyState}
        >
          <Trans i18nKey="recommendations.emptyState.body">
            Every check is alerting, attributed, running and pointed at something nothing else covers.
          </Trans>
        </EmptyState>
      ) : (
        recommendations.map((recommendation) => (
          <RecommendationFinding
            key={recommendation.id}
            calNames={calNames}
            recommendation={recommendation}
            totalCheckCount={checks.length}
          />
        ))
      )}
    </Stack>
  );
}

interface RecommendationFindingProps {
  recommendation: Recommendation;
  calNames: string[];
  totalCheckCount: number;
}

function RecommendationFinding({ recommendation, calNames, totalCheckCount }: RecommendationFindingProps) {
  const { id, checks, groups } = recommendation;
  const { severity, title, tooltip, actionLabel, href } = getRecommendationCopy(recommendation, calNames);

  return (
    <RecommendationSection
      title={title}
      tooltip={tooltip}
      summary={getSummary(recommendation, totalCheckCount)}
      action={
        <LinkButton
          variant="secondary"
          fill="outline"
          size="sm"
          href={href}
          onClick={() => trackRecommendationActioned({ finding: id, scope: 'finding' })}
        >
          {actionLabel}
        </LinkButton>
      }
    >
      {groups ? (
        <PaginatedRows
          items={groups}
          renderItem={(group) => (
            <GroupRow
              key={group.key}
              label={group.label}
              detail={
                group.detail
                  ? t('recommendations.group.detail', '{{detail}} · {{checkCount}} checks', {
                      detail: group.detail,
                      checkCount: group.checks.length,
                    })
                  : t('recommendations.group.count', '{{checkCount}} checks', { checkCount: group.checks.length })
              }
              severity={severity}
              checks={group.checks}
            />
          )}
        />
      ) : (
        <PaginatedRows
          items={checks}
          renderItem={(check) => <CheckRow key={check.id} check={check} severity={severity} />}
        />
      )}
    </RecommendationSection>
  );
}

function getSummary({ id, checks, groups }: Recommendation, totalCheckCount: number) {
  if (groups) {
    return t('recommendations.summary.groups', '{{groupCount}} of {{totalCheckCount}} checks across {{targetCount}} targets', {
      groupCount: checks.length,
      totalCheckCount,
      targetCount: groups.length,
    });
  }

  switch (id) {
    case RecommendationId.AlertingGaps:
      return t(
        'recommendations.summary.alertingGaps',
        '{{affectedCheckCount}} of {{totalCheckCount}} checks have no alerts',
        { affectedCheckCount: checks.length, totalCheckCount }
      );

    case RecommendationId.MissingCostLabels:
      return t(
        'recommendations.summary.missingCostLabels',
        '{{affectedCheckCount}} of {{totalCheckCount}} checks are unattributed',
        { affectedCheckCount: checks.length, totalCheckCount }
      );

    default:
      return t('recommendations.summary.paused', '{{affectedCheckCount}} of {{totalCheckCount}} checks are paused', {
        affectedCheckCount: checks.length,
        totalCheckCount,
      });
  }
}

interface RecommendationCopy {
  severity: RecommendationSeverity;
  title: string;
  tooltip: string;
  actionLabel: string;
  href: string;
}

function getRecommendationCopy({ id, checks, groups }: Recommendation, calNames: string[]): RecommendationCopy {
  switch (id) {
    case RecommendationId.AlertingGaps:
      return {
        // The only finding where doing nothing means a real failure goes unseen.
        severity: 'error',
        title: t('recommendations.alertingGaps.title', 'Alerting'),
        tooltip: t(
          'recommendations.alertingGaps.description',
          'These checks are running but have no alerting configured, so a failure will go unnoticed until someone looks.'
        ),
        actionLabel: t('recommendations.alertingGaps.action', 'Set up alerts'),
        href: getChecksWithoutAlertsUrl(),
      };

    case RecommendationId.MissingCostLabels:
      return {
        severity: 'warning',
        title: t('recommendations.missingCostLabels.title', 'Cost attribution'),
        tooltip: t(
          'recommendations.missingCostLabels.description',
          'These checks are missing one or more of your cost attribution labels ({{labels}}), so their spend cannot be attributed to a team.',
          { labels: calNames.join(', ') }
        ),
        actionLabel: t('recommendations.missingCostLabels.action', 'Add labels'),
        href: getChecksMissingCostLabelsUrl(calNames),
      };

    case RecommendationId.DuplicateChecks:
      return {
        severity: 'info',
        title: t('recommendations.duplicateChecks.title', 'Duplicate checks'),
        tooltip: t(
          'recommendations.duplicateChecks.description',
          'These targets are monitored more than once by the same type of check. Duplicates cost the same as the original and rarely tell you anything new.'
        ),
        actionLabel: t('recommendations.duplicateChecks.action', 'Review duplicates'),
        href: getChecksByTargetUrl(groups?.[0]?.label ?? checks[0].target),
      };

    case RecommendationId.OverlappingTargets:
      return {
        severity: 'info',
        title: t('recommendations.overlappingTargets.title', 'Overlapping targets'),
        tooltip: t(
          'recommendations.overlappingTargets.description',
          'These targets are covered by more than one kind of check. Some overlap is deliberate, so this is worth a look rather than a clean-up.'
        ),
        actionLabel: t('recommendations.overlappingTargets.action', 'Review overlap'),
        href: getChecksByTargetUrl(groups?.[0]?.label ?? checks[0].target),
      };

    case RecommendationId.PausedChecks:
      return {
        severity: 'warning',
        title: t('recommendations.pausedChecks.title', 'Paused checks'),
        tooltip: t(
          'recommendations.pausedChecks.description',
          'These checks are paused and are not monitoring anything. Resume the ones you still need and delete the rest.'
        ),
        actionLabel: t('recommendations.pausedChecks.action', 'Review paused checks'),
        href: getPausedChecksUrl(),
      };
  }
}

/**
 * Engagement is what decides which findings survive past this experiment, so impressions are
 * reported alongside clicks. Both are reported once per visit rather than on every re-render.
 */
function useRecommendationImpressions(recommendations: Recommendation[], checkCount: number) {
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) {
      return;
    }

    reported.current = true;
    trackRecommendationsTabViewed({ findingCount: recommendations.length, checkCount });
    recommendations.forEach(({ id, checks }: { id: RecommendationId; checks: Check[] }) =>
      trackRecommendationShown({ finding: id, affectedCheckCount: checks.length })
    );
  }, [recommendations, checkCount]);
}
