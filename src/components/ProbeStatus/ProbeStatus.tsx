import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, BadgeColor, Button, ConfirmModal, Container, IconName, Legend, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { type Probe } from 'types';
import { canEditProbes, formatDate } from 'utils';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';
import { useResetProbeToken } from 'data/useProbes';
import { SuccessRateGauge } from 'components/SuccessRateGauge';

interface Props {
  probe: Probe;
  onReset: (token: string) => void;
}

interface BadgeStatus {
  color: BadgeColor;
  text: string;
  icon: IconName;
}

export const ProbeStatus = ({ probe, onReset }: Props) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const styles = useStyles2(getStyles);
  const { onResetToken } = useResetProbeToken(probe, (token) => {
    setShowResetModal(false);
    onReset(token);
  });

  if (!probe) {
    return null;
  }

  const badgeStatus = getBadgeStatus(probe.online);
  const neverModified = probe.created === probe.modified;
  const neverOnline = probe.onlineChange === probe.created && !probe.online;
  const canEdit = canEditProbes(probe);

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.badgeContainer}>
          <Legend className={styles.legend}>Status:</Legend>
          <Badge color={badgeStatus.color} icon={badgeStatus.icon} text={badgeStatus.text} />
        </div>
        {canEdit && (
          <Container>
            <Button variant="destructive" onClick={() => setShowResetModal(true)}>
              Reset Access Token
            </Button>
            <ConfirmModal
              isOpen={showResetModal}
              title="Reset Probe Access Token"
              body="Are you sure you want to reset the access token for this Probe?"
              confirmText="Reset Token"
              onConfirm={onResetToken}
              onDismiss={() => setShowResetModal(false)}
            />
          </Container>
        )}
      </div>
      <SuccessRateGauge title="Reachability" id={probe.id!} type={SuccessRateTypes.Probes} height={200} width={300} />
      <div className={styles.metaWrapper}>
        <Meta title="Version:" value={probe.version} />
        <Meta
          title={`Last ${probe.online ? `offline` : `online`}:`}
          value={neverOnline ? `Never` : formatDate(probe.onlineChange * 1000)}
        />
        {probe.modified && (
          <Meta title="Last modified:" value={neverModified ? `Never` : formatDate(probe.modified * 1000)} />
        )}
      </div>
    </div>
  );
};

const Meta = ({ title, value }: { title: string; value: string }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.metaItem}>
      <div className={css({ fontWeight: 700 })}>{title}</div>
      <div>{value}</div>
    </div>
  );
};

const getBadgeStatus = (online: boolean): BadgeStatus => {
  if (online) {
    return {
      text: 'Online',
      color: 'green',
      icon: 'heart',
    };
  }
  return {
    text: 'Offline',
    color: 'red',
    icon: 'heart-break',
  };
};

const getStyles = (theme: GrafanaTheme2) => ({
  legend: css({
    margin: theme.spacing(0, 1, 0, 0),
    width: `auto`,
  }),
  container: css({
    paddingLeft: theme.spacing(1),
    marginBottom: theme.spacing(2),
  }),
  badgeContainer: css({
    marginBottom: theme.spacing(1),
    display: `flex`,
    alignItems: `center`,
  }),
  metaWrapper: css({
    display: `flex`,
    gap: theme.spacing(1),
    flexDirection: `column`,
    marginTop: theme.spacing(2),
    paddingLeft: theme.spacing(1),
  }),
  metaItem: css({ display: `flex`, gap: theme.spacing(0.5) }),
});
