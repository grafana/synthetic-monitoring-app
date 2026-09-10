import { t } from '@grafana/i18n';

import { Recommendation, RecommendationId, RecommendationSeverity } from './Recommendations.types';

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
        tooltip: t(
          'recommendations.duplicateChecks.description',
          'These targets are monitored more than once by the same type of check. Duplicates cost the same as the original and rarely tell you anything new.'
        ),
      };

    case RecommendationId.OverlappingTargets:
      return {
        severity: 'info',
        title: t('recommendations.overlappingTargets.title', 'Overlapping targets'),
        tooltip: t(
          'recommendations.overlappingTargets.description',
          'These targets are covered by more than one kind of check. Some overlap is deliberate, so this is worth a look rather than a clean-up.'
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

    case RecommendationId.DuplicateChecks:
    case RecommendationId.OverlappingTargets:
      return t(
        'recommendations.summary.groups',
        '{{affectedCheckCount}} of {{totalCheckCount}} checks across {{targetCount}} targets',
        { ...counts, targetCount: groups?.length ?? 0 }
      );
  }
}
