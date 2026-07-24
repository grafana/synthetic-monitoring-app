import { useMemo } from 'react';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

import { createExecutionCountsDefinition } from './httpHeaderQueryDefinitions';
import { selectExecutionCounts } from './httpHeaderSelectors';

export function formatHttpExecutionOverviewExtra(
  total: number | null,
  successful: number | null
): string | undefined {
  if (total === null || successful === null) {
    return undefined;
  }

  return `${Math.round(successful).toLocaleString()} of ${Math.round(total).toLocaleString()} succeeded`;
}

export function useHttpExecutionOverviewExtra(): string | undefined {
  const definition = useMemo(() => createExecutionCountsDefinition(), []);
  const { panelData } = useDashboardPanelQuery(definition);
  const { total, successful } = selectExecutionCounts(panelData);

  return formatHttpExecutionOverviewExtra(total, successful);
}
