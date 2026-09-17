import React, { useMemo } from 'react';
import { t, Trans } from '@grafana/i18n';
import { Button, EmptyState, Stack, Text, useStyles2 } from '@grafana/ui';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { CategorySummary, Recommendation, RecommendationId } from './Recommendations.types';
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
import { countDistinctChecks, summariseCategories } from './Recommendations.categories';
import { AttentionRow, CategoryRail, SeverityLegend } from './Recommendations.components';
import { getCategoryCopy, getRecommendationCopy } from './Recommendations.copy';
import {
  ATTENTION_VIEW,
  useDismissedCheckMap,
  useDismissedRecommendations,
  useRecommendationImpressions,
  useRecommendationsView,
} from './Recommendations.hooks';
import { getStyles } from './Recommendations.styles';
import { computeRecommendations } from './Recommendations.utils';

const NO_FINDINGS: Recommendation[] = [];

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
  // A stale dismissal of a finding since resolved is nothing to restore.
  const dismissedCount = recommendations.length - visible.length;
  const categories = useMemo(() => summariseCategories(visible), [visible]);
  const { view, setView, focusedId } = useRecommendationsView();
  // The URL's category can empty out (dismissed, resolved); land instead.
  const active = categories.find(({ category }) => category.id === view);
  const dismissedChecks = useDismissedCheckMap();

  useRecommendationImpressions({
    visible,
    shown: active?.findings ?? NO_FINDINGS,
    checkCount: checks.length,
    dismissedCount,
    focusedId,
  });

  if (checks.length === 0) {
    return <ChecksEmptyState />;
  }

  return (
    <div className={styles.layout}>
      <CategoryRail categories={categories} view={active ? view : ATTENTION_VIEW} onSelect={setView} />
      <div className={styles.content}>
        {/* Feedback shows with the empty state too: finding nothing is a signal as well. */}
        <Stack direction="row" gap={2} alignItems="flex-start" justifyContent="space-between">
          <Heading active={active} visible={visible} totalCheckCount={checks.length} calNames={calNames} />
          <div className={styles.feedback}>
            <Feedback feature="recommendations" about={{ text: `New feature!` }} />
          </div>
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
        {active
          ? active.findings.map((recommendation) => (
              <Finding
                key={recommendation.id}
                recommendation={recommendation}
                calNames={calNames}
                totalCheckCount={checks.length}
                isSolo={active.findings.length === 1}
                isFocused={recommendation.id === focusedId}
                onDismiss={() => dismiss(recommendation.id)}
              />
            ))
          : categories.map((summary) => (
              <AttentionRow
                key={summary.category.id}
                summary={summary}
                totalCheckCount={checks.length}
                dismissedChecks={dismissedChecks}
                onSelect={() => setView(summary.category.id)}
              />
            ))}
        <div className={styles.footer}>
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
        </div>
      </div>
    </div>
  );
}

interface HeadingProps {
  active?: CategorySummary;
  visible: Recommendation[];
  totalCheckCount: number;
  calNames: string[];
}

function Heading({ active, visible, totalCheckCount, calNames }: HeadingProps) {
  const headline = active ? getCategoryCopy(active.category.id).label : getOverview(visible, totalCheckCount, calNames);
  const caption = active ? (
    getCategoryCopy(active.category.id).caption
  ) : (
    <Trans i18nKey="recommendations.intro">
      Findings derived from how your checks are configured. Act on them here, or open the checks they refer to.
    </Trans>
  );

  return (
    <Stack direction="column" gap={0.25}>
      <Stack direction="row" gap={2} alignItems="center" wrap="wrap">
        {headline && <Text weight="medium">{headline}</Text>}
        <SeverityLegend findings={active ? active.findings : visible} />
      </Stack>
      <Text variant="bodySmall" color="secondary">
        {caption}
      </Text>
    </Stack>
  );
}

function getOverview(visible: Recommendation[], totalCheckCount: number, calNames: string[]) {
  if (visible.length === 0) {
    return undefined;
  }

  return t(
    'recommendations.overview.headline',
    '{{affectedCheckCount}} of {{totalCheckCount}} checks need attention. {{leadFinding}} is the gap to close first.',
    {
      affectedCheckCount: countDistinctChecks(visible),
      totalCheckCount,
      leadFinding: getRecommendationCopy(visible[0].id, calNames).title,
    }
  );
}

function getDismissedSummary(dismissedCount: number) {
  switch (dismissedCount) {
    case 0:
      return t('recommendations.dismissed.none', 'No findings dismissed');
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
  isSolo: boolean;
  isFocused: boolean;
  onDismiss: () => void;
}

// One component per finding: each owns its own action.
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
