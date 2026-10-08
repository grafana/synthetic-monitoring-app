import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

const CONTAINER_NAME = 'choiceTileGrid';

interface ChoiceTileGridProps {
  /** `li` elements, each holding one `ChoiceTile`. */
  children: ReactNode;
}

/**
 * Lays tiles out by the space they actually get rather than the viewport, so the same grid works
 * full-width on the page and inside narrower containers.
 */
export function ChoiceTileGrid({ children }: ChoiceTileGridProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <ul className={styles.grid}>{children}</ul>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    containerName: CONTAINER_NAME,
    containerType: 'inline-size',
  }),
  grid: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: theme.spacing(1.5),
    gridTemplateColumns: 'minmax(0, 1fr)',

    [`@container ${CONTAINER_NAME} (min-width: 480px)`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    [`@container ${CONTAINER_NAME} (min-width: 760px)`]: {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
  }),
});
