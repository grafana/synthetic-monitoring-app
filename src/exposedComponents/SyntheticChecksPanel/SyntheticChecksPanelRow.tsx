import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Spinner, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { PLUGIN_URL_PATH } from 'routing/constants';
import { useLatency } from 'data/useLatency';
import { useCheckReachabilitySuccessRate, useCheckUptimeSuccessRate } from 'data/useSuccessRates';

function formatPercentage(value: number | null | undefined, loading?: boolean): React.ReactNode {
  if (loading) {
    return <Spinner inline size="sm" />;
  }

  if (value == null) {
    return 'N/A';
  }

  return `${(value * 100).toFixed(2)}%`;
}

function formatLatency(value: string | null | undefined, loading?: boolean): React.ReactNode {
  if (loading) {
    return <Spinner inline size="sm" />;
  }

  if (value == null) {
    return 'N/A';
  }

  const ms = Number(value) * 1000;

  return `${Math.round(ms)} ms`;
}

interface SyntheticChecksPanelRowProps {
  check: Check;
}

export const SyntheticChecksPanelRow = ({ check }: SyntheticChecksPanelRowProps) => {
  const styles = useStyles2(getStyles);
  const { data: uptimeData, isLoading: uptimeLoading } = useCheckUptimeSuccessRate(check);
  const { data: reachabilityData, isLoading: reachabilityLoading } = useCheckReachabilitySuccessRate(check);
  const { data: latencyData, isLoading: latencyLoading } = useLatency(check);

  const reachabilityValue = reachabilityData?.value?.[1] ? Number(reachabilityData.value[1]) : null;
  const latencyValue = latencyData?.value?.[1] ?? null;

  return (
    <tr className={styles.row}>
      <td className={styles.nameCell}>
        <TextLink href={`${PLUGIN_URL_PATH}checks/${check.id}`} inline={false}>
          {check.job}
        </TextLink>
      </td>
      <td className={styles.metricCell}>{formatPercentage(uptimeData, uptimeLoading)}</td>
      <td className={styles.metricCell}>{formatPercentage(reachabilityValue, reachabilityLoading)}</td>
      <td className={styles.metricCell}>{formatLatency(latencyValue, latencyLoading)}</td>
    </tr>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    row: css({
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    }),
    nameCell: css({
      padding: theme.spacing(1, 1.5),
    }),
    metricCell: css({
      padding: theme.spacing(1, 1.5),
      textAlign: 'right',
      whiteSpace: 'nowrap',
    }),
  };
}
