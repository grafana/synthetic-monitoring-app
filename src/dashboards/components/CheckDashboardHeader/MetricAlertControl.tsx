import React, { useState } from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { MetricAlertModel, MetricAlertState } from './health/checkHealth.types';
import { Check } from 'types';
import { Toggletip } from 'components/Toggletip';

import { useCheckHealthOptional } from './health/CheckHealthContext';
import { QuickAlertSetup } from './QuickAlertSetup';

type SetupStatusIconState = Extract<MetricAlertState, 'pending' | 'error'>;

const SETUP_STATUS_ICON: Record<
  SetupStatusIconState,
  {
    icon: IconName;
    ariaLabel: (metric: string) => string;
  }
> = {
  pending: {
    icon: 'clock-nine',
    ariaLabel: (metric) => `Alert setup pending for ${metric}`,
  },
  error: {
    icon: 'exclamation-triangle',
    ariaLabel: (metric) => `Alert setup failed for ${metric}`,
  },
};

function isConfiguredAlert(state: MetricAlertState): boolean {
  return state !== 'unsupported' && state !== 'not-configured';
}

function SetupStatusIcon({
  className,
  metricLabel,
  model,
}: {
  className: string;
  metricLabel: string;
  model: MetricAlertModel;
}) {
  if (model.state !== 'pending' && model.state !== 'error') {
    return null;
  }

  const presentation = SETUP_STATUS_ICON[model.state];
  const icon = (
    <span aria-label={presentation.ariaLabel(metricLabel)} className={className}>
      <Icon name={presentation.icon} size="sm" />
    </span>
  );

  return model.message ? <Tooltip content={model.message}>{icon}</Tooltip> : icon;
}

export function MetricAlertControl<TCheck extends Check>({
  check,
  metric,
}: {
  check: TCheck;
  metric: HeaderMetricDefinition<TCheck>;
}) {
  const styles = useStyles2(getStyles);
  const health = useCheckHealthOptional();
  const alert = health?.metrics[metric.id]?.alert;
  const [open, setOpen] = useState(false);
  const alertType = metric.health?.alertTypes?.[0];

  if (!alertType || !alert || alert.state === 'unsupported') {
    return null;
  }

  if (alert.state === 'not-configured' && !alert.canWrite) {
    return (
      <Tooltip content="You do not have permission to configure this alert.">
        <span aria-label={`No alert configured for ${metric.label}`} className={styles.noAlert}>
          No alert
        </span>
      </Tooltip>
    );
  }

  const mode = isConfiguredAlert(alert.state) ? 'edit' : 'create';
  const buttonLabel = mode === 'edit' ? 'Configured' : 'Set up alert';
  const ariaLabel = `${buttonLabel} for ${metric.label}`;

  return (
    <span className={styles.control}>
      <SetupStatusIcon className={styles.statusIcon} metricLabel={metric.label} model={alert} />
      <Toggletip
        content={
          <QuickAlertSetup
            alertType={alertType}
            canWrite={Boolean(alert.canWrite)}
            check={check}
            mode={mode}
            onCancel={() => setOpen(false)}
            onSaved={() => setOpen(false)}
          />
        }
        maxWidth="100%"
        onOpenChange={setOpen}
        open={open}
        width={800}
      >
        <button aria-label={ariaLabel} className={styles.actionButton} type="button">
          <Icon name="bell" size="sm" />
          {buttonLabel}
        </button>
      </Toggletip>
    </span>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  control: css({
    alignItems: 'center',
    color: theme.colors.text.primary,
    display: 'inline-flex',
    flexShrink: 0,
    gap: theme.spacing(0.5),
    marginLeft: 'auto',
  }),
  statusIcon: css({
    display: 'inline-flex',
  }),
  actionButton: css({
    alignItems: 'center',
    background: theme.colors.secondary.main,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.pill,
    color: theme.colors.text.primary,
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.25, 1),
    whiteSpace: 'nowrap',
  }),
  noAlert: css({
    color: theme.colors.text.secondary,
    flexShrink: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    marginLeft: 'auto',
  }),
});
