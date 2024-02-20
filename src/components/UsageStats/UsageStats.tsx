import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { BigValue, BigValueColorMode, BigValueGraphMode, BigValueTextMode, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { checkToUsageCalcValues } from 'utils';
import { useChecks } from 'data/useChecks';
import { useUsageCalc } from 'hooks/useUsageCalc';
import { DisplayCard } from 'components/DisplayCard';

export const UsageStats = () => {
  const { data: checks = [], isLoading } = useChecks();
  const styles = useStyles2(getStyles);
  const usage = useUsageCalc(checks.map(checkToUsageCalcValues));

  return (
    <DisplayCard className={cx(styles.card, styles.usageGrid, styles.marginBottom)}>
      <h2 className={styles.usageHeader}>Your Grafana Cloud Synthetic Monitoring usage</h2>
      <BigValue
        theme={config.theme2}
        textMode={BigValueTextMode.ValueAndName}
        colorMode={BigValueColorMode.Value}
        graphMode={BigValueGraphMode.Area}
        height={80}
        width={75}
        value={{
          numeric: checks.length,
          color: config.theme2.colors.text.primary,
          title: 'Total checks',
          text: isLoading ? `...` : checks.length.toLocaleString(),
        }}
      />
      <BigValue
        theme={config.theme2}
        textMode={BigValueTextMode.ValueAndName}
        colorMode={BigValueColorMode.Value}
        graphMode={BigValueGraphMode.Area}
        height={80}
        width={115}
        value={{
          numeric: usage?.activeSeries ?? 0,
          color: config.theme2.colors.text.primary,
          title: 'Total active series',
          text: isLoading ? `...` : usage?.activeSeries.toLocaleString() ?? 'N/A',
        }}
      />
      <BigValue
        theme={config.theme2}
        textMode={BigValueTextMode.ValueAndName}
        colorMode={BigValueColorMode.Value}
        graphMode={BigValueGraphMode.Area}
        height={80}
        width={115}
        value={{
          numeric: usage?.dpm ?? 0,
          color: config.theme2.colors.text.primary,
          title: 'Data points per minute',
          text: isLoading ? `...` : usage?.dpm.toLocaleString() ?? 'N/A',
        }}
      />
      <BigValue
        theme={config.theme2}
        textMode={BigValueTextMode.ValueAndName}
        colorMode={BigValueColorMode.Value}
        graphMode={BigValueGraphMode.Area}
        height={80}
        width={175}
        value={{
          numeric: usage?.checksPerMonth ?? 0,
          color: config.theme2.colors.text.primary,
          title: 'Checks executions per month',
          text: isLoading ? `...` : usage?.checksPerMonth.toLocaleString() ?? 'N/A',
        }}
      />
      <BigValue
        theme={config.theme2}
        textMode={BigValueTextMode.ValueAndName}
        colorMode={BigValueColorMode.Value}
        graphMode={BigValueGraphMode.Area}
        height={80}
        width={150}
        value={{
          numeric: usage?.logsGbPerMonth ?? 0,
          color: config.theme2.colors.text.primary,
          title: 'Logs per month',
          text: isLoading ? `...` : `${usage?.logsGbPerMonth.toFixed(2) ?? 0}GB`,
        }}
      />
    </DisplayCard>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    backgroundColor: theme.colors.background.secondary,
  }),
  usageGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, auto))',
    gridGap: theme.spacing(1),
  }),
  usageHeader: css({
    maxWidth: '220px',
  }),
  marginBottom: css({
    marginBottom: theme.spacing(2),
  }),
});
