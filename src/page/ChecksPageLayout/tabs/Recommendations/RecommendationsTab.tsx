import React, { useCallback, useMemo, useState } from 'react';
import { t, Trans } from '@grafana/i18n';
import { Alert, Button, EmptyState, LoadingPlaceholder, Stack, Text, useStyles2 } from '@grafana/ui';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { CategorySummary, Recommendation, RecommendationId } from './Recommendations.types';
import { Check } from 'types';
import {
  CheckFolderAccessProvider,
  useIsVisibilitySettling,
  useVisibleChecks,
} from 'contexts/CheckFolderAccessContext';
import { useSuspenseChecks } from 'data/useChecks';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { ChecksEmptyState } from 'components/ChecksEmptyState';
import { Feedback } from 'components/Feedback';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

import { AlertingGapsFinding } from './findings/AlertingGapsFinding';
import { MissingCostLabelsFinding } from './findings/MissingCostLabelsFinding';
import { PausedChecksFinding } from './findings/PausedChecksFinding';
import { RedundancyFinding } from './findings/RedundancyFinding';
import { RecommendationFilters } from './RecommendationFilters';
import { countDismissedChecks, getFindingSnapshot } from './Recommendations.analytics';
import { countDistinctChecks, summariseCategories } from './Recommendations.categories';
import { AttentionRow, CategoryRail, SeverityLegend } from './Recommendations.components';
import { UNESCAPED } from './Recommendations.constants';
import { getCategoryCopy, getRecommendationCopy } from './Recommendations.copy';
import { filterFindings, FindingFilter, matchesRecommendationFilters } from './Recommendations.filters';
import {
  ATTENTION_VIEW,
  useDismissedCheckMap,
  useDismissedRecommendations,
  useEntryPoint,
  useFilterOptions,
  useRecommendationFilters,
  useRecommendationImpressions,
  useRecommendationsView,
} from './Recommendations.hooks';
import { RecommendationsEntryPoint } from './Recommendations.links';
import { getStyles } from './Recommendations.styles';
import { computeRecommendations } from './Recommendations.utils';

const NO_FINDINGS: Recommendation[] = [];

export function RecommendationsTab() {
  // Read here, above the suspense boundary, so the duration covers loading the checks too.
  const [openedAt] = useState(() => performance.now());
  const entryPoint = useEntryPoint();

  return (
    <QueryErrorBoundary>
      <RecommendationsTabChecks openedAt={openedAt} entryPoint={entryPoint} />
    </QueryErrorBoundary>
  );
}

interface VisitOrigin {
  openedAt: number;
  entryPoint: RecommendationsEntryPoint;
}

// Findings act on checks, so they need the same folder-level permissions the check list uses.
function RecommendationsTabChecks(origin: VisitOrigin) {
  const { data: checks } = useSuspenseChecks();

  return (
    <CheckFolderAccessProvider checks={checks}>
      <RecommendationsTabContent {...origin} />
    </CheckFolderAccessProvider>
  );
}

function RecommendationsTabContent({ openedAt, entryPoint }: VisitOrigin) {
  const styles = useStyles2(getStyles);
  // Visible, not all: a check in a folder the user cannot read is hidden on the Checks page, so
  // its job and target must not reach a finding here either.
  const checks = useVisibleChecks();
  // An empty list reads as "no checks created" below, which is only true once every folder
  // has answered: until then a tenant whose checks all live in folders looks like a new one.
  const isVisibilitySettling = useIsVisibilitySettling();
  const { data: calData, isLoading: isCALsLoading, isError: isCALsUnavailable } = useTenantCostAttributionLabels();
  const calNames = useMemo(() => calData?.names ?? [], [calData?.names]);
  // No labels and not-yet-known are the same empty array to the finders, so wait for the
  // query to settle before deciding what to show. Otherwise the cost finding is missing
  // from the first render, the empty state and the one-shot visit impression.
  const isSettling = isCALsLoading || isVisibilitySettling;

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

  // Structure (categories, panels, impressions) stays on `visible`; only counts and copy read
  // `matched`. Findings are never filtered away, just narrowed, so the page keeps its shape.
  const { selection, setSelection, isActive: isFiltering } = useRecommendationFilters();
  const { typeOptions, labelOptions, folderOptions, defaultFolderUid } = useFilterOptions(checks, selection);
  const matches = useCallback(
    (check: Check) => matchesRecommendationFilters(check, selection, defaultFolderUid),
    [selection, defaultFolderUid]
  );
  const filter = useMemo<FindingFilter>(
    () => ({ isActive: isFiltering, matches, selection }),
    [isFiltering, matches, selection]
  );
  const matched = useMemo(
    () => (isFiltering ? filterFindings(visible, matches) : visible),
    [isFiltering, visible, matches]
  );
  const matchedCategories = useMemo(
    () => (isFiltering ? summariseCategories(matched) : categories),
    [isFiltering, matched, categories]
  );
  // The URL's category can empty out (dismissed, resolved); land instead.
  const active = categories.find(({ category }) => category.id === view);
  const dismissedChecks = useDismissedCheckMap();

  const getVisit = useCallback(
    () => ({
      findingCount: recommendations.length,
      dismissedCount,
      dismissedCheckCount: countDismissedChecks(recommendations, dismissedChecks),
      checkCount: checks.length,
      ...getFindingSnapshot(recommendations),
      entryPoint,
      focusFinding: focusedId,
      durationMs: Math.round(performance.now() - openedAt),
      calsUnavailable: isCALsUnavailable,
    }),
    [
      recommendations,
      dismissedCount,
      dismissedChecks,
      checks.length,
      entryPoint,
      focusedId,
      openedAt,
      isCALsUnavailable,
    ]
  );

  useRecommendationImpressions({ shown: active?.findings ?? NO_FINDINGS, getVisit, isComplete: !isSettling });

  // Before the empty state: an incomplete list must not be mistaken for an empty one.
  if (isSettling) {
    return <LoadingPlaceholder text={t('recommendations.loading', 'Looking for findings...')} />;
  }

  if (checks.length === 0) {
    return <ChecksEmptyState />;
  }

  return (
    <div className={styles.layout}>
      <div className={styles.railColumn}>
        <CategoryRail categories={matchedCategories} view={active ? view : ATTENTION_VIEW} onSelect={setView} />
        {visible.length > 0 && (
          <>
            <div className={styles.railDivider} role="presentation" />
            <RecommendationFilters
              typeOptions={typeOptions}
              labelOptions={labelOptions}
              folderOptions={folderOptions}
              selection={selection}
              onChange={setSelection}
            />
          </>
        )}
      </div>
      <div className={styles.content}>
        {/* Feedback shows with the empty state too: finding nothing is a signal as well. */}
        <Stack direction="row" gap={2} alignItems="flex-start" justifyContent="space-between">
          <Heading
            active={active}
            visible={visible}
            matched={matched}
            isFiltering={isFiltering}
            totalCheckCount={checks.length}
            calNames={calNames}
          />
          <div className={styles.feedback}>
            <Feedback feature="recommendations" about={{ text: 'Experimental' }} />
          </div>
        </Stack>
        {isCALsUnavailable && (
          <Alert
            severity="warning"
            title={t('recommendations.calsUnavailable.title', 'Cost attribution labels could not be loaded')}
            data-testid={RECOMMENDATIONS_TEST_ID.calsUnavailable}
          >
            <Trans i18nKey="recommendations.calsUnavailable.body">
              Checks missing cost attribution labels are not included below. Every other finding is unaffected.
            </Trans>
          </Alert>
        )}
        {recommendations.length === 0 && !isCALsUnavailable && (
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
                filter={filter}
                onDismiss={() => dismiss(recommendation.id)}
              />
            ))
          : categories.map((summary) => (
              <AttentionRow
                key={summary.category.id}
                summary={summary}
                totalCheckCount={checks.length}
                dismissedChecks={dismissedChecks}
                matchedCheckCount={
                  isFiltering ? getMatchedCheckCount(matchedCategories, summary.category.id) : undefined
                }
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
  matched: Recommendation[];
  isFiltering: boolean;
  totalCheckCount: number;
  calNames: string[];
}

function Heading({ active, visible, matched, isFiltering, totalCheckCount, calNames }: HeadingProps) {
  // With nothing visible the filters are hidden too, so they must not take the blame for an empty page.
  const headline = active
    ? getCategoryCopy(active.category.id).label
    : isFiltering && visible.length > 0
      ? getFilteredOverview(visible, matched, calNames)
      : getOverview(visible, totalCheckCount, calNames);
  const legendFindings = active ? matched.filter(({ id }) => active.category.findings.includes(id)) : matched;
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
        <SeverityLegend findings={legendFindings} />
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
      ...UNESCAPED,
    }
  );
}

function getFilteredOverview(visible: Recommendation[], matched: Recommendation[], calNames: string[]) {
  const matchedCount = countDistinctChecks(matched);
  // Rail order, as unfiltered: the first finding that still has a check to show.
  const lead = matched.find(({ checks }) => checks.length > 0);

  if (matchedCount === 0 || !lead) {
    return t('recommendations.filters.headlineNone', 'No checks match your filters.');
  }

  const totalCount = countDistinctChecks(visible);
  const leadFinding = getRecommendationCopy(lead.id, calNames).title;

  return totalCount === 1
    ? t(
        'recommendations.filters.headlineSingle',
        '1 of 1 check matches your filters. {{leadFinding}} is the gap to close first.',
        { leadFinding, ...UNESCAPED }
      )
    : t(
        'recommendations.filters.headline',
        '{{matchedCount}} of {{totalCount}} checks match your filters. {{leadFinding}} is the gap to close first.',
        { matchedCount, totalCount, leadFinding, ...UNESCAPED }
      );
}

function getMatchedCheckCount(matchedCategories: CategorySummary[], id: CategorySummary['category']['id']) {
  return matchedCategories.find(({ category }) => category.id === id)?.checkCount ?? 0;
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
  filter: FindingFilter;
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
