import React, { useMemo } from 'react';
import { DataSourceInstanceSettings, GrafanaTheme2, PanelData } from '@grafana/data';
import { SceneDataNode, VizConfigBuilders } from '@grafana/scenes';
import { VizPanel } from '@grafana/scenes-react';
import { IconButton, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { getExploreTracesUrl, getExploreTraceUrl } from 'scenes/components/LogsRenderer/TraceLink.utils';

const viz = VizConfigBuilders.traces().build();

const TRACE_TIME_BUFFER_MS = 5 * 60 * 1000;

interface TracePanelProps {
  traceId: string;
  tracesDS: DataSourceInstanceSettings;
  traceData: PanelData;
  logTimestamp: number;
  onClose: () => void;
}

export const TracePanel = ({ traceId, tracesDS, traceData, logTimestamp, onClose }: TracePanelProps) => {
  const styles = useStyles2(getStyles);
  const exploreUrl = getExploreTraceUrl(tracesDS.uid, traceId);
  const drilldownUrl = getExploreTracesUrl(tracesDS.uid, traceId, {
    from: logTimestamp - TRACE_TIME_BUFFER_MS,
    to: logTimestamp + TRACE_TIME_BUFFER_MS,
  });
  const dataProvider = useMemo(() => new SceneDataNode({ data: traceData }), [traceData]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Trace: {traceId}</h4>
        <Stack direction="row" gap={1} alignItems="center">
          <LinkButton
            fill="text"
            size="md"
            icon="gf-traces"
            href={drilldownUrl}
            tooltip="Open in Traces Drilldown"
            aria-label="Open in Traces Drilldown"
          />
          <LinkButton
            fill="text"
            size="md"
            icon="compass"
            href={exploreUrl}
            tooltip="Open in Explore"
            aria-label="Open trace in Explore"
          />
          <IconButton name="times" aria-label="Close trace panel" tooltip="Close" onClick={onClose} size="md" />
        </Stack>
      </div>
      <div className={styles.panel}>
        <VizPanel dataProvider={dataProvider} title="" viz={viz} />
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    background: theme.colors.background.primary,
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderBottom: `1px solid ${theme.colors.border.medium}`,
  }),
  title: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0,
  }),
  panel: css({
    minHeight: '500px',
    height: '60vh',
  }),
});
