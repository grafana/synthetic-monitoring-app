import React, { useLayoutEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { LoadingBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function InlineLoadingBar({ ariaLabel }: { ariaLabel: string }) {
  const styles = useStyles2(getStyles);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const measure = () => setWidth(Math.floor(element.getBoundingClientRect().width));
    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.loadingBar} data-testid="inline-loading-bar" ref={containerRef}>
      <LoadingBar ariaLabel={ariaLabel} width={width || 200} />
    </div>
  );
}

const getStyles = (_theme: GrafanaTheme2) => ({
  loadingBar: css({
    left: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  }),
});
