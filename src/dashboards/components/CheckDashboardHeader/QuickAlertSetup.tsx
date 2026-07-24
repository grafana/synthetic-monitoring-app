import React, { useMemo, useState } from 'react';
import { FieldErrors, FormProvider, Resolver, ResolverResult, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckAlertDraft, CheckAlertPublished, CheckAlertType, CheckFormValues } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { QUERY_KEYS, useListAlertsForCheck, useUpdateAlertsForCheck } from 'data/useCheckAlerts';
import { validateAlertDraft } from 'components/CheckForm/AlertsPerCheck/alertDraftValidation';
import { AlertItem } from 'components/CheckForm/AlertsPerCheck/AlertItem';
import {
  ALL_PREDEFINED_ALERTS,
  PredefinedAlertInterface,
} from 'components/CheckForm/AlertsPerCheck/AlertsPerCheck.constants';

export type QuickAlertSetupMode = 'create' | 'edit';

const ALERT_METRIC_LABELS: Record<CheckAlertType, string> = {
  [CheckAlertType.ProbeFailedExecutionsTooHigh]: 'Reachability',
  [CheckAlertType.HTTPRequestDurationTooHighAvg]: 'Average latency',
  [CheckAlertType.PingRequestDurationTooHighAvg]: 'Average latency',
  [CheckAlertType.DNSRequestDurationTooHighAvg]: 'Average latency',
  [CheckAlertType.TLSTargetCertificateCloseToExpiring]: 'SSL expiry',
};

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function createQuickAlertResolver(alertType: CheckAlertType): Resolver<CheckFormValues> {
  return async (values): Promise<ResolverResult<CheckFormValues>> => {
    const alert = values.alerts?.[alertType];

    if (!alert?.isSelected) {
      return { values, errors: {} };
    }

    const threshold = typeof alert.threshold === 'number' ? alert.threshold : Number.NaN;
    const draftErrors = validateAlertDraft({
      draft: {
        name: alertType,
        threshold,
        period: alert.period,
        runbookUrl: alert.runbookUrl,
      },
      frequency: values.frequency,
      probeCount: values.probes.length,
    });

    const alertErrors: Record<string, { type: string; message: string }> = {};

    if (draftErrors.threshold) {
      alertErrors.threshold = { type: 'validate', message: draftErrors.threshold };
    }

    if (draftErrors.period) {
      alertErrors.period = { type: 'validate', message: draftErrors.period };
    }

    if (alert.runbookUrl && !isValidHttpUrl(alert.runbookUrl)) {
      alertErrors.runbookUrl = { type: 'validate', message: 'Runbook URL must be a valid URL' };
    }

    if (Object.keys(alertErrors).length > 0) {
      const errors: FieldErrors<CheckFormValues> = {
        alerts: {
          [alertType]: alertErrors,
        },
      };

      return { values: {}, errors };
    }

    return { values, errors: {} };
  };
}

function buildDefaultValues(
  check: Check,
  alert: PredefinedAlertInterface,
  existingAlert?: CheckAlertPublished
): CheckFormValues {
  return {
    id: check.id,
    job: check.job,
    target: check.target,
    frequency: check.frequency,
    probes: check.probes,
    labels: check.labels ?? [],
    checkType: getCheckType(check.settings),
    alerts: {
      [alert.type]: {
        isSelected: true,
        threshold: existingAlert?.threshold ?? alert.defaultValues.threshold,
        period: existingAlert?.period ?? alert.defaultValues.period,
        runbookUrl: existingAlert?.runbookUrl ?? '',
      },
    },
  } as CheckFormValues;
}

export function QuickAlertSetup({
  alertType,
  canWrite = true,
  check,
  mode = 'create',
  onCancel,
  onSaved,
}: {
  alertType: CheckAlertType;
  canWrite?: boolean;
  check: Check;
  mode?: QuickAlertSetupMode;
  onCancel?: () => void;
  onSaved: () => void;
}) {
  const styles = useStyles2(getStyles);
  const predefined = ALL_PREDEFINED_ALERTS.find((alert) => alert.type === alertType);
  const existingAlertsQuery = useListAlertsForCheck(check.id);
  const existingAlerts = existingAlertsQuery.data ?? check.alerts ?? [];
  const existingAlert = existingAlerts.find((alert) => alert.name === alertType);
  const updateAlerts = useUpdateAlertsForCheck({ prevAlerts: existingAlerts });
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(mode === 'create');
  const formDisabled = !canWrite || (mode === 'edit' && !isEditing);
  const defaultValues = useMemo(
    () => (predefined && check.id ? buildDefaultValues(check, predefined, existingAlert) : undefined),
    [check, existingAlert, predefined]
  );
  const form = useForm<CheckFormValues>({
    defaultValues,
    disabled: formDisabled,
    resolver: createQuickAlertResolver(alertType),
    mode: 'onSubmit',
    values: defaultValues,
  });
  const [saveError, setSaveError] = useState<string>();

  if (!predefined || !check.id || !defaultValues) {
    return null;
  }

  const metricLabel = ALERT_METRIC_LABELS[alertType];
  const advancedHref = generateRoutePath(AppRoutes.EditCheck, { id: check.id });
  const dialogLabel =
    mode === 'create'
      ? `Set up ${metricLabel} alert`
      : isEditing
        ? `Edit ${metricLabel} alert`
        : `View ${metricLabel} alert`;

  const onSubmit = form.handleSubmit(async (values) => {
    setSaveError(undefined);
    const alertValues = values.alerts?.[alertType];

    if (!alertValues?.isSelected || alertValues.threshold === undefined) {
      return;
    }

    const draft: CheckAlertDraft = {
      name: alertType,
      threshold: alertValues.threshold,
      ...(alertValues.period ? { period: alertValues.period } : {}),
      ...(alertValues.runbookUrl ? { runbookUrl: alertValues.runbookUrl } : {}),
    };

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
  });

  return (
    <FormProvider {...form}>
      <form
        aria-label={dialogLabel}
        className={styles.dialog}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void onSubmit();
        }}
        role="dialog"
      >
        <div className={styles.alertItem}>
          <AlertItem alert={predefined} onSelectionChange={() => undefined} selected />
        </div>

        {saveError ? (
          <div className={styles.error} role="alert">
            {saveError}
          </div>
        ) : null}

        <div className={styles.actions}>
          <Stack>
            {mode === 'edit' && !isEditing && canWrite ? (
              <Button onClick={() => setIsEditing(true)} size="sm" type="button">
                Edit alert
              </Button>
            ) : null}

            {isEditing && canWrite ? (
              <Button disabled={updateAlerts.isPending || form.formState.isSubmitting} size="sm" type="submit">
                Save alert
              </Button>
            ) : null}

            <Button
              disabled={updateAlerts.isPending || form.formState.isSubmitting}
              onClick={() => {
                if (mode === 'edit' && isEditing) {
                  form.reset(defaultValues);
                  setIsEditing(false);
                  setSaveError(undefined);
                  return;
                }

                onCancel?.();
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              {mode === 'edit' && !isEditing ? 'Close' : 'Cancel'}
            </Button>
          </Stack>
          <TextLink href={advancedHref}>Go to check editor instead</TextLink>
        </div>
      </form>
    </FormProvider>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  dialog: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    maxWidth: '100%',
    width: '100%',
  }),
  heading: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  alertItem: css({
    // AlertItem styles assume CheckForm indentation; tighten for the toggletip.
    marginLeft: theme.spacing(-1),
  }),
  error: css({
    color: theme.colors.error.text,
  }),
  actions: css({
    alignItems: 'center',
    justifyContent: 'space-between',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }),
});
