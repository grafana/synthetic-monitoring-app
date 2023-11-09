import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { type Probe } from 'types';
import { ProbeCard } from 'components/ProbeCard';

interface Props {
  probes: Probe[];
  title: string;
}

export const ProbeList = ({ probes, title }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.list}>
      <h2>{title}</h2>
      {probes.map((probe) => {
        return <ProbeCard key={probe.id} probe={probe} />;
      })}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  list: css({
    marginBottom: theme.spacing(4),
  }),
});
