import React, { useState } from 'react';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Badge, BadgeColor, Button, ConfirmModal, Container, IconName, Legend, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe } from 'types';
import { hasRole } from 'utils';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';

import { SuccessRateGauge } from './SuccessRateGauge';

interface Props {
  probe: Probe;
  onResetToken: () => void;
}

interface BadgeStatus {
  color: BadgeColor;
  text: string;
  icon: IconName;
}

const getStyles = (theme: GrafanaTheme2) => ({
  legend: css`
    margin: 0 ${theme.spacing(1)} 0 0;
    width: auto;
  `,
  container: css`
    padding-left: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(2)};
  `,
  badgeContainer: css`
    margin-bottom: ${theme.spacing(1)};
    display: flex;
    align-items: center;
  `,
});

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

export const ProbeStatus = ({ probe, onResetToken }: Props) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const styles = useStyles2(getStyles);

  if (!probe) {
    return null;
  }
  const isEditor = !probe.public && hasRole(OrgRole.Editor);
  const badgeStatus = getBadgeStatus(probe.online);

  const handleResetToken = async () => {
    await onResetToken();
    setShowResetModal(false);
  };

  return (
    <Container margin="md">
      <div className={styles.container}>
        <div className={styles.badgeContainer}>
          <Legend className={styles.legend}>Status:</Legend>
          <Badge color={badgeStatus.color} icon={badgeStatus.icon} text={badgeStatus.text} />
        </div>
        {!probe.public && (
          <Container>
            <Button variant="destructive" onClick={() => setShowResetModal(true)} disabled={!isEditor}>
              Reset Access Token
            </Button>
            <ConfirmModal
              isOpen={showResetModal}
              title="Reset Probe Access Token"
              body="Are you sure you want to reset the access token for this Probe?"
              confirmText="Reset Token"
              onConfirm={handleResetToken}
              onDismiss={() => setShowResetModal(false)}
            />
          </Container>
        )}
      </div>
      <SuccessRateGauge title="Reachability" id={probe.id!} type={SuccessRateTypes.Probes} height={200} width={300} />
    </Container>
  );
};
