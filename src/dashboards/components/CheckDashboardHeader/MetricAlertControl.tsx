import React, { useState } from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { MetricAlertModel, MetricAlertState } from './health/checkHealth.types';
import { Check } from 'types';
import { Toggletip } from 'components/Toggletip';

import { useCheckHealthOptional } from './health/CheckHealthContext';
import { QuickAlertSetup } from './QuickAlertSetup';

type PresentedAlertState = Exclude<MetricAlertState, 'not-configured' | 'unsupported'>;

const ALERT_STATE_PRESENTATION: Record<
  PresentedAlertState,
  {
    icon: IconName;
    label: (metric: string) => string;
    tone: 'error' | 'neutral' | 'warning';
  }
> = {
  firing: {
    icon: 'bell',
    label: (metric) => `Alert firing for ${metric}`,
    tone: 'error',
  },
  historical: {
    icon: 'bell',
    label: (metric) => `Alert fired in this range for ${metric}`,
    tone: 'warning',
  },
  configured: {
    icon: 'bell',
    label: (metric) => `Alert configured for ${metric}`,
    tone: 'neutral',
  },
  pending: {
    icon: 'clock-nine',
    label: (metric) => `Alert setup pending for ${metric}`,
    tone: 'warning',
  },
  error: {
    icon: 'exclamation-triangle',
    label: (metric) => `Alert setup failed for ${metric}`,
    tone: 'error',
  },
};

function AlertStatusIcon({
  metricLabel,
  model,
}: {
  metricLabel: string;
  model: MetricAlertModel;
}) {
  const styles = useStyles2(getStyles);

  if (model.state === 'unsupported' || model.state === 'not-configured') {
    return null;
  }

  const presentation = ALERT_STATE_PRESENTATION[model.state];
  const label = presentation.label(metricLabel);
  const icon = (
    <span
      aria-label={label}
      className={cx(styles.status, styles[presentation.tone])}
      role="img"
    >
      <Icon aria-hidden name={presentation.icon} />
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

  if (alert.state === 'not-configured' && alert.canWrite) {
    return (
      <Toggletip
        content={
          <QuickAlertSetup
            alertType={alertType}
            check={check}
            onCancel={() => setOpen(false)}
            onSaved={() => setOpen(false)}
          />
        }
        onOpenChange={setOpen}
        open={open}
      >
        <button
          aria-label={`Set up alert for ${metric.label}`}
          className={styles.setupButton}
          type="button"
        >
          <Icon name="bell" />
        </button>
      </Toggletip>
    );
  }

  if (alert.state === 'not-configured') {
    const label = `No alert configured for ${metric.label}`;

    return (
      <Tooltip content="You do not have permission to configure this alert.">
        <span aria-label={label} className={cx(styles.status, styles.muted)} role="img">
          <Icon aria-hidden name="bell" />
        </span>
      </Tooltip>
    );
  }

  return <AlertStatusIcon metricLabel={metric.label} model={alert} />;
}

const getStyles = (theme: GrafanaTheme2) => ({
  setupButton: css({
    alignItems: 'center',
    background: 'transparent',
    border: 0,
    color: theme.colors.text.link,
    cursor: 'pointer',
    display: 'inline-flex',
    padding: 0,
  }),
  status: css({
    alignItems: 'center',
    display: 'inline-flex',
  }),
  error: css({ color: theme.colors.error.text }),
  warning: css({ color: theme.colors.warning.text }),
  neutral: css({ color: theme.colors.text.secondary }),
  muted: css({ color: theme.colors.text.disabled }),
});
