import React, { useMemo } from 'react';
import { formatPercent, selectNumericValue } from 'dashboards/components/CheckDashboardHeader/headerMetricValue';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { createUptimePanelDefinition } from 'dashboards/http/panels/headlinePanelDefinitions';

import { HTTPCheck } from 'types';

import { createExecutionCountsDefinition } from './httpHeaderQueryDefinitions';
import { selectExecutionCounts } from './httpHeaderSelectors';

export function HttpHealthNarrative({ check }: { check: HTTPCheck }) {
  const uptimeDefinition = useMemo(() => createUptimePanelDefinition(check), [check]);
  const executionDefinition = useMemo(() => createExecutionCountsDefinition(), []);
  const uptimeQuery = useDashboardPanelQuery(uptimeDefinition);
  const executionQuery = useDashboardPanelQuery(executionDefinition);
  const uptime = selectNumericValue(uptimeQuery.panelData);
  const { total, failed } = selectExecutionCounts(executionQuery.panelData);
  const clauses: string[] = [];

  if (uptime !== null) {
    clauses.push(`Available from at least one location ${formatPercent(uptime)} of the time`);
  }

  if (total !== null && failed !== null) {
    clauses.push(
      `${Math.round(failed).toLocaleString()} of ${Math.round(total).toLocaleString()} individual executions failed`
    );
  }

  return <p>{clauses.length > 0 ? `${clauses.join('. ')}.` : 'No telemetry is available for this scope.'}</p>;
}
