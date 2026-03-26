import React, { useMemo } from 'react';
import { DataSourceInstanceSettings, GrafanaTheme2, PanelData } from '@grafana/data';
import { SceneDataNode, VizConfigBuilders } from '@grafana/scenes';
import { VizPanel } from '@grafana/scenes-react';
import { IconButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { getExploreTraceUrl } from 'scenes/components/LogsRenderer/TraceLink.utils';

const viz = VizConfigBuilders.traces().build();

interface TracePanelProps {
  traceId: string;
  tracesDS: DataSourceInstanceSettings;
  traceData: PanelData;
  onClose: () => void;
}

export const TracePanel = ({ traceId, tracesDS, traceData, onClose }: TracePanelProps) => {
  const styles = useStyles2(getStyles);
  const href = getExploreTraceUrl(tracesDS.uid, traceId);
  const dataProvider = useMemo(() => new SceneDataNode({ data: traceData }), [traceData]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Trace: {traceId}</span>
        <Stack direction="row" gap={1} alignItems="center">
          <a href={href} className={styles.exploreLink} title="Open in Explore">
            <IconButton name="external-link-alt" aria-label="Open trace in Explore" size="md" />
          </a>
          <IconButton name="times" aria-label="Close trace panel" onClick={onClose} size="md" />
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
  }),
  exploreLink: css({
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      textDecoration: 'none',
    },
  }),
  panel: css({
    minHeight: '500px',
    height: '60vh',
  }),
});
