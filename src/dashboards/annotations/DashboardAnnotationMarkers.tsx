import React from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Toggletip } from 'components/Toggletip';

import { useDashboardAnnotationsOptional } from './DashboardAnnotationsProvider';

const MAX_VISIBLE_MARKERS = 40;

export function DashboardAnnotationMarkers() {
  const context = useDashboardAnnotationsOptional();
  const styles = useStyles2(getStyles);

  if (!context) {
    return null;
  }

  const events = Object.entries(context.eventsByName)
    .filter(([name]) => context.enabledByName[name] !== false)
    .flatMap(([name, ranges]) => ranges.map(([from, to]) => ({ name, from, to })))
    .slice(0, MAX_VISIBLE_MARKERS);

  if (events.length === 0) {
    return null;
  }

  return (
    <div aria-label="Alert annotations" className={styles.rail}>
      {events.map((event, index) => (
        <Toggletip
          content={
            <div>
              <strong>{event.name}</strong>
              <div>
                {dateTimeFormat(event.from)}
                {event.to !== event.from ? ` – ${dateTimeFormat(event.to)}` : null}
              </div>
            </div>
          }
          key={`${event.name}-${event.from}-${event.to}-${index}`}
        >
          <button
            aria-label="Annotation region"
            className={styles.marker}
            title={`${event.name} annotation`}
            type="button"
          />
        </Toggletip>
      ))}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  rail: css({
    alignItems: 'center',
    display: 'flex',
    gap: '2px',
    minHeight: theme.spacing(2),
    overflow: 'hidden',
  }),
  marker: css({
    background: theme.visualization.getColorByName('red'),
    border: 0,
    borderRadius: theme.shape.radius.default,
    cursor: 'pointer',
    height: theme.spacing(2),
    opacity: 0.8,
    padding: 0,
    width: '4px',
    '&:hover, &:focus-visible': { opacity: 1, width: '6px' },
  }),
});
