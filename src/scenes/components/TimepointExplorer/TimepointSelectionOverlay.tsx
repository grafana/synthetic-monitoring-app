import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface TimepointSelectionOverlayProps {
  startX: number;
  currentX: number;
  isSelecting: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const TimepointSelectionOverlay = ({
  startX,
  currentX,
  isSelecting,
  containerRef,
}: TimepointSelectionOverlayProps) => {
  const styles = useStyles2(getStyles);

  if (!isSelecting || !containerRef.current) {
    return null;
  }

  const rect = containerRef.current.getBoundingClientRect();
  const left = Math.min(startX, currentX) - rect.left;
  const width = Math.abs(currentX - startX);

  return (
    <div
      className={styles.overlay}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
    />
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  overlay: css`
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: rgba(120, 120, 130, 0.2);
    pointer-events: none;
    z-index: 10;
  `,
});
