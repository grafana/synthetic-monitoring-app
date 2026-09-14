import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { t, Trans } from '@grafana/i18n';
import { Button, ConfirmModal, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import {
  trackRecommendationActionCompleted,
  trackRecommendationActioned,
} from 'features/tracking/recommendationEvents';

import { FindingProps } from './Finding.types';
import { Check } from 'types';
import { useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { QUERY_KEYS } from 'data/useChecks';
import { showAlert } from 'data/utils';

import {
  formatAlertPeriod,
  formatAlertThreshold,
  getRecommendedAlerts,
  RecommendedAlert,
  runInBatches,
} from '../Recommendations.alerts';
import { CheckRow, PaginatedRows, RecommendationSection } from '../Recommendations.components';
import { BULK_ACTION_BATCH_SIZE } from '../Recommendations.constants';
import { getRecommendationCopy, getRecommendationSummary } from '../Recommendations.copy';
import { getChecksWithoutAlertsUrl } from '../Recommendations.links';
import { getStyles } from '../Recommendations.styles';

interface AlertPlan {
  check: Check;
  alerts: RecommendedAlert[];
}

/**
 * A. Checks running without alerting. The action is the check editor's own default alerts,
 * applied from here so the gap closes without leaving the page: one check at a time after a
 * preview, or every check at once after confirming.
 */
export function AlertingGapsFinding({ recommendation, totalCheckCount, isFocused, onDismiss }: FindingProps) {
  const { id, checks } = recommendation;
  const { severity, title, tooltip } = getRecommendationCopy(id, []);
  const queryClient = useQueryClient();
  const { mutateAsync: updateAlerts } = useUpdateAlertsForCheck();
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  // A check that runs less often than the longest alert period has nothing we can safely apply.
  const plans = useMemo<AlertPlan[]>(
    () =>
      checks.map((check) => ({ check, alerts: getRecommendedAlerts(check) })).filter((plan) => plan.alerts.length > 0),
    [checks]
  );
  const totalAlertCount = plans.reduce((sum, plan) => sum + plan.alerts.length, 0);

  const handleApplyAll = async () => {
    setIsApplyingAll(true);

    const results = await runInBatches(plans, BULK_ACTION_BATCH_SIZE, ({ check, alerts }) =>
      updateAlerts({ alerts: alerts.map((alert) => alert.draft), checkId: check.id! })
    );
    const succeeded = results.filter((result) => result.status === 'fulfilled').length;

    if (succeeded > 0) {
      trackRecommendationActionCompleted({
        finding: id,
        action: 'alerts_added',
        checkCount: succeeded,
        scope: 'finding',
      });
      showAlert(
        'success',
        succeeded === 1
          ? t('recommendations.alertingGaps.bulkAppliedSingle', 'Added alerts to 1 check')
          : t('recommendations.alertingGaps.bulkApplied', 'Added alerts to {{checkCount}} checks', {
              checkCount: succeeded,
            })
      );
    }

    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    setIsApplyingAll(false);
    setIsConfirmingAll(false);
  };

  return (
    <RecommendationSection
      title={title}
      tooltip={tooltip}
      summary={getRecommendationSummary(recommendation, totalCheckCount)}
      severity={severity}
      isFocused={isFocused}
      onDismiss={onDismiss}
      actions={
        <>
          <LinkButton
            variant="secondary"
            fill="outline"
            size="sm"
            href={getChecksWithoutAlertsUrl()}
            onClick={() => trackRecommendationActioned({ finding: id, scope: 'finding' })}
          >
            <Trans i18nKey="recommendations.alertingGaps.viewInList">View in check list</Trans>
          </LinkButton>
          {plans.length > 1 && (
            <Button variant="primary" size="sm" onClick={() => setIsConfirmingAll(true)}>
              {t('recommendations.alertingGaps.setUpAll', 'Set up alerts for all {{checkCount}} checks', {
                checkCount: plans.length,
              })}
            </Button>
          )}
        </>
      }
    >
      <PaginatedRows
        items={checks}
        renderItem={(check) => (
          <AlertSetupRow
            key={check.id}
            check={check}
            onEditClick={() => trackRecommendationActioned({ finding: id, scope: 'check' })}
            onApplied={() =>
              trackRecommendationActionCompleted({ finding: id, action: 'alerts_added', checkCount: 1, scope: 'check' })
            }
          />
        )}
      />
      <ConfirmModal
        isOpen={isConfirmingAll}
        title={t('recommendations.alertingGaps.confirm.title', 'Set up alerts for all checks')}
        body={t(
          'recommendations.alertingGaps.confirm.body',
          'This adds {{alertCount}} alerts across {{checkCount}} checks, using the default thresholds for each check type. You can tune or remove any of them from the check editor afterwards.',
          { alertCount: totalAlertCount, checkCount: plans.length }
        )}
        confirmText={
          isApplyingAll
            ? t('recommendations.alertingGaps.confirm.applying', 'Adding alerts...')
            : t('recommendations.alertingGaps.confirm.confirm', 'Add alerts')
        }
        disabled={isApplyingAll}
        onConfirm={handleApplyAll}
        onDismiss={() => setIsConfirmingAll(false)}
      />
    </RecommendationSection>
  );
}

interface AlertSetupRowProps {
  check: Check;
  onEditClick: () => void;
  onApplied: () => void;
}

/** One unalerted check with a "Set up" control that previews the default alerts before adding them. */
function AlertSetupRow({ check, onEditClick, onApplied }: AlertSetupRowProps) {
  const styles = useStyles2(getStyles);
  const queryClient = useQueryClient();
  const { mutateAsync: updateAlerts, isPending } = useUpdateAlertsForCheck();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const alerts = useMemo(() => getRecommendedAlerts(check), [check]);

  const handleApply = async () => {
    try {
      await updateAlerts({ alerts: alerts.map((alert) => alert.draft), checkId: check.id! });
    } catch {
      // The mutation's meta already raises the error toast; the row stays open to retry.
      return;
    }

    setIsDone(true);
    setIsExpanded(false);
    onApplied();
    // The check list carries each check's alerts, so refetching it drops this row from the finding.
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
  };

  return (
    <CheckRow
      check={check}
      onEditClick={onEditClick}
      action={
        isDone ? (
          <span className={styles.doneText}>
            <Trans i18nKey="recommendations.alertingGaps.row.done">Alerts added</Trans>
          </span>
        ) : alerts.length > 0 ? (
          <Button
            size="sm"
            variant="secondary"
            fill="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={t('recommendations.alertingGaps.row.setUpLabel', 'Set up alerts for {{job}}', {
              job: check.job,
            })}
          >
            {isExpanded
              ? t('recommendations.alertingGaps.row.close', 'Close')
              : t('recommendations.alertingGaps.row.setUp', 'Set up')}
          </Button>
        ) : undefined
      }
      expansion={
        isExpanded && (
          <div className={styles.inlinePanel}>
            <Stack direction="column" gap={1}>
              <span className={styles.inlinePanelTitle}>
                {t('recommendations.alertingGaps.row.previewTitle', 'Recommended alerts for {{job}}', {
                  job: check.job,
                })}
              </span>
              <Stack direction="column" gap={0.5}>
                {alerts.map((alert) => (
                  <div key={alert.draft.name} className={styles.previewItem}>
                    <span className={styles.previewItemLabel}>{alert.definition.name}</span>
                    <span className={styles.rowDetail}>
                      {alert.draft.period
                        ? t('recommendations.alertingGaps.row.thresholdWithPeriod', '{{threshold}} over {{period}}', {
                            threshold: formatAlertThreshold(alert),
                            period: formatAlertPeriod(alert.draft.period),
                          })
                        : formatAlertThreshold(alert)}
                    </span>
                  </div>
                ))}
              </Stack>
              <Stack direction="row" gap={1} justifyContent="flex-end">
                <Button size="sm" variant="secondary" fill="text" onClick={() => setIsExpanded(false)}>
                  <Trans i18nKey="recommendations.alertingGaps.row.cancel">Cancel</Trans>
                </Button>
                <Button size="sm" variant="primary" onClick={handleApply} disabled={isPending}>
                  {isPending
                    ? t('recommendations.alertingGaps.row.applying', 'Adding...')
                    : alerts.length === 1
                      ? t('recommendations.alertingGaps.row.applySingle', 'Add alert')
                      : t('recommendations.alertingGaps.row.apply', 'Add {{alertCount}} alerts', {
                          alertCount: alerts.length,
                        })}
                </Button>
              </Stack>
            </Stack>
          </div>
        )
      }
    />
  );
}
