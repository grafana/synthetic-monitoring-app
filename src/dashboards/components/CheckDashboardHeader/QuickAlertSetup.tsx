import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Combobox, Field, Input, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckAlertDraft, CheckAlertType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { QUERY_KEYS, useListAlertsForCheck, useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { validateAlertDraft } from 'components/CheckForm/AlertsPerCheck/alertDraftValidation';
import {
  ALERT_PERIODS,
  ALL_PREDEFINED_ALERTS,
} from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

const ALERT_METRIC_LABELS: Record<CheckAlertType, string> = {
  [CheckAlertType.ProbeFailedExecutionsTooHigh]: 'Reachability',
  [CheckAlertType.HTTPRequestDurationTooHighAvg]: 'Average latency',
  [CheckAlertType.PingRequestDurationTooHighAvg]: 'Average latency',
  [CheckAlertType.DNSRequestDurationTooHighAvg]: 'Average latency',
  [CheckAlertType.TLSTargetCertificateCloseToExpiring]: 'SSL expiry',
};

export function QuickAlertSetup({
  alertType,
  check,
  onCancel,
  onSaved,
}: {
  alertType: CheckAlertType;
  check: Check;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const styles = useStyles2(getStyles);
  const predefined = ALL_PREDEFINED_ALERTS.find((alert) => alert.type === alertType);
  const [threshold, setThreshold] = useState(predefined?.defaultValues.threshold ?? 0);
  const [period, setPeriod] = useState<string | undefined>(predefined?.defaultValues.period);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const existingAlertsQuery = useListAlertsForCheck(check.id);
  const existingAlerts = existingAlertsQuery.data ?? check.alerts ?? [];
  const updateAlerts = useUpdateAlertsForCheck({ prevAlerts: existingAlerts });
  const queryClient = useQueryClient();
  const draft = useMemo<CheckAlertDraft>(
    () => ({
      name: alertType,
      threshold,
      ...(period ? { period } : {}),
    }),
    [alertType, period, threshold]
  );
  const errors = validateAlertDraft({
    draft,
    frequency: check.frequency,
    probeCount: check.probes.length,
  });

  if (!predefined || !check.id) {
    return null;
  }

  const save = async () => {
    setSubmitted(true);
    setSaveError(undefined);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const preserved: CheckAlertDraft[] = existingAlerts
      .filter((alert) => alert.name !== alertType)
      .map(({ name, threshold, period, runbookUrl }) => ({
        name,
        threshold,
        period,
        runbookUrl,
      }));

    try {
      await updateAlerts.mutateAsync({
        checkId: check.id!,
        alerts: [...preserved, draft],
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.listAlertsForCheck });
      onSaved();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save alert');
    }
  };

  const metricLabel = ALERT_METRIC_LABELS[alertType];
  const advancedHref = generateRoutePath(AppRoutes.EditCheck, { id: check.id });

  return (
    <div aria-label={`Set up ${metricLabel} alert`} className={styles.dialog} role="dialog">
      <div className={styles.heading}>
        <strong>Set up alert</strong>
        <span>{predefined.description.replace('$threshold', String(threshold))}</span>
      </div>
      <div className={styles.fields}>
        <Field
          error={submitted ? errors.threshold : undefined}
          htmlFor={`quick-alert-threshold-${alertType}`}
          invalid={submitted && Boolean(errors.threshold)}
          label="Threshold"
        >
          <Input
            aria-label="Threshold"
            id={`quick-alert-threshold-${alertType}`}
            min={1}
            onChange={(event) => setThreshold(event.currentTarget.valueAsNumber)}
            type="number"
            value={Number.isNaN(threshold) ? '' : threshold}
          />
        </Field>
        {predefined.supportsPeriod ? (
          <Field
            error={submitted ? errors.period : undefined}
            htmlFor={`quick-alert-period-${alertType}`}
            invalid={submitted && Boolean(errors.period)}
            label="Period"
          >
            <Combobox
              aria-label="Period"
              id={`quick-alert-period-${alertType}`}
              onChange={({ value }) => setPeriod(value ?? undefined)}
              options={[...ALERT_PERIODS]}
              value={period}
            />
          </Field>
        ) : null}
      </div>
      {saveError ? (
        <div className={styles.error} role="alert">
          {saveError}
        </div>
      ) : null}
      <div className={styles.actions}>
        <Button disabled={updateAlerts.isPending} onClick={() => void save()} size="sm">
          Save alert
        </Button>
        <Button disabled={updateAlerts.isPending} onClick={onCancel} size="sm" variant="secondary">
          Cancel
        </Button>
        <TextLink href={advancedHref}>Advanced settings</TextLink>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  dialog: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    minWidth: '320px',
  }),
  heading: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  fields: css({
    display: 'grid',
    gap: theme.spacing(1),
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  }),
  error: css({
    color: theme.colors.error.text,
  }),
  actions: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
});
