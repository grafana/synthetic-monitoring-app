import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, Card, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { type Label, type Probe, ROUTES } from 'types';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';
import { getRoute } from 'components/Routing';
import { SuccessRateGauge } from 'components/SuccessRateGauge';

export const ProbeCard = ({ probe }: { probe: Probe }) => {
  const onlineTxt = probe.online ? 'Online' : 'Offline';
  const onlineIcon = probe.online ? 'heart' : 'heart-break';
  const color = probe.online ? 'green' : 'red';
  const probeTypeText = probe.public ? 'Public' : 'Private';
  const probeTypeIcon = probe.public ? 'cloud' : 'lock';
  const styles = useStyles2(getStyles);
  const href = `${getRoute(ROUTES.EditProbe)}/${probe.id}`;

  return (
    <Card className={styles.card} href={href}>
      <Card.Heading className={styles.heading}>{probe.name}</Card.Heading>
      <div className={styles.meta}>
        <div>
          <Badge color={color} icon={onlineIcon} text={onlineTxt} />
          <Badge color="blue" icon="compass" text={probe.region} />
          <Badge color="blue" icon={probeTypeIcon} text={probeTypeText} />
          <div>{labelsToString(probe.labels)}</div>
          <div>Version: {probe.version}</div>
        </div>
      </div>
      <Card.Tags>
        <div className={styles.tagsWrapper}>
          <SuccessRateGauge
            title="Reachability"
            type={SuccessRateTypes.Probes}
            id={probe.id!}
            height={60}
            width={150}
          />
          <Button className={cx(styles.select)} tabIndex={-1}>
            Select
          </Button>
        </div>
      </Card.Tags>
    </Card>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    '&:hover button': {
      opacity: 1,
    },
  }),
  meta: css({
    gridArea: 'Meta',
  }),
  select: css({
    opacity: 0,
    '&:focus': {
      opacity: 1,
    },
  }),
  heading: css({
    // fontSize: theme.typography.h2.fontSize,
    // fontWeight: theme.typography.h2.fontWeight,
    marginBottom: theme.spacing(1),
  }),
  tagsWrapper: css({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
  }),
});

function labelsToString(labels: Label[]) {
  return labels.map(({ name, value }) => `${name}:${value}`).join(', ');
}
