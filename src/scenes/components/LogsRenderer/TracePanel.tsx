import React, { useMemo } from 'react';
import { DataSourceInstanceSettings, GrafanaTheme2, PanelData } from '@grafana/data';
import { SceneDataNode, VizConfigBuilders } from '@grafana/scenes';
import { VizPanel } from '@grafana/scenes-react';
import { Box, IconButton, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { getExploreTracesUrl, getExploreTraceUrl } from 'scenes/components/LogsRenderer/TraceLink.utils';

const viz = VizConfigBuilders.traces().build();

const TRACE_TIME_BUFFER_MS = 5 * 60 * 1000;

const ARROW_SIZE = 8;

interface TracePanelProps {
  traceId: string;
  tracesDS: DataSourceInstanceSettings;
  traceData: PanelData;
  logTimestamp: number;
  arrowOffset: number | null;
  onClose: () => void;
}

export const TracePanel = ({ traceId, tracesDS, traceData, logTimestamp, arrowOffset, onClose }: TracePanelProps) => {
  const styles = useStyles2(getStyles);
  const exploreUrl = getExploreTraceUrl(tracesDS.uid, traceId);
  const drilldownUrl = getExploreTracesUrl(tracesDS.uid, traceId, {
    from: logTimestamp - TRACE_TIME_BUFFER_MS,
    to: logTimestamp + TRACE_TIME_BUFFER_MS,
  });
  const dataProvider = useMemo(() => new SceneDataNode({ data: traceData }), [traceData]);

  return (
    <div className={styles.container}>
      {arrowOffset !== null && <div className={styles.arrow} style={{ left: arrowOffset }} />}
      <Box paddingX={2} paddingY={1}>
        <Stack justifyContent="space-between" alignItems="center">
          <Text element="h4">
            <div className={styles.title}>Trace: {traceId}</div>
          </Text>
          <Stack direction="row" gap={1} alignItems="center">
            <LinkButton fill="text" size="md" icon="gf-traces" href={drilldownUrl}>
              View in Traces Drilldown
            </LinkButton>
            <LinkButton
              fill="text"
              size="md"
              icon="compass"
              href={exploreUrl}
              tooltip="View Trace in Explore"
              aria-label="View Trace in Explore"
            />
            <IconButton name="times" aria-label="Close trace panel" tooltip="Close" onClick={onClose} size="md" />
          </Stack>
        </Stack>
      </Box>
      <div className={styles.panel}>
        <VizPanel dataProvider={dataProvider} title="" viz={viz} />
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    position: 'relative',
    border: `1px solid ${theme.colors.warning.border}`,
    borderRadius: theme.shape.radius.default,
    marginTop: ARROW_SIZE,
    marginBottom: theme.spacing(1),
    background: theme.colors.background.primary,
  }),
  arrow: css({
    position: 'absolute',
    top: -ARROW_SIZE,
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderBottom: `${ARROW_SIZE}px solid ${theme.colors.warning.border}`,
  }),
  title: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  panel: css({
    minHeight: '500px',
    height: '60vh',
  }),
});
