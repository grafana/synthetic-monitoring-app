import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { type Probe } from 'types';
import { ProbeCard } from 'components/ProbeCard';

interface Props {
  probes: Probe[];
  title: string;
  emptyText?: ReactNode;
}

const defaultEmptyText = 'No probes found';

export const ProbeList = ({ probes, title, emptyText = defaultEmptyText }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.list}>
      <h2 className={styles.heading}>{title}</h2>
      {probes.length ? (
        probes.map((probe) => {
          return <ProbeCard key={probe.id} probe={probe} />;
        })
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.container}>{emptyText}</div>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  list: css({
    marginBottom: theme.spacing(4),
  }),
  heading: css({
    fontWeight: theme.typography.h4.fontWeight,
    fontSize: theme.typography.h4.fontSize,
    lineHeight: theme.typography.h4.lineHeight,
    fontFamily: theme.typography.h4.fontFamily,
  }),
  emptyState: css({
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing(4),
  }),
  container: css({
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
  }),
});
