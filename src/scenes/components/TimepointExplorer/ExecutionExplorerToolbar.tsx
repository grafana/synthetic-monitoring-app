import React from 'react';
import { AnnotationQuery, GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DashboardAnnotationControls } from 'dashboards/annotations/DashboardAnnotationControls';
import { DashboardAnnotationMarkers } from 'dashboards/annotations/DashboardAnnotationMarkers';

import { ExecutionResultFilter } from './TimepointExplorer.types';

export function ExecutionExplorerToolbar({
  resultFilter,
  onResultFilterChange,
  annotations,
}: {
  resultFilter: ExecutionResultFilter;
  onResultFilterChange: (filter: ExecutionResultFilter) => void;
  annotations: AnnotationQuery[];
}) {
  const styles = useStyles2(getStyles);

  return (
    <div aria-label="Execution explorer controls" className={styles.toolbar}>
      <div className={styles.filterGroup}>
        <div aria-label="Result filter" className={styles.segmented} role="group">
          <Button
            aria-pressed={resultFilter === 'all'}
            onClick={() => onResultFilterChange('all')}
            size="sm"
            variant={resultFilter === 'all' ? 'primary' : 'secondary'}
          >
            All runs
          </Button>
          <Button
            aria-pressed={resultFilter === 'unsuccessful'}
            onClick={() => onResultFilterChange('unsuccessful')}
            size="sm"
            variant={resultFilter === 'unsuccessful' ? 'primary' : 'secondary'}
          >
            Unsuccessful only
          </Button>
        </div>
        {annotations.length > 0 ? <DashboardAnnotationControls annotations={annotations} /> : null}
        <DashboardAnnotationMarkers />
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    alignItems: 'center',
    display: 'flex',
    flex: '0 0 auto',
    gap: theme.spacing(1),
    whiteSpace: 'nowrap',
  }),
  filterGroup: css({ alignItems: 'center', display: 'flex', gap: theme.spacing(1) }),
  segmented: css({ display: 'flex' }),
});
