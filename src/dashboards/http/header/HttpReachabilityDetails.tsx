import React from 'react';
import { formatPercent } from 'dashboards/components/CheckDashboardHeader/headerMetricValue';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

import { HTTPCheck } from 'types';

import { createReachabilityBreakdownDefinition } from './httpHeaderQueryDefinitions';
import { selectProbeReachabilityRows } from './httpHeaderSelectors';

export function HttpReachabilityDetails({ check: _check }: { check: HTTPCheck }) {
  const { panelData, isLoading } = useDashboardPanelQuery(createReachabilityBreakdownDefinition());
  const rows = selectProbeReachabilityRows(panelData);

  if (isLoading && rows.length === 0) {
    return <span>Loading probe breakdown…</span>;
  }

  return (
    <div>
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
