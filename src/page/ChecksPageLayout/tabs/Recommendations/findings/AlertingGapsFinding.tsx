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
import {
  CheckRow,
  DismissedChecksFooter,
  PaginatedRows,
  RecommendationSection,
  SelectionBar,
} from '../Recommendations.components';
import { BULK_ACTION_BATCH_SIZE } from '../Recommendations.constants';
import { useRowSelection } from '../Recommendations.hooks';
import { getChecksWithoutAlertsUrl } from '../Recommendations.links';
import { getStyles } from '../Recommendations.styles';
import { useFindingPanel } from './Finding.hooks';

interface AlertPlan {
  check: Check;
  alerts: RecommendedAlert[];
}

/**
 * A. Checks running without alerting. The action is the check editor's own default alerts,
 * applied from here so the gap closes without leaving the page: one check at a time after a
 * preview, the ticked checks at once, or every check at once after confirming.
 */
export function AlertingGapsFinding({ recommendation, totalCheckCount, isSolo, isFocused, onDismiss }: FindingProps) {
  const { id } = recommendation;
  const { severity, header, rows, dismissedCount, dismissCheck, restoreChecks } = useFindingPanel({
    recommendation,
    totalCheckCount,
    isSolo,
  });
  const queryClient = useQueryClient();
  const { mutateAsync: updateAlerts } = useUpdateAlertsForCheck();
  const selection = useRowSelection(rows);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // A check that runs less often than the longest alert period has nothing we can safely apply.
  const plans = useMemo<AlertPlan[]>(
    () =>
      rows.map((check) => ({ check, alerts: getRecommendedAlerts(check) })).filter((plan) => plan.alerts.length > 0),
    [rows]
  );
  const totalAlertCount = plans.reduce((sum, plan) => sum + plan.alerts.length, 0);

  const applyTo = async (targets: AlertPlan[]) => {
    setIsApplying(true);

    const results = await runInBatches(targets, BULK_ACTION_BATCH_SIZE, ({ check, alerts }) =>
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

    // The check list carries each check's alerts, so refetching it drops the done rows from the finding.
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    setIsApplying(false);
  };

  const handleApplyAll = async () => {
    await applyTo(plans);
    setIsConfirmingAll(false);
  };

  const handleApplySelected = async () => {
    const selectedIds = selection.selected.map((check) => check.id);
    await applyTo(plans.filter((plan) => selectedIds.includes(plan.check.id)));
    selection.clear();
  };

  return (
    <RecommendationSection
      {...header}
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
      toolbar={
        <SelectionBar
          selectedCount={selection.selected.length}
          actionLabel={t('recommendations.alertingGaps.setUpSelected', 'Set up alerts for {{checkCount}}', {
            checkCount: selection.selected.length,
          })}
          isBusy={isApplying}
          onAction={handleApplySelected}
          onClear={selection.clear}
        />
      }
      footer={<DismissedChecksFooter dismissedCount={dismissedCount} onRestore={restoreChecks} />}
    >
      <PaginatedRows
        items={rows}
        renderItem={(check) => (
          <AlertSetupRow
            key={check.id}
            check={check}
            isSelected={selection.isSelected(check)}
            onSelectChange={selection.toggle}
            onDismiss={dismissCheck}
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
          isApplying
            ? t('recommendations.alertingGaps.confirm.applying', 'Adding alerts...')
            : t('recommendations.alertingGaps.confirm.confirm', 'Add alerts')
        }
        disabled={isApplying}
        onConfirm={handleApplyAll}
        onDismiss={() => setIsConfirmingAll(false)}
      />
    </RecommendationSection>
  );
}

interface AlertSetupRowProps {
  check: Check;
  isSelected: boolean;
  onSelectChange: (check: Check) => void;
  onDismiss: (check: Check) => void;
  onEditClick: () => void;
  onApplied: () => void;
}

/** One unalerted check with a "Set up" control that previews the default alerts before adding them. */
function AlertSetupRow({ check, isSelected, onSelectChange, onDismiss, onEditClick, onApplied }: AlertSetupRowProps) {
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
    // Same confirmation the rest of the app gives after a mutation. The hook has no successAlert
    // of its own because the check editor calls it straight after updateCheck, which already toasts.
    showAlert(
      'success',
      alerts.length === 1
        ? t('recommendations.alertingGaps.row.appliedSingle', 'Added an alert to {{job}}', { job: check.job })
        : t('recommendations.alertingGaps.row.applied', 'Added {{alertCount}} alerts to {{job}}', {
            alertCount: alerts.length,
            job: check.job,
          })
    );
    // The check list carries each check's alerts, so refetching it drops this row from the finding.
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
  };

  return (
    <CheckRow
      check={check}
      doneLabel={isDone ? t('recommendations.alertingGaps.row.done', 'Alerts added') : undefined}
      isSelected={isSelected}
      onSelectChange={alerts.length > 0 ? onSelectChange : undefined}
      onDismiss={onDismiss}
      onEditClick={onEditClick}
      action={
        alerts.length > 0 ? (
          <Button
            size="sm"
            variant="primary"
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
