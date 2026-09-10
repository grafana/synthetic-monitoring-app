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
import { useDismissedRecommendations, useRecommendationImpressions } from './Recommendations.hooks';
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

  useRecommendationImpressions(visible, { checkCount: checks.length, dismissedCount });

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
            Findings derived from how your checks are configured. Act on them here, or open the checks they refer to.
          </Trans>
        </Text>
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
          onDismiss={() => dismiss(recommendation.id)}
        />
      ))}
      {dismissedCount > 0 && (
        <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end">
          <span className={styles.mutedText}>
            {dismissedCount === 1
              ? t('recommendations.dismissed.summarySingle', '1 finding dismissed')
              : t('recommendations.dismissed.summary', '{{dismissedCount}} findings dismissed', { dismissedCount })}
          </span>
          <Button size="sm" variant="secondary" fill="text" onClick={restoreAll}>
            <Trans i18nKey="recommendations.dismissed.restore">Show dismissed</Trans>
          </Button>
        </Stack>
      )}
    </Stack>
  );
}

interface FindingDispatchProps {
  recommendation: Recommendation;
  calNames: string[];
  totalCheckCount: number;
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
