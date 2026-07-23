import React, { useEffect, useRef, useState } from 'react';
import { FieldSparkline, GrafanaTheme2 } from '@grafana/data';
import { GraphDrawStyle, VisibilityMode } from '@grafana/schema';
import { Sparkline, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

const SPARKLINE_HEIGHT = 36;

export function HeaderMetricSparkline({ sparkline }: { sparkline: FieldSparkline }) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden
      className={styles.container}
      data-testid="header-metric-sparkline"
      ref={containerRef}
    >
      {width > 0 ? (
        <Sparkline
          height={SPARKLINE_HEIGHT}
          sparkline={sparkline}
          theme={theme}
          width={width}
          config={{
            color: { mode: 'fixed', fixedColor: theme.colors.text.secondary },
            custom: {
              drawStyle: GraphDrawStyle.Line,
              fillOpacity: 20,
              lineWidth: 1.5,
              showPoints: VisibilityMode.Never,
            },
          }}
        />
      ) : null}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    alignSelf: 'center',
    flex: '1 1 auto',
    height: SPARKLINE_HEIGHT,
    minWidth: theme.spacing(8),
  }),
});
