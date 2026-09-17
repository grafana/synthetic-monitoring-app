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
  HeaderAction,
  PaginatedRows,
  PanelFooter,
  RecommendationSection,
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

  // A check slower than the longest alert period has no valid default alert.
  const plans = useMemo<AlertPlan[]>(
    () =>
      rows.map((check) => ({ check, alerts: getRecommendedAlerts(check) })).filter((plan) => plan.alerts.length > 0),
    [rows]
  );
  const totalAlertCount = plans.reduce((sum, plan) => sum + plan.alerts.length, 0);

  // Returns the checks it succeeded on. Failures toast via the mutation's meta.
  const applyTo = async (targets: AlertPlan[], scope: 'finding' | 'selection'): Promise<Check[]> => {
    setIsApplying(true);

    const results = await runInBatches(targets, BULK_ACTION_BATCH_SIZE, ({ check, alerts }) =>
      updateAlerts({ alerts: alerts.map((alert) => alert.draft), checkId: check.id! })
    );
    const succeeded = targets.filter((_, index) => results[index].status === 'fulfilled').map((plan) => plan.check);

    if (succeeded.length > 0) {
      trackRecommendationActionCompleted({ finding: id, action: 'alerts_added', checkCount: succeeded.length, scope });
      showAlert(
        'success',
        succeeded.length === 1
          ? t('recommendations.alertingGaps.bulkAppliedSingle', 'Added alerts to 1 check')
          : t('recommendations.alertingGaps.bulkApplied', 'Added alerts to {{checkCount}} checks', {
              checkCount: succeeded.length,
            })
      );
    }

    // The check list carries the alerts, so refetching it drops the done rows.
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    setIsApplying(false);

    return succeeded;
  };

  const handleApplyAll = async () => {
    await applyTo(plans, 'finding');
    setIsConfirmingAll(false);
  };

  const handleApplySelected = async () => {
    const selectedIds = selection.selected.map((check) => check.id);
    const succeeded = await applyTo(
      plans.filter((plan) => selectedIds.includes(plan.check.id)),
      'selection'
    );
    // Failed rows stay ticked for a retry.
    selection.deselect(succeeded);
  };

  const selectedCount = selection.selected.length;
  // Ticked rows go straight through; "all" still confirms.
  const headerLabel =
    selectedCount === 1
      ? t('recommendations.alertingGaps.setUpSelectedSingle', 'Set up alerts for 1 check')
      : selectedCount > 1
        ? t('recommendations.alertingGaps.setUpSelected', 'Set up alerts for {{checkCount}} checks', {
            checkCount: selectedCount,
          })
        : plans.length > 1
          ? t('recommendations.alertingGaps.setUpAll', 'Set up alerts for all {{checkCount}}', {
              checkCount: plans.length,
            })
          : undefined;

  return (
    <RecommendationSection
      {...header}
      severity={severity}
      isFocused={isFocused}
      onDismiss={onDismiss}
      actions={
        <HeaderAction
          label={headerLabel}
          selectedCount={selectedCount}
          isBusy={isApplying}
          onAction={selectedCount > 0 ? handleApplySelected : () => setIsConfirmingAll(true)}
          onClearSelection={selection.clear}
        />
      }
      footer={
        <PanelFooter
          dismissedCount={dismissedCount}
          onRestore={restoreChecks}
          secondaryAction={
            <LinkButton
              variant="secondary"
              fill="outline"
              size="sm"
              href={getChecksWithoutAlertsUrl()}
              onClick={() => trackRecommendationActioned({ finding: id, scope: 'finding' })}
            >
              <Trans i18nKey="recommendations.alertingGaps.viewInList">View in check list</Trans>
            </LinkButton>
          }
        />
      }
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
      // The mutation's meta raises the error toast; the row stays open to retry.
      return;
    }

    setIsDone(true);
    setIsExpanded(false);
    onApplied();
    // The hook has no successAlert of its own: the editor calls it right after updateCheck, which toasts.
    showAlert(
      'success',
      alerts.length === 1
        ? t('recommendations.alertingGaps.row.appliedSingle', 'Added an alert to {{job}}', { job: check.job })
        : t('recommendations.alertingGaps.row.applied', 'Added {{alertCount}} alerts to {{job}}', {
            alertCount: alerts.length,
            job: check.job,
          })
    );
    // The check list carries the alerts, so refetching it drops this row.
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
