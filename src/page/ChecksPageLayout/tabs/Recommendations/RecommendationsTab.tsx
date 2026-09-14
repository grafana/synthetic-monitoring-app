import React, { useMemo } from 'react';
import { t, Trans } from '@grafana/i18n';
import { Button, EmptyState, Stack, Text, useStyles2 } from '@grafana/ui';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { Recommendation, RecommendationId } from './Recommendations.types';
import { FeatureName } from 'types';
import { useSuspenseChecks } from 'data/useChecks';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { Feedback } from 'components/Feedback';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { AlertingGapsFinding } from './findings/AlertingGapsFinding';
import { MissingCostLabelsFinding } from './findings/MissingCostLabelsFinding';
import { PausedChecksFinding } from './findings/PausedChecksFinding';
import { RedundancyFinding } from './findings/RedundancyFinding';
import { getRecommendationCopy } from './Recommendations.copy';
import {
  useDismissedRecommendations,
  useFocusedRecommendation,
  useRecommendationImpressions,
} from './Recommendations.hooks';
import { getStyles } from './Recommendations.styles';
import { computeRecommendations } from './Recommendations.utils';

export function RecommendationsTab() {
  return (
    <QueryErrorBoundary>
      <RecommendationsTabContent />
    </QueryErrorBoundary>
  );
}

function RecommendationsTabContent() {
  const styles = useStyles2(getStyles);
  const { data: checks } = useSuspenseChecks();
  const { isEnabled: isCALsEnabled } = useFeatureFlag(FeatureName.CALs);
  const { data: calData } = useTenantCostAttributionLabels();
  const calNames = useMemo(() => (isCALsEnabled ? (calData?.names ?? []) : []), [isCALsEnabled, calData?.names]);

  const recommendations = useMemo(() => computeRecommendations({ checks, calNames }), [checks, calNames]);
  const { dismissed, dismiss, restoreAll } = useDismissedRecommendations();
  const visible = useMemo(
    () => recommendations.filter((recommendation) => !dismissed.includes(recommendation.id)),
    [recommendations, dismissed]
  );
  // Only findings that exist for this tenant count as dismissed; a stale dismissal of a finding
  // that has since resolved itself is not something to offer bringing back.
  const dismissedCount = recommendations.length - visible.length;
  const focusedId = useFocusedRecommendation();

  useRecommendationImpressions(visible, { checkCount: checks.length, dismissedCount, focusedId });

  if (checks.length === 0) {
    return <ChecksEmptyState />;
  }

  return (
    <Stack direction="column" gap={2}>
      {/* Feedback sits outside the empty state as well as the findings: hearing that we
          found nothing worth showing is as useful a signal as hearing that a finding was wrong. */}
      <Stack direction="row" gap={2} alignItems="flex-start" justifyContent="space-between">
        <Stack direction="column" gap={0.25}>
          {visible.length > 0 && <Text weight="medium">{getOverview(visible, checks.length, calNames)}</Text>}
          <Text variant="bodySmall" color="secondary">
            <Trans i18nKey="recommendations.intro">
              Findings derived from how your checks are configured. Act on them here, or open the checks they refer to.
            </Trans>
          </Text>
        </Stack>
        <Feedback feature="recommendations" about={{ text: `New feature!` }} />
      </Stack>
      {recommendations.length === 0 && (
        <EmptyState
          variant="completed"
          message={t('recommendations.emptyState.message', 'Nothing needs your attention')}
          data-testid={RECOMMENDATIONS_TEST_ID.emptyState}
        >
          <Trans i18nKey="recommendations.emptyState.body">
            Every check is alerting, attributed, running and pointed at something nothing else covers.
          </Trans>
        </EmptyState>
      )}
      {visible.map((recommendation) => (
        <Finding
          key={recommendation.id}
          recommendation={recommendation}
          calNames={calNames}
          totalCheckCount={checks.length}
          isFocused={recommendation.id === focusedId}
          onDismiss={() => dismiss(recommendation.id)}
        />
      ))}
      <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end">
        <span className={styles.mutedText}>{getDismissedSummary(dismissedCount)}</span>
        <Button
          size="sm"
          variant="secondary"
          fill="outline"
          icon="eye"
          onClick={restoreAll}
          disabled={dismissedCount === 0}
        >
          <Trans i18nKey="recommendations.dismissed.restoreLong">Show dismissed findings</Trans>
        </Button>
      </Stack>
    </Stack>
  );
}

/** One line that says how much of the fleet is affected and what to tackle first. */
function getOverview(visible: Recommendation[], totalCheckCount: number, calNames: string[]) {
  // A check can appear in several findings; count it once.
  const affectedCheckCount = new Set(visible.flatMap(({ checks }) => checks.map((check) => check.id))).size;
  const leadFinding = getRecommendationCopy(visible[0].id, calNames).title;

  return t(
    'recommendations.overview.headline',
    '{{affectedCheckCount}} of {{totalCheckCount}} checks need attention. {{leadFinding}} is the gap to close first.',
    { affectedCheckCount, totalCheckCount, leadFinding }
  );
}

function getDismissedSummary(dismissedCount: number) {
  switch (dismissedCount) {
    case 0:
      return t('recommendations.dismissed.none', 'Nothing dismissed');
    case 1:
      return t('recommendations.dismissed.summarySingle', '1 finding dismissed');
    default:
      return t('recommendations.dismissed.summary', '{{dismissedCount}} findings dismissed', { dismissedCount });
  }
}

interface FindingDispatchProps {
  recommendation: Recommendation;
  calNames: string[];
  totalCheckCount: number;
  isFocused: boolean;
  onDismiss: () => void;
}

/** Each finding owns its action, so each gets its own component rather than a shared shape with switches. */
function Finding({ recommendation, calNames, ...props }: FindingDispatchProps) {
  switch (recommendation.id) {
    case RecommendationId.AlertingGaps:
      return <AlertingGapsFinding recommendation={recommendation} {...props} />;
    case RecommendationId.MissingCostLabels:
      return <MissingCostLabelsFinding recommendation={recommendation} calNames={calNames} {...props} />;
    case RecommendationId.DuplicateChecks:
    case RecommendationId.OverlappingTargets:
      return <RedundancyFinding recommendation={recommendation} {...props} />;
    case RecommendationId.PausedChecks:
      return <PausedChecksFinding recommendation={recommendation} {...props} />;
  }
}
