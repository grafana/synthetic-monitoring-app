import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { formatPercent, selectNumericValue } from 'dashboards/components/CheckDashboardHeader/headerMetricValue';
import { InlineLoadingBar } from 'dashboards/components/CheckDashboardHeader/InlineLoadingBar';
import { useStableWhileLoading } from 'dashboards/components/CheckDashboardHeader/useStableWhileLoading';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { createUptimePanelDefinition } from 'dashboards/http/panels/headlinePanelDefinitions';

import { HTTPCheck } from 'types';

import { createExecutionCountsDefinition } from './httpHeaderQueryDefinitions';
import { selectExecutionCounts } from './httpHeaderSelectors';

export function HttpHealthNarrative({ check }: { check: HTTPCheck }) {
  const styles = useStyles2(getStyles);
  const uptimeDefinition = useMemo(() => createUptimePanelDefinition(check), [check]);
  const executionDefinition = useMemo(() => createExecutionCountsDefinition(), []);
  const uptimeQuery = useDashboardPanelQuery(uptimeDefinition);
  const executionQuery = useDashboardPanelQuery(executionDefinition);
  const uptime = useStableWhileLoading(selectNumericValue(uptimeQuery.panelData), uptimeQuery.isLoading) ?? null;
  const executionCounts = useStableWhileLoading(
    selectExecutionCounts(executionQuery.panelData),
    executionQuery.isLoading,
    (candidate) => candidate.total === null && candidate.failed === null
  );
  const { total, failed } = executionCounts;
  const isLoading = uptimeQuery.isLoading || executionQuery.isLoading;
  const clauses: string[] = [];

  if (uptime !== null) {
    clauses.push(`Available from at least one location ${formatPercent(uptime)} of the time`);
  }

  if (total !== null && failed !== null) {
    clauses.push(
      `${Math.round(failed).toLocaleString()} of ${Math.round(total).toLocaleString()} individual executions failed`
    );
  }

  return (
    <div className={styles.container}>
      {isLoading ? <InlineLoadingBar ariaLabel="Updating health narrative" /> : null}
      <p>{clauses.length > 0 ? `${clauses.join('. ')}.` : 'No telemetry is available for this scope.'}</p>
    </div>
  );
}

const getStyles = (_theme: GrafanaTheme2) => ({
  container: css({
    position: 'relative',
  }),
});
