import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { type Probe } from 'types';
import { Collapse } from 'components/Collapse';
import { ProbeCard } from 'components/ProbeCard';

interface Props {
  [`data-testid`]?: string;
  probes: Probe[];
  title: string;
  emptyText?: ReactNode;
}

const defaultEmptyText = 'No probes found';

export const ProbeList = ({ 'data-testid': dataTestId, probes, title, emptyText = defaultEmptyText }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <Collapse
      className={styles.list}
      data-testid={dataTestId}
      isOpen
      label={<h2 className={styles.heading}>{title}</h2>}
    >
      {probes.length ? (
        probes.map((probe) => {
          return <ProbeCard key={probe.id} probe={probe} />;
        })
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.container}>{emptyText}</div>
        </div>
      )}
    </Collapse>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const headingSize = `h4`;

  return {
    list: css({
      height: `auto`,
    }),
    heading: css({
      margin: 0,
      fontFamily: theme.typography[headingSize].fontFamily,
      fontSize: theme.typography[headingSize].fontSize,
      fontWeight: theme.typography[headingSize].fontWeight,
      letterSpacing: theme.typography[headingSize].letterSpacing,
      lineHeight: theme.typography[headingSize].lineHeight,
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
  };
};
