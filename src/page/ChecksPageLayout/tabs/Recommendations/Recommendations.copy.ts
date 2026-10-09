import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getTotalChecksPerPeriod } from 'checkUsageCalc';

import {
  CategorySummary,
  DismissedChecks,
  Recommendation,
  RecommendationCategoryId,
  RecommendationId,
  RecommendationSeverity,
} from './Recommendations.types';
import { Check, CheckAlertType } from 'types';

import { formatAlertPeriod, formatAlertThreshold, getAlertPlans, RecommendedAlert } from './Recommendations.alerts';
import { UNESCAPED } from './Recommendations.constants';
import { getDismissedCheckIds } from './Recommendations.utils';

export interface RecommendationCopy {
  title: string;
  tooltip: string;
}

export function getRecommendationCopy(id: RecommendationId, calNames: string[]): RecommendationCopy {
  switch (id) {
    case RecommendationId.AlertingGaps:
      return {
        title: t('recommendations.alertingGaps.title', 'Alerting'),
        tooltip: t(
          'recommendations.alertingGaps.description',
          'These checks are running but have no alerting configured, so a failure will go unnoticed until someone looks.'
        ),
      };

    case RecommendationId.MissingCostLabels:
      return {
        title: t('recommendations.missingCostLabels.title', 'Cost attribution'),
        tooltip: t(
          'recommendations.missingCostLabels.description',
          'These checks are missing one or more of your cost attribution labels ({{labels}}), so their spend cannot be attributed to a team.',
          { labels: calNames.join(', '), ...UNESCAPED }
        ),
      };

    case RecommendationId.DuplicateChecks:
      return {
        title: t('recommendations.duplicateChecks.title', 'Duplicate checks'),
        // Matching ignores probes and frequency; the copy has to say so.
        tooltip: t(
          'recommendations.duplicateChecks.description',
          'Same target, same check type, more than one check. Potential duplicates only: matching ignores everything else these checks can differ on, such as request method, authentication, assertions or script contents, as well as frequency and probes. Each one bills at full rate, so they are worth reviewing, but compare the full configuration in the editor before deleting any of them.'
        ),
      };

    case RecommendationId.OverlappingTargets:
      return {
        title: t('recommendations.overlappingTargets.title', 'Overlapping targets'),
        tooltip: t(
          'recommendations.overlappingTargets.description',
          'Same target, different check types, for example an HTTP check and a browser check on the same URL. Often deliberate: HTTP for uptime, browser for the user journey. Review rather than delete, and keep the one whose failure you would actually act on.'
        ),
      };

    case RecommendationId.PausedChecks:
      return {
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

    // Either can stand alone as a panel title, so each names its kind of redundancy.
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

// Mirrors each finding's header button, so the landing view promises what the panel offers.
export function getRecommendationActionLabel(
  { id, checks }: Recommendation,
  dismissedCheckIds: number[],
  canWrite: (check: Check) => boolean
): string {
  switch (id) {
    case RecommendationId.AlertingGaps: {
      // Same rule the panel applies, so the row cannot offer an action the panel withholds.
      const applicableCount = getAlertPlans(
        checks.filter((check) => !dismissedCheckIds.includes(check.id!)),
        canWrite
      ).length;

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

// One finding borrows its own summary and action; several roll up.
export function getCategoryRowCopy(
  { findings, checkCount }: CategorySummary,
  totalCheckCount: number,
  dismissedChecks: DismissedChecks,
  canWrite: (check: Check) => boolean
) {
  if (findings.length === 1) {
    return {
      summary: getRecommendationSummary(findings[0], totalCheckCount),
      action: getRecommendationActionLabel(
        findings[0],
        getDismissedCheckIds(dismissedChecks, findings[0].id),
        canWrite
      ),
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

const DURATION_AVERAGE_ALERTS = [
  CheckAlertType.HTTPRequestDurationTooHighAvg,
  CheckAlertType.PingRequestDurationTooHighAvg,
  CheckAlertType.DNSRequestDurationTooHighAvg,
];

// Worded as the editor words each alert, so the preview reads like what the user will find there.
export function getRecommendedAlertCopy(alert: RecommendedAlert, check: Check): string {
  const { definition, draft } = alert;
  const threshold = formatAlertThreshold(alert);

  if (!draft.period) {
    return definition.type === CheckAlertType.TLSTargetCertificateCloseToExpiring
      ? t('recommendations.alertingGaps.row.certificateExpiry', 'Certificate expires in less than {{threshold}}', {
          threshold,
        })
      : threshold;
  }

  const period = formatAlertPeriod(draft.period);

  if (definition.type === CheckAlertType.ProbeFailedExecutionsTooHigh) {
    const executionCount = getTotalChecksPerPeriod(
      check.probes.length,
      check.frequency,
      durationToMilliseconds(parseDuration(draft.period))
    );

    return draft.threshold === 1
      ? t(
          'recommendations.alertingGaps.row.failedExecutionsSingle',
          'At least 1 of {{executionCount}} probe executions fails in the last {{period}}',
          { executionCount, period }
        )
      : t(
          'recommendations.alertingGaps.row.failedExecutions',
          'At least {{threshold}} of {{executionCount}} probe executions fail in the last {{period}}',
          { threshold, executionCount, period }
        );
  }

  if (DURATION_AVERAGE_ALERTS.includes(definition.type)) {
    return t(
      'recommendations.alertingGaps.row.averageDuration',
      'Average duration above {{threshold}} over the last {{period}}',
      { threshold, period }
    );
  }

  return t('recommendations.alertingGaps.row.thresholdWithPeriod', '{{threshold}} over {{period}}', {
    threshold,
    period,
  });
}
