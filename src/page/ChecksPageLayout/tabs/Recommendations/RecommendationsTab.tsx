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
  useDismissedRecommendations,
  useRecommendationImpressions,
  useRecommendationsView,
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
  const categories = useMemo(() => summariseCategories(visible), [visible]);
  const { view, setView, focusedId } = useRecommendationsView();
  // A category can empty out from under the URL (its findings dismissed, or resolved); land instead.
  const active = categories.find(({ category }) => category.id === view);

  useRecommendationImpressions(visible, { checkCount: checks.length, dismissedCount, focusedId });

  if (checks.length === 0) {
    return <ChecksEmptyState />;
  }

  return (
    <div className={styles.layout}>
      <CategoryRail categories={categories} view={active ? view : ATTENTION_VIEW} onSelect={setView} />
      <div className={styles.content}>
        {/* Feedback sits outside the empty state as well as the findings: hearing that we
            found nothing worth showing is as useful a signal as hearing that a finding was wrong. */}
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

/**
 * The pane heading. On the landing view it is the overview line and the tab's intro; on a
 * category it is the category's name and caption. The legend covers whichever is showing.
 */
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

/** One line that says how much of the fleet is affected and what to tackle first. */
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
