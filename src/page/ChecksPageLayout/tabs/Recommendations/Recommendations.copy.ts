import { t } from '@grafana/i18n';

import {
  CategorySummary,
  Recommendation,
  RecommendationCategoryId,
  RecommendationId,
  RecommendationSeverity,
} from './Recommendations.types';

import { getRecommendedAlerts } from './Recommendations.alerts';

export interface RecommendationCopy {
  severity: RecommendationSeverity;
  title: string;
  tooltip: string;
}

export function getRecommendationCopy(id: RecommendationId, calNames: string[]): RecommendationCopy {
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
      };

    case RecommendationId.DuplicateChecks:
      return {
        severity: 'info',
        title: t('recommendations.duplicateChecks.title', 'Duplicate checks'),
        // The tooltip's job is to tell this finding from its sibling, so it says what was
        // matched on. Matching ignores probes and frequency, and the copy has to be honest about that.
        tooltip: t(
          'recommendations.duplicateChecks.description',
          'Same target, same check type, more than one check. Matched on target and type only, so compare the frequency and probes shown on each row before deciding. Each duplicate bills at full rate. Safe to delete down to one unless you are deliberately running from different probe sets.'
        ),
      };

    case RecommendationId.OverlappingTargets:
      return {
        severity: 'info',
        title: t('recommendations.overlappingTargets.title', 'Overlapping targets'),
        tooltip: t(
          'recommendations.overlappingTargets.description',
          'Same target, different check types, for example an HTTP check and a browser check on the same URL. Often deliberate: HTTP for uptime, browser for the user journey. Review rather than delete, and keep the one whose failure you would actually act on.'
        ),
      };

    case RecommendationId.PausedChecks:
      return {
        severity: 'warning',
        title: t('recommendations.pausedChecks.title', 'Paused checks'),
        tooltip: t(
          'recommendations.pausedChecks.description',
          'These checks are paused and are not monitoring anything. Resume the ones you still need and delete the rest.'
        ),
      };
  }
}

export function getRecommendationSummary({ id, checks, groups }: Recommendation, totalCheckCount: number) {
  const counts = { affectedCheckCount: checks.length, totalCheckCount };

  switch (id) {
    case RecommendationId.AlertingGaps:
      return t(
        'recommendations.summary.alertingGaps',
        '{{affectedCheckCount}} of {{totalCheckCount}} checks have no alerts',
        counts
      );

    case RecommendationId.MissingCostLabels:
      return t(
        'recommendations.summary.missingCostLabels',
        '{{affectedCheckCount}} of {{totalCheckCount}} checks are unattributed',
        counts
      );

    case RecommendationId.PausedChecks:
      return t(
        'recommendations.summary.paused',
        '{{affectedCheckCount}} of {{totalCheckCount}} checks are paused',
        counts
      );

    // Each says what kind of redundancy it is, since either can stand alone as a panel's title.
    case RecommendationId.DuplicateChecks:
      return t(
        'recommendations.summary.duplicates',
        '{{affectedCheckCount}} of {{totalCheckCount}} checks are duplicates across {{targetCount}} targets',
        { ...counts, targetCount: groups?.length ?? 0 }
      );

    case RecommendationId.OverlappingTargets:
      return t(
        'recommendations.summary.overlapping',
        '{{affectedCheckCount}} of {{totalCheckCount}} checks overlap across {{targetCount}} targets',
        { ...counts, targetCount: groups?.length ?? 0 }
      );
  }
}

/**
 * The finding's headline action as it reads on its panel, so the landing view can promise the
 * same thing the panel then offers. Mirrors the buttons each finding component renders.
 */
export function getRecommendationActionLabel({ id, checks }: Recommendation): string {
  switch (id) {
    case RecommendationId.AlertingGaps: {
      // Only checks with an applicable default alert take part in the bulk action.
      const applicableCount = checks.filter((check) => getRecommendedAlerts(check).length > 0).length;

      return applicableCount > 1
        ? t('recommendations.alertingGaps.setUpAll', 'Set up alerts for all {{checkCount}}', {
            checkCount: applicableCount,
          })
        : t('recommendations.alertingGaps.viewInList', 'View in check list');
    }

    case RecommendationId.MissingCostLabels:
      return t('recommendations.missingCostLabels.action', 'View in check list');

    case RecommendationId.PausedChecks:
      return t('recommendations.pausedChecks.action', 'Review paused checks');

    case RecommendationId.DuplicateChecks:
    case RecommendationId.OverlappingTargets:
      return t('recommendations.categories.review', 'Review');
  }
}

export interface CategoryCopy {
  label: string;
  /** One line under the pane heading saying what the category is about. */
  caption: string;
}

export function getCategoryCopy(id: RecommendationCategoryId): CategoryCopy {
  switch (id) {
    case RecommendationCategoryId.Alerting:
      return {
        label: t('recommendations.categories.alerting.label', 'Alerting'),
        caption: t('recommendations.categories.alerting.caption', 'Checks that are running but would fail silently.'),
      };

    case RecommendationCategoryId.Cost:
      return {
        label: t('recommendations.categories.cost.label', 'Cost & attribution'),
        caption: t('recommendations.categories.cost.caption', 'Checks whose spend cannot be attributed to a team.'),
      };

    case RecommendationCategoryId.Paused:
      return {
        label: t('recommendations.categories.paused.label', 'Paused checks'),
        caption: t('recommendations.categories.paused.caption', 'Checks that exist but are not monitoring anything.'),
      };

    case RecommendationCategoryId.Redundancy:
      return {
        label: t('recommendations.categories.redundancy.label', 'Redundancy'),
        caption: t(
          'recommendations.categories.redundancy.caption',
          'Targets covered more than once. Worth a look, not always a clean-up.'
        ),
      };
  }
}

/**
 * What a category's row on the landing view says. A category with one finding borrows that
 * finding's own summary and action; one with several rolls them up.
 */
export function getCategoryRowCopy({ findings, checkCount }: CategorySummary, totalCheckCount: number) {
  if (findings.length === 1) {
    return {
      summary: getRecommendationSummary(findings[0], totalCheckCount),
      action: getRecommendationActionLabel(findings[0]),
    };
  }

  return {
    summary: t(
      'recommendations.categories.summary',
      '{{checkCount}} of {{totalCheckCount}} checks across {{findingCount}} findings',
      { checkCount, totalCheckCount, findingCount: findings.length }
    ),
    action: t('recommendations.categories.reviewMany', 'Review {{findingCount}} findings', {
      findingCount: findings.length,
    }),
  };
}

export function getLegendLabel(severity: RecommendationSeverity, checkCount: number) {
  switch (severity) {
    case 'error':
      return t('recommendations.legend.critical', '{{checkCount}} critical', { checkCount });
    case 'warning':
      return t('recommendations.legend.warning', '{{checkCount}} warning', { checkCount });
    case 'info':
      return t('recommendations.legend.info', '{{checkCount}} info', { checkCount });
  }
}
