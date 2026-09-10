import React, { useEffect, useMemo, useRef } from 'react';
import { IconName } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { EmptyState, Stack, Text } from '@grafana/ui';
import {
  trackRecommendationActioned,
  trackRecommendationShown,
  trackRecommendationsTabViewed,
} from 'features/tracking/recommendationEvents';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { Recommendation, RecommendationId } from './Recommendations.types';
import { FeatureName } from 'types';
import { useSuspenseChecks } from 'data/useChecks';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { RecommendationCard } from './RecommendationCard';
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

  if (recommendations.length === 0) {
    return (
      <EmptyState
        variant="completed"
        message={t('recommendations.emptyState.message', 'Nothing needs your attention')}
        data-testid={RECOMMENDATIONS_TEST_ID.emptyState}
      >
        <Trans i18nKey="recommendations.emptyState.body">
          Every check is alerting, attributed, running and pointed at something nothing else covers.
        </Trans>
      </EmptyState>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      <Text color="secondary">
        <Trans i18nKey="recommendations.intro">
          Findings derived from how your checks are configured. Each one opens the checks it refers to.
        </Trans>
      </Text>
      <Stack direction="column" gap={1}>
        {recommendations.map((recommendation) => (
          <RecommendationCardFor key={recommendation.id} calNames={calNames} recommendation={recommendation} />
        ))}
      </Stack>
    </Stack>
  );
}

interface RecommendationCardForProps {
  recommendation: Recommendation;
  calNames: string[];
}

function RecommendationCardFor({ recommendation, calNames }: RecommendationCardForProps) {
  const { id, checks, groups } = recommendation;
  const { icon, title, description, actionLabel, href } = getRecommendationCopy(recommendation, calNames);

  return (
    <RecommendationCard
      icon={icon}
      title={title}
      description={description}
      checkCount={checks.length}
      action={{
        label: actionLabel,
        href,
        onClick: () => trackRecommendationActioned({ finding: id, scope: 'finding' }),
      }}
      groups={groups}
      getGroupHref={(group) => getChecksByTargetUrl(group.label)}
      onGroupClick={() => trackRecommendationActioned({ finding: id, scope: 'group' })}
    />
  );
}

interface RecommendationCopy {
  icon: IconName;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}

function getRecommendationCopy({ id, checks, groups }: Recommendation, calNames: string[]): RecommendationCopy {
  switch (id) {
    case RecommendationId.AlertingGaps:
      return {
        icon: 'bell-slash',
        title: t('recommendations.alertingGaps.title', 'Checks running without alerts'),
        description: t(
          'recommendations.alertingGaps.description',
          'These checks are running but have no alerting configured, so a failure will go unnoticed until someone looks.'
        ),
        actionLabel: t('recommendations.alertingGaps.action', 'Set up alerts'),
        href: getChecksWithoutAlertsUrl(),
      };

    case RecommendationId.MissingCostLabels:
      return {
        icon: 'tag-alt',
        title: t('recommendations.missingCostLabels.title', 'Checks missing cost attribution labels'),
        description: t(
          'recommendations.missingCostLabels.description',
          'These checks are missing one or more of your cost attribution labels ({{labels}}), so their spend cannot be attributed to a team.',
          { labels: calNames.join(', ') }
        ),
        actionLabel: t('recommendations.missingCostLabels.action', 'Add labels'),
        href: getChecksMissingCostLabelsUrl(calNames),
      };

    case RecommendationId.DuplicateChecks:
      return {
        icon: 'file-copy-alt',
        title: t('recommendations.duplicateChecks.title', 'Duplicate checks'),
        description: t(
          'recommendations.duplicateChecks.description',
          'These targets are monitored more than once by the same type of check. Duplicates cost the same as the original and rarely tell you anything new.'
        ),
        actionLabel: t('recommendations.duplicateChecks.action', 'Review duplicates'),
        href: getChecksByTargetUrl(groups?.[0]?.label ?? checks[0].target),
      };

    case RecommendationId.OverlappingTargets:
      return {
        icon: 'layers-alt',
        title: t('recommendations.overlappingTargets.title', 'Targets monitored by several check types'),
        description: t(
          'recommendations.overlappingTargets.description',
          'These targets are covered by more than one kind of check. Some overlap is deliberate, so this is worth a look rather than a clean-up.'
        ),
        actionLabel: t('recommendations.overlappingTargets.action', 'Review overlap'),
        href: getChecksByTargetUrl(groups?.[0]?.label ?? checks[0].target),
      };

    case RecommendationId.PausedChecks:
      return {
        icon: 'pause-circle',
        title: t('recommendations.pausedChecks.title', 'Paused checks'),
        description: t(
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
    recommendations.forEach(({ id, checks }) =>
      trackRecommendationShown({ finding: id, affectedCheckCount: checks.length })
    );
  }, [recommendations, checkCount]);
}
