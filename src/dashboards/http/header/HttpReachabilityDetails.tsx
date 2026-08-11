import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { formatPercent } from 'dashboards/components/CheckDashboardHeader/headerMetricValue';
import { InlineLoadingBar } from 'dashboards/components/CheckDashboardHeader/InlineLoadingBar';
import { useStableWhileLoading } from 'dashboards/components/CheckDashboardHeader/useStableWhileLoading';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

import { HTTPCheck } from 'types';

import { createReachabilityBreakdownDefinition } from './httpHeaderQueryDefinitions';
import { selectProbeReachabilityRows } from './httpHeaderSelectors';

export function HttpReachabilityDetails({ check: _check }: { check: HTTPCheck }) {
  const styles = useStyles2(getStyles);
  const { panelData, isLoading } = useDashboardPanelQuery(createReachabilityBreakdownDefinition());
  const rows = useStableWhileLoading(
    selectProbeReachabilityRows(panelData),
    isLoading,
    (candidate) => candidate.length === 0
  );

  return (
    <div className={styles.container}>
      {isLoading ? <InlineLoadingBar ariaLabel="Updating probe breakdown" /> : null}
      <strong>By probe</strong>
      {panelData.errors?.length ? <p>Some probe results could not be loaded.</p> : null}
      {rows.length > 0 ? (
        <ul>
          {rows.map((row) => (
            <li key={row.probe}>
              {row.probe}: {formatPercent(row.reachability)} · {Math.round(row.failed).toLocaleString()} failed
            </li>
          ))}
        </ul>
      ) : (
        <p>No per-probe telemetry is available.</p>
      )}
    </div>
  );
}

const getStyles = (_theme: GrafanaTheme2) => ({
  container: css({
    position: 'relative',
  }),
});
