import React from 'react';
import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { IconButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

const viz = VizConfigBuilders.traces().build();

interface TracePanelProps {
  traceId: string;
  tracesDS: DataSourceInstanceSettings;
  onClose: () => void;
}

export const TracePanel = ({ traceId, tracesDS, onClose }: TracePanelProps) => {
  const styles = useStyles2(getStyles);

  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'A',
        queryType: 'traceql',
        query: traceId,
      },
    ],
    datasource: { type: tracesDS.type, uid: tracesDS.uid },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Trace: {traceId}</span>
        <IconButton name="times" aria-label="Close trace panel" onClick={onClose} size="md" />
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
  panel: css({
    minHeight: '500px',
    height: '60vh',
  }),
});
