import React from 'react';
import { AnnotationQuery, GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DashboardAnnotationControls } from 'dashboards/annotations/DashboardAnnotationControls';
import { DashboardAnnotationMarkers } from 'dashboards/annotations/DashboardAnnotationMarkers';

import { ExecutionResultFilter } from './TimepointExplorer.types';

const COMING_LATER_ID = 'execution-explorer-coming-later';

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

      <div className={styles.futureGroup}>
        {['Product context', 'Compare related checks', 'Advanced filters'].map((label) => (
          <Button aria-describedby={COMING_LATER_ID} disabled key={label} size="sm" variant="secondary">
            {label}
          </Button>
        ))}
        <span className={styles.visuallyHidden} id={COMING_LATER_ID}>
          Coming later
        </span>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  toolbar: css({
    alignItems: 'center',
    containerName: 'execution-explorer-toolbar',
    containerType: 'inline-size',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1, 2),
    justifyContent: 'space-between',
  }),
  filterGroup: css({ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1, 2) }),
  segmented: css({ display: 'flex' }),
  futureGroup: css({ display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1) }),
  visuallyHidden: css({
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: '1px',
  }),
});
